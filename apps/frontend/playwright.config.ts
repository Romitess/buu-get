import { loadMonorepoEnv } from './config/monorepo-env';
import { defineConfig, devices } from '@playwright/test';

loadMonorepoEnv();

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:9000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(process.env.CI
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:9000',
          reuseExistingServer: true,
          timeout: 120_000,
        },
      }),
});
