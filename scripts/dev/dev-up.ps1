param(
  [ValidateSet('infra', 'app', 'full')]
  [string]$Mode = 'infra',
  [ValidateRange(30, 3600)]
  [int]$TimeoutSeconds = 900
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
. (Join-Path $root 'scripts/compose/compose-health.ps1')

if (-not (Test-Path ".env")) {
  Write-Host "Arquivo .env nao encontrado. Copie .env.example para .env antes de subir o ambiente." -ForegroundColor Yellow
  exit 1
}

$composeProjectName = Get-DotEnvValue -Path ".env" -Key "COMPOSE_PROJECT_NAME"
$projectNameValidation = Test-ComposeProjectNameValue -ProjectName $composeProjectName

if (-not $projectNameValidation.IsValid) {
  Write-Host $projectNameValidation.Message -ForegroundColor Red
  exit 1
}

$timeoutSeconds = $TimeoutSeconds
$pollIntervalSeconds = 5

function Get-BuildServicesForMode {
  param(
    [string]$Mode
  )

  switch ($Mode) {
    'app' { return @('api', 'web') }
    'full' { return @('api', 'web', 'worker') }
    default { return @() }
  }
}

function Get-InfraImageServices {
  return @('postgres', 'redis', 'rabbitmq', 'minio', 'minio-init', 'clickhouse')
}

function Get-InfraImageForService {
  param(
    [string]$Service
  )

  switch ($Service) {
    'postgres' { return 'postgres:16' }
    'redis' { return 'redis:7-alpine' }
    'rabbitmq' { return 'rabbitmq:3.13-management' }
    'minio' { return 'minio/minio:RELEASE.2025-02-18T16-25-55Z' }
    'minio-init' { return 'minio/mc:RELEASE.2025-03-12T17-29-24Z' }
    'clickhouse' { return 'clickhouse/clickhouse-server:25.3' }
    default { return $null }
  }
}

function Test-DockerImageExists {
  param(
    [string]$Image
  )

  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    & cmd.exe /d /c "docker image inspect $Image >NUL 2>NUL"
    return ($LASTEXITCODE -eq 0)
  }
  finally {
    $ErrorActionPreference = $previousPreference
  }
}

function Invoke-ConditionalComposePull {
  $servicesToPull = @()

  foreach ($service in (Get-InfraImageServices)) {
    $image = Get-InfraImageForService -Service $service
    if ([string]::IsNullOrWhiteSpace($image)) {
      continue
    }

    if (-not (Test-DockerImageExists -Image $image)) {
      $servicesToPull += $service
    }
  }

  if ($servicesToPull.Count -eq 0) {
    Write-Host "Imagens de infraestrutura ja disponiveis. Pulando docker compose pull." -ForegroundColor DarkGray
    return
  }

  Write-Host "Imagens de infraestrutura ausentes. Executando docker compose pull:" -ForegroundColor Yellow
  foreach ($service in $servicesToPull) {
    Write-Host " - $service" -ForegroundColor Yellow
  }

  $pullArgs = @('pull') + $servicesToPull
  $pullResult = Invoke-ComposeCommand -Arguments ($pullArgs -join ' ')
  $pullResult.Output | Out-Host

  if ($pullResult.ExitCode -ne 0) {
    throw "docker compose $($pullArgs -join ' ') falhou."
  }
}

function Get-ServiceFingerprintFiles {
  param(
    [string]$Service
  )

  switch ($Service) {
    'api' {
      return @(
        'apps/api/Dockerfile.dev',
        'apps/api/.dockerignore',
        'apps/api/Gemfile',
        'apps/api/Gemfile.lock'
      )
    }
    'web' {
      return @(
        'apps/web/Dockerfile.dev',
        'apps/web/.dockerignore',
        'apps/web/package.json',
        'apps/web/pnpm-lock.yaml'
      )
    }
    'worker' {
      return @(
        'apps/worker/Dockerfile.dev',
        'apps/worker/.dockerignore',
        'apps/worker/Gemfile',
        'apps/worker/Gemfile.lock',
        'apps/worker/worker.gemspec'
      )
    }
    default { return @() }
  }
}

function Get-ServiceBuildFingerprint {
  param(
    [string]$Service
  )

  $relativePaths = @('compose.yaml') + (Get-ServiceFingerprintFiles -Service $Service)
  $fingerprintEntries = @()

  foreach ($relativePath in $relativePaths) {
    $absolutePath = Join-Path $root $relativePath

    if (-not (Test-Path -LiteralPath $absolutePath)) {
      $fingerprintEntries += "$relativePath=MISSING"
      continue
    }

    $hash = (Get-FileHash -LiteralPath $absolutePath -Algorithm SHA256).Hash.ToLowerInvariant()
    $fingerprintEntries += "$relativePath=$hash"
  }

  $serializedEntries = ($fingerprintEntries -join "`n")
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($serializedEntries)
  $sha256 = [System.Security.Cryptography.SHA256]::Create()

  try {
    $combinedHash = $sha256.ComputeHash($bytes)
    return ($combinedHash | ForEach-Object { $_.ToString("x2") }) -join ''
  }
  finally {
    $sha256.Dispose()
  }
}

function Get-BuildStateFilePath {
  param(
    [string]$Service
  )

  return Join-Path $root ".tmp/dev-up-build/$Service.sha256"
}

function Get-PreviousBuildFingerprint {
  param(
    [string]$Service
  )

  $stateFile = Get-BuildStateFilePath -Service $Service
  if (-not (Test-Path -LiteralPath $stateFile)) {
    return $null
  }

  $value = (Get-Content -LiteralPath $stateFile -Raw).Trim()
  if ([string]::IsNullOrWhiteSpace($value)) {
    return $null
  }

  return $value
}

function Set-BuildFingerprintState {
  param(
    [string]$Service,
    [string]$Fingerprint
  )

  $stateFile = Get-BuildStateFilePath -Service $Service
  $stateDir = Split-Path -Parent $stateFile
  if (-not (Test-Path -LiteralPath $stateDir)) {
    New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
  }
  Set-Content -LiteralPath $stateFile -Value $Fingerprint -NoNewline
}

function Test-ComposeImageExists {
  param(
    [string]$Service
  )

  $imagesResult = Invoke-ComposeCommand -Arguments "images -q $Service"
  if ($imagesResult.ExitCode -ne 0) {
    return $false
  }

  $imageId = $imagesResult.Output | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' } | Select-Object -First 1
  return [bool]$imageId
}

function Get-ServicesRequiringBuild {
  param(
    [string[]]$Services
  )

  $buildDecisions = @()

  foreach ($service in $Services) {
    $fingerprint = Get-ServiceBuildFingerprint -Service $service
    $previousFingerprint = Get-PreviousBuildFingerprint -Service $service
    $imageExists = Test-ComposeImageExists -Service $service
    $reasons = @()

    if (-not $imageExists) {
      $reasons += 'imagem ausente'
    }

    if ($null -eq $previousFingerprint) {
      $reasons += 'baseline de fingerprint ausente'
    }
    elseif ($previousFingerprint -ne $fingerprint) {
      $reasons += 'fingerprint alterado'
    }

    $buildDecisions += [PSCustomObject]@{
      Service = $service
      Fingerprint = $fingerprint
      RequiresBuild = ($reasons.Count -gt 0)
      Reasons = $reasons
    }
  }

  return $buildDecisions
}

function Invoke-ConditionalComposeBuild {
  param(
    [string]$Mode
  )

  $buildableServices = Get-BuildServicesForMode -Mode $Mode
  if ($buildableServices.Count -eq 0) {
    return
  }

  $buildDecisions = Get-ServicesRequiringBuild -Services $buildableServices
  $servicesToBuild = $buildDecisions | Where-Object { $_.RequiresBuild }

  if ($servicesToBuild.Count -eq 0) {
    Write-Host "Sem alteracoes relevantes para build. Pulando docker compose build." -ForegroundColor DarkGray
    return
  }

  Write-Host "Alteracoes detectadas em artefatos de build. Executando rebuild seletivo:" -ForegroundColor Yellow
  foreach ($decision in $servicesToBuild) {
    Write-Host " - $($decision.Service): $($decision.Reasons -join ', ')" -ForegroundColor Yellow
  }

  $buildArgs = @('build') + ($servicesToBuild | ForEach-Object { $_.Service })
  $buildResult = Invoke-ComposeCommand -Arguments ($buildArgs -join ' ')
  $buildResult.Output | Out-Host

  if ($buildResult.ExitCode -ne 0) {
    throw "docker compose $($buildArgs -join ' ') falhou."
  }

  foreach ($decision in $buildDecisions) {
    Set-BuildFingerprintState -Service $decision.Service -Fingerprint $decision.Fingerprint
  }
}

$composeArgs = @()
if ($Mode -ne 'infra') {
  $composeArgs += '--profile'
  $composeArgs += $Mode
}
$composeArgs += 'up'
$composeArgs += '-d'

try {
  Invoke-ConditionalComposePull
  Invoke-ConditionalComposeBuild -Mode $Mode

  $composeUpResult = Invoke-ComposeCommand -Arguments ($composeArgs -join ' ')
  $composeUpResult.Output | Out-Host

  if ($composeUpResult.ExitCode -ne 0) {
    $friendlyError = Get-ComposeUpFriendlyError -ComposeOutput ($composeUpResult.Output -join "`n")

    if ($null -ne $friendlyError) {
      throw $friendlyError
    }

    throw "docker compose $($composeArgs -join ' ') falhou."
  }

  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  while ($true) {
    $services = Get-ComposeServices
    $result = Test-ComposeServicesReady -Services $services

    if ($result.IsReady) {
      (Invoke-ComposeCommand -Arguments 'ps').Output | Out-Host
      Write-Host ""
      if ($Mode -eq 'infra') {
        Write-Host "Infraestrutura local do StreamGate iniciada e saudavel." -ForegroundColor Green
      }
      else {
        Write-Host "Ambiente '$Mode' do StreamGate iniciado e saudavel." -ForegroundColor Green
      }
      exit 0
    }

    if ($result.FatalIssues.Count -gt 0) {
      Write-Host ""
      Write-Host "Falha ao subir a infraestrutura local do StreamGate." -ForegroundColor Red
      $result.FatalIssues | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
      (Invoke-ComposeCommand -Arguments 'ps').Output | Out-Host
      (Invoke-ComposeCommand -Arguments 'down').Output | Out-Host
      exit 1
    }

    if ((Get-Date) -ge $deadline) {
      Write-Host ""
      Write-Host "Timeout aguardando containers ficarem prontos." -ForegroundColor Red
      $result.PendingIssues | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
      (Invoke-ComposeCommand -Arguments 'ps').Output | Out-Host
      (Invoke-ComposeCommand -Arguments 'down').Output | Out-Host
      exit 1
    }

    Start-Sleep -Seconds $pollIntervalSeconds
  }
}
catch {
  Write-Host ""
  Write-Host "Erro ao subir a infraestrutura local do StreamGate: $($_.Exception.Message)" -ForegroundColor Red
  try {
    (Invoke-ComposeCommand -Arguments 'ps').Output | Out-Host
    (Invoke-ComposeCommand -Arguments 'down').Output | Out-Host
  }
  catch {
  }
  exit 1
}
