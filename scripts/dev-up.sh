#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

source "$SCRIPT_DIR/compose-health.sh"

cd "$ROOT_DIR"

if [[ ! -f ".env" ]]; then
  echo "Arquivo .env nao encontrado. Copie .env.example para .env antes de subir o ambiente." >&2
  exit 1
fi

compose_project_name="$(get_dotenv_value ".env" "COMPOSE_PROJECT_NAME")"
project_name_validation="$(test_compose_project_name_value "$compose_project_name")"

if [[ -n "$project_name_validation" ]]; then
  echo "$project_name_validation" >&2
  exit 1
fi

timeout_seconds=180
poll_interval_seconds=5
deadline=$((SECONDS + timeout_seconds))

set +e
compose_up_output="$(invoke_compose_command up -d 2>&1)"
compose_up_exit=$?
set -e

printf '%s\n' "$compose_up_output"

if [[ $compose_up_exit -ne 0 ]]; then
  friendly_error="$(get_compose_up_friendly_error "$compose_up_output")"

  if [[ -n "$friendly_error" ]]; then
    echo ""
    echo "Erro ao subir a infraestrutura local do StreamGate: $friendly_error" >&2
    exit 1
  fi

  echo ""
  echo "Erro ao subir a infraestrutura local do StreamGate: docker compose up -d falhou." >&2
  exit 1
fi

while true; do
  services_json="$(get_compose_services_json)"

  if analysis_output="$(test_compose_services_ready "$services_json")"; then
    invoke_compose_command ps
    echo ""
    echo "Infraestrutura local do StreamGate iniciada e saudavel."
    exit 0
  fi

  fatal_issues="$(printf '%s\n' "$analysis_output" | awk -F '\t' '$1 == "fatal" {print $2}')"
  pending_issues="$(printf '%s\n' "$analysis_output" | awk -F '\t' '$1 == "pending" {print $2}')"

  if [[ -n "$fatal_issues" ]]; then
    echo ""
    echo "Falha ao subir a infraestrutura local do StreamGate." >&2
    printf ' - %s\n' "$fatal_issues" >&2
    invoke_compose_command ps
    invoke_compose_command down
    exit 1
  fi

  if (( SECONDS >= deadline )); then
    echo ""
    echo "Timeout aguardando containers ficarem prontos." >&2
    if [[ -n "$pending_issues" ]]; then
      printf ' - %s\n' "$pending_issues" >&2
    fi
    invoke_compose_command ps
    invoke_compose_command down
    exit 1
  fi

  sleep "$poll_interval_seconds"
done
