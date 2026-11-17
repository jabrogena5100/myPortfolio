# Development environment (Docker, no host Node)

Status: **Working** (Phase 2). Owner decided 2026-11-17 to run Node tooling through Docker. `scripts/web.sh` exists; install, check and build were run through it. Astro 7.4.12 builds on Node 26.13.1.

Images already on this machine (from the other project): `node:26-bookworm-slim`, `mcr.microsoft.com/playwright:v1.65.1-noble`. Tags published on Docker Hub on 2026-11-11 include `node:26.13.1-bookworm-slim` and `node:22.23.5-bookworm-slim`. Astro 7.4.12 declares `engines.node >= 22.23.4`, so Node 26.13.1 satisfies it; Confirmed in Phase 2: it builds on Node 26.13.1 (fallback `22.23.5` not needed).

Pins (installed in Phase 2, except the last three, added in Phase 6): Node `26.13.1` image, Astro `7.4.12`, Tailwind `4.3.5`, TypeScript `6.0.3` (7.x is incompatible with `@astrojs/check`), Playwright `1.65.1` (image `v1.65.1-noble`; the npm package version must match the image), `@axe-core/playwright` `4.14.0`, Lighthouse `13.6.0`.

## Wrapper (`scripts/web.sh`)

Runs any command in `node:26.13.1-bookworm-slim` as your user, with `--network host` (the other projects found Docker's default bridge slow), Astro telemetry disabled, the npm cache inside the project (`.npm-cache/`, git-ignored) and no credentials mounted. Add `TTY_FLAGS=-it` for the dev server.

Examples: `scripts/web.sh npm ci`, `scripts/web.sh npm run build`, `TTY_FLAGS=-it scripts/web.sh npm run dev`.
Playwright and axe run in the Playwright image against the built `dist/` served by a static server in the same network.

No credentials are mounted. No AWS, Terraform apply, domain or DNS command is run from this repo by me.
