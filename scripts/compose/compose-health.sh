#!/usr/bin/env bash
set -euo pipefail

export LANG="${LANG:-C.UTF-8}"
export LC_CTYPE="${LC_CTYPE:-$LANG}"
test_compose_project_name_value() {
  local project_name="${1:-}"

  if [[ -z "$project_name" ]]; then
    echo ""
    return 0
  fi

  if [[ "$project_name" =~ ^[a-z0-9][a-z0-9_-]*$ ]]; then
    echo ""
    return 0
  fi

  echo "COMPOSE_PROJECT_NAME invalido: '$project_name'. Use apenas letras minusculas, numeros, hifen e underscore."
}

get_dotenv_value() {
  local path="$1"
  local key="$2"

  if [[ ! -f "$path" ]]; then
    return 0
  fi

  awk -F '=' -v key="$key" '$1 ~ "^[[:space:]]*" key "$" { sub(/^[[:space:]]+/, "", $2); print $2; exit }' "$path"
}

get_env_or_dotenv_value() {
  local path="$1"
  local key="$2"

  if [[ -n "${!key:-}" ]]; then
    printf '%s\n' "${!key}"
    return 0
  fi

  get_dotenv_value "$path" "$key"
}

is_positive_integer() {
  local value="${1:-}"
  [[ "$value" =~ ^[1-9][0-9]*$ ]]
}

is_valid_email() {
  local value="${1:-}"
  [[ "$value" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]]
}

is_valid_https_url() {
  local value="${1:-}"
  [[ "$value" =~ ^https://[^[:space:]]+$ ]]
}

assert_sprint5_operational_env() {
  local path="$1"
  local issues=()
  local key value

  local numeric_keys=(
    OPERATIONAL_ACTION_COOLDOWN_SECONDS
    OPERATIONAL_ACTION_DAILY_LIMIT
    IDEMPOTENCY_KEY_TTL_SECONDS
    JOB_ARTIFACT_RETENTION_DAYS
    NOTIFICATION_RETENTION_DAYS
    NOTIFICATION_DELIVERY_RETENTION_DAYS
    DLQ_REPLAY_REQUEST_RETENTION_DAYS
    ARTIFACT_DOWNLOAD_URL_TTL_SECONDS
    SMOKE_HTTP_TIMEOUT_SECONDS
    SMOKE_WORKER_TIMEOUT_SECONDS
    SMOKE_POLL_INTERVAL_SECONDS
  )

  for key in "${numeric_keys[@]}"; do
    value="$(get_env_or_dotenv_value "$path" "$key")"
    if ! is_positive_integer "$value"; then
      issues+=("$key deve estar definido com inteiro positivo no ambiente local.")
    fi
  done

  local required_keys=(
    SEED_OPERATOR_PASSWORD
    SEED_ADMIN_PASSWORD
    SMOKE_ADMIN_EMAIL
    SMOKE_SECOND_ADMIN_EMAIL
    SMOKE_SECOND_ADMIN_PASSWORD
    SMOKE_NOTIFICATION_EMAIL
    SMOKE_WEBHOOK_URL
  )

  for key in "${required_keys[@]}"; do
    value="$(get_env_or_dotenv_value "$path" "$key")"
    if [[ -z "$value" ]]; then
      issues+=("$key deve estar definido antes de rodar CI local, smokes ou reports da Sprint 5.")
    fi
  done

  for key in SMOKE_ADMIN_EMAIL SMOKE_SECOND_ADMIN_EMAIL SMOKE_NOTIFICATION_EMAIL; do
    value="$(get_env_or_dotenv_value "$path" "$key")"
    if [[ -n "$value" ]] && ! is_valid_email "$value"; then
      issues+=("$key precisa ser um e-mail valido.")
    fi
  done

  value="$(get_env_or_dotenv_value "$path" "SMOKE_WEBHOOK_URL")"
  if [[ -n "$value" ]] && ! is_valid_https_url "$value"; then
    issues+=("SMOKE_WEBHOOK_URL precisa usar HTTPS e host valido para o teste de notificacao.")
  fi

  if [[ ${#issues[@]} -gt 0 ]]; then
    printf 'Configuracao Sprint 5 incompleta:\n' >&2
    printf -- '- %s\n' "${issues[@]}" >&2
    printf 'Sincronize seu .env com .env.example antes de continuar.\n' >&2
    return 1
  fi
}

get_compose_up_friendly_error() {
  local compose_output="${1:-}"

  if [[ -z "$compose_output" ]]; then
    echo ""
    return 0
  fi

  if [[ "$compose_output" =~ container\ name\ \"/([^\"]+)\"\ is\ already\ in\ use ]]; then
    local container_name="${BASH_REMATCH[1]}"
    echo "Ja existe um container com o nome '$container_name'. Remova-o com 'docker rm -f $container_name' e tente novamente."
    return 0
  fi

  echo ""
}

invoke_compose_command() {
  docker compose "$@"
}

get_compose_services_json() {
  invoke_compose_command ps --format json
}

analyze_compose_services() {
  local services_json="$1"
  local service_json
  local name
  local state
  local health
  local exit_code

  while IFS= read -r service_json; do
    [[ -z "$service_json" ]] && continue

    name="$(jq -r '.Service' <<<"$service_json")"
    state="$(jq -r '.State' <<<"$service_json")"
    health="$(jq -r '(.Health // "")' <<<"$service_json")"
    exit_code="$(jq -r '(.ExitCode // 0)' <<<"$service_json")"

    if [[ "$name" == "minio-init" ]]; then
      if [[ "$state" == "exited" && "$exit_code" == "0" ]]; then
        continue
      fi

      if [[ "$state" == "exited" ]]; then
        printf 'fatal\tOne-shot service '\''%s'\'' exited with code %s.\n' "$name" "$exit_code"
        continue
      fi

      printf 'pending\tOne-shot service '\''%s'\'' has not completed yet (state: %s).\n' "$name" "$state"
      continue
    fi

    if [[ "$state" != "running" ]]; then
      if [[ "$state" == "created" || "$state" == "restarting" || "$state" == "starting" ]]; then
        printf 'pending\tService '\''%s'\'' is not ready yet (state: %s).\n' "$name" "$state"
      else
        printf 'fatal\tService '\''%s'\'' is not running (state: %s).\n' "$name" "$state"
      fi
      continue
    fi

    if [[ -z "$health" || "$health" == "healthy" ]]; then
      continue
    fi

    if [[ "$health" == "starting" ]]; then
      printf 'pending\tService '\''%s'\'' is still starting.\n' "$name"
      continue
    fi

    printf 'fatal\tService '\''%s'\'' is unhealthy.\n' "$name"
  done < <(jq -c '.[]' <<<"$services_json")

  return 0
}

test_compose_services_ready() {
  local services_json="$1"
  local analysis

  analysis="$(analyze_compose_services "$services_json")"

  if [[ -z "$analysis" ]]; then
    return 0
  fi

  printf '%s\n' "$analysis"
  return 1
}
