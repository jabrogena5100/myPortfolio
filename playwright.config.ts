import { defineConfig } from '@playwright/test';

// Chromium only (recorded as a limitation in docs/verification.md).
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4321' },
  webServer: {
    command: 'npx astro preview --port 4321 --host 127.0.0.1',
    url: 'http://127.0.0.1:4321/',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
