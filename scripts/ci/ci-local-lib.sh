#!/usr/bin/env bash
set -euo pipefail

CI_LOCAL_RESULTS=()
CI_LOCAL_STEP_OUTPUT=''

ci_local_print_rule() {
  printf '%*s\n' 80 '' | tr ' ' '='
}

ci_local_print_workflow_header() {
  local name="$1"
  echo
  ci_local_print_rule
  echo "WORKFLOW: $name"
  ci_local_print_rule
}

ci_local_print_step_header() {
  local workflow="$1"
  local step="$2"
  echo
  echo ">>> [$workflow] $step"
}

ci_local_run_step() {
  local workflow="$1"
  local step="$2"
  local workdir="$3"
  local command="$4"

  ci_local_print_step_header "$workflow" "$step"
  echo "Diretorio: $workdir"
  echo "Comando: $command"
  echo "Status: RUNNING"

  local output
  set +e
  output="$(cd "$workdir" && bash -lc "$command" 2>&1)"
  local exit_code=$?
  set -e

  if [[ -n "$output" ]]; then
    echo "--- output start ---"
    printf '%s\n' "$output"
    echo "--- output end ---"
  else
    echo "--- output start ---"
    echo "(sem output)"
    echo "--- output end ---"
  fi

  if [[ $exit_code -eq 0 ]]; then
    echo "Status: PASS"
  else
    echo "Status: FAIL (exit code $exit_code)"
  fi

  CI_LOCAL_STEP_OUTPUT="$output"
  return $exit_code
}

ci_local_record_result() {
  local workflow="$1"
  local status="$2"
  local detail="$3"
  CI_LOCAL_RESULTS+=("$workflow|$status|$detail")
}

ci_local_print_summary() {
  echo
  ci_local_print_rule
  echo 'RESUMO FINAL'
  ci_local_print_rule

  local failures=0
  local workflow status detail
  for entry in "${CI_LOCAL_RESULTS[@]}"; do
    IFS='|' read -r workflow status detail <<< "$entry"
    printf '%-18s %-8s %s\n' "$workflow" "$status" "$detail"
    if [[ "$status" != 'PASS' ]]; then
      failures=$((failures + 1))
    fi
  done

  echo
  if [[ $failures -eq 0 ]]; then
    echo 'Resultado geral: PASS'
  else
    echo "Resultado geral: FAIL ($failures workflow(s) com problema)"
  fi

  return $failures
}

ci_local_require_command() {
  local command_name="$1"
  if command -v "$command_name" >/dev/null 2>&1; then
    return 0
  fi

  CI_LOCAL_STEP_OUTPUT="Comando obrigatorio nao encontrado: $command_name"
  return 1
}
