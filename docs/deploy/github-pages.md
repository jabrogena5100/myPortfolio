# Fallback: GitHub Pages

A free alternative to S3 + CloudFront. **You do every GitHub step.** Nothing here has been run; the workflow is a template in `docs/deploy/templates/` (not in `.github/workflows/`), so it does nothing until you copy it.

## What you give up, compared with CloudFront

| | GitHub Pages | S3 + CloudFront (this repo's Terraform) |
| --- | --- | --- |
| Cost | Free for a public repository | Small but not zero; not estimated here |
| Custom security headers (CSP, HSTS policy, COOP) | **Not possible**; you can only use what GitHub sets | Set in `infra/terraform/headers.tf` |
| Cache-Control | Fixed by GitHub | Per folder, set by `scripts/site-sync.sh` |
| Hosting path | **Root only.** The site uses absolute links like `/projects/`, so it must be a user site (`<user>.github.io`) or a custom domain. A project site at `<user>.github.io/<repo>/` would break every link | Root |
| Missing pages | `404.html` is served | `404.html` mapped by the distribution |
| Infrastructure to keep | None | A Terraform stack |

## Steps

1. Decide the address: a repository named `<your-user>.github.io`, or any repository with a custom domain configured under Settings, Pages.
2. In Settings, Pages, set the source to **GitHub Actions**.
3. Copy `docs/deploy/templates/pages.yml` to `.github/workflows/pages.yml` and set `SITE_URL` in it. It runs only when you start it (`workflow_dispatch`).
4. Run the workflow from the Actions tab. It builds in the pinned Node image and deploys the `dist/` folder.
5. Run the checks against the live address: `E2E_BASE_URL=https://<address> scripts/e2e.sh` (the CSP test still passes because it injects the header itself; the real site will not send it, so do not claim that header on Pages).

## Optional: run the checks on every pull request

Copy `docs/deploy/templates/ci.yml` to `.github/workflows/ci.yml`. It runs the type check, the build and the Playwright and axe suite in the pinned Playwright image.

## Pinned versions

Both templates pin each action to a full commit SHA, taken from the GitHub API on 2026-11-17: `actions/checkout` v7.0.1, `actions/configure-pages` v6.0.0, `actions/upload-pages-artifact` v5.0.0, `actions/deploy-pages` v5.0.1. Re-check before using them.
