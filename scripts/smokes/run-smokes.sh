#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT_DIR/scripts/compose/compose-health.sh"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-480}"
REPORTS_DIR="$ROOT_DIR/scripts/smokes/reports"
LOGS_DIR="$REPORTS_DIR/logs"
STARTED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
START_SECONDS="$(date +%s)"
FAILED=0
RESULT_NAMES=()
RESULT_STATUS=()
RESULT_DURATION=()
RESULT_LOGS=()

cd "$ROOT_DIR"

report_slug() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-|-$//g'
}

init_reports() {
  mkdir -p "$LOGS_DIR"
  rm -f "$REPORTS_DIR/summary.json" "$REPORTS_DIR/report.html" "$LOGS_DIR"/*.log
}

ensure_seed_password_env() {
  local env_path="$ROOT_DIR/.env"
  if [[ -n "${SEED_OPERATOR_PASSWORD:-}" ]]; then
    if [[ -z "${SEED_ADMIN_PASSWORD:-}" ]]; then
      export SEED_ADMIN_PASSWORD="$SEED_OPERATOR_PASSWORD"
    fi
    return
  fi
  local value
  value="$(get_dotenv_value "$env_path" "SEED_OPERATOR_PASSWORD")"
  if [[ -n "$value" ]]; then
    export SEED_OPERATOR_PASSWORD="$value"
  fi

  local admin_value
  admin_value="$(get_dotenv_value "$env_path" "SEED_ADMIN_PASSWORD")"
  if [[ -n "$admin_value" ]]; then
    export SEED_ADMIN_PASSWORD="$admin_value"
  elif [[ -n "${SEED_OPERATOR_PASSWORD:-}" ]]; then
    export SEED_ADMIN_PASSWORD="$SEED_OPERATOR_PASSWORD"
  fi
}

ensure_smoke_env() {
  local env_path="$ROOT_DIR/.env"
  local key value

  export SMOKE_API_BASE_URL="${SMOKE_API_BASE_URL:-http://127.0.0.1:3000}"

  for key in \
    SMOKE_ADMIN_EMAIL \
    SMOKE_SECOND_ADMIN_EMAIL \
    SMOKE_SECOND_ADMIN_PASSWORD \
    SMOKE_NOTIFICATION_EMAIL \
    SMOKE_WEBHOOK_URL \
    SMOKE_HTTP_TIMEOUT_SECONDS \
    SMOKE_WORKER_TIMEOUT_SECONDS \
    SMOKE_POLL_INTERVAL_SECONDS
  do
    if [[ -z "${!key:-}" ]]; then
      value="$(get_dotenv_value "$env_path" "$key")"
      if [[ -n "$value" ]]; then
        export "$key=$value"
      fi
    fi
  done

  assert_operational_env "$env_path"
}

stop_stack() {
  bash scripts/dev/dev-down.sh || true
}

collect_logs() {
  echo
  echo "Logs recentes para diagnostico:"
  local diagnostics_path="$LOGS_DIR/compose-diagnostics.log"
  : > "$diagnostics_path"
  for service in api web worker rabbitmq minio; do
    echo
    echo "--- $service ---"
    {
      echo "--- $service ---"
      docker compose logs --tail 80 "$service" || true
    } | tee -a "$diagnostics_path"
  done
}

run_step() {
  local name="$1"
  shift
  echo
  echo "==> $name"
  local slug log_path
  slug="$(report_slug "$name")"
  log_path="$LOGS_DIR/$slug.log"
  local start end duration
  start="$(date +%s)"
  if "$@" > >(tee "$log_path") 2>&1; then
    end="$(date +%s)"
    duration=$((end - start))
    RESULT_NAMES+=("$name")
    RESULT_STATUS+=("PASS")
    RESULT_DURATION+=("$duration")
    RESULT_LOGS+=("scripts/smokes/reports/logs/$slug.log")
  else
    end="$(date +%s)"
    duration=$((end - start))
    RESULT_NAMES+=("$name")
    RESULT_STATUS+=("FAIL")
    RESULT_DURATION+=("$duration")
    RESULT_LOGS+=("scripts/smokes/reports/logs/$slug.log")
    return 1
  fi
}

print_summary() {
  echo
  echo "Resumo dos smokes"
  for index in "${!RESULT_NAMES[@]}"; do
    printf '%-28s %-6s %6ss\n' "${RESULT_NAMES[$index]}" "${RESULT_STATUS[$index]}" "${RESULT_DURATION[$index]}"
  done
}

write_reports() {
  local status="PASS"
  local exit_code=0
  if [[ "$FAILED" -ne 0 ]]; then
    status="FAIL"
    exit_code=1
  fi
  local finished_at duration
  finished_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  duration=$(( $(date +%s) - START_SECONDS ))

  {
    printf '{\n'
    printf '  "name": "Operational smoke suite",\n'
    printf '  "status": "%s",\n' "$status"
    printf '  "exitCode": %s,\n' "$exit_code"
    printf '  "startedAt": "%s",\n' "$STARTED_AT"
    printf '  "finishedAt": "%s",\n' "$finished_at"
    printf '  "durationSeconds": %s,\n' "$duration"
    printf '  "cwd": ".",\n'
    printf '  "command": "scripts/smokes/run-smokes.sh",\n'
    printf '  "reportPath": "scripts/smokes/reports/report.html",\n'
    printf '  "artifacts": [{"label": "Smoke logs", "path": "scripts/smokes/reports/logs"}],\n'
    printf '  "steps": [\n'
    for index in "${!RESULT_NAMES[@]}"; do
      [[ "$index" -gt 0 ]] && printf ',\n'
      printf '    {"Name": "%s", "Status": "%s", "DurationSeconds": %s, "LogPath": "%s"}' \
        "${RESULT_NAMES[$index]}" "${RESULT_STATUS[$index]}" "${RESULT_DURATION[$index]}" "${RESULT_LOGS[$index]}"
    done
    printf '\n  ]\n'
    printf '}\n'
  } > "$REPORTS_DIR/summary.json"

  {
    printf '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Operational Smoke Suite</title>'
    printf '<style>body{margin:0;font-family:Segoe UI,sans-serif;background:#10130f;color:#f8f2dc}main{max-width:980px;margin:0 auto;padding:36px 20px}h1{font-size:clamp(2rem,5vw,4rem);letter-spacing:-.05em}table{width:100%%;border-collapse:collapse;background:#1b2118;border-radius:18px;overflow:hidden}th,td{padding:14px;border-bottom:1px solid #33402c;text-align:left}.pass{color:#98e6a2;font-weight:800}.fail{color:#ff8c76;font-weight:800}a{color:#d7ff72}</style></head><body><main>'
    printf '<h1>Operational Smoke Suite</h1><p>Status: <strong class="%s">%s</strong> | Duracao: %ss</p><table><thead><tr><th>Smoke</th><th>Status</th><th>Duracao</th><th>Log</th></tr></thead><tbody>' "$(tr '[:upper:]' '[:lower:]' <<< "$status")" "$status" "$duration"
    for index in "${!RESULT_NAMES[@]}"; do
      printf '<tr><td>%s</td><td class="%s">%s</td><td>%ss</td><td><a href="logs/%s">log</a></td></tr>' \
        "${RESULT_NAMES[$index]}" "$(tr '[:upper:]' '[:lower:]' <<< "${RESULT_STATUS[$index]}")" "${RESULT_STATUS[$index]}" "${RESULT_DURATION[$index]}" "$(basename "${RESULT_LOGS[$index]}")"
    done
    printf '</tbody></table></main></body></html>'
  } > "$REPORTS_DIR/report.html"

  node scripts/reports/generate-index.mjs || true
}

trap 'print_summary; stop_stack; write_reports' EXIT

init_reports
ensure_seed_password_env
ensure_smoke_env

echo "Preparando ambiente limpo para smokes..."
stop_stack

run_step "Start infra stack" bash scripts/dev/dev-up.sh infra "$TIMEOUT_SECONDS" || FAILED=1
if [[ "$FAILED" -eq 0 ]]; then run_step "Infra compose smoke" python scripts/smokes/compose-smoke.py || FAILED=1; fi
if [[ "$FAILED" -eq 0 ]]; then run_step "Start app stack" bash scripts/dev/dev-up.sh app "$TIMEOUT_SECONDS" || FAILED=1; fi
if [[ "$FAILED" -eq 0 ]]; then run_step "Seed auth fixtures" docker compose exec -T -e SEED_OPERATOR_PASSWORD -e SEED_ADMIN_PASSWORD api bundle exec rails db:seed || FAILED=1; fi
if [[ "$FAILED" -eq 0 ]]; then run_step "Signed upload smoke" python scripts/smokes/upload-signed-smoke.py || FAILED=1; fi
if [[ "$FAILED" -eq 0 ]]; then run_step "Start full stack" bash scripts/dev/dev-up.sh full "$TIMEOUT_SECONDS" || FAILED=1; fi
if [[ "$FAILED" -eq 0 ]]; then run_step "Worker operational smoke" python scripts/smokes/worker-operational-smoke.py || FAILED=1; fi
if [[ "$FAILED" -eq 0 ]]; then run_step "Public link smoke" python scripts/smokes/public-link-smoke.py || FAILED=1; fi
if [[ "$FAILED" -eq 0 ]]; then run_step "Seed second admin fixture" docker compose exec -T -e SMOKE_ADMIN_EMAIL -e SMOKE_SECOND_ADMIN_EMAIL -e SMOKE_SECOND_ADMIN_PASSWORD api bundle exec rails runner "admin = User.find_by!(email: ENV.fetch('SMOKE_ADMIN_EMAIL', 'admin@streamgate.local')); email = ENV.fetch('SMOKE_SECOND_ADMIN_EMAIL'); password = ENV.fetch('SMOKE_SECOND_ADMIN_PASSWORD'); user = User.find_or_initialize_by(email: email); user.full_name = 'Operational Approver'; user.organization_id = admin.organization_id; user.role = :admin; user.status = :active; user.password = password; user.save!; user.ensure_default_organization_membership!" || FAILED=1; fi
if [[ "$FAILED" -eq 0 ]]; then run_step "Safe operations + artifacts + notifications smoke" python scripts/smokes/safe-operations-smoke.py || FAILED=1; fi
if [[ "$FAILED" -eq 0 ]]; then run_step "Persisted notifications + deliveries audit" bash scripts/smokes/verify-safe-operations-records.sh || FAILED=1; fi

if [[ "$FAILED" -ne 0 ]]; then
  docker compose ps || true
  collect_logs
  exit 1
fi

echo "Todos os smokes passaram."
