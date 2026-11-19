<!--
DRAFT for the RyuStoreFront repository's README.md. It lives here because the RyuStoreFront repo is read-only
for this assistant. Copy it over yourself, then check the items marked CHECK. Every number below is quoted from the
portfolio's fact registry (src/data/facts.ts) with its status; none was re-run when this was written (2026-11-18).
-->

# RyuStoreFront

An online store built as an engineering portfolio project. The interesting part is not the catalogue but the parts that
go wrong in real shops: **payments, stock, order state and background work under retries, crashes and races.**
Stripe runs in **test mode only**. There are no real payments, customers or traffic.

A fuller case study with the evidence and its limits is on the author's portfolio site. CHECK: add its link once the permanent address exists.

## What it does

- **Backend:** Java 25, Spring Boot, PostgreSQL, Flyway migrations. A modular monolith with a separate worker process.
- **Payments:** Stripe Checkout with signature-verified, idempotent webhook handling.
- **Inventory:** atomic stock reservation with expiry, so concurrent buyers cannot oversell.
- **Orders:** one transition table drives the order lifecycle; illegal transitions are rejected and replays are no-ops.
- **Async work:** a transactional outbox drained by a worker (confirmation emails, stock release, order events).
- **Frontend:** Next.js, designed from tokens first, wired to the API.
- **Infrastructure:** Terraform for ECS Fargate, RDS and an ALB on AWS.

## What was tested, and how it was recorded

| Claim | Result | Status |
| --- | --- | --- |
| Same Stripe event delivered 3 times in a row and 6 times at once | One paid order, one payment, one `order.paid` event, one email record | Run, 2026-11-14 |
| Expired-then-completed webhook | Refunded once, order stays cancelled, stock restored (fake gateway, not real Stripe refunds) | Run, 2026-11-14 |
| 50 threads reserving 1 unit each against 10 in stock | Exactly 10 reservations, 20 consecutive rounds (one JVM, one VM) | User-reported, 2026-11-14 |
| Worker killed with SIGKILL mid-job | Event stays pending; a restarted worker completes it exactly once | User-reported, 2026-11-14 |
| Backend suite | 235 tests, 0 failures (Testcontainers Postgres 18, one VM) | User-reported, 2026-11-15 |
| Order transition table | All 36 status pairs tested | Documented |
| Accessibility | axe scan, 119 pages, 0 violations, Chromium only, mock API; no screen-reader walkthrough | Run, 2026-11-15 |
| One real checkout on AWS (Stripe test mode) | Order became paid after the webhook reached the API on Fargate; stack then destroyed (31 resources) and a 13-check audit found nothing billable left | User-reported, 2026-11-15 |

**Not done:** no load test, no Lighthouse run, no latency percentiles, no measured AWS cost. In the cloud session no worker
or frontend was running, so email and cart clearing were not exercised there.

## Running it

- `compose.yaml` defines the local stack; the Maven wrapper (`mvnw`) is committed. CHECK: add the exact commands you use.
- `web/` holds the Next.js app; `scripts/` holds helper scripts (`web.sh`, `aws-terraform.sh`, `aws-audit.sh`, others).
- `infra/` holds the Terraform (`foundation`, per-session `session`); see `infra/README.md`.

## Documentation

`docs/decisions.md` (choices and tradeoffs), `docs/payments.md`, `docs/order-lifecycle.md`, `docs/worker.md`,
`docs/email.md`, `docs/verification.md` (what was run and what was not), `docs/api/`, `docs/explain/` (query plans).

## Status

Built and tested locally; deployed once to AWS for a single test-mode checkout, then destroyed. There is no live demo
right now. CHECK: the demo domain status before publishing.
