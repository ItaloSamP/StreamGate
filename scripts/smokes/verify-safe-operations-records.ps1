param(
  [string]$ContextPath = ".tmp/smokes/safe-operations-context.json"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$absoluteContextPath = Join-Path $root $ContextPath

if (-not (Test-Path -LiteralPath $absoluteContextPath)) {
  throw "Contexto do safe smoke nao encontrado em '$absoluteContextPath'."
}

$context = Get-Content -LiteralPath $absoluteContextPath -Raw | ConvertFrom-Json
Push-Location $root
try {
  & docker compose exec -T `
    -e "SAFE_COMPLETED_JOB_ID=$($context.completed_job_id)" `
    -e "SAFE_COMPLETED_NOTIFICATION_ID=$($context.completed_notification_id)" `
    -e "SAFE_QUARANTINED_JOB_ID=$($context.quarantined_job_id)" `
    -e "SAFE_QUARANTINE_ID=$($context.quarantine_id)" `
    -e "SAFE_RETRY_NOTIFICATION_ID=$($context.retry_notification_id)" `
    -e "SAFE_REPLAY_REQUEST_ID=$($context.replay_request_id)" `
    -e "SAFE_WEBHOOK_TEST_TRACE_ID=$($context.webhook_test_trace_id)" `
    api bundle exec rails runner script/verify_safe_operations_records.rb

  if ($LASTEXITCODE -ne 0) {
    throw "Verificacao persistida do safe smoke falhou com exit code $LASTEXITCODE."
  }
}
finally {
  Pop-Location
}
