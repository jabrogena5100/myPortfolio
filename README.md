# myPortfolio

Joshua Abrogena's software engineering portfolio: a static Astro site documenting three projects with their evidence.

## Develop (Node runs in Docker; no host Node needed)

```
scripts/web.sh npm install
scripts/web.sh npm run check
scripts/web.sh npm run build        # output in dist/
TTY_FLAGS=-it scripts/web.sh npm run dev   # http://localhost:4321
```

## Layout

- `src/` site source; `src/styles/tokens.css` is the only place design values live
- `content/evidence/` per-project evidence (separate from site copy)
- `docs/` decisions, verification log, content plan
- `design/` anti-slop checklist, tokens spec, component notes, review gallery

Status and decisions: `docs/decisions.md`. Every verification result, including what was not run: `docs/verification.md`.

## Fill in contact details and the resume

Edit the `contact` object in `src/data/site.ts` (email, GitHub, LinkedIn, resume URL). Every value is `null` until supplied; the site then shows "To be added." For the resume, copy the PDF into `public/` (for example `public/resume.pdf`) and set `resumeUrl: '/resume.pdf'`. Rebuild and every page updates.

## Deploy

Plan, apply and upload are described in `docs/deploy/runbook.md` (S3 + CloudFront with Terraform; GitHub Pages fallback in `docs/deploy/github-pages.md`). Nothing has been deployed. The Terraform is in `infra/terraform/` and has been validated but never planned or applied.

## Checks

- `scripts/web.sh npm run test:unit` runs the CloudFront Function unit tests.
- `scripts/e2e.sh` builds the site and runs Playwright with axe in the pinned Playwright image.
- `E2E_BASE_URL=https://<site> scripts/e2e.sh` and `LH_BASE_URL=https://<site> scripts/lighthouse.sh` run the same checks against a deployed site.
- `scripts/lighthouse.sh` builds, then runs Lighthouse (mobile and desktop) on every page and writes `design/lighthouse/summary.json`.

Results, and what was not run, are in `docs/verification.md`.
