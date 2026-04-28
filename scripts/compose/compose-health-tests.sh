#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/compose-health.sh"

assert_eq() {
  local actual="$1"
  local expected="$2"
  local message="$3"

  if [[ "$actual" != "$expected" ]]; then
    echo "assert_eq failed: $message. expected '$expected', got '$actual'" >&2
    exit 1
  fi
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  local message="$3"

  if [[ "$haystack" != *"$needle"* ]]; then
    echo "assert_contains failed: $message" >&2
    exit 1
  fi
}

valid_message="$(test_compose_project_name_value "streamgate")"
assert_eq "$valid_message" "" "valid project name should pass"

invalid_message="$(test_compose_project_name_value "StreamGate")"
assert_contains "$invalid_message" "COMPOSE_PROJECT_NAME" "invalid project name should mention COMPOSE_PROJECT_NAME"

conflict_message="$(get_compose_up_friendly_error 'Error response from daemon: Conflict. The container name "/streamgate-clickhouse" is already in use by container "abc".')"
assert_contains "$conflict_message" "streamgate-clickhouse" "friendly conflict error should mention the conflicting container"
assert_contains "$conflict_message" "docker rm -f streamgate-clickhouse" "friendly conflict error should include cleanup command"

unknown_message="$(get_compose_up_friendly_error 'other docker error')"
assert_eq "$unknown_message" "" "unknown compose errors should not be rewritten"

healthy_json='[
  {"Service":"postgres","State":"running","Health":"healthy","ExitCode":0},
  {"Service":"redis","State":"running","Health":"healthy","ExitCode":0},
  {"Service":"rabbitmq","State":"running","Health":"healthy","ExitCode":0},
  {"Service":"minio","State":"running","Health":"healthy","ExitCode":0},
  {"Service":"clickhouse","State":"running","Health":"healthy","ExitCode":0},
  {"Service":"minio-init","State":"exited","Health":"","ExitCode":0}
]'

if ! healthy_result="$(test_compose_services_ready "$healthy_json")"; then
  echo "healthy environment should have passed" >&2
  exit 1
fi

assert_eq "$healthy_result" "" "healthy environment should not report issues"

healthy_ndjson='{"Service":"postgres","State":"running","Health":"healthy","ExitCode":0}
{"Service":"redis","State":"running","Health":"healthy","ExitCode":0}
{"Service":"rabbitmq","State":"running","Health":"healthy","ExitCode":0}'

if ! healthy_ndjson_result="$(test_compose_services_ready "$healthy_ndjson")"; then
  echo "healthy NDJSON environment should have passed" >&2
  exit 1
fi

assert_eq "$healthy_ndjson_result" "" "healthy NDJSON environment should not report issues"

failed_json='[
  {"Service":"postgres","State":"running","Health":"healthy","ExitCode":0},
  {"Service":"redis","State":"running","Health":"starting","ExitCode":0},
  {"Service":"rabbitmq","State":"running","Health":"unhealthy","ExitCode":0},
  {"Service":"minio","State":"exited","Health":"","ExitCode":1},
  {"Service":"clickhouse","State":"running","Health":"healthy","ExitCode":0},
  {"Service":"minio-init","State":"exited","Health":"","ExitCode":1}
]'

if failed_result="$(test_compose_services_ready "$failed_json")"; then
  echo "failed environment should not have passed" >&2
  exit 1
fi

assert_contains "$failed_result" $'pending\tService '\''redis'\'' is still starting.' "starting redis should be pending"
assert_contains "$failed_result" $'pending\tService '\''rabbitmq'\'' is unhealthy but may still recover during startup.' "unhealthy rabbitmq should be pending while startup can still recover"
assert_contains "$failed_result" $'fatal\tService '\''minio'\'' is not running (state: exited).' "failed minio should be fatal"
assert_contains "$failed_result" $'fatal\tOne-shot service '\''minio-init'\'' exited with code 1.' "failed minio-init should be fatal"

echo "compose-health tests passed"
