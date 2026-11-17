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
| — | 2+ | Playwright, axe, Lighthouse, link, contrast, keyboard, reduced-motion checks | Not run | No site exists yet |
