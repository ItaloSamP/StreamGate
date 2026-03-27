#!/usr/bin/env bash
set -euo pipefail

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

  while IFS=$'\t' read -r name state health exit_code; do
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
  done < <(
    jq -r '.[] | [.Service, .State, (.Health // ""), ((.ExitCode // 0) | tostring)] | @tsv' <<<"$services_json"
  )
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
