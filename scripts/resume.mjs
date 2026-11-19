// Renders the HTML resume (/resume/) to public/resume.pdf with the pinned Chromium, in print mode.
// Run through scripts/resume.sh (inside the Playwright image). It builds nothing and sends nothing anywhere.
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const PORT = 4323;
const BASE = `http://127.0.0.1:${PORT}`;
const server = spawn('npx', ['astro', 'preview', '--port', String(PORT), '--host', '127.0.0.1'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/resume/')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 500)); }

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${BASE}/resume/`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: 'public/resume.pdf', format: 'Letter', printBackground: true, preferCSSPageSize: true });
await browser.close();
server.kill();
console.log('wrote public/resume.pdf');
