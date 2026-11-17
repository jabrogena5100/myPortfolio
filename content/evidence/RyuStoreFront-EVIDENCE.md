# RyuStoreFront: evidence inventory

Generated 2026-11-17 by reading `/home/joshua/RyuStoreFront` **read-only** (no scripts run, no Git changes).
Sibling repo state when read: branch `phase5-order-history-and-admin`, one uncommitted line in `docs/verification.md`; last commit on that branch `44b41fe` (PR #26). The project is **under active development**, so this file is a snapshot; re-check before publishing.

This file is evidence, not marketing copy. Portfolio copy must not go beyond it.

## How to read the status labels

| Label | Meaning |
| --- | --- |
| **Code-verified** | I found the code, config or test file in the repo on 2026-11-17 (I did NOT run it) |
| **Run (per log)** | The repo's `docs/verification.md` records that the output was seen by Claude Code in that project |
| **User-reported** | The project owner ran it and reported the result; recorded in the log |
| **Not done** | The log says it was not done, or no evidence exists |

I ran **no** RyuStoreFront tests myself. Every test result below comes from its `docs/verification.md`, which is self-reported documentation, not independent verification.

## 1. Purpose and user problem

A deployable online shoe store whose purpose is to demonstrate the hard parts of e-commerce: payments, inventory correctness, order lifecycle, asynchronous processing and cloud operation (`CLAUDE.md` section 1). It is explicitly a portfolio project. `CLAUDE.md` itself says it is "a plan, not a record", so **verification.md, not CLAUDE.md, is the source of truth for what exists.**

Do not claim: real customers, real payments, production traffic, revenue. Stripe runs in test mode only.

## 2. Architecture and technology choices

| Item | Status | Source |
| --- | --- | --- |
| Java 25, Spring Boot 4.1.2, Maven wrapper | Code-verified | `pom.xml` |
| Modular monolith: modules `auth`, `cart`, `catalog`, `checkout`, `inventory`, `notifications`, `orders`, `outbox`, `payments`, `worker`, `shared` | Code-verified | `src/main/java/link/ryustorefront/storefront/` |
| Module boundaries enforced by a test (Spring Modulith `ApplicationModules.verify()`) | Code-verified (test exists); outcome in full-suite runs | `ModularityTests.java` |
| PostgreSQL, Flyway migrations V1 to V10 | Code-verified | `src/main/resources/db/migration/` |
| One jar, two profiles (`api`, `worker`), same image | Code-verified (Docker run of worker profile user-reported) | `docs/decisions.md` #3; verification row 2026-11-15 "same image runs the worker" |
| Server-side sessions (Spring Session JDBC), CSRF tokens, BCrypt | Documented in decisions; V6 migration exists | `docs/decisions.md` slice 3b |
| Stripe hosted Checkout, `stripe-java` 34.1.0, behind a `PaymentGateway` interface | Documented; real Stripe call proven only by manual run (see section 5) | `docs/decisions.md` slice 4a |
| Frontend: Next.js 16.4.6, React 19.3.1, Tailwind 4.3.5, TypeScript 7.0.2 (exact pins) | Code-verified | `web/package.json` |
| Browser calls `/api/*` on the Next origin; Next proxies to the API (first-party cookies, no CORS) | Documented | `docs/decisions.md` Phase 5 slice 1 |
| Terraform on AWS: VPC, 2 public subnets, ALB (2 listeners), ECS cluster/service/task (Fargate, 512 CPU units = 0.5 vCPU, 1024 MB, X86_64), RDS Postgres (`db.t4g.micro`), ECR, ACM, Route 53, Secrets Manager, CloudWatch log group, IAM roles | Code-verified | `infra/foundation/*.tf`, `infra/session/*.tf` |
| Two Terraform stages: persistent `foundation` (zone, ECR, certificate, secret shells) and destroyable per-session stage | Code-verified | `docs/decisions.md` Phase 4b |
| Tasks in public subnets with no NAT gateway; security groups are the only barrier | Documented | `docs/decisions.md` Phase 4b per-session |

**The frontend is NOT deployed to AWS** (only the API was). No ECS/Terraform resource for Next.js exists in `infra/`. `Code-verified`.
**The worker was NOT deployed to AWS** in the verified cloud run (`desired` API only; see section 8).

## 3. Implemented features (with honest status)

| Feature | Backend | Tests / evidence | Notes |
| --- | --- | --- | --- |
| Catalogue: search, filters, sort, pagination, categories | Implemented | `CatalogApiTests`; user-reported 71 tests green on 2026-11-14 | Postgres full-text search |
| Cart (guest and signed-in), merge on sign-in | Implemented | `CartApiTests`, `SecureCartCookieTests` | Guest cart token stored only as SHA-256 hash |
| Auth: register, login, logout, CSRF | Implemented | `AuthApiTests` | **Not done:** rate limiting, password reset, email verification, session-timeout test |
| Checkout start with stock reservation, idempotency key | Implemented | `CheckoutApiTests`, `CheckoutConcurrencyTests` | |
| No overselling under concurrency | Implemented (atomic `UPDATE ... WHERE stock >= n` + `CHECK (stock >= 0)`) | `StockReservationConcurrencyTests`; user-reported | See metrics, section 6 |
| Order state machine, all 36 status pairs tested | Implemented | `OrderStatusTests`, `OrderTransitionTests`; `docs/order-lifecycle.md` | |
| Transactional outbox + worker (`FOR UPDATE SKIP LOCKED`, backoff, dead after 10 attempts) | Implemented | `OutboxTests`, `OutboxProcessorTests`, `WorkerKillTests`, `ExpirySweepTests` | |
| Order confirmation email (Mailpit locally) via outbox, `sent_emails` ledger | Implemented | `OrderEmailTests`, `OrderConfirmationEmailTests` | No SES/real mail |
| Stripe webhook: signature check on raw bytes, idempotent event table, out-of-order handling, auto-refund when money cannot be honoured | Implemented | `StripeWebhookTests` (19), `StripeWebhookChainTests` (2) | Refunds **not** exercised against real Stripe |
| `GET /api/orders/{id}` (owner only) | Implemented | `PaymentApiTests`; user-reported suite green | |
| Order history list, admin orders/products/refund API | **Not implemented** (proposed only) | `docs/api/proposed-ui-needs.md`; branch name suggests work in progress | Admin screens run on fixtures |
| Next.js UI: home, listing, product, cart, sign in/register, checkout, pay, confirmation, order page | Implemented and wired to API | `web/live/*.spec.ts`; user-reported green | Admin screens and order history are fixture-only designs |
| Signed-in header menu | Implemented | Not screenshotted (mock has no session) | |
| Rate limits, security headers, dependency scan, k6 load test, backup note (Phase 6) | **Planned, not done** | `CLAUDE.md` phase table | |
| Full AWS session with frontend, worker, failure drills (Phase 7) | **Planned, not done** | | |
| SQS, S3/CloudFront product images, SES, OpenTelemetry | **Planned in CLAUDE.md; not built.** Decisions replaced SQS with the Postgres outbox. Product images are typographic placeholders | `docs/decisions.md` | |

## 4. Difficult engineering challenges (candidates for case study)

1. **Money-safe webhook handling.** Stripe retries and reorders events; payment can arrive after the order expired. Design: `INSERT ... ON CONFLICT DO NOTHING` on event id in one transaction, order row lock, payment unique constraints, refund via outbox with a Stripe idempotency key. Evidence: 19 webhook tests including 6 simultaneous duplicates, expired-then-completed, wrong amount/currency, vanished hold. Source: `docs/payments.md`, `docs/decisions.md` slice 4b, `StripeWebhookTests.java`.
2. **Inventory correctness and lock ordering.** Atomic conditional update instead of row locks; one transaction for checkout; fixed lock order (order, reservations, variants) after finding a potential deadlock with a concurrent payment. Evidence: concurrency test, decisions row "Lock order". Source: `docs/decisions.md` Phase 4 slice 1, `StockReservationConcurrencyTests.java`.
3. **At-least-once background processing.** Outbox written in the same transaction as the state change; worker claim/handle/mark in one transaction; SIGKILL test proves a killed worker leaves the event pending and a restart completes it once. Source: `docs/worker.md`, `WorkerKillTests.java`.
4. (Optional) **Search performance on 50,000 products**: index design and a `ts_rank` vs `ts_rank_cd` finding. Source: `docs/explain/README.md`.

## 5. Tests and verification evidence

All "user-reported" or "run" below are from `docs/verification.md`.

| Claim | Status | Detail (preserve when quoting) |
| --- | --- | --- |
| Full backend suite green | User-reported | 2026-11-15T08:35Z: `Tests run: 235, Failures: 0, Errors: 0, Skipped: 0`, 4:14 min. Java 25, Testcontainers Postgres 18, one VM. Later slices (order endpoint) reported green without counts |
| Webhook suite | Run (per log) | 2026-11-14 23:39: `StripeWebhookTests` 19 run, 0 failures; full suite 233 at that time |
| Worker-kill test | User-reported | `WorkerKillTests` 1 test, 58.8 s; two child JVMs; part of 181-test suite at the time |
| Stock concurrency | User-reported | 50 threads, 10 units, exactly 10 reservations, 20 consecutive rounds, one JVM, Postgres 18.7 Testcontainers. **Not** a production-traffic claim |
| Axe accessibility scan | Run (per log) | Playwright 1.65.1 + `@axe-core/playwright` 4.14.0, Chromium only, 119 pages (mock API), 0 violations. Excludes keyboard walkthrough, screen reader, Firefox/WebKit, real devices |
| Lighthouse | **Not done** | |
| Real Stripe (test mode) checkout, local | User-reported | One order, card 4242, `stripe listen`; order `paid`, one `payments` row 36800 USD, one email in Mailpit |
| Real Stripe checkout in AWS | User-reported | 2026-11-15, see section 8 |
| Playwright screens | Run (per log) | 120 PNGs in `design/screens/` of the sibling repo, live-API shots in `design/screens-live/` |

## 6. Performance metrics (with context)

| Number | Context |
| --- | --- |
| Boots-by-price query 227 ms to 20 ms; count 518 ms to 22 ms; deep page 28 ms to 5 ms | 50,000 products / 750,680 variants, warm cache, **single runs**, local Postgres in Docker, before/after the `min_price_minor` change (`docs/explain/README.md`). Not a load test |
| `ts_rank_cd` 410 ms vs `ts_rank` 22 ms | Same dataset; an experiment on the page query |
| Seeding 50,000 products about 197 s | Log `Seeded 50000 products in 196530 ms`, first pre-trigger run, local |
| API start 55.2 s on Fargate 0.5 vCPU / 1 GB vs 22.3 s on dev VM (no CPU limit) | One observation each; cold fresh-database first start in the cloud |
| ECR image about 187 MiB compressed | `describe-images`, single check |
| Counts per listing view: about 25 small queries, 20 to 90 ms each | Dev VM, owner's local API with 49,507 products, **not** measured under load |

**No load test (k6) exists. No latency percentiles, throughput, or cost per session has been measured.** Do not cite any.

## 7. Demo / screenshot evidence

- `/home/joshua/RyuStoreFront/design/screens/` (120 files) and `design/screens-live/`; review gallery `design/REVIEW.md`. Many screens are fixtures or mock-API data, and the review states the owner sign-off covers design on fixtures.
- `screens-live/` holds real-data shots (home, listing, product) from the owner's local API with 49,507 products.
- No demo video. No public URL (infrastructure was destroyed).
- Portfolio use: copy selected PNGs into `public/projects/ryustorefront/` **only after** checking they contain no personal data, and label mock-API vs real-data shots.

## 8. Deployment status

- **Verified (user-reported, 2026-11-15):** one real cloud checkout in AWS us-west-2. API on Fargate (0.5 vCPU, 1 GB) behind an ALB with HTTPS (`/actuator/health` returned `200` with ssl verify result `0`), RDS Postgres 18.6 `db.t4g.micro`, Stripe test mode, 100 seeded products. Stripe delivery log: `checkout.session.completed` HTTP 200 at 04:27:02 UTC. A repeat `pay` returned 409 `order_not_payable`.
- **Not part of that run:** worker (so no email and no cart-clearing in the cloud), frontend, database row inspection, replay/reorder against the cloud endpoint, refunds.
- **Teardown:** `plan -destroy` showed 31 resources; owner applied it; `scripts/aws-audit.sh` 13 direct checks all `ok`; foundation resources (zone, ECR, 2 secrets, certificate) intentionally remain. The `Destroy complete` line was not captured. Session cost **not measured**.
- Currently **nothing is running**. The persistent foundation incurs small ongoing costs (hosted zone, secrets), amounts unmeasured.

## 9. Known limitations (stated by the project)

- Tasks have public IPs; security group is the only barrier (not a private network).
- `sslmode=require` encrypts but does not verify the RDS certificate.
- Read-only root filesystem off for first run; untried.
- Postgres 18.6 on RDS vs 18.7 locally/in tests; app not tested against RDS beyond migrations and one checkout.
- No login rate limiting, password reset, email verification.
- Shopper charged-before-refund window (worker poll interval) in the mismatch case.
- Hold can exceed 30 minutes by about 11 minutes after payment page creation.
- Price filter counts use about 25 queries per view; no facet endpoint.
- UI dark theme only; product images are placeholders; Chromium-only testing.
- Admin and order history are designs on fixtures.

## 10. Next planned improvements

From `CLAUDE.md` and `docs/api/proposed-ui-needs.md`: order history and admin API, remaining Phase 5 wiring and Playwright e2e of the full purchase, Phase 6 hardening (rate limits, security headers, dependency scan, k6 load run, accessibility pass), Phase 7 full AWS session including worker and frontend, real product images. Treat all as **planned**.

## 11. Supporting source paths (all under `/home/joshua/RyuStoreFront`)

`CLAUDE.md`, `docs/decisions.md`, `docs/verification.md`, `docs/payments.md`, `docs/worker.md`, `docs/order-lifecycle.md`, `docs/email.md`, `docs/api/*.md`, `docs/explain/README.md`, `design/REVIEW.md`, `design/BRIEF.md`, `design/README.md`, `pom.xml`, `web/package.json`, `infra/foundation/*.tf`, `infra/session/*.tf`, `scripts/aws-audit.sh`, `src/test/java/link/ryustorefront/storefront/*Tests.java`.

## 12. Unsupported or unresolved claims (do NOT publish as fact)

| Claim from the brief or plan | Finding |
| --- | --- |
| "Terraform on AWS including ECS Fargate, RDS, ALB" | Supported by code and the cloud run. |
| "Real AWS checkout test, followed by teardown and resource audit" | Supported **as user-reported**, with gaps listed in section 8. |
| "Transactional outbox and background worker" | Supported by code and tests, but worker never ran in AWS. |
| "Next.js frontend" | Built and tested locally; not deployed. |
| "Scalable", "high-traffic", "production-ready" | **Unsupported.** No load test. |
| SQS, CloudFront images, SES, Spring Modulith "enforced" in CI | SQS/CloudFront/SES not built. Modulith test exists; I did not confirm it runs in CI. |
| Lighthouse scores | None exist. |
| Per-session AWS cost | Not measured. |
| Test counts newer than 235 | Not recorded. |
| Project-wide independent verification | None. All results are the owner's own records. |
