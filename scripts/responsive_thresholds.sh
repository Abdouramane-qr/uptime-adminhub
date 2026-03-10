#!/usr/bin/env bash
set -euo pipefail

REPORT_DIR="${1:-./qa_reports/responsive_matrix}"
ACC_MIN="${ACC_MIN:-0.90}"
PERF_MIN="${PERF_MIN:-0.70}"
BP_MIN="${BP_MIN:-0.90}"

if [[ ! -d "$REPORT_DIR" ]]; then
  echo "[RESP-QA] Report directory not found: $REPORT_DIR"
  exit 1
fi

python3 - "$REPORT_DIR" "$ACC_MIN" "$PERF_MIN" "$BP_MIN" <<'PY'
import json
import pathlib
import re
import sys

report_dir = pathlib.Path(sys.argv[1])
acc_min = float(sys.argv[2])
perf_min = float(sys.argv[3])
bp_min = float(sys.argv[4])

files = sorted(report_dir.glob("lh_*.json"))
if not files:
    print("[RESP-QA] No lh_*.json reports found")
    sys.exit(1)

pattern = re.compile(r"^lh_(?P<viewport>mobile_320|tablet_768|desktop_1280)_(?P<route>.+)\.json$")
failed = False

summary_path = report_dir / "responsive_thresholds_summary.md"
with summary_path.open("w") as w:
    w.write("# Responsive Thresholds Summary\n\n")
    w.write(f"Thresholds: accessibility>={acc_min:.2f}, performance>={perf_min:.2f}, best-practices>={bp_min:.2f}\n\n")
    w.write("| Viewport | Route | Accessibility | Performance | Best Practices | Result |\n")
    w.write("|---|---|---:|---:|---:|---|\n")

    for f in files:
      m = pattern.match(f.name)
      viewport = m.group("viewport") if m else "unknown"
      route = m.group("route") if m else f.stem

      data = json.loads(f.read_text())
      cats = data.get("categories", {})
      acc = cats.get("accessibility", {}).get("score", 0)
      perf = cats.get("performance", {}).get("score", 0)
      bp = cats.get("best-practices", {}).get("score", 0)

      ok = (acc >= acc_min) and (perf >= perf_min) and (bp >= bp_min)
      result = "PASS" if ok else "FAIL"
      if not ok:
          failed = True

      print(f"[RESP-QA] {f.name}: accessibility={acc:.2f}, performance={perf:.2f}, best-practices={bp:.2f} => {result}")
      w.write(f"| {viewport} | `{route}` | {acc:.2f} | {perf:.2f} | {bp:.2f} | **{result}** |\n")

    w.write("\n")
    w.write(f"Overall: **{'FAIL' if failed else 'PASS'}**\n")

print(f"[RESP-QA] Summary generated: {summary_path}")
if failed:
    print("[RESP-QA] FAILED thresholds")
    sys.exit(1)
print("[RESP-QA] PASSED thresholds")
PY
