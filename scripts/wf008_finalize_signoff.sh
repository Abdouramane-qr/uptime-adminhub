#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <evidence_pack_dir>"
  exit 1
fi

PACK_DIR="$1"
if [[ ! -d "$PACK_DIR" ]]; then
  echo "Evidence pack directory not found: $PACK_DIR"
  exit 1
fi

required_files=(
  "00_context.txt"
  "01_sp_account_creation.png"
  "02_sp_email_confirm.png"
  "03_sp_onboarding_pending_review.png"
  "04_sp_approval_before_after.png"
  "05_sp_provider_presence_map.png"
  "06_sp_mobile_login.png"
  "11_fleet_account_creation.png"
  "12_fleet_email_confirm.png"
  "13_fleet_onboarding_pending_review.png"
  "14_fleet_approval_before_after.png"
  "15_fleet_mobile_login.png"
  "20_sql_evidence.txt"
  "30_signoff.md"
)

missing=0
empty=0

echo "Checking WF-008 evidence pack: $PACK_DIR"
for f in "${required_files[@]}"; do
  p="${PACK_DIR}/${f}"
  if [[ ! -f "$p" ]]; then
    echo "MISSING: $f"
    missing=1
    continue
  fi
  if [[ ! -s "$p" ]]; then
    echo "EMPTY:   $f"
    empty=1
  else
    echo "OK:      $f"
  fi
done

SIGNOFF_FILE="${PACK_DIR}/30_signoff.md"
if [[ -f "$SIGNOFF_FILE" ]]; then
  if grep -qi "Overall: .*GO" "$SIGNOFF_FILE"; then
    echo "SIGNOFF: GO marker detected"
  else
    echo "SIGNOFF: GO marker not detected in 30_signoff.md"
    empty=1
  fi
fi

if [[ "$missing" -ne 0 || "$empty" -ne 0 ]]; then
  echo
  echo "WF-008 finalize check FAILED."
  echo "Resolve missing/empty evidence before marking ticket done."
  exit 2
fi

echo
echo "WF-008 finalize check PASSED."
echo "Evidence pack is complete and ready for audit."
