#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

files=$(git ls-files)

patterns=(
  'AIza[0-9A-Za-z_-]{35}'
  'sb_publishable_[A-Za-z0-9_-]{20,}'
  'sb_secret_[A-Za-z0-9_-]{20,}'
  'SUPABASE_SERVICE_ROLE_KEY\s*[=:]\s*["'"'"'][^"'"'"']{20,}["'"'"']'
)

failed=0
for p in "${patterns[@]}"; do
  if echo "$files" | xargs -r rg -n --pcre2 "$p" -- >/tmp/adminhub_secret_hits.txt 2>/dev/null; then
    echo "[SECRET CHECK] Potential secret detected for pattern: $p"
    cat /tmp/adminhub_secret_hits.txt
    failed=1
  fi
done
rm -f /tmp/adminhub_secret_hits.txt

if [[ "$failed" -eq 1 ]]; then
  echo "[SECRET CHECK] FAILED"
  exit 1
fi

echo "[SECRET CHECK] OK"
