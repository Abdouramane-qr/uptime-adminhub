#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <evidence_pack_dir>"
  exit 1
fi

PACK_DIR="$1"
ROOT="/home/suprox/projects/new/garage"
RUNBOOK_TICKETS="${ROOT}/uptime-repo/docs/WEB_WORKFLOW_IMPLEMENTATION_TICKETS.md"
SUMMARY_FILE="${PACK_DIR}/40_wf008_completion_summary.md"

"${ROOT}/uptime-adminhub/scripts/wf008_finalize_signoff.sh" "$PACK_DIR"

if [[ ! -f "$RUNBOOK_TICKETS" ]]; then
  echo "Tickets file not found: $RUNBOOK_TICKETS"
  exit 1
fi

if grep -q -- "- \[ \] \`WF-008\`" "$RUNBOOK_TICKETS"; then
  sed -i '0,/- \[ \] `WF-008`/s//- [x] `WF-008`/' "$RUNBOOK_TICKETS"
fi

cat > "$SUMMARY_FILE" <<EOF
# WF-008 Completion Summary

Date (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Evidence pack: ${PACK_DIR}

## Result
- WF-008 final validation: PASS
- Ticket doc status updated: \`WEB_WORKFLOW_IMPLEMENTATION_TICKETS.md\` => \`WF-008\` checked

## Suggested Commit Message
docs: close WF-008 with SP/Fleet signoff evidence

## Suggested PR Notes
1. Executed SP and Fleet end-to-end onboarding tracks.
2. Captured evidence pack and SQL outputs for audit.
3. Updated workflow ticket status to done after automated validation.
EOF

echo "WF-008 marked done and summary generated:"
echo "  ${SUMMARY_FILE}"
