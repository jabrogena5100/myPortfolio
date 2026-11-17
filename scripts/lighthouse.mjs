// Runs Lighthouse (mobile and desktop presets) against the production build served by `astro preview`.
// Run through scripts/lighthouse.sh (inside the pinned Playwright image). Writes design/lighthouse/summary.json.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { launch } from 'chrome-launcher';
import { chromium } from '@playwright/test';

const PORT = 4322;
const BASE = `http://127.0.0.1:${PORT}`;
const PAGES = ['/', '/projects/', '/projects/ryustorefront/', '/projects/ryucloud/', '/projects/wildfire-monitoring/', '/services/', '/about/', '/contact/'];
const REPEAT_HOME = 3; // home page mobile is repeated to show run-to-run variance
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

const server = spawn('npx', ['astro', 'preview', '--port', String(PORT), '--host', '127.0.0.1'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 500)); }

const chrome = await launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] });
const results = [];
let env = {};

async function run(path, preset, repeat) {
  const flags = { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: CATEGORIES };
  const r = await lighthouse(BASE + path, flags, preset === 'desktop' ? desktopConfig : undefined);
  const lhr = r.lhr;
  env = { lighthouse: lhr.lighthouseVersion, userAgent: lhr.environment.hostUserAgent, throttling: lhr.configSettings.throttlingMethod, formFactor: lhr.configSettings.formFactor };
  const a = lhr.audits;
  const failing = Object.values(a)
    .filter((x) => x.score !== null && x.score < 1 && !['notApplicable', 'manual', 'informative'].includes(x.scoreDisplayMode))
    .map((x) => `${x.id}=${x.score}`);
  results.push({
    path, preset, repeat,
    scores: Object.fromEntries(CATEGORIES.map((c) => [c, Math.round((lhr.categories[c].score ?? 0) * 100)])),
    metrics: {
      fcp_ms: Math.round(a['first-contentful-paint'].numericValue),
      lcp_ms: Math.round(a['largest-contentful-paint'].numericValue),
      tbt_ms: Math.round(a['total-blocking-time'].numericValue),
      cls: Number(a['cumulative-layout-shift'].numericValue.toFixed(3)),
      speed_index_ms: Math.round(a['speed-index'].numericValue),
      transfer_bytes: Math.round(a['total-byte-weight'].numericValue),
    },
    failing,
  });
  console.log(preset.padEnd(8), path.padEnd(34), JSON.stringify(results.at(-1).scores), `LCP ${results.at(-1).metrics.lcp_ms}ms`);
}

for (const preset of ['mobile', 'desktop']) {
  for (const path of PAGES) await run(path, preset, 1);
}
for (let i = 2; i <= REPEAT_HOME; i++) await run('/', 'mobile', i);

await chrome.kill();
server.kill();
mkdirSync('design/lighthouse', { recursive: true });
writeFileSync(process.env.LH_OUT || 'design/lighthouse/summary.json', JSON.stringify({
  date: new Date().toISOString().slice(0, 10),
  ...env,
  note: 'Local run against `astro preview` (no CDN, no HTTP compression). Mobile preset uses simulated slow-4G and 4x CPU slowdown; desktop preset uses the desktop config. Chromium only. One run per page and preset, except the home page on mobile (3 runs).',
  results,
}, null, 2));
