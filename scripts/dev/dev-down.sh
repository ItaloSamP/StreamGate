#!/usr/bin/env bash
set -euo pipefail

export LANG="${LANG:-C.UTF-8}"
export LC_CTYPE="${LC_CTYPE:-$LANG}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

cd "$ROOT_DIR"

docker compose --profile app --profile full --profile worker down --remove-orphans

echo "Infraestrutura local do StreamGate finalizada."
