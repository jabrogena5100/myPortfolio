// This site's own verification results, shown on the home page. Same rules as facts.ts:
// every line has a status, a date and its setup. UPDATE THESE when you rerun the checks
// (docs/verification.md is the full record; design/lighthouse/summary.json holds the Lighthouse data).
import type { Status } from './facts';

export interface Check { label: string; result: string; context: string; status: Status; date: string }

export const siteChecks: Check[] = [
  { label: 'Browser tests', result: '109 passing', context: 'Playwright, Chromium only, every page at 3 widths, plus 7 unit tests for the CDN routing function', status: 'run', date: '2026-11-17' },
  { label: 'Accessibility (axe)', result: '0 violations', context: 'every page at 320, 390, 820 and 1440 px, plus forced colors', status: 'run', date: '2026-11-17' },
  { label: 'Lighthouse', result: '90-100 / 100 / 100 / 100', context: 'performance (mobile 90 to 100, desktop 100), accessibility, best practices, SEO. Local preview, simulated slow 4G, no CDN; mobile varies run to run', status: 'run', date: '2026-11-17' },
  { label: 'Content-Security-Policy', result: '0 violations', context: 'the site runs under script-src \'self\' with no inline scripts or styles', status: 'run', date: '2026-11-17' },
  { label: 'Deployed site', result: 'not deployed', context: 'Terraform is validated, never planned or applied', status: 'not-run', date: '2026-11-17' },
];
