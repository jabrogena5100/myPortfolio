// This site's own verification results, shown on the home page. Same rules as facts.ts:
// every line has a status, a date and its setup. UPDATE THESE when you rerun the checks
// (docs/verification.md is the full record; design/lighthouse/summary-deployed.json holds the live Lighthouse data).
import type { Status } from './facts';

export interface Check { label: string; result: string; context: string; status: Status; date: string }

export const siteChecks: Check[] = [
  { label: 'Browser tests', result: '118 passing on the live site', context: 'Playwright, Chromium only, run by the owner against https://joshuaabrogena.dev (1 test skipped: it applies only to a build without a site address); the same suite passes locally (119 tests), plus 7 unit tests for the CDN routing function', status: 'user-reported', date: '2026-11-19' },
  { label: 'Accessibility (axe)', result: '0 violations', context: 'every page at 320, 390, 820 and 1440 px, plus forced colors', status: 'run', date: '2026-11-17' },
  { label: 'Lighthouse', result: '73-100 / 100 / 100 / 100', context: 'performance, accessibility, best practices, SEO, run from a slow VM against the CloudFront address, before the custom domain was added; not yet rerun on the new address. Largest paint 0.9 to 1.1 s on mobile, no layout shift; total blocking time, and so the performance score, varies widely between runs', status: 'run', date: '2026-11-18' },
  { label: 'Content-Security-Policy', result: 'enforced', context: 'CloudFront sends script-src \'self\' with no inline scripts or styles; the browser suite ran against it and the policy blocked injected styles', status: 'run', date: '2026-11-18' },
  { label: 'Deployed site', result: 'live at joshuaabrogena.dev', context: 'S3 and CloudFront from Terraform, with an AWS certificate for the custom domain; DNS stays at Cloudflare. Headers, TLS and the certificate checked from outside on the new address', status: 'user-reported', date: '2026-11-19' },
];
