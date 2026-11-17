# Lighthouse data

`summary.json` is the current result for the shipped build. The other files are earlier runs and experiments, kept so every claim in `docs/verification.md` and `docs/decisions.md` can be checked. All runs: Lighthouse 13.6.0, HeadlessChrome 159, simulated throttling (mobile: slow 4G, 4x CPU), local `astro preview`, no CDN, no compression, one run per page and preset (home on mobile 3 times).

| File | What it is |
| --- | --- |
| `summary.json` | Shipped build: one external module script (CSP `script-src 'self'`) |
| `summary-phase6-inline-scripts.json` | Phase 6 final run: two inline scripts, before the CSP work |
| `experiment-one-module-script.json` | Same as `summary.json` (the run that was kept) |
| `experiment-two-module-scripts.json` | Two external module scripts |
| `experiment-classic-defer-script.json` | One plain `defer` script from `public/` (rejected: no faster) |
| `experiment-inline-css.json` | Phase 6: stylesheet inlined (rejected) |
| `experiment-first-run.json` | Phase 6: first run, before the final fixes |
| `page-weight.json` | Uncompressed bytes per page from `astro preview` |

Not a field measurement. The deployed-site run belongs in `summary-deployed.json` (see `docs/deploy/runbook.md` section 7).
