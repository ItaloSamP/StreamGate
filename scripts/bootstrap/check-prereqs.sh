#!/usr/bin/env bash
set -euo pipefail

export LANG="${LANG:-C.UTF-8}"
export LC_CTYPE="${LC_CTYPE:-$LANG}"
checks=(
  "git:git --version"
  "docker:docker --version"
  "docker compose:docker compose version"
  "jq:jq --version"
  "node:node --version"
  "pnpm:pnpm --version"
  "ruby:ruby --version"
  "bundle:bundle --version"
  "rails:rails --version"
)

for check in "${checks[@]}"; do
  name="${check%%:*}"
  command="${check#*:}"

  if result="$(bash -lc "$command" 2>&1)"; then
    printf '[OK] %s: %s\n' "$name" "$result"
  else
    printf '[MISSING/ERROR] %s: %s\n' "$name" "$result"
  fi
done
