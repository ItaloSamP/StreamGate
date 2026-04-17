#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-480}"
FAILURES=()

cd "$ROOT_DIR"

get_dotenv_value() {
  local key="$1"
  [[ -f .env ]] || return 0
  grep -E "^[[:space:]]*$key=" .env | head -n 1 | cut -d= -f2- | xargs || true
}

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

stop_stack() {
  bash scripts/dev/dev-down.sh || true
}

export SEED_OPERATOR_PASSWORD="${SEED_OPERATOR_PASSWORD:-$(get_dotenv_value SEED_OPERATOR_PASSWORD)}"
export SEED_OPERATOR_PASSWORD="${SEED_OPERATOR_PASSWORD:-ChangeMe123!}"
export SEED_ADMIN_PASSWORD="${SEED_ADMIN_PASSWORD:-$SEED_OPERATOR_PASSWORD}"
export AUTH_INTEGRATION_BASE_URL="${AUTH_INTEGRATION_BASE_URL:-http://localhost:3000}"
export E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:5173}"
export POSTGRES_HOST="${POSTGRES_HOST:-$(get_dotenv_value POSTGRES_HOST)}"
export POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
export POSTGRES_PORT="${POSTGRES_PORT:-$(get_dotenv_value POSTGRES_PORT)}"
export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
export POSTGRES_DB="${POSTGRES_DB:-$(get_dotenv_value POSTGRES_DB)}"
export POSTGRES_DB="${POSTGRES_DB:-streamgate_development}"
export POSTGRES_TEST_DB="${POSTGRES_TEST_DB:-$(get_dotenv_value POSTGRES_TEST_DB)}"
export POSTGRES_TEST_DB="${POSTGRES_TEST_DB:-streamgate_test}"
export POSTGRES_USER="${POSTGRES_USER:-$(get_dotenv_value POSTGRES_USER)}"
export POSTGRES_USER="${POSTGRES_USER:-postgres}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(get_dotenv_value POSTGRES_PASSWORD)}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

run_step "Frontend unit reports" bash -lc "cd apps/web && pnpm test:run"

trap stop_stack EXIT
run_step "Start infra for backend reports" bash scripts/dev/dev-up.sh infra "$TIMEOUT_SECONDS"
run_step "Prepare API test database" bash -lc "cd apps/api && bundle exec rails db:prepare"
run_step "API Rails reports" node scripts/reports/run-command.mjs --name "API Rails tests" --out apps/api/test/reports --cwd apps/api --coverage apps/api/test/reports/coverage/index.html --env STREAMGATE_REPORTS=1 -- bundle exec rails test
run_step "Worker RSpec reports" node scripts/reports/run-command.mjs --name "Worker RSpec tests" --out apps/worker/spec/reports --cwd apps/worker --coverage apps/worker/spec/reports/coverage/index.html --env STREAMGATE_REPORTS=1 -- bundle exec rspec
run_step "Start app for frontend integration reports" bash scripts/dev/dev-up.sh app "$TIMEOUT_SECONDS"
run_step "Seed auth fixtures" docker compose exec -T -e SEED_OPERATOR_PASSWORD -e SEED_ADMIN_PASSWORD api bundle exec rails db:seed
run_step "Frontend integration reports" bash -lc "cd apps/web && pnpm test:integration"
run_step "Frontend E2E reports" bash -lc "cd apps/web && pnpm test:e2e"
stop_stack
trap - EXIT

run_step "Operational smoke reports" bash scripts/smokes/run-smokes.sh
run_step "Local CI reports" bash scripts/ci/ci-local.sh all
run_step "Generate reports index" node scripts/reports/generate-index.mjs

if [[ "${#FAILURES[@]}" -gt 0 ]]; then
  echo
  echo "Falhas encontradas:"
  printf -- '- %s\n' "${FAILURES[@]}"
  exit 1
fi

echo
echo "Todos os reports foram gerados com sucesso."
