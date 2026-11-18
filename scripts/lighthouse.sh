#!/usr/bin/env bash
# Build, then run Lighthouse on every page in the pinned Playwright image.
# Against a deployed site: LH_BASE_URL=https://<site> LH_OUT=design/lighthouse/summary-deployed.json scripts/lighthouse.sh
set -euo pipefail
cd "$(dirname "$0")/.."
# Refuse a variable that is set but empty (for example `E2E_BASE_URL="$SITE"` when $SITE is not set in this shell);
# otherwise the script would silently fall back to a local build and report it as if it were the live site.
if [[ -n "${LH_BASE_URL+x}" && -z "${LH_BASE_URL}" ]]; then
  echo "LH_BASE_URL is set but empty. Did \$SITE expand? Set it first, for example: SITE=https://<your-address>" >&2; exit 1
fi
if [[ -n "${LH_BASE_URL:-}" ]]; then echo "TARGET: LIVE ${LH_BASE_URL} (no local build)" >&2; else echo "TARGET: local build served by astro preview" >&2; fi
[[ -n "${LH_BASE_URL:-}" ]] || scripts/web.sh npm run build
exec docker run --rm --network host --ipc=host ${LH_BASE_URL:+-e LH_BASE_URL} ${LH_OUT:+-e LH_OUT} ${LH_PAGES:+-e LH_PAGES} \
  -u "$(id -u):$(id -g)" -e HOME=/tmp -e ASTRO_TELEMETRY_DISABLED=1 -e DO_NOT_TRACK=1 \
  -v "$PWD":/app -w /app mcr.microsoft.com/playwright:v1.65.1-noble \
  node scripts/lighthouse.mjs
