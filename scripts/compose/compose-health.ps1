$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom
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

function Get-EnvOrDotEnvValue {
  param(
    [Parameter(Mandatory)]
    [string]$Path,
    [Parameter(Mandatory)]
    [string]$Key
  )

  $currentValue = [Environment]::GetEnvironmentVariable($Key)
  if (-not [string]::IsNullOrWhiteSpace($currentValue)) {
    return $currentValue.Trim()
  }

  return Get-DotEnvValue -Path $Path -Key $Key
}

function Test-PositiveIntegerValue {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $false
  }

  $parsed = 0
  return [int]::TryParse($Value, [ref]$parsed) -and $parsed -gt 0
}

function Test-EmailValue {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $false
  }

  try {
    $mailAddress = [System.Net.Mail.MailAddress]::new($Value)
    return $mailAddress.Address -eq $Value
  }
  catch {
    return $false
  }
}

function Test-HttpsUrlValue {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $false
  }

  $uri = $null
  if (-not [Uri]::TryCreate($Value, [UriKind]::Absolute, [ref]$uri)) {
    return $false
  }

  return $uri.Scheme -eq 'https' -and -not [string]::IsNullOrWhiteSpace($uri.Host)
}

function Assert-Sprint5OperationalEnv {
  param(
    [Parameter(Mandatory)]
    [string]$Path
  )

  $issues = New-Object System.Collections.Generic.List[string]
  $numericKeys = @(
    'OPERATIONAL_ACTION_COOLDOWN_SECONDS',
    'OPERATIONAL_ACTION_DAILY_LIMIT',
    'IDEMPOTENCY_KEY_TTL_SECONDS',
    'JOB_ARTIFACT_RETENTION_DAYS',
    'NOTIFICATION_RETENTION_DAYS',
    'NOTIFICATION_DELIVERY_RETENTION_DAYS',
    'DLQ_REPLAY_REQUEST_RETENTION_DAYS',
    'ARTIFACT_DOWNLOAD_URL_TTL_SECONDS',
    'SMOKE_HTTP_TIMEOUT_SECONDS',
    'SMOKE_WORKER_TIMEOUT_SECONDS',
    'SMOKE_POLL_INTERVAL_SECONDS'
  )

  foreach ($key in $numericKeys) {
    $value = Get-EnvOrDotEnvValue -Path $Path -Key $key
    if (-not (Test-PositiveIntegerValue -Value $value)) {
      $issues.Add("$key deve estar definido com inteiro positivo no ambiente local.") | Out-Null
    }
  }

  foreach ($key in @('SEED_OPERATOR_PASSWORD', 'SEED_ADMIN_PASSWORD', 'SMOKE_ADMIN_EMAIL', 'SMOKE_SECOND_ADMIN_EMAIL', 'SMOKE_SECOND_ADMIN_PASSWORD', 'SMOKE_NOTIFICATION_EMAIL', 'SMOKE_WEBHOOK_URL')) {
    $value = Get-EnvOrDotEnvValue -Path $Path -Key $key
    if ([string]::IsNullOrWhiteSpace($value)) {
      $issues.Add("$key deve estar definido antes de rodar CI local, smokes ou reports da Sprint 5.") | Out-Null
    }
  }

  foreach ($key in @('SMOKE_ADMIN_EMAIL', 'SMOKE_SECOND_ADMIN_EMAIL', 'SMOKE_NOTIFICATION_EMAIL')) {
    $value = Get-EnvOrDotEnvValue -Path $Path -Key $key
    if (-not [string]::IsNullOrWhiteSpace($value) -and -not (Test-EmailValue -Value $value)) {
      $issues.Add("$key precisa ser um e-mail valido.") | Out-Null
    }
  }

  $webhookUrl = Get-EnvOrDotEnvValue -Path $Path -Key 'SMOKE_WEBHOOK_URL'
  if (-not [string]::IsNullOrWhiteSpace($webhookUrl) -and -not (Test-HttpsUrlValue -Value $webhookUrl)) {
    $issues.Add('SMOKE_WEBHOOK_URL precisa usar HTTPS e host valido para o teste de notificacao.') | Out-Null
  }

  if ($issues.Count -gt 0) {
    throw ("Configuracao Sprint 5 incompleta:`n- " + ($issues -join "`n- ") + "`nSincronize seu .env com .env.example antes de continuar.")
  }
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
