import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const root = resolve(__dirname);
const envTestPath = resolve(root, '.env.test');
if (existsSync(envTestPath)) {
  loadEnv({ path: envTestPath, override: true });
}

const apiBaseURL =
  process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3000';
const webBaseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:9000';

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  globalSetup: resolve(root, 'tests/global-setup.ts'),
  globalTeardown: resolve(root, 'tests/global-teardown.ts'),
  projects: [
    {
      name: 'integration',
      testDir: './tests/integration',
      use: {
        baseURL: apiBaseURL,
        extraHTTPHeaders: {
          Accept: 'application/json',
        },
      },
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      testIgnore: ['**/fixtures/**', '**/pages/**'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: webBaseURL,
        trace: 'on-first-retry',
      },
    },
  ],
  // Start Quasar only for browser e2e (not API integration / CI).
  ...(!process.env.CI &&
  process.env.SKIP_WEB_SERVER !== '1' &&
  !process.argv.some(
    (arg, i, arr) =>
      arg === '--project=integration' ||
      (arg === '--project' && arr[i + 1] === 'integration'),
  )
    ? {
        webServer: {
          command: 'npm run dev:frontend',
          url: webBaseURL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      }
    : {}),
});
