#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-480}"
FAILED=0
RESULT_NAMES=()
RESULT_STATUS=()
RESULT_DURATION=()

cd "$ROOT_DIR"

get_dotenv_value() {
  local key="$1"
  [[ -f .env ]] || return 0
  grep -E "^[[:space:]]*$key=" .env | head -n 1 | cut -d= -f2- | xargs || true
}

ensure_seed_password_env() {
  if [[ -n "${SEED_OPERATOR_PASSWORD:-}" ]]; then
    if [[ -z "${SEED_ADMIN_PASSWORD:-}" ]]; then
      export SEED_ADMIN_PASSWORD="$SEED_OPERATOR_PASSWORD"
    fi
    return
  fi
  local value
  value="$(get_dotenv_value SEED_OPERATOR_PASSWORD)"
  if [[ -n "$value" ]]; then
    export SEED_OPERATOR_PASSWORD="$value"
  fi

  local admin_value
  admin_value="$(get_dotenv_value SEED_ADMIN_PASSWORD)"
  if [[ -n "$admin_value" ]]; then
    export SEED_ADMIN_PASSWORD="$admin_value"
  elif [[ -n "${SEED_OPERATOR_PASSWORD:-}" ]]; then
    export SEED_ADMIN_PASSWORD="$SEED_OPERATOR_PASSWORD"
  fi
}

stop_stack() {
  bash scripts/dev/dev-down.sh || true
}

collect_logs() {
  echo
  echo "Logs recentes para diagnostico:"
  for service in api web worker rabbitmq minio; do
    echo
    echo "--- $service ---"
    docker compose logs --tail 80 "$service" || true
  done
}

run_step() {
  local name="$1"
  shift
  echo
  echo "==> $name"
  local start end duration
  start="$(date +%s)"
  if "$@"; then
    end="$(date +%s)"
    duration=$((end - start))
    RESULT_NAMES+=("$name")
    RESULT_STATUS+=("PASS")
    RESULT_DURATION+=("$duration")
  else
    end="$(date +%s)"
    duration=$((end - start))
    RESULT_NAMES+=("$name")
    RESULT_STATUS+=("FAIL")
    RESULT_DURATION+=("$duration")
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

trap 'print_summary; stop_stack' EXIT

ensure_seed_password_env

echo "Preparando ambiente limpo para smokes..."
stop_stack

run_step "Start infra stack" bash scripts/dev/dev-up.sh infra "$TIMEOUT_SECONDS" || FAILED=1
if [[ "$FAILED" -eq 0 ]]; then run_step "Infra compose smoke" python scripts/smokes/compose-smoke.py || FAILED=1; fi
if [[ "$FAILED" -eq 0 ]]; then run_step "Start app stack" bash scripts/dev/dev-up.sh app "$TIMEOUT_SECONDS" || FAILED=1; fi
if [[ "$FAILED" -eq 0 ]]; then run_step "Seed auth fixtures" docker compose exec -T -e SEED_OPERATOR_PASSWORD -e SEED_ADMIN_PASSWORD api bundle exec rails db:seed || FAILED=1; fi
if [[ "$FAILED" -eq 0 ]]; then run_step "Signed upload smoke" python scripts/smokes/upload-signed-smoke.py || FAILED=1; fi
if [[ "$FAILED" -eq 0 ]]; then run_step "Start full stack" bash scripts/dev/dev-up.sh full "$TIMEOUT_SECONDS" || FAILED=1; fi
if [[ "$FAILED" -eq 0 ]]; then run_step "Worker operational smoke" python scripts/smokes/worker-operational-smoke.py || FAILED=1; fi

if [[ "$FAILED" -ne 0 ]]; then
  docker compose ps || true
  collect_logs
  exit 1
fi

echo "Todos os smokes passaram."
