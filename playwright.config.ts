import { defineConfig } from '@playwright/test';

// Set E2E_BASE_URL to run the same checks against a deployed site (no local server is started).
const external = process.env.E2E_BASE_URL;

// Chromium only (recorded as a limitation in docs/verification.md).
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  reporter: [['list']],
  use: { baseURL: external || 'http://127.0.0.1:4321' },
  webServer: external
    ? undefined
    : {
        command: 'npx astro preview --port 4321 --host 127.0.0.1',
        url: 'http://127.0.0.1:4321/',
        reuseExistingServer: false,
        timeout: 60_000,
      },
});
