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

$results = New-Object System.Collections.Generic.List[object]
$failed = $false

function Invoke-SmokeCommand {
  param(
    [Parameter(Mandatory)]
    [string]$Name,
    [Parameter(Mandatory)]
    [string]$Command
  )

  Write-Host ""
  Write-Host "==> $Name" -ForegroundColor Cyan
  $startedAt = Get-Date
  & cmd.exe /d /c $Command
  $exitCode = $LASTEXITCODE
  $duration = [Math]::Round(((Get-Date) - $startedAt).TotalSeconds, 1)

  $script:results.Add([pscustomobject]@{
    Name = $Name
    Status = $(if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' })
    DurationSeconds = $duration
  })

  if ($exitCode -ne 0) {
    throw "Smoke '$Name' falhou com exit code $exitCode."
  }
}

function Invoke-ComposeLogsSnapshot {
  Write-Host ""
  Write-Host "Logs recentes para diagnostico:" -ForegroundColor Yellow
  foreach ($service in @('api', 'web', 'worker', 'rabbitmq', 'minio')) {
    Write-Host ""
    Write-Host "--- $service ---" -ForegroundColor DarkYellow
    & docker compose logs --tail 80 $service 2>&1 | Out-Host
  }
}

function Stop-StreamGateStack {
  try {
    & powershell -ExecutionPolicy Bypass -File (Join-Path $root 'scripts/dev/dev-down.ps1') | Out-Host
  }
  catch {
    Write-Host "Falha ao derrubar stack: $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

function Ensure-SeedPasswordEnv {
  if (-not [string]::IsNullOrWhiteSpace($env:SEED_OPERATOR_PASSWORD)) {
    if ([string]::IsNullOrWhiteSpace($env:SEED_ADMIN_PASSWORD)) {
      $env:SEED_ADMIN_PASSWORD = $env:SEED_OPERATOR_PASSWORD
    }
    return
  }

  $seedPassword = Get-DotEnvValue -Path (Join-Path $root '.env') -Key 'SEED_OPERATOR_PASSWORD'
  if (-not [string]::IsNullOrWhiteSpace($seedPassword)) {
    $env:SEED_OPERATOR_PASSWORD = $seedPassword
  }

  $adminPassword = Get-DotEnvValue -Path (Join-Path $root '.env') -Key 'SEED_ADMIN_PASSWORD'
  if (-not [string]::IsNullOrWhiteSpace($adminPassword)) {
    $env:SEED_ADMIN_PASSWORD = $adminPassword
  }
  elseif (-not [string]::IsNullOrWhiteSpace($env:SEED_OPERATOR_PASSWORD)) {
    $env:SEED_ADMIN_PASSWORD = $env:SEED_OPERATOR_PASSWORD
  }
}

try {
  Ensure-SeedPasswordEnv

  Write-Host "Preparando ambiente limpo para smokes..." -ForegroundColor Cyan
  Stop-StreamGateStack

  Invoke-SmokeCommand -Name 'Start infra stack' -Command "powershell -ExecutionPolicy Bypass -File scripts/dev/dev-up.ps1 -Mode infra -TimeoutSeconds $TimeoutSeconds"
  Invoke-SmokeCommand -Name 'Infra compose smoke' -Command 'python scripts/smokes/compose-smoke.py'

  Invoke-SmokeCommand -Name 'Start app stack' -Command "powershell -ExecutionPolicy Bypass -File scripts/dev/dev-up.ps1 -Mode app -TimeoutSeconds $TimeoutSeconds"
  Invoke-SmokeCommand -Name 'Seed auth fixtures' -Command 'docker compose exec -T -e SEED_OPERATOR_PASSWORD -e SEED_ADMIN_PASSWORD api bundle exec rails db:seed'
  Invoke-SmokeCommand -Name 'Signed upload smoke' -Command 'python scripts/smokes/upload-signed-smoke.py'

  Invoke-SmokeCommand -Name 'Start full stack' -Command "powershell -ExecutionPolicy Bypass -File scripts/dev/dev-up.ps1 -Mode full -TimeoutSeconds $TimeoutSeconds"
  Invoke-SmokeCommand -Name 'Worker operational smoke' -Command 'python scripts/smokes/worker-operational-smoke.py'
}
catch {
  $failed = $true
  Write-Host ""
  Write-Host $_.Exception.Message -ForegroundColor Red
  try { & docker compose ps | Out-Host } catch {}
  Invoke-ComposeLogsSnapshot
}
finally {
  Write-Host ""
  Write-Host "Resumo dos smokes" -ForegroundColor Cyan
  foreach ($result in $results) {
    $color = if ($result.Status -eq 'PASS') { 'Green' } else { 'Red' }
    Write-Host ("{0,-28} {1,-6} {2,6}s" -f $result.Name, $result.Status, $result.DurationSeconds) -ForegroundColor $color
  }

  Stop-StreamGateStack
}

if ($failed) {
  exit 1
}

Write-Host "Todos os smokes passaram." -ForegroundColor Green
