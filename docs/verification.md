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
| 2026-11-17 | 3 | Font licences verified from upstream sources before download | Run and passed | Source Serif 4: `adobe-fonts/source-serif`, GitHub reports OFL-1.1, `LICENSE.md` read, release 4.005R. Hanken Grotesk: `marcologous/hanken-grotesk` (named as upstream in the Google Fonts `upstream_info.md`), OFL-1.1, `OFL.txt` read. Source Serif's Reserved Font Name "Source" means the file is shipped unmodified. Details and SHA-256 in `docs/fonts.md` |
| 2026-11-17 | 3 | Fonts are self-hosted; the site makes no third-party requests | Run and passed | Playwright test records every request host on the home page: only `127.0.0.1:4321`. Both faces report status `loaded`. Console and page errors: none |
| 2026-11-17 | 3 | `astro check` and `astro build` after Phase 3 | Run and passed | 15 files, 0 errors/warnings/hints; 8 pages built |
| 2026-11-17 | 3 | Playwright + axe suite against the production build, Chromium only | Run and passed | `scripts/e2e.sh`: **35 passed** (1.1 min) after fixes. Covers 8 pages x 3 widths (390, 820, 1440): axe tags wcag2a, wcag2aa, wcag21a, wcag21aa, best-practice, **0 violations**; exactly one `h1`; no horizontal overflow. 5 of the 8 pages are placeholders |
| 2026-11-17 | 3 | First run of that suite failed 5 tests; causes found | Run and failed, then fixed | 3 failures were a real defect (link-in-text-block: no underline on running-text links), 2 were test bugs (focus loop ran past the last control onto the page body; mouse moved outside the viewport). Fixed; the last full run passed |
| 2026-11-17 | 3 | Keyboard: skip link first in tab order and moves focus to `#main`; nav links and all three project cards reachable by Tab with a 2 px solid focus ring | Run and passed | Playwright, desktop |
| 2026-11-17 | 3 | Mobile menu: opens with Enter, Escape closes it and returns focus to the button, all four links at least 44 px tall | Run and passed | Playwright, 390 px |
| 2026-11-17 | 3 | Reduced motion: card transitions are 0 s under `prefers-reduced-motion: reduce`, 0.2 s otherwise; no hover transform | Run and passed | Playwright, computed styles. Page-transition (View Transitions) behaviour not tested |
| 2026-11-17 | 3 | Pointer spotlight updates `--mx` on hover-capable devices | Run and passed | Playwright, desktop |
| 2026-11-17 | 3 | Every internal link and in-page anchor on the home page resolves | Run and passed | Playwright: all internal hrefs returned 200, anchors found. 4 of the targets are placeholder pages. External links: none exist yet |
| 2026-11-17 | 3 | Dark colour contrast on the rendered homepage | Run and passed | axe `color-contrast` (part of wcag2aa) reported no violation at 3 widths. Complements the computed palette table in `design/TOKENS.md` |
| 2026-11-17 | 3 | Homepage screenshots reviewed by Claude Code at 3 widths | Run and passed | See `design/REVIEW.md`; 4 visual defects found and fixed. **Owner sign-off: not done** |
| — | 3 | Firefox, WebKit, real devices, screen reader, forced colors, 200% zoom | Not run | |
| — | 3 | Lighthouse | Not run | Phase 6 |
| — | 4+ | Checks of the case-study, services, about and contact pages | Not run | Those pages are placeholders |
