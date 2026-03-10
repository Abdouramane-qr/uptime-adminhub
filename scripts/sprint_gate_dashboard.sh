#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADMIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WORKSPACE_ROOT="$(cd "${ADMIN_ROOT}/.." && pwd)"

OUT="${1:-${WORKSPACE_ROOT}/qa_reports/sprint_gate_dashboard.md}"

WF008_SUMMARY="${WF008_SUMMARY:-}"
P105_SUMMARY="${P105_SUMMARY:-${ADMIN_ROOT}/qa_reports/responsive_matrix/responsive_thresholds_summary.md}"
M7_REPORT="${M7_REPORT:-${WORKSPACE_ROOT}/uptime-repo/qa_reports/m7_release_gate_report.md}"

status_of_file() {
  local f="$1"
  if [[ -z "$f" ]]; then
    echo "NOT_CONFIGURED"
    return
  fi
  if [[ ! -f "$f" || ! -s "$f" ]]; then
    echo "MISSING"
    return
  fi
  if rg -qi "NO-GO|FAIL" "$f"; then
    echo "FAIL"
    return
  fi
  if rg -qi "GO|PASS" "$f"; then
    echo "PASS"
    return
  fi
  echo "UNKNOWN"
}

WF008_STATUS="$(status_of_file "$WF008_SUMMARY")"
P105_STATUS="$(status_of_file "$P105_SUMMARY")"
M7_STATUS="$(status_of_file "$M7_REPORT")"

OVERALL="GO"
for s in "$WF008_STATUS" "$P105_STATUS" "$M7_STATUS"; do
  if [[ "$s" != "PASS" ]]; then
    OVERALL="NO-GO"
    break
  fi
done

mkdir -p "$(dirname "$OUT")"
cat > "$OUT" <<EOF
# Sprint Gate Dashboard

Date (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")

## Gates
- WF-008 signoff: **${WF008_STATUS}**  
  source: \`${WF008_SUMMARY:-not set}\`
- P1-05 responsive web: **${P105_STATUS}**  
  source: \`${P105_SUMMARY}\`
- Milestone 7 mobile (\`TKT-060..064\`): **${M7_STATUS}**  
  source: \`${M7_REPORT}\`

## Overall
- **${OVERALL}**

## Remaining blockers (auto)
EOF

append_blocker() {
  local name="$1"
  local s="$2"
  if [[ "$s" != "PASS" ]]; then
    echo "- ${name}: ${s}" >> "$OUT"
  fi
}

append_blocker "WF-008" "$WF008_STATUS"
append_blocker "P1-05" "$P105_STATUS"
append_blocker "M7 (TKT-060..064)" "$M7_STATUS"

echo "Dashboard generated: $OUT"
if [[ "$OVERALL" == "GO" ]]; then
  exit 0
fi
exit 2
