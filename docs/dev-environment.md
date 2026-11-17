# Development environment (Docker, no host Node)

Status: **Proposed**, decided by the owner on 2026-11-17: run Node tooling through Docker.

Images already on this machine (from the other project): `node:26-bookworm-slim`, `mcr.microsoft.com/playwright:v1.65.1-noble`. Tags published on Docker Hub on 2026-11-11 include `node:26.13.1-bookworm-slim` and `node:22.23.5-bookworm-slim`. Astro 7.4.12 declares `engines.node >= 22.23.4`, so Node 26.13.1 satisfies it; **Phase 2 must confirm** that Astro 7 builds on Node 26 before this is final (fallback: `22.23.5`).

Proposed pins (re-verify at scaffold time): Node `26.13.1` image, Astro `7.4.12`, Tailwind `4.3.5`, TypeScript `7.0.2`, Playwright `1.65.1` (image `v1.65.1-noble`; the npm package version must match the image), `@axe-core/playwright` `4.14.0`, Lighthouse `13.6.0`.

## Intended wrapper (`scripts/web.sh`, written in Phase 2)

```
docker run --rm -it -u "$(id -u):$(id -g)" -v "$PWD":/app -w /app \
  -p 4321:4321 node:26.13.1-bookworm-slim "$@"
```

Examples: `scripts/web.sh npm ci`, `scripts/web.sh npm run build`, `scripts/web.sh npm run dev -- --host 0.0.0.0`.
Playwright and axe run in the Playwright image against the built `dist/` served by a static server in the same network. Builds on this VM may need `--network host` for downloads (the other projects found Docker's default bridge slow).

No credentials are mounted. No AWS, Terraform apply, domain or DNS command is run from this repo by me.
