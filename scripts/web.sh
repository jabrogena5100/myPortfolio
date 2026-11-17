#!/usr/bin/env bash
# Run Node tooling in Docker (no host Node). Usage: scripts/web.sh npm ci
set -euo pipefail
cd "$(dirname "$0")/.."
IMAGE="${WEB_NODE_IMAGE:-node:26.13.1-bookworm-slim}"
exec docker run --rm ${TTY_FLAGS:--i} --network host \
  -u "$(id -u):$(id -g)" -e HOME=/tmp -e ASTRO_TELEMETRY_DISABLED=1 -e DO_NOT_TRACK=1 -e npm_config_cache=/app/.npm-cache \
  -v "$PWD":/app -w /app "$IMAGE" "$@"
