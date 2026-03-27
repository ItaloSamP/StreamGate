#!/usr/bin/env bash
set -euo pipefail
source scripts/compose-health.sh
healthy_json='[
  {"Service":"postgres","State":"running","Health":"healthy","ExitCode":0},
  {"Service":"redis","State":"running","Health":"healthy","ExitCode":0},
  {"Service":"rabbitmq","State":"running","Health":"healthy","ExitCode":0},
  {"Service":"minio","State":"running","Health":"healthy","ExitCode":0},
  {"Service":"clickhouse","State":"running","Health":"healthy","ExitCode":0},
  {"Service":"minio-init","State":"exited","Health":"","ExitCode":0}
]'
set +e
output="$(test_compose_services_ready "$healthy_json")"
code=$?
set -e
echo "code:$code"
printf 'output:%s\n' "$output"