#!/usr/bin/env bash
set -euo pipefail

ENV_NAME="${1:-staging}"
TESTER="${2:-tester}"

ROOT="/home/suprox/projects/new/garage"
TS_UTC="$(date -u +%Y%m%d_%H%M)"
PACK_DIR="${ROOT}/uptime-adminhub/qa_reports/WF008_${ENV_NAME}_${TS_UTC}_${TESTER}"

mkdir -p "$PACK_DIR"

cat > "${PACK_DIR}/00_context.txt" <<EOF
Ticket: WF-008
Environment: ${ENV_NAME}
Tester: ${TESTER}
Start time (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
End time (UTC):
Admin web revision:
Mobile build info:
Notes:
EOF

cat > "${PACK_DIR}/30_signoff.md" <<EOF
# WF-008 Final Decision

Overall: [ ] GO [ ] NO-GO

Blocking issues:
- 

Notes:
- 
EOF

touch \
  "${PACK_DIR}/01_sp_account_creation.png" \
  "${PACK_DIR}/02_sp_email_confirm.png" \
  "${PACK_DIR}/03_sp_onboarding_pending_review.png" \
  "${PACK_DIR}/04_sp_approval_before_after.png" \
  "${PACK_DIR}/05_sp_provider_presence_map.png" \
  "${PACK_DIR}/06_sp_mobile_login.png" \
  "${PACK_DIR}/11_fleet_account_creation.png" \
  "${PACK_DIR}/12_fleet_email_confirm.png" \
  "${PACK_DIR}/13_fleet_onboarding_pending_review.png" \
  "${PACK_DIR}/14_fleet_approval_before_after.png" \
  "${PACK_DIR}/15_fleet_mobile_login.png" \
  "${PACK_DIR}/20_sql_evidence.txt"

echo "WF-008 evidence pack initialized:"
echo "  ${PACK_DIR}"
echo
echo "Next:"
echo "  1) Fill screenshots/files in this folder"
echo "  2) Run wf008_sql_evidence.sh > ${PACK_DIR}/20_sql_evidence.txt"
