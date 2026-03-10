#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
OUT_DIR="${2:-./qa_reports/responsive_matrix}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MATRIX_SCRIPT="${SCRIPT_DIR}/run_responsive_matrix.sh"
THRESH_SCRIPT="${SCRIPT_DIR}/responsive_thresholds.sh"

if [[ ! -x "$MATRIX_SCRIPT" ]]; then
  echo "[P1-05] Missing executable: $MATRIX_SCRIPT"
  exit 1
fi
if [[ ! -x "$THRESH_SCRIPT" ]]; then
  echo "[P1-05] Missing executable: $THRESH_SCRIPT"
  exit 1
fi

echo "[P1-05] Running responsive matrix..."
"$MATRIX_SCRIPT" "$BASE_URL" "$OUT_DIR"

echo "[P1-05] Running responsive thresholds..."
"$THRESH_SCRIPT" "$OUT_DIR"

echo "[P1-05] Gate PASSED."
echo "[P1-05] Artifacts:"
echo "  - ${OUT_DIR}/responsive_matrix_summary.md"
echo "  - ${OUT_DIR}/responsive_thresholds_summary.md"
