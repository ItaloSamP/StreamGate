#!/usr/bin/env bash
set -euo pipefail

export LANG="${LANG:-C.UTF-8}"
export LC_CTYPE="${LC_CTYPE:-$LANG}"
CI_LOCAL_RESULTS=()
CI_LOCAL_STEP_RESULTS=()
CI_LOCAL_STEP_OUTPUT=''
CI_LOCAL_STARTED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
CI_LOCAL_START_SECONDS="$(date +%s)"

ci_local_report_slug() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-|-$//g'
}

ci_local_init_reports() {
  local reports_dir="$1"
  mkdir -p "$reports_dir/logs"
  rm -f "$reports_dir/summary.json" "$reports_dir/report.html" "$reports_dir/logs"/*.log
}

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

  local output start_seconds duration
  start_seconds="$(date +%s)"
  set +e
  output="$(cd "$workdir" && bash -lc "$command" 2>&1)"
  local exit_code=$?
  set -e
  duration=$(( $(date +%s) - start_seconds ))
  local status='PASS'
  [[ $exit_code -ne 0 ]] && status='FAIL'
  if [[ -n "${CI_LOCAL_REPORTS_DIR:-}" ]]; then
    local slug log_path
    slug="$(ci_local_report_slug "$workflow-$step")"
    log_path="$CI_LOCAL_REPORTS_DIR/logs/$slug.log"
    printf '%s\n' "${output:-"(sem output)"}" > "$log_path"
    CI_LOCAL_STEP_RESULTS+=("$workflow|$step|$status|$exit_code|$duration|scripts/ci/reports/logs/$slug.log")
  fi

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

ci_local_write_reports() {
  local reports_dir="$1"
  local mode="$2"
  local status='PASS'
  local exit_code=0
  local failures=0
  local workflow workflow_status detail
  for entry in "${CI_LOCAL_RESULTS[@]}"; do
    IFS='|' read -r workflow workflow_status detail <<< "$entry"
    if [[ "$workflow_status" != 'PASS' ]]; then
      failures=$((failures + 1))
    fi
  done
  if [[ $failures -gt 0 ]]; then
    status='FAIL'
    exit_code=1
  fi
  local finished_at duration
  finished_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  duration=$(( $(date +%s) - CI_LOCAL_START_SECONDS ))

  {
    printf '{\n'
    printf '  "name": "Local CI suite",\n'
    printf '  "status": "%s",\n' "$status"
    printf '  "exitCode": %s,\n' "$exit_code"
    printf '  "startedAt": "%s",\n' "$CI_LOCAL_STARTED_AT"
    printf '  "finishedAt": "%s",\n' "$finished_at"
    printf '  "durationSeconds": %s,\n' "$duration"
    printf '  "cwd": ".",\n'
    printf '  "command": "scripts/ci/ci-local.sh %s",\n' "$mode"
    printf '  "reportPath": "scripts/ci/reports/report.html",\n'
    printf '  "artifacts": [{"label": "CI logs", "path": "scripts/ci/reports/logs"}],\n'
    printf '  "steps": [\n'
    for index in "${!CI_LOCAL_STEP_RESULTS[@]}"; do
      [[ "$index" -gt 0 ]] && printf ',\n'
      IFS='|' read -r workflow step step_status step_exit step_duration step_log <<< "${CI_LOCAL_STEP_RESULTS[$index]}"
      printf '    {"Workflow": "%s", "Step": "%s", "Status": "%s", "ExitCode": %s, "DurationSeconds": %s, "LogPath": "%s"}' \
        "$workflow" "$step" "$step_status" "$step_exit" "$step_duration" "$step_log"
    done
    printf '\n  ]\n'
    printf '}\n'
  } > "$reports_dir/summary.json"

  {
    printf '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Local CI Suite</title>'
    printf '<style>body{margin:0;font-family:Segoe UI,sans-serif;background:#10130f;color:#f8f2dc}main{max-width:1120px;margin:0 auto;padding:36px 20px}h1{font-size:clamp(2rem,5vw,4rem);letter-spacing:-.05em}table{width:100%%;border-collapse:collapse;background:#1b2118;border-radius:18px;overflow:hidden}th,td{padding:14px;border-bottom:1px solid #33402c;text-align:left}.pass{color:#98e6a2;font-weight:800}.fail{color:#ff8c76;font-weight:800}a{color:#d7ff72}</style></head><body><main>'
    printf '<h1>Local CI Suite</h1><p>Status: <strong class="%s">%s</strong></p><table><thead><tr><th>Workflow</th><th>Step</th><th>Status</th><th>Duracao</th><th>Log</th></tr></thead><tbody>' "$(tr '[:upper:]' '[:lower:]' <<< "$status")" "$status"
    for entry in "${CI_LOCAL_STEP_RESULTS[@]}"; do
      IFS='|' read -r workflow step step_status step_exit step_duration step_log <<< "$entry"
      printf '<tr><td>%s</td><td>%s</td><td class="%s">%s</td><td>%ss</td><td><a href="logs/%s">log</a></td></tr>' \
        "$workflow" "$step" "$(tr '[:upper:]' '[:lower:]' <<< "$step_status")" "$step_status" "$step_duration" "$(basename "$step_log")"
    done
    printf '</tbody></table></main></body></html>'
  } > "$reports_dir/report.html"
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
