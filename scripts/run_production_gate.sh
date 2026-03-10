#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[GATE] 1/5 Secret scan"
./scripts/check_secrets.sh

echo "[GATE] 2/5 Strict backend static guard"
npm run qa:strict-backend

echo "[GATE] 3/5 Lint"
npm run lint

echo "[GATE] 4/5 Tests"
npm test

echo "[GATE] 5/5 Strict backend build"
npm run build:strict-backend

echo "[GATE] PASS: uptime-adminhub production gate completed"
