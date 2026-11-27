// Single source of truth for every result quoted on the site.
// Home cards, project index and case studies all read from here, so a number cannot drift.
// Every fact keeps its setup, date and status. Every number comes from a row marked Run or User-reported in the
// project's own metrics ledger, snapshotted in content/evidence/RyuZCloud-metrics-2026-11-26.md and
// content/evidence/RyuStoreFront-metrics-2026-11-26.md. The row IDs are given in brackets in each context.
// Status vocabulary (see docs/verification.md):
//   run            executed and the output was seen (as recorded in the project's own ledger)
//   user-reported  the owner ran it and recorded the result; raw output not always kept
//   documented     a project document states it; not used for numbers
//   not-run        no evidence exists, so no claim is made

export type Status = 'run' | 'user-reported' | 'documented' | 'not-run';

export const statusLabel: Record<Status, string> = {
  run: 'Run',
  'user-reported': 'User-reported',
  documented: 'Documented',
  'not-run': 'Not run',
};

export interface Fact {
  short: string;   // one line for cards
  claim: string;   // the full statement
  context: string; // setup, dataset, hardware, denominator, and where it was measured
  status: Status;
  date: string;
}

const f = (x: Fact) => x;

export const facts = {
  // ---------------- RyuStoreFront ----------------
  ssfWebhookDupes: f({
    short: 'Six simultaneous duplicate Stripe webhooks leave one paid order (test suite).',
    claim: 'The same Stripe event delivered 3 times in a row, and 6 times at the same moment, leaves 1 paid order, 1 payment row, 1 order.paid event and 1 confirmation-email record.',
    context: 'Local: one JVM, Postgres 18.7 in Testcontainers, signatures from an independent HMAC-SHA256 (StripeWebhookTests, 19 tests) [B2].',
    status: 'run',
    date: '2026-11-14',
  }),
  ssfWebhookOrder: f({
    short: 'Out-of-order events handled: expired then completed is refunded once.',
    claim: 'Expired-then-completed is refunded once and the order stays cancelled. Completed-then-expired stays paid.',
    context: 'Local: same test class and run as the duplicate test, with a fake payment gateway. Refunds were not exercised against real Stripe [B2].',
    status: 'run',
    date: '2026-11-14',
  }),
  ssfStockRace: f({
    short: '50 concurrent buyers, 10 units in stock, exactly 10 reservations in each of 20 rounds.',
    claim: '50 threads each reserving 1 unit against 10 in stock produced exactly 10 reservations and 0 stock left, in each of 20 consecutive rounds. At checkout level, 20 buyers for 5 units produced exactly 5 orders in each of 3 rounds.',
    context: 'Local: one JVM, threads released by a latch, connection pool of 60, Postgres 18.7 in Testcontainers on one VM. Not a traffic claim [B3, B4].',
    status: 'user-reported',
    date: '2026-11-14',
  }),
  ssfWorkerKill: f({
    short: 'A worker killed mid-job leaves the event pending; a restarted worker finishes it exactly once.',
    claim: 'A separate worker JVM killed with SIGKILL mid-job: its writes vanish, the event stays pending with 0 attempts, and a restarted worker completes it exactly once. Separately, 4 competing workers handled 60 events, each exactly once.',
    context: 'Local: two child JVMs against the test database, test time 51.8 s (WorkerKillTests); OutboxProcessorTests with a 5 ms handler, not a throughput claim [B5, B7].',
    status: 'user-reported',
    date: '2026-11-14',
  }),
  ssfStateMachine: f({
    short: 'All 36 order status pairs are tested against one transition table.',
    claim: 'All 36 status pairs (6 statuses × 6) are tested. 10 concurrent identical transitions apply once, and a payment racing a cancellation has one winner in each of 20 rounds.',
    context: 'Local: unit table plus the real service and Postgres (OrderStatusTests, OrderTransitionTests) [B6].',
    status: 'user-reported',
    date: '2026-11-14',
  }),
  ssfSuite: f({
    short: '245 backend tests, 0 failures.',
    claim: 'Full backend suite: 245 tests, 0 failures, 0 errors, 0 skipped, in 28 classes.',
    context: 'Local: dev VM, Java 25, Postgres 18.7 and Mailpit in Testcontainers, 6 min 32 s [B1c].',
    status: 'run',
    date: '2026-11-20',
  }),
  ssfExplain: f({
    short: 'At 50,000 products, a count query went from 518 ms to 22 ms after an index change.',
    claim: 'At 50,000 products and 750,680 variants, after adding a maintained minimum price per product: count 518 ms to 22 ms, category sorted by price 227 ms to 20 ms, deep page 28 ms to 5.1 ms.',
    context: 'Local Postgres 18.7 in Docker, warm cache, single runs of EXPLAIN (the ledger marks them for re-measurement). Not a load test [D1, D2, D3].',
    status: 'user-reported',
    date: '2026-11-14',
  }),
  ssfAxe: f({
    short: 'Accessibility scan: 119 pages, 0 violations (Chromium only).',
    claim: 'After the redesign, an axe scan (WCAG 2.0/2.1 A and AA rules) found 0 violations on 119 pages at 1440 and 390 px. The quality gates passed 19 of 19, including 12 routes at 320 px with 0 px sideways overflow.',
    context: 'Local: mock API, production build, Playwright 1.65.1 with @axe-core/playwright 4.14.0, Chromium only. Axe covers only the automatable share of WCAG [F10, F9c].',
    status: 'run',
    date: '2026-11-20',
  }),
  ssfPhotos: f({
    short: '142 products with 188 licensed photos; served AVIF a median 12.7 % of the original’s bytes.',
    claim: 'The demo catalogue has 142 products, 1,113 variants and 188 licensed photos. The 960 px AVIF a card loads is a median 12.7 % of its original’s bytes (mean 32.6 KB against a 270.7 KB mean original).',
    context: 'Local: Compose Postgres and SeaweedFS; sharp 0.35.5, AVIF q50. Bytes on disk, not transferred [D6b, F5].',
    status: 'user-reported',
    date: '2026-11-20',
  }),
  ssfLighthouse: f({
    short: 'Lighthouse accessibility 100 on all four measured pages; fonts cut from 138 KB to 52 KB.',
    claim: 'After the redesign, Lighthouse accessibility was 100 on home, listing, product and sign-in. Switching to subset fonts cut font bytes from 138.0 KB to 51.8 KB (home on mobile: 345.7 KB to 260.6 KB). Real photos made the mobile listing’s largest paint slower; loading the first two cards eagerly brought it from 4,459 ms to 2,702 ms, still later than with placeholders.',
    context: 'Local: production build on the dev VM, Lighthouse 13.6.0 with simulated slow 4G and 4× CPU, medians of 3 or 5 runs. Modelled, not field data [F3b, F8, F11b].',
    status: 'run',
    date: '2026-11-21',
  }),
  ssfCloudCheckout: f({
    short: 'API, worker and frontend on AWS: one real test-mode purchase paid by Stripe’s webhook.',
    claim: 'A Terraform session stage of 44 resources ran the API, the worker and the frontend on AWS. One real purchase in Stripe test mode was paid through the webhook, and the worker processed the order.paid event. An unsigned webhook call was rejected.',
    context: 'AWS us-west-2: Fargate (API 0.5 vCPU / 1 GB), ALB over HTTPS, RDS Postgres, Stripe test mode, card 4242. The shop’s order history page is still a design fixture [C11, C14].',
    status: 'user-reported',
    date: '2026-11-23',
  }),
  ssfCloudChecks: f({
    short: '19 of 19 browser checks passed against the deployed shop, twice.',
    claim: 'The live browser checks passed 19 of 19 against the deployed shop, in two runs (1.8 and 1.7 min). An earlier run had 1 failure, a test race that was fixed in the test.',
    context: 'AWS: Playwright 1.65.1, Chromium, real DNS, TLS, ALB host routing and CloudFront photos [C13].',
    status: 'user-reported',
    date: '2026-11-23',
  }),
  ssfOutboxRetry: f({
    short: 'On AWS, the outbox retried a failing email send 6 times, then delivered it.',
    claim: 'The confirmation email failed 6 times against the SES sandbox (gaps growing from about 5 s to about 80 s), then sent once the recipient was verified.',
    context: 'AWS: worker on Fargate, SES sandbox. That the recipient was verified in between is assumed, not confirmed. Not the same as the worker-kill test [C15].',
    status: 'user-reported',
    date: '2026-11-23',
  }),
  ssfTeardown: f({
    short: 'Each AWS session was destroyed and an audit found nothing left.',
    claim: 'The first session ended with a 31-resource destroy plan and an empty state afterwards, then a 13-check audit came back all ok. The second session’s 44 resources were destroyed in two runs, followed by a clean audit.',
    context: 'AWS: Terraform 1.17.2. The first “Destroy complete” line was not captured; the second destroy was split by expired credentials. Session cost was not measured [C2, C3, C11].',
    status: 'user-reported',
    date: '2026-11-23',
  }),
  ssfStartup: f({
    short: 'API cold start on 0.5 vCPU Fargate: 50.4 to 59.4 s (single runs).',
    claim: 'The API started in 55.2 s on a fresh database (including migrations and seeding), and in 50.4, 58.8 and 59.4 s in the second session. The worker took 121.9 s.',
    context: 'AWS: Fargate 0.5 vCPU / 1 GB, x86_64. Separate single runs, not averages [C4, C12].',
    status: 'user-reported',
    date: '2026-11-23',
  }),
  ssfNotRun: f({
    short: 'No load test, latency percentile or measured cloud cost exists.',
    claim: 'No API latency or throughput under load, no webhook replay against the cloud endpoint, no real per-session cost and no rebuild-from-zero time exist yet.',
    context: 'Listed as Not run in the project’s ledger [P2, C8, C9, C10].',
    status: 'not-run',
    date: '2026-11-26',
  }),

  // ---------------- RyuZCloud ----------------
  rzCrash: f({
    short: 'Worker killed mid-encode; a second attempt finished the job (43 of 43 checks).',
    claim: 'The worker was SIGKILLed mid-encode; its lease expired and the job finished on attempt 2. The crash script passed 43 checks (35 baseline plus 8 recovery). In an earlier run the kill came at about 2 % of the encode.',
    context: 'Local: Docker Compose on the Ubuntu VM (4 vCPU), synthetic 10 s clip, lease 120 s. Recovery time was not measured [R2, R3].',
    status: 'run',
    date: '2026-11-10',
  }),
  rzE2e: f({
    short: 'End-to-end scripts: 23 upload checks and 35 processing checks passed.',
    claim: 'The upload script passed 23 checks and the processing script (upload, queue, worker, HLS) 35.',
    context: 'Local: Docker Compose on the Ubuntu VM, browser-equivalent upload to MinIO [R1, R4].',
    status: 'run',
    date: '2026-11-10',
  }),
  rzTests: f({
    short: 'Go: 9 of 9 packages pass; frontend: 116 of 116 tests pass.',
    claim: 'All 9 Go test packages pass against a real Postgres 17, the real-FFmpeg transcode tests pass in 11.9 s, and the frontend passes 116 of 116 tests.',
    context: 'Local: Go 1.26.10 image and Postgres 17 container (2026-11-10); Vitest in the container (2026-11-24) [T1, T3, T4].',
    status: 'run',
    date: '2026-11-24',
  }),
  rzVulns: f({
    short: 'Reachable Go vulnerabilities went from 13 to 0; secret scan clean.',
    claim: 'govulncheck reported 13 reachable vulnerabilities, then 0 after upgrading Go (1.25.14 to 1.26.10), pgx and x/text. gitleaks found 0 leaks across 15 commits.',
    context: 'Local: govulncheck v1.1.4, gitleaks 8.21.2 [S1, S2].',
    status: 'run',
    date: '2026-11-10',
  }),
  rzSeed: f({
    short: '40 clips seeded through the real upload path: 40 ready, 0 failed, 0 retried.',
    claim: 'A 40-clip library (971 s of footage) went through the real upload path: 40 ready, 0 failed, every job on its first attempt. Its 430.6 MB of originals became 288.5 MB of HLS in two renditions.',
    context: 'Local: Docker Compose on the VM, worker concurrency 1, 2 CPUs, 360p and 720p renditions. Clips from Pixabay and Wikimedia Commons [L1, L2].',
    status: 'run',
    date: '2026-11-24',
  }),
  rzTranscode: f({
    short: 'Transcode took a median 0.768× the clip’s length (n = 40, local VM).',
    claim: 'Worker job time divided by clip length had a median of 0.768× (range 0.321 to 2.789×) over 40 clips of 8 to 60 s, covering download, probe, both renditions, thumbnail and upload.',
    context: 'Local VM, worker 2 CPUs, FFmpeg 2 threads. One seed, so the spread is across clips, not repeated runs. Not measured on Fargate [P1].',
    status: 'run',
    date: '2026-11-24',
  }),
  rzA11y: f({
    short: '0 WCAG A/AA axe violations on 9 pages at 2 widths; Lighthouse accessibility 100.',
    claim: 'On the real local stack, 8 of 8 browser tests passed: 9 pages at 390 and 1440 px with 0 WCAG 2.1 A/AA violations, 0 px sideways overflow at 320 px, and the player usable by keyboard alone. Lighthouse accessibility was 100 on every measured page.',
    context: 'Local: Compose stack, Playwright 1.65, Chromium; Lighthouse 13.6.0 on production builds [T6, P4].',
    status: 'run',
    date: '2026-11-26',
  }),
  rzPerf: f({
    short: 'Two layout-shift fixes worked; a player change made first frame slower and was reverted.',
    claim: 'Layout shift went from 0.668 to 0 on the desktop credits page and from 0.17 to 0 on the mobile watch page. Switching Chrome to hls.js made time to first frame slower (653 ms to 976 ms unthrottled, medians, n = 12) and pages heavier, so it was reverted; the revert is not yet re-measured.',
    context: 'Local: production builds on the VM, seeded library, Lighthouse 13.6.0 and Playwright Chromium. Timings are local, with no CDN [P4b, P4db, P3b].',
    status: 'run',
    date: '2026-11-26',
  }),
  rzBug: f({
    short: 'A CloudFront signed-cookie bug that only appeared on AWS, fixed with a regression test.',
    claim: 'On AWS, playback returned 403 because the cookie policy’s resource ended in %2A instead of *: the URL builder percent-encoded the wildcard. The fix builds the resource string directly, and a regression test asserting the literal wildcard passes.',
    context: 'Found in the 2026-11-14 AWS session; the regression test passed locally on 2026-11-23 [T5].',
    status: 'run',
    date: '2026-11-23',
  }),
  rzPrivate: f({
    short: 'Media is private: 403 without signed cookies on CloudFront and S3, 200 with them.',
    claim: 'Unsigned media requests got 403 from CloudFront and from S3 directly; with signed cookies they got 200.',
    context: 'AWS us-west-2, curl checks [S3].',
    status: 'run',
    date: '2026-11-14',
  }),
  rzCloud: f({
    short: 'AWS session: 115-resource plan, 2 uploads transcoded, 19 of 20 alarms OK.',
    claim: 'Terraform planned 115 resources from an empty state. Two uploads (10 s and 6 s HEVC) were each transcoded to 360p and 720p on Fargate, logged at 33 s and 16 s. 20 CloudWatch alarms were defined and 19 of 20 were OK at the first check. The teardown destroyed 94 resources.',
    context: 'AWS us-west-2. 94 does not match the 115 planned, and the ledger leaves that unexplained. Worker task size was not confirmed; n = 2, not a benchmark [C1, C2, C3, C4].',
    status: 'user-reported',
    date: '2026-11-14',
  }),
  rzNotRun: f({
    short: 'No load test, recovery time, Fargate transcode speed or real cost exists yet.',
    claim: 'Not measured yet: concurrent uploads, recovery time after a worker kill, duplicate outputs after recovery, transcode speed on Fargate, time from apply to first played video, and real cost from Cost Explorer.',
    context: 'Listed as Not run in the project’s ledger. A list-price cost estimate exists there but is not repeated here [R5, R6, R7, C5, C6, P1b].',
    status: 'not-run',
    date: '2026-11-26',
  }),
} satisfies Record<string, Fact>;

export type FactId = keyof typeof facts;
