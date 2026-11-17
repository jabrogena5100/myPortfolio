// All site copy that states a fact lives here, next to its evidence source.
// Rule: if a sentence is not backed by content/evidence/* it does not go here.

export const site = {
  name: 'Joshua Abrogena',
  role: 'Independent Software Engineer',
  since: 'November 2026 to present', // owner's preferred description, not proof of client work
  positioning:
    'I build backends that stay correct under retries and failure, and the AWS infrastructure to run them.',
  intro:
    'Payment webhooks, inventory holds, background job workers: the parts of a system where duplicates, crashes and races are the normal case. I build them in Java and Go, test the failure paths, and deploy them to AWS with Terraform and tear them down again. I also studied how to evaluate a smoke-detection model without fooling myself.',
};

export const nav = [
  { href: '/projects/', label: 'Projects' },
  { href: '/services/', label: 'Services' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];

// Evidence: docs/content-plan.md section 2.
export const services = [
  {
    n: '01',
    title: 'Backend systems that stay correct under retries and failure',
    body: 'Payment webhooks, stock reservations, order state machines, outbox and job-queue workers, with tests that kill workers and replay events.',
    proof: 'Shown in RyuStoreFront and RyuCloud.',
    limit: 'Test results are my own records. No load testing and no production traffic.',
  },
  {
    n: '02',
    title: 'AWS infrastructure as code, deployed and torn down',
    body: 'Terraform for ECS Fargate, RDS, load balancing, S3 with CloudFront, queues and least-privilege IAM, plus an audit script that checks nothing billable is left behind.',
    proof: 'Applied and destroyed once each for RyuStoreFront and RyuCloud.',
    limit: 'Each stack ran for one session. No always-on operation and no measured cost.',
  },
  {
    n: '03',
    title: 'Experiment design and audit for computer-vision models',
    body: 'One evaluation path for every model and dataset, leakage audits, hash-pinned artifacts, and conclusions that say no more than the data does.',
    proof: 'Shown in the wildfire monitoring capstone.',
    limit: 'Academic simulation. Not a production machine-learning system.',
  },
];

// Status lines: docs/content-plan.md section 3. Each states what is true today.
export const projects = [
  {
    slug: 'ryustorefront',
    kind: 'Backend and payments',
    name: 'RyuStoreFront',
    problem: 'A shoe store built around the parts of e-commerce that fail: money and stock under retries and races.',
    status: 'Built and tested locally. One real AWS checkout in test mode, then destroyed. Not running now.',
    stack: 'Java 25, Spring Boot, PostgreSQL, Next.js, Terraform',
    evidence: [
      'Six simultaneous duplicate Stripe webhooks leave one paid order (test suite).',
      '50 concurrent buyers, 10 units in stock, exactly 10 reservations (single-JVM test).',
      'One real checkout on AWS in Stripe test mode, destroyed and audited (user-reported).',
    ],
  },
  {
    slug: 'ryucloud',
    kind: 'Cloud video pipeline',
    name: 'RyuCloud',
    problem: 'A video platform where uploads skip the API and a worker transcodes to streaming video, surviving crashes and duplicates.',
    status: 'Locally complete. Deployed to AWS once and destroyed. Not production-ready. Currently down.',
    stack: 'Go, PostgreSQL, FFmpeg, Next.js, Terraform',
    evidence: [
      'Worker killed mid-encode; a second attempt finished the job (43-check crash test).',
      'A CloudFront signed-cookie bug that only appeared on AWS, found and fixed with a regression test.',
      'One AWS session, 94 resources destroyed (owner-reported; no raw output kept).',
    ],
  },
  {
    slug: 'wildfire-monitoring',
    kind: 'Research capstone',
    name: 'Wildfire monitoring',
    problem: 'Does training a smoke detector on synthetic or real imagery change how a simulated UAV monitors a fire?',
    status: 'University research (ECE 496). Simulation and public datasets. Results are descriptive.',
    stack: 'Python, YOLOv8, ArduPilot SITL, PyTorch',
    evidence: [
      'An audit found a leaky train/test split; a clip-disjoint split was built and models retrained.',
      'Three seeds per model, every metric through one code path.',
      'In 56 simulated runs, neither detector reached the ignition cell sooner than a plain patrol, on average.',
    ],
  },
];

export const verifyTerms = [
  {
    term: 'Run',
    body: 'Executed and the output was seen.',
    example: 'RyuStoreFront accessibility scan: 119 pages, 0 violations, Chromium only.',
  },
  {
    term: 'User-reported',
    body: 'I ran it and recorded the result; the raw output was not stored.',
    example: 'RyuCloud AWS session, 2026-11-14: stack destroyed, audit clean.',
  },
  {
    term: 'Not run',
    body: 'No evidence exists, so no claim is made.',
    example: 'Load tests. None of the three projects has one.',
  },
];

export const capabilities = [
  { group: 'Backend and data', items: [
    ['Java, Spring Boot, JPA and plain SQL', 'RyuStoreFront'],
    ['Go services with net/http and pgx', 'RyuCloud'],
    ['PostgreSQL: constraints, locking, full-text search, query plans', 'RyuStoreFront, RyuCloud'],
    ['Idempotency, outbox, leases and retries', 'RyuStoreFront, RyuCloud'],
  ]},
  { group: 'Cloud and delivery', items: [
    ['Terraform: ECS Fargate, RDS, ALB, S3, CloudFront, SQS', 'RyuStoreFront, RyuCloud'],
    ['Deploy, destroy and audit routines', 'RyuStoreFront, RyuCloud'],
    ['GitHub Actions CI, secret scanning, vulnerability checks', 'RyuCloud'],
  ]},
  { group: 'Frontend and quality', items: [
    ['Next.js and TypeScript against a real API', 'RyuStoreFront, RyuCloud'],
    ['Playwright and axe accessibility checks', 'RyuStoreFront'],
    ['Testcontainers integration tests', 'RyuStoreFront'],
  ]},
  { group: 'Machine-learning evaluation', items: [
    ['YOLOv8 training and one-path evaluation', 'Wildfire monitoring'],
    ['Leakage audits, seed variance, clustered bootstrap', 'Wildfire monitoring'],
    ['ArduPilot SITL integration', 'Wildfire monitoring'],
  ]},
] as const;
