# Verification log

Status values: **Run and passed**, **Run and failed**, **User-reported**, **Not run**, **Blocked**.

| Date | Phase | Claim | Status | Evidence |
| --- | --- | --- | --- | --- |
| 2026-11-17 | 0 | Sibling repo located at `/home/joshua/RyuStoreFront`; read only | Run and passed | `ls`, `git status` (read-only); no writes made there |
| 2026-11-17 | 0 | Framework versions on npm: astro 7.4.12, next 16.4.6, tailwindcss 4.3.5, typescript 7.0.2, @playwright/test 1.65.1, @axe-core/playwright 4.14.0, lighthouse 13.6.0 | Run and passed | `curl https://registry.npmjs.org/<pkg>/latest`; astro 7.4.12 published 2026-11-13, next 16.4.6 2026-11-09. Official docs pages not yet read |
| 2026-11-17 | 0 | RyuStoreFront claims in the brief (Java 25, Spring Boot, Next.js, Terraform ECS/RDS/ALB, tests) match the repo | Run and passed | Code and config read: `pom.xml` (Spring Boot 4.1.2, Java 25), `web/package.json`, `infra/**/*.tf`, 28 test classes listed. Outcomes of its tests were **not** re-run, see evidence file |
| 2026-11-17 | 0 | 21st.dev popular components inspected | Run and passed (partial) | Listing and component pages read; **source code not visible without an API key**, so no code inspection |
| 2026-11-17 | 0 | 21st.dev MCP integration | Run and passed | After the owner registered it, `mcp__21st-dev__search` returned results and `get_component` returned source for ids 2487, 1500, 19075. `aws-mcp` still fails to start (`uvx` not found); unrelated |
| 2026-11-17 | 1 | Source of three 21st.dev components inspected for fit, dependencies and defects | Run and passed | See `docs/decisions.md` D5. Source read for 3 components; no licence field is returned by the MCP, so licences remain unverified for them. Nothing installed |
| 2026-11-17 | 0 | Node/npm available locally | Blocked (resolved by decision) | `node`, `npm` not in PATH; Docker 29.9.3 is available. Owner decided 2026-11-17: run Node tooling through Docker |
| 2026-11-17 | 1 | RyuCloud and wildfire evidence files read in full (496 and 313 lines) | Run and passed | `content/evidence/RyuCloudInfo.md`, `AutonomousDroneProjectInfo.md`. Their contents are the exporters' own statements; I ran nothing in those projects and could not verify them |
| 2026-11-17 | 1 | Dark palette contrast ratios (text, muted, accent, sage, danger, borders) | Run and passed | Computed with WCAG 2.x relative luminance in a Python script; table in `design/TOKENS.md`. `text-subtle` fails 4.5:1 on `surface-2` and is restricted. Not yet checked in rendered pages |
| 2026-11-17 | 1 | Node 26.13.1 and 22.23.5 images exist | Run and passed | Docker Hub tag API; `node:26.13.1-bookworm-slim` pulled and ran (`node -v` v26.13.1, npm 11.20.0) |
| 2026-11-17 | 2 | `npm install` of the pinned dependencies | Run and passed | In Docker: 408 packages added, 0 vulnerabilities (npm's install-time summary, not a separate audit). `@astrojs/check` peer range forced TypeScript 6.0.3 (see D1) |
| 2026-11-17 | 2 | `astro check` (types) | Run and passed | 4 files, 0 errors, 0 warnings, 0 hints |
| 2026-11-17 | 2 | `astro build` produces a static site on Node 26.13.1 | Run and passed | 1 page built in 1.92 s; `dist/index.html` is 584 bytes with 0 `<script>` tags; one CSS file, 11,380 bytes |
| 2026-11-17 | 2 | Only token colours exist in the built CSS | Run and passed (narrow) | `grep` of the built CSS found the two token hexes checked (`#151310`, `d98b55`) and no `gray-`, `slate-` or `zinc-` classes. Not a full audit of every declared value |
| 2026-11-17 | 2 | Astro telemetry disabled in the wrapper | Run and passed | After the change a build printed no "collects anonymous usage data" notice (count 0) |
| — | 2+ | Playwright, axe, Lighthouse, link, contrast, keyboard, reduced-motion checks | Not run | No site exists yet |
