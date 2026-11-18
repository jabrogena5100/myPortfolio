// This site's own verification results, shown on the home page. Same rules as facts.ts:
// every line has a status, a date and its setup. UPDATE THESE when you rerun the checks
// (docs/verification.md is the full record; design/lighthouse/summary-deployed.json holds the live Lighthouse data).
import type { Status } from './facts';

export interface Check { label: string; result: string; context: string; status: Status; date: string }

export const siteChecks: Check[] = [
  { label: 'Browser tests', result: '94 passing on the live site', context: 'Playwright, Chromium only, against the CloudFront address; the same suite passes locally (111 tests), plus 7 unit tests for the CDN routing function', status: 'run', date: '2026-11-18' },
  { label: 'Accessibility (axe)', result: '0 violations', context: 'every page at 320, 390, 820 and 1440 px, plus forced colors', status: 'run', date: '2026-11-17' },
  { label: 'Lighthouse', result: '73-100 / 100 / 100 / 100', context: 'performance, accessibility, best practices, SEO, run against this live site from a slow VM. Largest paint 0.9 to 1.1 s on mobile, no layout shift; total blocking time, and so the performance score, varies widely between runs', status: 'run', date: '2026-11-18' },
  { label: 'Content-Security-Policy', result: 'enforced', context: 'CloudFront sends script-src \'self\' with no inline scripts or styles; the browser suite ran against it and the policy blocked injected styles', status: 'run', date: '2026-11-18' },
  { label: 'Deployed site', result: 'live on CloudFront', context: 'S3 and CloudFront from Terraform, applied once (11 resources). Headers, compression, redirects and the 404 page checked on the live address. Default address, no custom domain yet', status: 'user-reported', date: '2026-11-18' },
];
