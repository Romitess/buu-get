/**
 * Playwright globalTeardown — placeholder for suite cleanup.
 * Per-test cleanup should live in fixtures; DB reset runs again on next globalSetup.
 */
async function globalTeardown(): Promise<void> {
  // Intentionally empty for Phase 0 — suites own their data cleanup.
}

export default globalTeardown;
