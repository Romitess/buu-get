import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * Playwright globalSetup — prepare DB (migrations + RBAC upsert; no truncate by default).
 * Set SKIP_TEST_DB_RESET=1 to skip (e.g. login-page smoke without MySQL).
 */
async function globalSetup(): Promise<void> {
  if (process.env.SKIP_TEST_DB_RESET === '1') {
    console.log('[global-setup] SKIP_TEST_DB_RESET=1 — skipping test DB reset');
    return;
  }

  const root = resolve(__dirname, '..');
  console.log('[global-setup] Running test:db:reset …');
  execSync('npm run test:db:reset', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' },
  });
}

export default globalSetup;
