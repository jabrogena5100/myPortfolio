#!/usr/bin/env bash
# Rebuild the site and render the resume page to public/resume.pdf (US Letter, print stylesheet).
# Edit the content in src/pages/resume.astro; contact details come from src/data/site.ts.
set -euo pipefail
cd "$(dirname "$0")/.."
scripts/web.sh npm run build
exec docker run --rm --network host --ipc=host \
  -u "$(id -u):$(id -g)" -e HOME=/tmp -e ASTRO_TELEMETRY_DISABLED=1 -e DO_NOT_TRACK=1 \
  -v "$PWD":/app -w /app mcr.microsoft.com/playwright:v1.65.1-noble \
  node scripts/resume.mjs
