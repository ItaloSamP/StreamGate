function Test-ComposeProjectNameValue {
  param(
    [AllowEmptyString()]
    [string]$ProjectName
  )

  if ([string]::IsNullOrWhiteSpace($ProjectName)) {
    return [pscustomobject]@{
      IsValid = $true
      Message = ""
    }
  }

  if ($ProjectName -cmatch '^[a-z0-9][a-z0-9_-]*$') {
    return [pscustomobject]@{
      IsValid = $true
      Message = ""
    }
  }

  return [pscustomobject]@{
    IsValid = $false
    Message = "COMPOSE_PROJECT_NAME invalido: '$ProjectName'. Use apenas letras minusculas, numeros, hifen e underscore."
  }
}

function Get-DotEnvValue {
  param(
    [Parameter(Mandatory)]
    [string]$Path,
    [Parameter(Mandatory)]
    [string]$Key
  )

  if (-not (Test-Path $Path)) {
    return $null
  }

  $line = Get-Content $Path | Where-Object {
    $_ -match "^\s*$Key="
  } | Select-Object -First 1

  if ($null -eq $line) {
    return $null
  }

  return ($line -split '=', 2)[1].Trim()
}

function Get-ComposeUpFriendlyError {
  param(
    [AllowEmptyString()]
    [string]$ComposeOutput
  )

  if ([string]::IsNullOrWhiteSpace($ComposeOutput)) {
    return $null
  }

  $match = [regex]::Match(
    $ComposeOutput,
    'container name "/(?<name>[^"]+)" is already in use'
  )

  if ($match.Success) {
    $containerName = $match.Groups['name'].Value
    return "Ja existe um container com o nome '$containerName'. Remova-o com 'docker rm -f $containerName' e tente novamente."
  }

  return $null
}

function Invoke-ComposeCommand {
  param(
    [Parameter(Mandatory)]
    [string]$Arguments
  )

  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    $output = & cmd.exe /d /c "docker compose $Arguments 2>&1"
    $exitCode = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $previousPreference
  }

  [pscustomobject]@{
    Output = @($output)
    ExitCode = $exitCode
  }
}

function Test-ComposeServicesReady {
  param(
    [Parameter(Mandatory)]
    [array]$Services,
    [string[]]$OneShotServices = @('minio-init')
  )

  $issues = New-Object System.Collections.Generic.List[string]
  $pendingIssues = New-Object System.Collections.Generic.List[string]
  $fatalIssues = New-Object System.Collections.Generic.List[string]

  foreach ($service in $Services) {
    $name = [string]$service.Service
    $state = [string]$service.State
    $health = [string]$service.Health
    $exitCode = 0

    if ($null -ne $service.ExitCode -and "$($service.ExitCode)" -ne '') {
      $exitCode = [int]$service.ExitCode
    }

    if ($OneShotServices -contains $name) {
      if ($state -eq 'exited' -and $exitCode -eq 0) {
        continue
      }

      if ($state -eq 'exited') {
        $message = "One-shot service '$name' exited with code $exitCode."
        $issues.Add($message)
        $fatalIssues.Add($message)
        continue
      }

      $message = "One-shot service '$name' has not completed yet (state: $state)."
      $issues.Add($message)
      $pendingIssues.Add($message)
      continue
    }

    if ($state -ne 'running') {
      if ($state -in @('created', 'restarting', 'starting')) {
        $message = "Service '$name' is not ready yet (state: $state)."
        $issues.Add($message)
        $pendingIssues.Add($message)
        continue
      }

      $message = "Service '$name' is not running (state: $state)."
      $issues.Add($message)
      $fatalIssues.Add($message)
      continue
    }

    if ([string]::IsNullOrWhiteSpace($health)) {
      continue
    }

    if ($health -eq 'healthy') {
      continue
    }

    if ($health -eq 'starting') {
      $message = "Service '$name' is still starting."
      $issues.Add($message)
      $pendingIssues.Add($message)
      continue
    }

    $message = "Service '$name' is unhealthy."
    $issues.Add($message)
    $fatalIssues.Add($message)
  }

  [pscustomobject]@{
    IsReady = ($issues.Count -eq 0)
    Issues = $issues.ToArray()
    PendingIssues = $pendingIssues.ToArray()
    FatalIssues = $fatalIssues.ToArray()
  }
}

function Get-ComposeServices {
  $result = Invoke-ComposeCommand -Arguments 'ps --format json'

  if ($result.ExitCode -ne 0) {
    throw "Falha ao consultar status do Docker Compose: $($result.Output -join ' ')"
  }

  $lines = @($result.Output | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

  if ($lines.Count -eq 0) {
    return @()
  }

  if ($lines.Count -eq 1) {
    $parsed = $lines[0] | ConvertFrom-Json
    if ($parsed -is [System.Array]) {
      return $parsed
    }

    return @($parsed)
  }

  return @($lines | ForEach-Object { $_ | ConvertFrom-Json })
}



