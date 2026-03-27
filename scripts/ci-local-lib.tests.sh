#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/ci-local-lib.sh"

assert_contains() {
  local haystack="$1"
  local needle="$2"
  local message="$3"

  if [[ "$haystack" != *"$needle"* ]]; then
    echo "[FAIL] $message"
    echo "Esperado encontrar: $needle"
    echo 'Recebido:'
    printf '%s\n' "$haystack"
    exit 1
  fi
}

assert_exit_code() {
  local actual="$1"
  local expected="$2"
  local message="$3"

  if [[ "$actual" -ne "$expected" ]]; then
    echo "[FAIL] $message"
    echo "Esperado exit code $expected, recebido $actual"
    exit 1
  fi
}

output="$(ci_local_run_step 'sample' 'success step' "$SCRIPT_DIR" 'printf ok' 2>&1)"
assert_contains "$output" 'Status: PASS' 'ci_local_run_step deve reportar PASS em comando bem-sucedido.'

set +e
output="$(ci_local_run_step 'sample' 'failing step' "$SCRIPT_DIR" 'exit 7' 2>&1)"
exit_code=$?
set -e
assert_exit_code "$exit_code" 7 'ci_local_run_step deve propagar o exit code do comando.'
assert_contains "$output" 'Status: FAIL (exit code 7)' 'ci_local_run_step deve reportar FAIL com o exit code.'

CI_LOCAL_RESULTS=()
ci_local_record_result 'frontend-ci' 'PASS' 'Tudo certo.'
ci_local_record_result 'docker-ci' 'FAIL' 'Falha no build.'
set +e
summary_output="$(ci_local_print_summary 2>&1)"
summary_exit=$?
set -e
assert_exit_code "$summary_exit" 1 'ci_local_print_summary deve retornar a quantidade de workflows com problema.'
assert_contains "$summary_output" 'frontend-ci' 'Resumo deve listar frontend-ci.'
assert_contains "$summary_output" 'docker-ci' 'Resumo deve listar docker-ci.'
assert_contains "$summary_output" 'Resultado geral: FAIL (1 workflow(s) com problema)' 'Resumo deve indicar falha geral.'

echo '[PASS] scripts/ci-local-lib.tests.sh'
