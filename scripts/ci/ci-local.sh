#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

source "$SCRIPT_DIR/ci-local-lib.sh"

mode="${1:-all}"
case "$mode" in
  all|frontend|backend|docker) ;;
  *)
    echo "Uso: ./scripts/ci/ci-local.sh [all|frontend|backend|docker]" >&2
    exit 1
    ;;
esac

created_env=0
cleanup() {
  if [[ $created_env -eq 1 && -f "$ROOT_DIR/.env" ]]; then
    rm -f "$ROOT_DIR/.env"
  fi
}
trap cleanup EXIT

ensure_env_file() {
  if [[ -f "$ROOT_DIR/.env" ]]; then
    return 0
  fi

  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
  created_env=1
  echo "Arquivo .env nao encontrado; copia temporaria criada a partir de .env.example."
}

get_powershell_file_command() {
  local file_path="$1"

  if command -v pwsh >/dev/null 2>&1; then
    printf 'pwsh -File %q' "$file_path"
    return 0
  fi

  if command -v powershell.exe >/dev/null 2>&1; then
    printf 'powershell.exe -ExecutionPolicy Bypass -File %q' "$file_path"
    return 0
  fi

  if command -v powershell >/dev/null 2>&1; then
    printf 'powershell -ExecutionPolicy Bypass -File %q' "$file_path"
    return 0
  fi

  return 1
}

run_frontend_workflow() {
  local workflow='frontend-ci'
  ci_local_print_workflow_header "$workflow"

  if ! ci_local_require_command pnpm; then
    echo "$CI_LOCAL_STEP_OUTPUT"
    ci_local_record_result "$workflow" 'FAIL' "$CI_LOCAL_STEP_OUTPUT"
    return 0
  fi

  local failed=0
  local reason='Todos os passos passaram.'

  ci_local_run_step "$workflow" 'Install dependencies' "$ROOT_DIR/apps/web" 'CI=true pnpm install --frozen-lockfile' || { failed=1; reason='Falha em Install dependencies.'; }
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'Lint' "$ROOT_DIR/apps/web" 'pnpm lint' || { failed=1; reason='Falha em Lint.'; }
  fi
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'TypeScript build' "$ROOT_DIR/apps/web" './node_modules/.bin/tsc -b' || { failed=1; reason='Falha em TypeScript build.'; }
  fi
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'Production build' "$ROOT_DIR/apps/web" 'pnpm build' || { failed=1; reason='Falha em Production build.'; }
  fi

  if [[ $failed -eq 0 ]]; then
    ci_local_record_result "$workflow" 'PASS' "$reason"
  else
    ci_local_record_result "$workflow" 'FAIL' "$reason"
  fi
}

run_backend_workflow() {
  local workflow='backend-ci'
  ci_local_print_workflow_header "$workflow"

  local failed=0
  local reason='Todos os jobs passaram.'

  if ! ci_local_require_command bundle; then
    echo "$CI_LOCAL_STEP_OUTPUT"
    ci_local_record_result "$workflow" 'FAIL' "$CI_LOCAL_STEP_OUTPUT"
    return 0
  fi

  if ! ci_local_require_command ruby; then
    echo "$CI_LOCAL_STEP_OUTPUT"
    ci_local_record_result "$workflow" 'FAIL' "$CI_LOCAL_STEP_OUTPUT"
    return 0
  fi

  ensure_env_file

  local postgres_host postgres_port postgres_user postgres_password postgres_test_db
  postgres_host="$(get_dotenv_value "$ROOT_DIR/.env" 'POSTGRES_HOST')"
  postgres_port="$(get_dotenv_value "$ROOT_DIR/.env" 'POSTGRES_PORT')"
  postgres_user="$(get_dotenv_value "$ROOT_DIR/.env" 'POSTGRES_USER')"
  postgres_password="$(get_dotenv_value "$ROOT_DIR/.env" 'POSTGRES_PASSWORD')"
  postgres_test_db="$(get_dotenv_value "$ROOT_DIR/.env" 'POSTGRES_TEST_DB')"

  [[ -z "$postgres_host" ]] && postgres_host='localhost'
  [[ -z "$postgres_port" ]] && postgres_port='5432'
  [[ -z "$postgres_user" ]] && postgres_user='postgres'
  [[ -z "$postgres_password" ]] && postgres_password='postgres'
  [[ -z "$postgres_test_db" ]] && postgres_test_db='streamgate_test'

  ci_local_run_step "$workflow" 'Infra for backend' "$ROOT_DIR" './scripts/dev/dev-up.sh' || { failed=1; reason='Falha ao subir a infra para backend-ci.'; }

  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'API install dependencies' "$ROOT_DIR/apps/api" 'bundle install --jobs 4 --retry 3' || { failed=1; reason='Falha em API install dependencies.'; }
  fi
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'API prepare database' "$ROOT_DIR/apps/api" "RAILS_ENV=test POSTGRES_HOST=$postgres_host POSTGRES_PORT=$postgres_port POSTGRES_TEST_DB=$postgres_test_db POSTGRES_USER=$postgres_user POSTGRES_PASSWORD=$postgres_password BUNDLE_WITHOUT=production bundle exec rails db:prepare" || { failed=1; reason='Falha em API prepare database.'; }
  fi
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'API tests' "$ROOT_DIR/apps/api" "RAILS_ENV=test POSTGRES_HOST=$postgres_host POSTGRES_PORT=$postgres_port POSTGRES_TEST_DB=$postgres_test_db POSTGRES_USER=$postgres_user POSTGRES_PASSWORD=$postgres_password BUNDLE_WITHOUT=production bundle exec rails test" || { failed=1; reason='Falha em API tests.'; }
  fi
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'API RuboCop' "$ROOT_DIR/apps/api" 'bundle exec rubocop' || { failed=1; reason='Falha em API RuboCop.'; }
  fi
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'API Brakeman' "$ROOT_DIR/apps/api" 'bundle exec brakeman -q' || { failed=1; reason='Falha em API Brakeman.'; }
  fi

  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'Worker install dependencies' "$ROOT_DIR/apps/worker" 'bundle install --jobs 4 --retry 3' || { failed=1; reason='Falha em Worker install dependencies.'; }
  fi
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'Worker tests' "$ROOT_DIR/apps/worker" 'bundle exec rspec' || { failed=1; reason='Falha em Worker tests.'; }
  fi
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'Worker RuboCop' "$ROOT_DIR/apps/worker" 'bundle exec rubocop' || { failed=1; reason='Falha em Worker RuboCop.'; }
  fi

  ci_local_run_step "$workflow" 'Stop backend infra' "$ROOT_DIR" './scripts/dev/dev-down.sh' >/dev/null 2>&1 || true

  if [[ $failed -eq 0 ]]; then
    ci_local_record_result "$workflow" 'PASS' "$reason"
  else
    ci_local_record_result "$workflow" 'FAIL' "$reason"
  fi
}

run_docker_workflow() {
  local workflow='docker-ci'
  ci_local_print_workflow_header "$workflow"

  local failed=0
  local reason='Todos os passos passaram.'
  local powershell_health_command=''

  if ! ci_local_require_command docker; then
    echo "$CI_LOCAL_STEP_OUTPUT"
    ci_local_record_result "$workflow" 'FAIL' "$CI_LOCAL_STEP_OUTPUT"
    return 0
  fi

  ensure_env_file

  if powershell_health_command="$(get_powershell_file_command './scripts/compose/compose-health.tests.ps1')"; then
    :
  else
    powershell_health_command=''
  fi

  ci_local_run_step "$workflow" 'Validate compose default config' "$ROOT_DIR" 'docker compose -f compose.yaml config' || { failed=1; reason='Falha em Validate compose default config.'; }
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'Validate compose full profile' "$ROOT_DIR" 'docker compose -f compose.yaml --profile full config' || { failed=1; reason='Falha em Validate compose full profile.'; }
  fi
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'Validate WSL bash health helpers' "$ROOT_DIR" 'bash scripts/compose/compose-health-tests.sh' || { failed=1; reason='Falha em Validate WSL bash health helpers.'; }
  fi
  if [[ $failed -eq 0 ]]; then
    if [[ -n "$powershell_health_command" ]]; then
      ci_local_run_step "$workflow" 'Validate PowerShell health helpers' "$ROOT_DIR" "$powershell_health_command" || { failed=1; reason='Falha em Validate PowerShell health helpers.'; }
    else
      failed=1
      reason='Falha em Validate PowerShell health helpers: nenhum PowerShell disponivel.'
      echo 'Nem pwsh, nem powershell.exe, nem powershell estao disponiveis.'
    fi
  fi
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'Build API production image' "$ROOT_DIR" 'docker build -t streamgate-api:ci ./apps/api' || { failed=1; reason='Falha em Build API production image.'; }
  fi
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'Build API development image' "$ROOT_DIR" 'docker build -f apps/api/Dockerfile.dev -t streamgate-api-dev:ci ./apps/api' || { failed=1; reason='Falha em Build API development image.'; }
  fi
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'Build Web production image' "$ROOT_DIR" 'docker build -t streamgate-web:ci ./apps/web' || { failed=1; reason='Falha em Build Web production image.'; }
  fi
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'Build Web development image' "$ROOT_DIR" 'docker build -f apps/web/Dockerfile.dev -t streamgate-web-dev:ci ./apps/web' || { failed=1; reason='Falha em Build Web development image.'; }
  fi
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'Build Worker development image' "$ROOT_DIR" 'docker build -f apps/worker/Dockerfile.dev -t streamgate-worker-dev:ci ./apps/worker' || { failed=1; reason='Falha em Build Worker development image.'; }
  fi
  if [[ $failed -eq 0 ]]; then
    ci_local_run_step "$workflow" 'Smoke test infra profile' "$ROOT_DIR" 'docker compose up -d && python scripts/compose/compose-smoke.py && docker compose ps' || { failed=1; reason='Falha em Smoke test infra profile.'; }
  fi

  ci_local_run_step "$workflow" 'Stop compose stack' "$ROOT_DIR" './scripts/dev/dev-down.sh' >/dev/null 2>&1 || true

  if [[ $failed -eq 0 ]]; then
    ci_local_record_result "$workflow" 'PASS' "$reason"
  else
    ci_local_record_result "$workflow" 'FAIL' "$reason"
  fi
}

case "$mode" in
  all)
    run_frontend_workflow
    run_backend_workflow
    run_docker_workflow
    ;;
  frontend)
    run_frontend_workflow
    ;;
  backend)
    run_backend_workflow
    ;;
  docker)
    run_docker_workflow
    ;;
esac

if ci_local_print_summary; then
  exit 0
else
  exit 1
fi


