#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TARGETS=(
  "src/pages/Accounts.tsx"
  "src/pages/Dispatch.tsx"
  "src/pages/Interventions.tsx"
  "src/pages/Map.tsx"
  "src/pages/Billing.tsx"
  "src/pages/Technicians.tsx"
  "src/pages/AuditLogs.tsx"
)

DEDICATED_TARGETS=(
  "src/pages/Billing.tsx"
  "src/pages/Technicians.tsx"
  "src/pages/AuditLogs.tsx"
)

echo "[strict-backend] Checking migrated pages for strict-mode guards..."

missing=0
for f in "${TARGETS[@]}"; do
  if ! rg -n "allowMockFallback\(|allowFallback" "$f" >/dev/null; then
    echo "[FAIL] $f: missing strict backend flag usage"
    missing=$((missing + 1))
    continue
  fi

  if ! rg -n "if \(!allowFallback\) set[A-Za-z]+\(\[\]\);" "$f" >/dev/null; then
    echo "[WARN] $f: no explicit strict-mode clear in catch block"
  else
    echo "[OK]   $f"
  fi
done

echo "[strict-backend] Checking dedicated pages for legacy endpoint regressions..."
for f in "${DEDICATED_TARGETS[@]}"; do
  if rg -n "listServiceRequests|listProviderPresence" "$f" >/dev/null; then
    echo "[FAIL] $f: legacy endpoint usage found"
    missing=$((missing + 1))
  else
    echo "[OK]   $f (dedicated endpoints only)"
  fi
done

if [[ "$missing" -gt 0 ]]; then
  echo "[strict-backend] FAILED: $missing file(s) missing strict-mode flag integration"
  exit 1
fi

echo "[strict-backend] PASS"
