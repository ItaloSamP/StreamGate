param(
  [ValidateRange(30, 3600)]
  [int]$TimeoutSeconds = 480
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

try {
  Invoke-ReportStep -Name 'Frontend unit reports' -Command 'cd apps\web && pnpm test:run'

  try {
    Invoke-ReportStep -Name 'Start infra for backend reports' -Command "powershell -ExecutionPolicy Bypass -File scripts/dev/dev-up.ps1 -Mode infra -TimeoutSeconds $TimeoutSeconds"
    Invoke-ReportStep -Name 'Prepare API test database' -Command 'cd apps\api && bundle exec rails db:prepare'
    Invoke-ReportStep -Name 'API Rails reports' -Command 'node scripts/reports/run-command.mjs --name "API Rails tests" --out apps/api/test/reports --cwd apps/api --coverage apps/api/test/reports/coverage/index.html --env STREAMGATE_REPORTS=1 -- bundle exec rails test'
    Invoke-ReportStep -Name 'Worker RSpec reports' -Command 'node scripts/reports/run-command.mjs --name "Worker RSpec tests" --out apps/worker/spec/reports --cwd apps/worker --coverage apps/worker/spec/reports/coverage/index.html --env STREAMGATE_REPORTS=1 -- bundle exec rspec'

    Invoke-ReportStep -Name 'Start app for frontend integration reports' -Command "powershell -ExecutionPolicy Bypass -File scripts/dev/dev-up.ps1 -Mode app -TimeoutSeconds $TimeoutSeconds"
    Invoke-ReportStep -Name 'Seed auth fixtures' -Command 'docker compose exec -T -e SEED_OPERATOR_PASSWORD -e SEED_ADMIN_PASSWORD api bundle exec rails db:seed'
    Invoke-ReportStep -Name 'Frontend integration reports' -Command 'cd apps\web && pnpm test:integration'
    Invoke-ReportStep -Name 'Frontend E2E reports' -Command 'cd apps\web && pnpm test:e2e'
  }
  finally {
    Stop-Stack
  }

  Invoke-ReportStep -Name 'Operational smoke reports' -Command "powershell -ExecutionPolicy Bypass -File scripts/smokes/run-smokes.ps1 -TimeoutSeconds $TimeoutSeconds"
  Invoke-ReportStep -Name 'Local CI reports' -Command 'powershell -ExecutionPolicy Bypass -File scripts/ci/ci-local.ps1 all'
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
Write-Host "Todos os reports foram gerados com sucesso." -ForegroundColor Green
