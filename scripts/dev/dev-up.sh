#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_HELPERS="$ROOT_DIR/scripts/compose/compose-health.sh"

source "$COMPOSE_HELPERS"

cd "$ROOT_DIR"

mode="${1:-infra}"
case "$mode" in
  infra|app|full) ;;
  *)
    echo "Modo invalido: '$mode'. Use 'infra', 'app' ou 'full'." >&2
    exit 1
    ;;
esac

raw_timeout="${2:-180}"
if [[ ! "$raw_timeout" =~ ^[0-9]+$ || "$raw_timeout" -lt 30 || "$raw_timeout" -gt 3600 ]]; then
  echo "Timeout invalido: '$raw_timeout'. Use um inteiro entre 30 e 3600 segundos." >&2
  exit 1
fi

timeout_seconds="$raw_timeout"
poll_interval_seconds=5

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

hash_file_sha256() {
  local file_path="$1"

  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file_path" | awk '{print $1}'
    return 0
  fi

  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$file_path" | awk '{print $1}'
    return 0
  fi

  echo "Nao foi possivel calcular hash SHA256: sha256sum/shasum indisponivel." >&2
  return 1
}

hash_stdin_sha256() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum | awk '{print $1}'
    return 0
  fi

  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 | awk '{print $1}'
    return 0
  fi

  echo "Nao foi possivel calcular hash SHA256 de stream: sha256sum/shasum indisponivel." >&2
  return 1
}

get_build_services_for_mode() {
  local selected_mode="$1"
  case "$selected_mode" in
    app) echo "api web" ;;
    full) echo "api web worker" ;;
    *) echo "" ;;
  esac
}

get_infra_image_services() {
  echo "postgres redis rabbitmq minio minio-init clickhouse"
}

get_infra_image_for_service() {
  local service="$1"
  case "$service" in
    postgres) echo "postgres:16" ;;
    redis) echo "redis:7-alpine" ;;
    rabbitmq) echo "rabbitmq:3.13-management" ;;
    minio) echo "minio/minio:RELEASE.2025-02-18T16-25-55Z" ;;
    minio-init) echo "minio/mc:RELEASE.2025-03-12T17-29-24Z" ;;
    clickhouse) echo "clickhouse/clickhouse-server:25.3" ;;
    *) echo "" ;;
  esac
}

test_docker_image_exists() {
  local image="$1"
  docker image inspect "$image" >/dev/null 2>&1
}

run_conditional_compose_pull() {
  local services_to_pull=()
  local service=""
  local image=""
  local infra_services_raw=""
  local infra_services=()

  infra_services_raw="$(get_infra_image_services)"
  read -r -a infra_services <<< "$infra_services_raw"

  for service in "${infra_services[@]}"; do
    image="$(get_infra_image_for_service "$service")"
    [[ -z "$image" ]] && continue

    if ! test_docker_image_exists "$image"; then
      services_to_pull+=("$service")
    fi
  done

  if (( ${#services_to_pull[@]} == 0 )); then
    echo "Imagens de infraestrutura ja disponiveis. Pulando docker compose pull."
    return 0
  fi

  echo "Imagens de infraestrutura ausentes. Executando docker compose pull:"
  for service in "${services_to_pull[@]}"; do
    echo " - $service"
  done
  invoke_compose_command pull "${services_to_pull[@]}"
}

get_service_fingerprint_files() {
  local service="$1"
  case "$service" in
    api)
      cat <<'EOF'
apps/api/Dockerfile.dev
apps/api/.dockerignore
apps/api/Gemfile
apps/api/Gemfile.lock
EOF
      ;;
    web)
      cat <<'EOF'
apps/web/Dockerfile.dev
apps/web/.dockerignore
apps/web/package.json
apps/web/pnpm-lock.yaml
EOF
      ;;
    worker)
      cat <<'EOF'
apps/worker/Dockerfile.dev
apps/worker/.dockerignore
apps/worker/Gemfile
apps/worker/Gemfile.lock
apps/worker/worker.gemspec
EOF
      ;;
    *)
      ;;
  esac
}

get_service_build_fingerprint() {
  local service="$1"
  local payload=""
  local relative_path=""

  payload+="compose.yaml="
  if [[ -f "$ROOT_DIR/compose.yaml" ]]; then
    payload+="$(hash_file_sha256 "$ROOT_DIR/compose.yaml")"$'\n'
  else
    payload+="MISSING"$'\n'
  fi

  while IFS= read -r relative_path; do
    [[ -z "$relative_path" ]] && continue
    payload+="$relative_path="
    if [[ -f "$ROOT_DIR/$relative_path" ]]; then
      payload+="$(hash_file_sha256 "$ROOT_DIR/$relative_path")"$'\n'
    else
      payload+="MISSING"$'\n'
    fi
  done < <(get_service_fingerprint_files "$service")

  printf '%s' "$payload" | hash_stdin_sha256
}

get_build_state_file() {
  local service="$1"
  echo "$ROOT_DIR/.tmp/dev-up-build/$service.sha256"
}

get_previous_build_fingerprint() {
  local service="$1"
  local state_file
  state_file="$(get_build_state_file "$service")"

  if [[ ! -f "$state_file" ]]; then
    return 0
  fi

  tr -d '[:space:]' < "$state_file"
}

set_build_fingerprint_state() {
  local service="$1"
  local fingerprint="$2"
  local state_file
  state_file="$(get_build_state_file "$service")"
  mkdir -p "$(dirname "$state_file")"
  printf '%s' "$fingerprint" > "$state_file"
}

test_compose_image_exists() {
  local service="$1"
  local image_id=""

  if ! image_id="$(invoke_compose_command images -q "$service" 2>/dev/null | awk 'NF { print; exit }')"; then
    return 1
  fi

  [[ -n "$image_id" ]]
}

run_conditional_compose_build() {
  local selected_mode="$1"
  local buildable_services_raw=""
  local buildable_services=()
  local services_to_build=()
  local state_updates=()
  local rebuild_reason_lines=()
  local service=""
  local fingerprint=""
  local previous_fingerprint=""
  local reasons=()
  local reasons_text=""

  buildable_services_raw="$(get_build_services_for_mode "$selected_mode")"
  if [[ -z "$buildable_services_raw" ]]; then
    return 0
  fi

  read -r -a buildable_services <<< "$buildable_services_raw"

  for service in "${buildable_services[@]}"; do
    fingerprint="$(get_service_build_fingerprint "$service")"
    previous_fingerprint="$(get_previous_build_fingerprint "$service")"
    reasons=()

    if ! test_compose_image_exists "$service"; then
      reasons+=("imagem ausente")
    fi

    if [[ -z "$previous_fingerprint" ]]; then
      reasons+=("baseline de fingerprint ausente")
    elif [[ "$previous_fingerprint" != "$fingerprint" ]]; then
      reasons+=("fingerprint alterado")
    fi

    state_updates+=("$service:$fingerprint")

    if (( ${#reasons[@]} > 0 )); then
      services_to_build+=("$service")
      reasons_text="$(IFS=', '; echo "${reasons[*]}")"
      rebuild_reason_lines+=(" - $service: $reasons_text")
    fi
  done

  if (( ${#services_to_build[@]} == 0 )); then
    echo "Sem alteracoes relevantes para build. Pulando docker compose build."
    return 0
  fi

  echo "Alteracoes detectadas em artefatos de build. Executando rebuild seletivo:"
  for reasons_text in "${rebuild_reason_lines[@]}"; do
    echo "$reasons_text"
  done
  invoke_compose_command build "${services_to_build[@]}"

  for service in "${state_updates[@]}"; do
    set_build_fingerprint_state "${service%%:*}" "${service#*:}"
  done
}

compose_args=()
if [[ "$mode" != "infra" ]]; then
  compose_args+=(--profile "$mode")
fi
compose_args+=(up -d)

run_conditional_compose_pull
run_conditional_compose_build "$mode"

set +e
compose_up_output="$(invoke_compose_command "${compose_args[@]}" 2>&1)"
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
  echo "Erro ao subir a infraestrutura local do StreamGate: docker compose ${compose_args[*]} falhou." >&2
  exit 1
fi

deadline=$((SECONDS + timeout_seconds))
while true; do
  services_json="$(get_compose_services_json)"

  if analysis_output="$(test_compose_services_ready "$services_json")"; then
    invoke_compose_command ps
    echo ""
    if [[ "$mode" == "infra" ]]; then
      echo "Infraestrutura local do StreamGate iniciada e saudavel."
    else
      echo "Ambiente '$mode' do StreamGate iniciado e saudavel."
    fi
    exit 0
  fi

  fatal_issues="$(printf '%s\n' "$analysis_output" | awk -F '\t' '$1 == "fatal" {print $2}')"
  pending_issues="$(printf '%s\n' "$analysis_output" | awk -F '\t' '$1 == "pending" {print $2}')"

  if [[ -n "$fatal_issues" ]]; then
    echo ""
    echo "Falha ao subir a infraestrutura local do StreamGate." >&2
    while IFS= read -r issue; do
      [[ -n "$issue" ]] && printf ' - %s\n' "$issue" >&2
    done <<< "$fatal_issues"
    invoke_compose_command ps
    invoke_compose_command down
    exit 1
  fi

  if (( SECONDS >= deadline )); then
    echo ""
    echo "Timeout aguardando containers ficarem prontos." >&2
    if [[ -n "$pending_issues" ]]; then
      while IFS= read -r issue; do
        [[ -n "$issue" ]] && printf ' - %s\n' "$issue" >&2
      done <<< "$pending_issues"
    fi
    invoke_compose_command ps
    invoke_compose_command down
    exit 1
  fi

  sleep "$poll_interval_seconds"
done
