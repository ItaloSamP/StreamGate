param(
  [ValidateRange(30, 3600)]
  [int]$TimeoutSeconds = 480,
  [ValidateSet('fast', 'operational', 'full-closeout')]
  [string]$Profile = 'full-closeout'
)

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom
$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
. (Join-Path $root 'scripts/compose/compose-health.ps1')

$failure = $null

function Invoke-ReportStep {
  param(
    [Parameter(Mandatory)]
    [string]$Name,
    [Parameter(Mandatory)]
    [string]$Command
  )

  Write-Host ""
  Write-Host "==> $Name" -ForegroundColor Cyan
  Push-Location $root
  try {
    & cmd.exe /d /c $Command
    $exitCode = $LASTEXITCODE
  }
  finally {
    Pop-Location
  }

  if ($exitCode -ne 0) {
    $script:failure = "$Name (exit code $exitCode)"
    Write-Host "Status: FAIL" -ForegroundColor Red
    throw $script:failure
  }
  else {
    Write-Host "Status: PASS" -ForegroundColor Green
  }
}

function Invoke-ReportStepWithRetry {
  param(
    [Parameter(Mandatory)]
    [string]$Name,
    [Parameter(Mandatory)]
    [string]$Command,
    [int]$Attempts = 2
  )

  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    try {
      Invoke-ReportStep -Name $Name -Command $Command
      return
    }
    catch {
      if ($attempt -ge $Attempts) {
        throw
      }

      Write-Host "Tentativa $attempt falhou para '$Name'. Repetindo..." -ForegroundColor Yellow
      Stop-Stack
      Start-Sleep -Seconds 5
    }
  }
}

function Get-SeedPassword {
  $value = Get-DotEnvValue -Path (Join-Path $root '.env') -Key 'SEED_OPERATOR_PASSWORD'
  if ([string]::IsNullOrWhiteSpace($value)) {
    return 'ChangeMe123!'
  }
  return $value
}

function Get-EnvOrDotEnv {
  param(
    [Parameter(Mandatory)]
    [string]$Key,
    [Parameter(Mandatory)]
    [string]$DefaultValue
  )

  $currentValue = [Environment]::GetEnvironmentVariable($Key)
  if (-not [string]::IsNullOrWhiteSpace($currentValue)) {
    return $currentValue
  }

  $dotEnvValue = Get-DotEnvValue -Path (Join-Path $root '.env') -Key $Key
  if (-not [string]::IsNullOrWhiteSpace($dotEnvValue)) {
    return $dotEnvValue
  }

  return $DefaultValue
}

function Stop-Stack {
  try {
    & powershell -ExecutionPolicy Bypass -File (Join-Path $root 'scripts/dev/dev-down.ps1') | Out-Host
  }
  catch {
    Write-Host "Falha ao derrubar stack: $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

function Assert-DevopsReadiness {
  Assert-Sprint5OperationalEnv -Path (Join-Path $root '.env')
}

function Wait-HttpReady {
  param(
    [Parameter(Mandatory)]
    [string]$Name,
    [Parameter(Mandatory)]
    [string]$Url,
    [int]$Attempts = 30,
    [int]$DelaySeconds = 2
  )

  Write-Host ""
  Write-Host "==> Wait $Name readiness" -ForegroundColor Cyan

  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        Write-Host "Status: PASS" -ForegroundColor Green
        return
      }
    }
    catch {
      if ($attempt -ge $Attempts) {
        $script:failure = "$Name readiness"
        Write-Host "Status: FAIL" -ForegroundColor Red
        throw "Falha ao aguardar $Name em $Url"
      }
    }

    Start-Sleep -Seconds $DelaySeconds
  }
}

function Wait-TcpReady {
  param(
    [Parameter(Mandatory)]
    [string]$Name,
    [Parameter(Mandatory)]
    [string]$Hostname,
    [Parameter(Mandatory)]
    [int]$Port,
    [int]$Attempts = 30,
    [int]$DelaySeconds = 2
  )

  Write-Host ""
  Write-Host "==> Wait $Name readiness" -ForegroundColor Cyan

  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    $client = $null
    try {
      $client = [System.Net.Sockets.TcpClient]::new()
      $asyncConnect = $client.BeginConnect($Hostname, $Port, $null, $null)
      $connected = $asyncConnect.AsyncWaitHandle.WaitOne([TimeSpan]::FromSeconds(5))
      if ($connected) {
        $client.EndConnect($asyncConnect)
        Write-Host "Status: PASS" -ForegroundColor Green
        return
      }
    }
    catch {
    }
    finally {
      if ($null -ne $client) {
        $client.Dispose()
      }
    }

    if ($attempt -ge $Attempts) {
      $script:failure = "$Name readiness"
      Write-Host "Status: FAIL" -ForegroundColor Red
      throw "Falha ao aguardar $Name em ${Hostname}:$Port"
    }

    Start-Sleep -Seconds $DelaySeconds
  }
}

function Write-ProfileBanner {
  Write-Host ""
  Write-Host "Perfil de reports: $Profile" -ForegroundColor Cyan
  switch ($Profile) {
    'fast' { Write-Host 'Escopo: frontend unit + backend API/worker. Sem integracao/E2E/smokes.' -ForegroundColor DarkCyan }
    'operational' { Write-Host 'Escopo: apenas smoke operacional/runtime para Sprint 5.' -ForegroundColor DarkCyan }
    'full-closeout' { Write-Host 'Escopo: backend/frontend reports + integracao/E2E + smokes. CI local roda separado para evitar duplicacao.' -ForegroundColor DarkCyan }
  }
}

$env:SEED_OPERATOR_PASSWORD = Get-SeedPassword
if ([string]::IsNullOrWhiteSpace($env:SEED_ADMIN_PASSWORD)) {
  $env:SEED_ADMIN_PASSWORD = $env:SEED_OPERATOR_PASSWORD
}
$env:AUTH_INTEGRATION_BASE_URL = 'http://localhost:3000'
$env:E2E_BASE_URL = 'http://localhost:5173'
$env:POSTGRES_HOST = Get-EnvOrDotEnv -Key 'POSTGRES_HOST' -DefaultValue 'localhost'
$env:POSTGRES_PORT = Get-EnvOrDotEnv -Key 'POSTGRES_PORT' -DefaultValue '5432'
$env:POSTGRES_DB = Get-EnvOrDotEnv -Key 'POSTGRES_DB' -DefaultValue 'streamgate_development'
$env:POSTGRES_TEST_DB = Get-EnvOrDotEnv -Key 'POSTGRES_TEST_DB' -DefaultValue 'streamgate_test'
$env:POSTGRES_USER = Get-EnvOrDotEnv -Key 'POSTGRES_USER' -DefaultValue 'postgres'
$env:POSTGRES_PASSWORD = Get-EnvOrDotEnv -Key 'POSTGRES_PASSWORD' -DefaultValue 'postgres'
$env:PARALLEL_WORKERS = Get-EnvOrDotEnv -Key 'PARALLEL_WORKERS' -DefaultValue '1'

try {
  Assert-DevopsReadiness
  Write-ProfileBanner

  if ($Profile -in @('fast', 'full-closeout')) {
    Invoke-ReportStep -Name 'Frontend unit reports' -Command 'cd apps\web && pnpm test:run'
  }

  if ($Profile -in @('fast', 'full-closeout')) {
    try {
      Invoke-ReportStepWithRetry -Name 'Start infra for backend reports' -Command "powershell -ExecutionPolicy Bypass -File scripts/dev/dev-up.ps1 -Mode infra -TimeoutSeconds $TimeoutSeconds"
      Invoke-ReportStep -Name 'Prepare API test database' -Command 'cd apps\api && bundle exec rails db:prepare'
      Invoke-ReportStep -Name 'API Rails reports' -Command 'node scripts/reports/run-command.mjs --name "API Rails tests" --out apps/api/test/reports --cwd apps/api --coverage apps/api/test/reports/coverage/index.html --env STREAMGATE_REPORTS=1 -- bundle exec rails test'
      Invoke-ReportStep -Name 'Worker RSpec reports' -Command 'node scripts/reports/run-command.mjs --name "Worker RSpec tests" --out apps/worker/spec/reports --cwd apps/worker --coverage apps/worker/spec/reports/coverage/index.html --env STREAMGATE_REPORTS=1 -- bundle exec rspec'
    }
    finally {
      Stop-Stack
    }
  }

  if ($Profile -eq 'full-closeout') {
    try {
      Invoke-ReportStepWithRetry -Name 'Start app for frontend integration reports' -Command "powershell -ExecutionPolicy Bypass -File scripts/dev/dev-up.ps1 -Mode app -TimeoutSeconds $TimeoutSeconds"
      Invoke-ReportStep -Name 'Seed auth fixtures' -Command 'docker compose exec -T -e SEED_OPERATOR_PASSWORD -e SEED_ADMIN_PASSWORD api bundle exec rails db:seed'
      Wait-TcpReady -Name 'API app' -Hostname '127.0.0.1' -Port 3000
      Wait-HttpReady -Name 'Web app' -Url 'http://localhost:5173/login'
      Invoke-ReportStep -Name 'Frontend integration reports' -Command 'cd apps\web && pnpm test:integration'
      Invoke-ReportStep -Name 'Frontend E2E reports' -Command 'set "E2E_STABLE_MODE=1" && cd apps\web && pnpm test:e2e'
    }
    finally {
      Stop-Stack
    }
  }

  if ($Profile -in @('operational', 'full-closeout')) {
    Invoke-ReportStep -Name 'Operational smoke reports' -Command "powershell -ExecutionPolicy Bypass -File scripts/smokes/run-smokes.ps1 -TimeoutSeconds $TimeoutSeconds"
  }
}
catch {
  if ([string]::IsNullOrWhiteSpace($failure)) {
    $failure = $_.Exception.Message
  }
}
finally {
  try {
    & node (Join-Path $root 'scripts/reports/generate-index.mjs') | Out-Host
  }
  catch {
    Write-Host "Falha ao atualizar hub de reports: $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

if (-not [string]::IsNullOrWhiteSpace($failure)) {
  Write-Host ""
  Write-Host "Execucao interrompida no primeiro erro:" -ForegroundColor Red
  Write-Host "- $failure" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Todos os reports do perfil '$Profile' foram gerados com sucesso." -ForegroundColor Green
