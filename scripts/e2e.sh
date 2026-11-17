#!/usr/bin/env bash
# Build, then run Playwright + axe against the production build inside the pinned Playwright image.
set -euo pipefail
cd "$(dirname "$0")/.."
scripts/web.sh npm run build
exec docker run --rm --network host --ipc=host \
  -u "$(id -u):$(id -g)" -e HOME=/tmp -e ASTRO_TELEMETRY_DISABLED=1 -e DO_NOT_TRACK=1 \
  -v "$PWD":/app -w /app mcr.microsoft.com/playwright:v1.65.1-noble \
  npx playwright test "$@"
