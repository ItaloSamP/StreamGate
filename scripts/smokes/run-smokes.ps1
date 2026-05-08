param(
  [ValidateRange(30, 3600)]
  [int]$TimeoutSeconds = 900
)

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom
$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
. (Join-Path $root 'scripts/compose/compose-health.ps1')

$reportsDir = Join-Path $root 'scripts/smokes/reports'
$logsDir = Join-Path $reportsDir 'logs'
$results = New-Object System.Collections.Generic.List[object]
$failed = $false
$startedAt = Get-Date

function Initialize-SmokeReports {
  New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
  foreach ($item in @('summary.json', 'report.html')) {
    $target = Join-Path $reportsDir $item
    if (Test-Path $target) { Remove-Item $target -Force }
  }
  Get-ChildItem -Path $logsDir -File -ErrorAction SilentlyContinue | Remove-Item -Force
}

function ConvertTo-ReportSlug {
  param([string]$Value)
  return ($Value.ToLowerInvariant() -replace '[^a-z0-9]+', '-' -replace '(^-|-$)', '')
}

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
  $output = & cmd.exe /d /c "$Command 2>&1"
  $exitCode = $LASTEXITCODE
  $duration = [Math]::Round(((Get-Date) - $startedAt).TotalSeconds, 1)
  $logPath = Join-Path $logsDir "$((ConvertTo-ReportSlug -Value $Name)).log"
  if ($null -ne $output -and @($output).Count -gt 0) {
    $output | Out-Host
    $output | Set-Content -Path $logPath -Encoding utf8
  }
  else {
    '(sem output)' | Set-Content -Path $logPath -Encoding utf8
  }

  $script:results.Add([pscustomobject]@{
    Name = $Name
    Status = $(if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' })
    DurationSeconds = $duration
    LogPath = ($logPath.Substring($root.Length + 1) -replace '\\', '/')
  })

  if ($exitCode -ne 0) {
    throw "Smoke '$Name' falhou com exit code $exitCode."
  }
}

function Invoke-ComposeLogsSnapshot {
  Write-Host ""
  Write-Host "Logs recentes para diagnostico:" -ForegroundColor Yellow
  $diagnosticsPath = Join-Path $logsDir 'compose-diagnostics.log'
  "" | Set-Content -Path $diagnosticsPath -Encoding utf8
  foreach ($service in @('api', 'web', 'worker', 'rabbitmq', 'minio')) {
    Write-Host ""
    Write-Host "--- $service ---" -ForegroundColor DarkYellow
    "--- $service ---" | Add-Content -Path $diagnosticsPath -Encoding utf8
    $logs = & docker compose logs --tail 80 $service 2>&1
    $logs | Out-Host
    $logs | Add-Content -Path $diagnosticsPath -Encoding utf8
  }
}

function Write-SmokeReports {
  $finishedAt = Get-Date
  $status = if ($failed) { 'FAIL' } else { 'PASS' }
  $exitCode = if ($failed) { 1 } else { 0 }
  $duration = [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)
  $summary = [ordered]@{
    name = 'Operational smoke suite'
    status = $status
    exitCode = $exitCode
    startedAt = $startedAt.ToUniversalTime().ToString('o')
    finishedAt = $finishedAt.ToUniversalTime().ToString('o')
    durationSeconds = $duration
    cwd = '.'
    command = 'scripts/smokes/run-smokes.ps1'
    reportPath = 'scripts/smokes/reports/report.html'
    artifacts = @(
      [ordered]@{ label = 'Smoke logs'; path = 'scripts/smokes/reports/logs' }
    )
    steps = $results.ToArray()
  }

  $summary | ConvertTo-Json -Depth 8 | Set-Content -Path (Join-Path $reportsDir 'summary.json') -Encoding utf8
  $rows = @($results | ForEach-Object {
    "<tr><td>$($_.Name)</td><td class='$($_.Status.ToLowerInvariant())'>$($_.Status)</td><td>$($_.DurationSeconds)s</td><td><a href='logs/$([IO.Path]::GetFileName($_.LogPath))'>log</a></td></tr>"
  }) -join "`n"
  $html = @"
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Operational Smoke Suite</title>
  <style>
    body { margin: 0; font-family: "Segoe UI", sans-serif; background: #10130f; color: #f8f2dc; }
    main { max-width: 980px; margin: 0 auto; padding: 36px 20px; }
    h1 { font-size: clamp(2rem, 5vw, 4rem); letter-spacing: -.05em; }
    table { width: 100%; border-collapse: collapse; background: #1b2118; border-radius: 18px; overflow: hidden; }
    th, td { padding: 14px; border-bottom: 1px solid #33402c; text-align: left; }
    .pass { color: #98e6a2; font-weight: 800; }
    .fail { color: #ff8c76; font-weight: 800; }
    a { color: #d7ff72; }
  </style>
</head>
<body><main><h1>Operational Smoke Suite</h1><p>Status: <strong class="$($status.ToLowerInvariant())">$status</strong> | Duracao: ${duration}s</p><table><thead><tr><th>Smoke</th><th>Status</th><th>Duracao</th><th>Log</th></tr></thead><tbody>$rows</tbody></table></main></body>
</html>
"@
  $html | Set-Content -Path (Join-Path $reportsDir 'report.html') -Encoding utf8
  try { & node (Join-Path $root 'scripts/reports/generate-index.mjs') | Out-Host } catch {}
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

function Ensure-SmokeEnv {
  $envPath = Join-Path $root '.env'

  if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable('SMOKE_API_BASE_URL'))) {
    [Environment]::SetEnvironmentVariable('SMOKE_API_BASE_URL', 'http://127.0.0.1:3000')
  }

  foreach ($key in @('SMOKE_ADMIN_EMAIL', 'SMOKE_SECOND_ADMIN_EMAIL', 'SMOKE_SECOND_ADMIN_PASSWORD', 'SMOKE_NOTIFICATION_EMAIL', 'SMOKE_WEBHOOK_URL', 'SMOKE_HTTP_TIMEOUT_SECONDS', 'SMOKE_WORKER_TIMEOUT_SECONDS', 'SMOKE_POLL_INTERVAL_SECONDS')) {
    if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($key))) {
      $value = Get-DotEnvValue -Path $envPath -Key $key
      if (-not [string]::IsNullOrWhiteSpace($value)) {
        [Environment]::SetEnvironmentVariable($key, $value)
      }
    }
  }

  Assert-OperationalEnv -Path $envPath
}

try {
  Initialize-SmokeReports
  Ensure-SeedPasswordEnv
  Ensure-SmokeEnv

  Write-Host "Preparando ambiente limpo para smokes..." -ForegroundColor Cyan
  Stop-StreamGateStack

  Invoke-SmokeCommand -Name 'Start infra stack' -Command "powershell -ExecutionPolicy Bypass -File scripts/dev/dev-up.ps1 -Mode infra -TimeoutSeconds $TimeoutSeconds"
  Invoke-SmokeCommand -Name 'Infra compose smoke' -Command 'python scripts/smokes/compose-smoke.py'

  Invoke-SmokeCommand -Name 'Start app stack' -Command "powershell -ExecutionPolicy Bypass -File scripts/dev/dev-up.ps1 -Mode app -TimeoutSeconds $TimeoutSeconds"
  Invoke-SmokeCommand -Name 'Seed auth fixtures' -Command 'docker compose exec -T -e SEED_OPERATOR_PASSWORD -e SEED_ADMIN_PASSWORD api bundle exec rails db:seed'
  Invoke-SmokeCommand -Name 'Signed upload smoke' -Command 'python scripts/smokes/upload-signed-smoke.py'

  Invoke-SmokeCommand -Name 'Start full stack' -Command "powershell -ExecutionPolicy Bypass -File scripts/dev/dev-up.ps1 -Mode full -TimeoutSeconds $TimeoutSeconds"
  Invoke-SmokeCommand -Name 'Worker operational smoke' -Command 'python scripts/smokes/worker-operational-smoke.py'
  Invoke-SmokeCommand -Name 'Public link smoke' -Command 'python scripts/smokes/public-link-smoke.py'
  Invoke-SmokeCommand -Name 'Seed second admin fixture' -Command "docker compose exec -T -e SMOKE_ADMIN_EMAIL -e SMOKE_SECOND_ADMIN_EMAIL -e SMOKE_SECOND_ADMIN_PASSWORD api bundle exec rails runner `"admin = User.find_by!(email: ENV.fetch('SMOKE_ADMIN_EMAIL', 'admin@streamgate.local')); email = ENV.fetch('SMOKE_SECOND_ADMIN_EMAIL'); password = ENV.fetch('SMOKE_SECOND_ADMIN_PASSWORD'); user = User.find_or_initialize_by(email: email); user.full_name = 'Operational Approver'; user.organization_id = admin.organization_id; user.role = :admin; user.status = :active; user.password = password; user.save!; user.ensure_default_organization_membership!`""
  Invoke-SmokeCommand -Name 'Safe operations + artifacts + notifications smoke' -Command 'python scripts/smokes/safe-operations-smoke.py'
  Invoke-SmokeCommand -Name 'Persisted notifications + deliveries audit' -Command 'powershell -ExecutionPolicy Bypass -File scripts/smokes/verify-safe-operations-records.ps1'
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
  Write-SmokeReports
}

if ($failed) {
  exit 1
}

Write-Host "Todos os smokes passaram." -ForegroundColor Green
