// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// SITE_URL is the public origin, e.g. https://example.com (no trailing slash needed).
// Unset (the default): no canonical links, no sitemap, and robots.txt has no Sitemap line.
// Set it when you know the final address, for example: SITE_URL=https://xxxx.cloudfront.net scripts/web.sh npm run build
const site = process.env.SITE_URL || undefined;

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Old URLs: RyuCloud was renamed RyuZCloud, and the wildfire case study was removed (2026-11-26).
  // In a static build each redirect is a small HTML page with a meta refresh (no script, so the CSP still holds).
  redirects: {
    '/projects/ryucloud/': '/projects/ryuzcloud/',
    '/projects/wildfire-monitoring/': '/projects/',
  },
  // The HTML resume (/resume/) is the source of public/resume.pdf. It is noindex and kept out of the sitemap.
  integrations: site ? [sitemap({ filter: (page) => !page.endsWith('/resume/') })] : [],
  vite: {
    plugins: [tailwindcss()],
    // Never inline scripts into the HTML, so a strict Content-Security-Policy (script-src 'self') works.
    build: { assetsInlineLimit: 0 },
  },
});
