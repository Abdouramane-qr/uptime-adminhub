#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
OUT_DIR="${2:-./qa_reports/responsive_matrix}"

mkdir -p "$OUT_DIR"

LH_CMD=""
if command -v lighthouse >/dev/null 2>&1; then
  LH_CMD="lighthouse"
elif command -v npx >/dev/null 2>&1; then
  LH_CMD="npx --yes lighthouse"
else
  echo "[RESP] Lighthouse CLI not found (no lighthouse and no npx)."
  exit 1
fi

ROUTES=(
  "/login"
  "/dashboard"
  "/map"
  "/interventions"
  "/accounts"
  "/settings"
)

VIEWPORTS=(
  "mobile_320,320,640,2,true"
  "tablet_768,768,1024,2,false"
  "desktop_1280,1280,800,1,false"
)

run_lighthouse_viewport() {
  local route="$1"
  local label="$2"
  local width="$3"
  local height="$4"
  local dsf="$5"
  local mobile="$6"

  local route_slug
  route_slug="$(echo "$route" | tr '/' '_' | tr -cd '[:alnum:]_')"
  route_slug="${route_slug##_}"
  local out_json="${OUT_DIR}/lh_${label}_${route_slug}.json"

  echo "[RESP] ${label} => ${BASE_URL}${route}"
  # shellcheck disable=SC2086
  $LH_CMD "${BASE_URL}${route}" \
    --only-categories=accessibility,performance,best-practices \
    --quiet \
    --chrome-flags='--headless --no-sandbox --disable-gpu' \
    --screenEmulation.width="$width" \
    --screenEmulation.height="$height" \
    --screenEmulation.deviceScaleFactor="$dsf" \
    --screenEmulation.mobile="$mobile" \
    --output=json \
    --output-path="$out_json" >/dev/null || {
      echo "[RESP] Lighthouse failed for ${label} ${route}"
      return 1
    }
}

for route in "${ROUTES[@]}"; do
  for vp in "${VIEWPORTS[@]}"; do
    IFS=',' read -r label width height dsf mobile <<< "$vp"
    run_lighthouse_viewport "$route" "$label" "$width" "$height" "$dsf" "$mobile"
  done
done

python3 - "$OUT_DIR" <<'PY'
import json
import pathlib
import sys

out_dir = pathlib.Path(sys.argv[1])
files = sorted(out_dir.glob("lh_*.json"))
if not files:
    print("[RESP] No reports generated")
    sys.exit(1)

rows = []
for f in files:
    d = json.loads(f.read_text())
    cats = d.get("categories", {})
    acc = cats.get("accessibility", {}).get("score", 0)
    perf = cats.get("performance", {}).get("score", 0)
    bp = cats.get("best-practices", {}).get("score", 0)
    name = f.stem.replace("lh_", "", 1)
    parts = name.split("_", 2)
    viewport = "_".join(parts[:2]) if len(parts) >= 2 else parts[0]
    route_slug = parts[2] if len(parts) >= 3 else "unknown"
    rows.append((viewport, route_slug, acc, perf, bp, f.name))

rows.sort()

md = out_dir / "responsive_matrix_summary.md"
with md.open("w") as w:
    w.write("# Responsive Matrix Summary\n\n")
    w.write("| Viewport | Route | Accessibility | Performance | Best Practices | Report |\n")
    w.write("|---|---:|---:|---:|---:|---|\n")
    for viewport, route_slug, acc, perf, bp, fname in rows:
        w.write(
            f"| {viewport} | `{route_slug}` | {acc:.2f} | {perf:.2f} | {bp:.2f} | `{fname}` |\n"
        )

print(f"[RESP] Summary generated: {md}")
PY

echo "[RESP] Responsive matrix completed: ${OUT_DIR}"
