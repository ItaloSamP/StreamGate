#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT_DIR/scripts/compose/compose-health.sh"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-480}"
PROFILE="${PROFILE:-full-closeout}"
FAILURES=()

cd "$ROOT_DIR"

run_step() {
  local name="$1"
  shift
  echo
  echo "==> $name"
  if "$@"; then
    echo "Status: PASS"
  else
    local exit_code=$?
    echo "Status: FAIL"
    FAILURES+=("$name (exit code $exit_code)")
    return "$exit_code"
  fi
}

run_step_with_retry() {
  local name="$1"
  shift
  local attempts=2
  local attempt
  for attempt in $(seq 1 "$attempts"); do
    if run_step "$name" "$@"; then
      return 0
    fi

    if [[ "$attempt" -lt "$attempts" ]]; then
      echo "Tentativa $attempt falhou para '$name'. Repetindo..."
      stop_stack
      sleep 5
    fi
  done

  return 1
}

wait_tcp_ready() {
  local name="$1"
  local hostname="$2"
  local port="$3"
  local attempts="${4:-30}"
  local delay_seconds="${5:-2}"
  local attempt

  echo
  echo "==> Wait $name readiness"

  for attempt in $(seq 1 "$attempts"); do
    if python - "$hostname" "$port" <<'PY'
import socket
import sys

host = sys.argv[1]
port = int(sys.argv[2])

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(5)
try:
    sock.connect((host, port))
except OSError:
    sys.exit(1)
finally:
    sock.close()
PY
    then
      echo "Status: PASS"
      return 0
    fi

    if [[ "$attempt" -ge "$attempts" ]]; then
      FAILURES+=("$name readiness")
      echo "Status: FAIL"
      echo "Falha ao aguardar $name em ${hostname}:$port" >&2
      return 1
    fi

    sleep "$delay_seconds"
  done
}

wait_http_ready() {
  local name="$1"
  local url="$2"
  local attempts="${3:-30}"
  local delay_seconds="${4:-2}"
  local attempt

  echo
  echo "==> Wait $name readiness"

  for attempt in $(seq 1 "$attempts"); do
    if curl --silent --show-error --fail --max-time 15 "$url" >/dev/null; then
      echo "Status: PASS"
      return 0
    fi

    if [[ "$attempt" -ge "$attempts" ]]; then
      FAILURES+=("$name readiness")
      echo "Status: FAIL"
      echo "Falha ao aguardar $name em $url" >&2
      return 1
    fi

    sleep "$delay_seconds"
  done
}

stop_stack() {
  bash scripts/dev/dev-down.sh || true
}

print_profile_banner() {
  echo
  echo "Perfil de reports: $PROFILE"
  case "$PROFILE" in
    fast)
      echo "Escopo: frontend unit + backend API/worker. Sem integracao/E2E/smokes."
      ;;
    operational)
      echo "Escopo: apenas smoke operacional/runtime para Sprint 5."
      ;;
    full-closeout)
      echo "Escopo: backend/frontend reports + integracao/E2E + smokes. CI local roda separado para evitar duplicacao."
      ;;
    *)
      echo "PROFILE invalido: $PROFILE" >&2
      exit 1
      ;;
  esac
}

export SEED_OPERATOR_PASSWORD="${SEED_OPERATOR_PASSWORD:-$(get_dotenv_value "$ROOT_DIR/.env" SEED_OPERATOR_PASSWORD)}"
export SEED_OPERATOR_PASSWORD="${SEED_OPERATOR_PASSWORD:-ChangeMe123!}"
export SEED_ADMIN_PASSWORD="${SEED_ADMIN_PASSWORD:-$SEED_OPERATOR_PASSWORD}"
export AUTH_INTEGRATION_BASE_URL="${AUTH_INTEGRATION_BASE_URL:-http://localhost:3000}"
export E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:5173}"
export POSTGRES_HOST="${POSTGRES_HOST:-$(get_dotenv_value "$ROOT_DIR/.env" POSTGRES_HOST)}"
export POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
export POSTGRES_PORT="${POSTGRES_PORT:-$(get_dotenv_value "$ROOT_DIR/.env" POSTGRES_PORT)}"
export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
export POSTGRES_DB="${POSTGRES_DB:-$(get_dotenv_value "$ROOT_DIR/.env" POSTGRES_DB)}"
export POSTGRES_DB="${POSTGRES_DB:-streamgate_development}"
export POSTGRES_TEST_DB="${POSTGRES_TEST_DB:-$(get_dotenv_value "$ROOT_DIR/.env" POSTGRES_TEST_DB)}"
export POSTGRES_TEST_DB="${POSTGRES_TEST_DB:-streamgate_test}"
export POSTGRES_USER="${POSTGRES_USER:-$(get_dotenv_value "$ROOT_DIR/.env" POSTGRES_USER)}"
export POSTGRES_USER="${POSTGRES_USER:-postgres}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(get_dotenv_value "$ROOT_DIR/.env" POSTGRES_PASSWORD)}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
export PARALLEL_WORKERS="${PARALLEL_WORKERS:-$(get_dotenv_value "$ROOT_DIR/.env" PARALLEL_WORKERS)}"
export PARALLEL_WORKERS="${PARALLEL_WORKERS:-1}"

assert_sprint5_operational_env "$ROOT_DIR/.env"
print_profile_banner

if [[ "$PROFILE" == "fast" || "$PROFILE" == "full-closeout" ]]; then
  run_step "Frontend unit reports" bash -lc "cd apps/web && pnpm test:run"
fi

trap stop_stack EXIT
if [[ "$PROFILE" == "fast" || "$PROFILE" == "full-closeout" ]]; then
  run_step_with_retry "Start infra for backend reports" bash scripts/dev/dev-up.sh infra "$TIMEOUT_SECONDS"
  run_step "Prepare API test database" bash -lc "cd apps/api && bundle exec rails db:prepare"
  run_step "API Rails reports" node scripts/reports/run-command.mjs --name "API Rails tests" --out apps/api/test/reports --cwd apps/api --coverage apps/api/test/reports/coverage/index.html --env STREAMGATE_REPORTS=1 -- bundle exec rails test
  run_step "Worker RSpec reports" node scripts/reports/run-command.mjs --name "Worker RSpec tests" --out apps/worker/spec/reports --cwd apps/worker --coverage apps/worker/spec/reports/coverage/index.html --env STREAMGATE_REPORTS=1 -- bundle exec rspec
  stop_stack
fi

if [[ "$PROFILE" == "full-closeout" ]]; then
  run_step_with_retry "Start app for frontend integration reports" bash scripts/dev/dev-up.sh app "$TIMEOUT_SECONDS"
  run_step "Seed auth fixtures" docker compose exec -T -e SEED_OPERATOR_PASSWORD -e SEED_ADMIN_PASSWORD api bundle exec rails db:seed
  wait_tcp_ready "API app" "127.0.0.1" "3000"
  wait_http_ready "Web app" "http://localhost:5173/login"
  run_step "Frontend integration reports" bash -lc "cd apps/web && pnpm test:integration"
  run_step "Frontend E2E reports" bash -lc "cd apps/web && E2E_STABLE_MODE=1 pnpm test:e2e"
  stop_stack
fi
trap - EXIT

if [[ "$PROFILE" == "operational" || "$PROFILE" == "full-closeout" ]]; then
  run_step "Operational smoke reports" bash scripts/smokes/run-smokes.sh
fi
run_step "Generate reports index" node scripts/reports/generate-index.mjs

if [[ "${#FAILURES[@]}" -gt 0 ]]; then
  echo
  echo "Falhas encontradas:"
  printf -- '- %s\n' "${FAILURES[@]}"
  exit 1
fi

echo
echo "Todos os reports do perfil '$PROFILE' foram gerados com sucesso."
