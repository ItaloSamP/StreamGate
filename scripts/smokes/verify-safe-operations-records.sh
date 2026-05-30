#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTEXT_PATH="${1:-$ROOT_DIR/.tmp/smokes/safe-operations-context.json}"

if [[ ! -f "$CONTEXT_PATH" ]]; then
  echo "Contexto do safe smoke nao encontrado em '$CONTEXT_PATH'." >&2
  exit 1
fi

completed_job_id="$(python -c 'import json,sys; print(json.load(open(sys.argv[1], encoding="utf-8"))["completed_job_id"])' "$CONTEXT_PATH")"
completed_notification_id="$(python -c 'import json,sys; print(json.load(open(sys.argv[1], encoding="utf-8"))["completed_notification_id"])' "$CONTEXT_PATH")"
quarantined_job_id="$(python -c 'import json,sys; print(json.load(open(sys.argv[1], encoding="utf-8"))["quarantined_job_id"])' "$CONTEXT_PATH")"
quarantine_id="$(python -c 'import json,sys; print(json.load(open(sys.argv[1], encoding="utf-8"))["quarantine_id"])' "$CONTEXT_PATH")"
retry_notification_id="$(python -c 'import json,sys; print(json.load(open(sys.argv[1], encoding="utf-8"))["retry_notification_id"])' "$CONTEXT_PATH")"
replay_request_id="$(python -c 'import json,sys; print(json.load(open(sys.argv[1], encoding="utf-8"))["replay_request_id"])' "$CONTEXT_PATH")"
webhook_test_trace_id="$(python -c 'import json,sys; print(json.load(open(sys.argv[1], encoding="utf-8"))["webhook_test_trace_id"])' "$CONTEXT_PATH")"

cd "$ROOT_DIR"
docker compose exec -T \
  -e "SAFE_COMPLETED_JOB_ID=$completed_job_id" \
  -e "SAFE_COMPLETED_NOTIFICATION_ID=$completed_notification_id" \
  -e "SAFE_QUARANTINED_JOB_ID=$quarantined_job_id" \
  -e "SAFE_QUARANTINE_ID=$quarantine_id" \
  -e "SAFE_RETRY_NOTIFICATION_ID=$retry_notification_id" \
  -e "SAFE_REPLAY_REQUEST_ID=$replay_request_id" \
  -e "SAFE_WEBHOOK_TEST_TRACE_ID=$webhook_test_trace_id" \
  api bundle exec rails runner script/verify_safe_operations_records.rb
