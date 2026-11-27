# Unified content plan

Status: **Proposed**, 2026-11-17. Built from two evidence files in `content/evidence/`:
`RyuStoreFront-EVIDENCE.md` (read from the repo by me) and `RyuCloudInfo.md` (exported from another VM).

> **Superseded 2026-11-26:** the portfolio now covers two projects only, RyuZCloud (formerly RyuCloud) and RyuStoreFront, and their numbers come from each project's `docs/metrics.md` (snapshots in `content/evidence/*-metrics-2026-11-26.md`). See `docs/decisions.md`.

Rule for all copy: if a sentence is not backed by a row below, it does not go on the site.

## 1. What the evidence supports, side by side

| | RyuStoreFront | RyuCloud |
| --- | --- | --- |
| Type | Solo software project | Solo software project |
| Languages / stack | Java 25, Spring Boot 4.1.2, Postgres, Next.js 16 | Go, Postgres 17, Next.js 15, FFmpeg, Redis/SQS |
| Core difficulty | Money and stock stay correct under retries and races | Background jobs stay correct under crashes, duplicates, retries |
| Automated tests (counted in source) | 28 test classes; 235 tests reported green | 232 Go `Test*` functions; frontend 106 reported (grep finds 79) |
| Failure/crash tests | Worker SIGKILL test; 50-thread stock race; 6 simultaneous duplicate webhooks | 43-check crash E2E; about 33 worker failure-path tests |
| Cloud | AWS: one real checkout, then destroy and audit (user-reported) | AWS: one full session, then destroy of 94 resources and audit (owner-reported, **no raw output kept**) |
| Deployed now | No | No |
| Visual assets | 120 screenshots (mock and real-API data) | **None** |
| Public repo | Not confirmed | Remote exists, "described as public"; not confirmed |
| Measured performance | Query timings on 50,000 products, single runs | Almost none; "no performance measurements" |
| Biggest honesty caveats | Cloud run had no worker or frontend; Phase 6/7 not done | Cloud evidence unrecorded; docs partly stale; 115 planned vs 94 destroyed not reconciled |

### Shared threads (what makes this a portfolio, not two unrelated projects)

1. **Correctness under failure with a test that proves it**: StoreFront (outbox, webhook idempotency, stock race) and RyuCloud (leases, ack-after-commit, sweeper) solve the same class of problem two ways. Both use PostgreSQL as the source of truth and treat the queue as a hint or an at-least-once channel.
2. **Cloud work that is torn down and audited**: both software projects applied Terraform in a real AWS account, then destroyed it and ran a direct-check audit script. Both chose public-subnet tasks with no NAT for cost and say plainly what that costs in isolation.
3. **Evidence discipline**: every project separates run, user-reported, documented and not-run, and each records its own corrections (StoreFront's lock-order change; RyuCloud's DNS delegation claim and the CloudFront wildcard bug). **This is the strongest cross-cutting story and it is true in both.**

### What is not supported (do not write)

- "Production-ready", "scalable", "high-traffic", "real-time at scale", "distributed systems expertise" (no multi-node or load evidence).
- Any cost per session, uptime, latency percentile or throughput for either cloud project.
- Any live demo, public users, clients or revenue.

## 2. Services (ranked by evidence strength)

| # | Service | Evidence | Strength | Honest limit |
| --- | --- | --- | --- | --- |
| 1 | **Backend systems that stay correct under retries and failure**: payment webhooks, inventory holds, state machines, outbox and job-queue workers | StoreFront and RyuCloud independently; crash, race and duplicate tests in both | Strongest: two projects, designed tests, written decisions | Test results are the owner's own records; no load testing; no production traffic |
| 2 | **AWS infrastructure as code with cost-aware deploy and teardown**: Terraform for ECS Fargate, RDS, ALB, S3/CloudFront, SQS, IAM least privilege, plus an audit script | StoreFront (31-resource session stage) and RyuCloud (115-resource plan, 94 destroyed), documented recovery from expired credentials and state corruption | Strong on method; moderate on proof | Each stack ran once; no always-on operation; no measured cost; RyuCloud's raw output is gone |

Full-stack work is shown as a **capability**, not a headline service: both software projects ship Next.js frontends wired to their APIs (StoreFront: token design system, 119 pages with 0 axe violations on a mock API; RyuCloud: 106 reported Vitest tests), but neither frontend is deployed or has a visible demo.

**Positioning line (draft):**
> Software engineer building backends that stay correct under retries and failure, and the AWS infrastructure to run them.

Intro paragraph (draft, about 60 words):
> I design, build and test backend systems where retries, crashes and duplicate messages are the normal case: a payment-webhook and inventory system in Java, a video-processing pipeline in Go, and the Terraform to deploy each to AWS and tear it down again.


## 3. Case-study outlines

Common template (brief section 5): problem; what I built; architecture; hardest challenges; evidence; tradeoffs and limitations; what I would improve next; links. Each case study opens with a **status line** that is true today, and an **Evidence** block that labels every result *run*, *user-reported* or *not done*.

### 3.1 RyuStoreFront (`/projects/ryustorefront`)

- **Status line:** "Backend and storefront built and tested locally; one real cloud checkout run in AWS test mode on 2026-11-15, then destroyed. Order history and admin API in progress. Not running now."
- **Problem:** e-commerce fails at money and stock under retries, races and abandoned checkouts. Build a small shoe store whose hard parts are verified.
- **Built:** modular monolith (11 packages, Modulith boundary test), Postgres with 10 migrations, Stripe Checkout (test mode), idempotent webhook, atomic stock reservation, 6-state order machine, outbox plus worker, Next.js UI, Terraform for a per-session AWS stage.
- **Architecture figure:** (new, drawn) request path and the outbox/worker path; checkout sequence with the webhook; Terraform stages (foundation kept, session destroyed).
- **Challenges (3):**
  1. Money-safe webhooks: event-id insert, order row lock, payments constraints, refund via outbox with idempotency key. Evidence: 19 webhook tests including 6 simultaneous duplicates and expired-then-completed ordering.
  2. Oversell prevention and lock ordering: conditional `UPDATE` plus `CHECK (stock >= 0)`; fixed lock order after finding a possible deadlock with a concurrent payment. Evidence: 50 threads, 10 units, exactly 10 reservations, 20 consecutive rounds (single JVM, Testcontainers).
  3. Surviving a killed worker: outbox claimed with `SKIP LOCKED`, kill test. Evidence: `WorkerKillTests`.
- **Evidence block:** 235 tests, 0 failures on 2026-11-15 (user-reported, Testcontainers Postgres 18, one VM); axe 0 violations on 119 mock-API pages (Chromium only); cloud checkout (user-reported, details and gaps stated); audit clean (user-reported). Query timings at 50,000 products with their single-run caveat.
- **Limits to state:** cloud run had no worker or frontend; no load test, Lighthouse or cost data; no login rate limiting; public-subnet tasks; Chromium only; images are placeholders.
- **Next:** Phase 6 hardening and k6, Phase 7 full session with worker and frontend, real photos. (All labelled planned.)
- **Links:** repository link only after the owner confirms it is public.
- **Gaps before writing:** none blocking. Needs owner confirmation of the order-history/admin status on the day of publishing.

### 3.2 RyuCloud (`/projects/ryucloud`)

- **Status line:** "Locally complete; deployed to AWS once on 2026-11-14 (owner-reported), then destroyed. Not production-ready. No live demo."
- **Problem:** keep large video bytes out of the API and keep job state correct when workers crash and messages repeat.
- **Built:** Go API plus separate Go worker; direct-to-S3 presigned uploads; FFmpeg HLS 360p/720p; Postgres lease-based job claims; Next.js with hls.js; CloudFront signed cookies; Terraform stack; CI with 5 jobs.
- **Architecture figure:** redraw the supplied Mermaid flow as an inline SVG, plus the job state machine from `docs/processing.md` (needs source: owner to confirm the diagram is current; the doc's own sequence diagram is stale).
- **Challenges (3):**
  1. Correct background pipeline: claim by conditional `UPDATE`, lease and heartbeat, sweeper, ack only after commit, idempotent outputs. Evidence: about 33 worker tests; crash E2E "passed (43 checks)" (35 baseline plus 8 recovery), worker killed at about 2 percent progress, second attempt completed.
  2. The CloudFront signed-cookie bug a unit test could not see: policy resource encoded `*` as `%2A`, so CloudFront returned 403 for media while a signed thumbnail returned 200. Fix and a regression test. **This is the best story in the portfolio**: it is specific, checkable in code (`cloudfront.go`, `0dda14b`) and shows why cloud testing matters.
  3. Deploying within 15-minute credentials: `ExpiredToken` failures, `errored.tfstate`, lock release, `state push`, untaint of a healthy database, staged apply and destroy, plus a DNS delegation claim the owner later corrected.
- **Evidence block:** two groups with different trust levels: (a) 2026-11-10 local re-verification run in a Claude Code session with output seen (Go tests 9 packages ok, frontend 106/106, E2E 23/35/43 checks, govulncheck 13 to 0 reachable, gitleaks clean); (b) 2026-11-14 cloud session, **owner-reported, no raw output or screenshots kept** (plan 115, final apply 22 added, destroy 94, unsigned media 403, one 582,800-byte segment fetched).
- **Limits to state:** no performance, cost or load numbers; deploy workflow never run; failure drills, restore test and cookie-expiry test not done; HEVC test clips only (n=2 jobs: 33 s and 16 s, task size not recorded, not a benchmark).
- **Next:** failure drills, capture evidence during the next session, repeat deploy with logs and cost data, multipart uploads, RDS certificate verification.
- **Do not use:** the 115/94 pair side by side unexplained; either say "115 planned, 94 destroyed (not reconciled in the repo)" or omit.
- **Gaps before writing:** screenshots (none exist), repository public status, owner decision on mentioning the registered domain and redacting zone IDs.

## 4. Visual assets: what exists, what is missing

Nothing below is a placeholder image. A missing asset is shown as a gap on the page only if the owner agrees; otherwise the page uses diagrams.

| Project | Asset | Exists? | Source / action | Owner needed? |
| --- | --- | --- | --- | --- |
| StoreFront | 6 to 8 UI screenshots (home, listing, product, cart, checkout, confirmation, order page; desktop and phone) | Yes, 120 PNGs | I copy selected files read-only from `RyuStoreFront/design/screens` (mock data) and `screens-live` (real data); label which is which; check for personal data | No (approve selection) |
| StoreFront | Architecture and order state machine diagrams | No | I draw as inline SVG from `docs/order-lifecycle.md`, `docs/worker.md` | No |
| StoreFront | Cloud checkout proof (Stripe delivery log, health check) | **No** | Nothing was captured; only user-reported text. Do not fake. A future session could capture it | Yes, if wanted |
| RyuCloud | Any screenshot (studio dashboard, watch page, network tab, worker log, Swagger) | **No** | Owner runs the local Compose stack and captures; list in `RyuCloudInfo.md` section 8 | **Yes** |
| RyuCloud | Architecture diagram, job state machine, bug before/after (resource string) | Draft only (Mermaid) | I redraw as inline SVG; the bug is shown as a two-line code comparison, not an image | Confirm state machine is current |
| RyuCloud | Any AWS evidence image | **No, none kept** | Cannot be recovered; stated plainly on the page | No |
| All | Portrait or personal photo | Unknown | Only if the owner supplies one; none is invented | Yes, optional |

## 5. Homepage layout

Single column on mobile; 12-column grid on desktop. Sections in order:

1. **Header**: wordmark (name text, supplied by owner) and five links: Projects, Services, About, Contact, plus the skip link. Mobile: native `<details>` menu.
2. **Hero (editorial)**: small tagline left, large serif headline right (the positioning line), 60-word intro, two calls to action: "See the projects" and "Contact". The resume link appears here **only after the PDF is supplied**. No photo, no gradient, a thin copper rule as the only ornament.
3. **Services (numbered)**: each with one sentence, the evidence behind it (named projects) and its honest limit in small type. Not cards: a ruled list.
4. **Projects (prominent cards)**: equal weight, stacked on mobile, side by side on wide desktop. Each card: type label, name, one-line problem, a one-line status stating exactly what is true ("Deployed once, then destroyed"), three evidence items, and a link. Pointer spotlight hover (our own 20 lines) with a visible focus style that matches.
5. **How I verify**: a short band explaining the status vocabulary (Run, User-reported, Documented, Not run) with one real example from each project. This is the section a generic portfolio cannot copy.
6. **Selected capabilities**: two plain columns (Backend and data, Cloud and delivery, Frontend and tooling), each item tagged with the project where it was exercised. No bars, no percentages, no logo wall.
7. **Closing call to action**: contact (email only once supplied), resume (once supplied), external links the owner chooses.
8. **Footer**: copyright, links, a one-line note that this is a personal portfolio with no clients listed.

**Home evidence-backed numbers allowed** (each with context in the site's copy): the number of projects; the AWS stacks; crash and race tests named in the case studies. Avoid counting statistics on the home page; keep them in case studies where context fits.

## 6. Build order for the case studies (for Phases 3 to 5)

1. RyuStoreFront first (screenshots and evidence are the most complete).
2. RyuCloud second (needs the owner's local screenshots; diagrams and the bug story carry it until then). Until assets arrive, its Evidence block uses text and code only, and a clearly labelled "no screenshots exist" note is **not** shown to visitors; the section simply omits images.

## 7. Open decisions for the owner

1. **Repository links.** StoreFront and RyuCloud: confirm public and which URLs to show.
2. **RyuCloud public details.** Mention the registered domain? Redact zone and account IDs in anything quoted? (I will not quote them.)
3. **RyuCloud screenshots.** Run the local stack and capture the studio page, watch page and worker log if you want images on that page.
4. **Still pending from before:** resume PDF, public contact links, display name for the wordmark.
