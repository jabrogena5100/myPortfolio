// Single source of truth for every result quoted on the site.
// Home cards, project index and case studies all read from here, so a number cannot drift.
// Every fact keeps its setup, date and status. Source files: content/evidence/*.
// Status vocabulary (see docs/verification.md):
//   run            executed and the output was seen (as recorded in the project's own log)
//   user-reported  the owner ran it and recorded the result; raw output not kept
//   documented     a project document states it; I could not re-check it
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
  context: string; // setup, dataset, hardware, denominator
  status: Status;
  date: string;
}

const f = (x: Fact) => x;

export const facts = {
  // ---------------- RyuStoreFront ----------------
  ssfWebhookDupes: f({
    short: 'Six simultaneous duplicate Stripe webhooks leave one paid order (test suite).',
    claim: 'The same Stripe event delivered three times in a row, and six times at the same moment, leaves one paid order, one payment row, one order.paid event and one confirmation-email record.',
    context: 'StripeWebhookTests (19 tests in the class, 0 failures). Java 25, Testcontainers Postgres 18, Mailpit, one VM. Read from the test reports of the run that ended BUILD SUCCESS.',
    status: 'run',
    date: '2026-11-14',
  }),
  ssfWebhookOrder: f({
    short: 'Out-of-order events handled: expired then completed is refunded once and the order stays cancelled.',
    claim: 'Expired-then-completed is refunded once and the order stays cancelled with stock back. Completed-then-expired stays paid. A wrong amount, a wrong currency, or a vanished stock hold each record the payment and refund it once.',
    context: 'Same test class and run as above, using a fake payment gateway. Refunds were not exercised against real Stripe.',
    status: 'run',
    date: '2026-11-14',
  }),
  ssfStockRace: f({
    short: '50 concurrent buyers, 10 units in stock, exactly 10 reservations (single-JVM test).',
    claim: '50 threads each reserving 1 unit against 10 in stock produced exactly 10 reservations and 0 stock left, in each of 20 consecutive rounds.',
    context: 'One JVM, threads released together by a latch, connection pool of 60, Postgres 18.7 in Testcontainers on one VM, a single test run. Not a production-traffic claim.',
    status: 'user-reported',
    date: '2026-11-14',
  }),
  ssfWorkerKill: f({
    short: 'A worker killed mid-job leaves the event pending; a restarted worker finishes it once.',
    claim: 'A separate worker process killed with SIGKILL mid-job: the job’s database writes vanish, the event stays pending with 0 attempts, and a restarted worker completes it exactly once.',
    context: 'WorkerKillTests: 1 test, 58.8 s, two child JVMs started from the test classpath against the test database. It ran inside a 181-test suite at the time.',
    status: 'user-reported',
    date: '2026-11-14',
  }),
  ssfSuite: f({
    short: '235 backend tests, 0 failures.',
    claim: 'Full backend suite: 235 tests run, 0 failures, 0 errors, 0 skipped.',
    context: 'Java 25, Testcontainers Postgres 18, one VM, 4 min 14 s, reported at 2026-11-15T08:35Z. Later runs were reported green without counts.',
    status: 'user-reported',
    date: '2026-11-15',
  }),
  ssfStateMachine: f({
    short: 'Every one of the 36 status pairs is tested against the order transition table.',
    claim: 'The order lifecycle rules live in one table; all 36 status pairs are tested, and a replayed request is a no-op rather than an error.',
    context: 'Stated in the project’s decisions document; the test classes OrderStatusTests and OrderTransitionTests exist in the repository.',
    status: 'documented',
    date: '2026-11-14',
  }),
  ssfAxe: f({
    short: 'Accessibility scan: 119 pages, 0 violations (Chromium only).',
    claim: 'The frontend passes an axe scan (WCAG 2.0/2.1 A and AA rules) on 119 pages at phone and desktop width with 0 violations.',
    context: 'Playwright 1.65.1 with @axe-core/playwright 4.14.0, Chromium only, against a mock API. Axe finds only the automatable share of WCAG; no keyboard-only or screen-reader walkthrough was done.',
    status: 'run',
    date: '2026-11-15',
  }),
  ssfCloudCheckout: f({
    short: 'One real checkout on AWS in Stripe test mode, destroyed and audited (user-reported).',
    claim: 'One real checkout on AWS in Stripe test mode: the order became paid after Stripe’s webhook reached the API on Fargate behind a load balancer over HTTPS. A repeated pay call returned 409 order_not_payable.',
    context: 'API task 0.5 vCPU / 1 GB, RDS Postgres 18.6, 100 seeded products, card 4242, Stripe delivery log showed checkout.session.completed answered HTTP 200 at 04:27:02 UTC. No worker and no frontend were running, so no email or cart clearing happened in the cloud. The database rows were not inspected.',
    status: 'user-reported',
    date: '2026-11-15',
  }),
  ssfTeardown: f({
    short: 'Cloud stage destroyed (31 resources); a 13-check audit found nothing left.',
    claim: 'The per-session stage was destroyed and a 13-check audit script found nothing billable remaining. The zone, container registry, two secrets and the certificate remain by design.',
    context: 'The plan showed 31 to destroy; the owner applied it. The final “Destroy complete” line was not captured. The audit’s tag search listed stale entries that direct checks contradicted. The session cost was not measured.',
    status: 'user-reported',
    date: '2026-11-15',
  }),
  ssfExplain: f({
    short: 'Catalogue queries at 50,000 products: a count went from 518 ms to 22 ms after an index change.',
    claim: 'At 50,000 products and 750,680 variants: boots-by-price 227 ms to 20 ms, count 518 ms to 22 ms, deep page 28 ms to 5 ms, after adding a stored minimum price per product.',
    context: 'Local Postgres in Docker, warm cache, single runs of EXPLAIN. Not a load test.',
    status: 'user-reported',
    date: '2026-11-14',
  }),
  ssfStartup: f({
    short: 'API starts in 55.2 s on 0.5 vCPU Fargate versus 22.3 s on the dev VM.',
    claim: 'The API started in 55.2 s on Fargate (0.5 vCPU, 1 GB) and the same image in 22.3 s on the development VM.',
    context: 'One observation each; the cloud figure is a cold, fresh-database first start including 10 migrations.',
    status: 'user-reported',
    date: '2026-11-15',
  }),
  ssfNotRun: f({
    short: 'No load test, Lighthouse run or cost measurement exists.',
    claim: 'No load test, Lighthouse run, latency percentile, throughput figure or per-session AWS cost exists for this project.',
    context: 'Planned for the hardening phase.',
    status: 'not-run',
    date: '2026-11-17',
  }),

  // ---------------- RyuCloud ----------------
  rcCrash: f({
    short: 'Worker killed mid-encode; a second attempt finished the job (43-check crash test).',
    claim: 'A worker killed at about 2 percent progress lost its lease; a second attempt completed the job (attempts=2). The crash script passed 43 checks (35 baseline plus 8 recovery).',
    context: 'CRASH_TEST=1 scripts/e2e-processing-test.sh against the local Compose stack (Postgres, Redis, MinIO, FFmpeg). Recovery took “several minutes” with a 120 s lease; the exact time was not recorded.',
    status: 'run',
    date: '2026-11-10',
  }),
  rcWorkerTests: f({
    short: 'About 33 worker failure-path tests run against a real PostgreSQL.',
    claim: 'Concurrent claims (exactly one wins), a crashed worker recovered after its lease expires, a worker dying on the last attempt, a stolen lease, acknowledgement only after the result is saved, and a downed queue recovered by the sweeper are each covered by a test.',
    context: 'About 33 test functions in worker_test.go, real PostgreSQL with in-memory storage and queue and a fake FFmpeg. All 9 Go packages passed on that date; counts of test functions are from the source.',
    status: 'run',
    date: '2026-11-10',
  }),
  rcE2e: f({
    short: 'End-to-end scripts passed: 23 upload checks, 35 processing checks, 43 with a crash.',
    claim: 'The upload script passed 23 checks, the processing script 35, and the processing script with a killed worker 43.',
    context: 'Local Compose stack on one Ubuntu VM with Docker 29.9.3.',
    status: 'run',
    date: '2026-11-10',
  }),
  rcVulns: f({
    short: 'Reachable Go vulnerabilities went from 13 to 0 after upgrades; secret scan clean.',
    claim: 'govulncheck reported 13 reachable vulnerabilities, then 0 after upgrading Go (1.26.10), pgx (5.9.2), x/text (0.41.0) and x/sync (0.22.0). gitleaks found no leaks over 15 commits. npm audit found 2 findings (1 high, 1 moderate) that were accepted as build-time only.',
    context: 'govulncheck v1.1.4, gitleaks 8.21.2.',
    status: 'run',
    date: '2026-11-10',
  }),
  rcCloud: f({
    short: 'One AWS session, 94 resources destroyed (owner-reported; no raw output kept).',
    claim: 'One session applied the stack, migrated the database, served the app, processed two uploads, played video back, then destroyed everything. The plan showed 115 resources to add; the final apply (after two expired-credential failures and staged applies) added 22; the destroy removed 94.',
    context: 'The three counts are not reconciled in the repository. No raw output or screenshots were kept. The session’s hours and cost were not recorded.',
    status: 'user-reported',
    date: '2026-11-14',
  }),
  rcBug: f({
    short: 'A CloudFront signed-cookie bug that only appeared on AWS, found and fixed with a regression test.',
    claim: 'Playback returned 403 for the playlist and segments while the signed thumbnail returned 200. The cookie policy’s resource ended in %2A instead of *, because the URL builder percent-encoded the wildcard. The fix builds the resource string directly; a regression test was added.',
    context: 'Found in the first cloud test. The Go test for the fix was written but its result was never reported.',
    status: 'user-reported',
    date: '2026-11-14',
  }),
  rcCfChecks: f({
    short: 'After the fix, signed requests returned 200 and unsigned ones 403.',
    claim: 'With the signed cookies the master playlist returned 200 (application/vnd.apple.mpegurl), a rendition playlist 200, and one segment 200 (582,800 bytes). The same playlist without cookies returned 403, as did unsigned media directly from S3.',
    context: 'Read-only checks on the public test video. Browser playback was reported by the owner (“videos play”). No screenshot or recording exists.',
    status: 'user-reported',
    date: '2026-11-14',
  }),
  rcJobs: f({
    short: 'Two cloud transcode jobs took 33 s and 16 s (n=2, not a benchmark).',
    claim: 'The worker logged two completed jobs for a 10 s and a 6 s HEVC test clip, taking 33 s and 16 s, each producing 2 renditions.',
    context: 'Fargate Spot worker; task size was not recorded in the evidence. Two samples only.',
    status: 'user-reported',
    date: '2026-11-14',
  }),
  rcNotRun: f({
    short: 'No load test, cost figure, failure drill or restore test exists.',
    claim: 'No request latency, throughput, concurrent-upload, transcode-speed or cost figures exist. The CI deploy workflow has never been run. Failure drills on AWS, a database restore test, cookie-expiry behaviour and Safari native playback were not tested.',
    context: 'The project’s own documents say “no performance or scalability measurements have been made”.',
    status: 'not-run',
    date: '2026-11-17',
  }),

  // ---------------- Wildfire monitoring ----------------
  wfSplit: f({
    short: 'An audit found a leaky train/test split; a clip-disjoint split was built and models retrained.',
    claim: 'An independent audit found the original Boreal split was not video-disjoint: 3 clips appeared in both train and test and 2 in both train and validation, through 197 background frames. A clip-disjoint v2 split was built (31 clips; 3,462 train, 748 validation, 744 test frames) and all three real-trained models were retrained. The v1 results were kept, not overwritten.',
    context: 'The auditor was an AI reviewer (Codex), recorded in the project’s audit document. v1 and v2 numbers are not comparable.',
    status: 'documented',
    date: '2026-10',
  }),
  wfOnePath: f({
    short: 'Three seeds per model, every metric through one code path.',
    claim: 'Every (model, test set) result comes through one evaluation code path on frozen, hash-pinned splits; predictions are saved so metrics can be recomputed offline. A recompute of 30 cells on a different machine gave identical detection metrics.',
    context: 'NumPy 2.1.2 versus 2.5.3 gave localisation statistics that differed by at most 4.2e-6 relative.',
    status: 'documented',
    date: '2026-10-29',
  }),
  wfLevel3Headline: f({
    short: 'In 56 simulated runs, neither detector reached the ignition cell sooner than a plain patrol, on average.',
    claim: 'Neither perception arm reached the ignition cell sooner than the plain patrol on average, and both covered less of the grid. The synthetic-trained detector (Model A) was earlier than the real-trained one (Model B) on first detection and first ignition-cell visit in 4 of 4 ignition cells.',
    context: 'ArduPilot SITL, single UAV, 10 by 10 grid of about 160 m cells, 600 s window, 8 held-out scenarios on 4 ignition cells, 7 arms. Capped means: unobserved events count as 600 s, so they are lower bounds. 15 of 56 ignition-cell visits were never observed. No significance claim is possible: with 4 clusters the smallest two-sided p is 0.125.',
    status: 'documented',
    date: '2026-11-09',
  }),
  wfConfound: f({
    short: 'The experiment’s own audits found a fire-timing confound and bounded it instead of hiding it.',
    claim: 'The fire is stepped on the wall clock, so in two-slot parallel execution the realized fire differed between arms (ignition-time ratio against the baseline 1.003 to 1.004 sequential, up to 1.09 parallel). No rerun was authorised, so the confound is documented, not fixed.',
    context: 'Documented in the Level 3 report together with censoring, provenance gaps and 9 post-window records removed from one run.',
    status: 'documented',
    date: '2026-11-13',
  }),
  wfTests: f({
    short: '385 tests reported passing; 390 test functions counted in the source.',
    claim: 'The project’s status log records 385 tests passing in 291 s. The source contains 390 test functions across 30 files, including calculation tests with hand-computed expected answers.',
    context: 'The 385 figure is from the project log, not re-run; the 390 is a count of test functions.',
    status: 'documented',
    date: '2026-11-13',
  }),
  wfRepro: f({
    short: 'The analysis reproduces byte-for-byte from the 56 raw runs; fresh simulation runs do not.',
    claim: 'Re-running the analysis scripts on the 56 recorded runs reproduced the result tables byte-for-byte and the figures pixel-for-pixel. A fresh simulation run of one arm differed from its recorded run (first true detection at 106 s versus 101 s), so fresh runs are not bit-reproducible.',
    context: 'Per the project’s status log. The raw runs (2.8 GB) are not in the repository.',
    status: 'documented',
    date: '2026-11-13',
  }),
  wfNotDone: f({
    short: 'No real flights, no probability map, no multi-UAV validation.',
    claim: 'No real flights were made. The probability-map planner was never built (the file is empty). The four-UAV demo is an architecture demonstration only. The cost-control watchdog for GPU pods never worked, per the owner.',
    context: 'The planner flown is a placeholder that keeps the highest recent confidence per grid cell.',
    status: 'not-run',
    date: '2026-11-17',
  }),
} satisfies Record<string, Fact>;

export type FactId = keyof typeof facts;
