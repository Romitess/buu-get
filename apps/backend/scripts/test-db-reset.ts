/**
 * Prepare DB for Playwright integration/e2e:
 *   migrations → (optional truncate) → RBAC seed (upsert)
 *
 * Default is safe for a shared/dev database: NO truncate, only idempotent seed.
 * Set ALLOW_DB_TRUNCATE=1 to wipe all tables (except migrations) before seeding.
 *
 * Usage (from monorepo root): npm run test:db:reset
 * Loads `.env.test` if present, otherwise falls back to `.env` / `.env.local`.
 */
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MONOREPO_ROOT = resolve(__dirname, '../../..');
const envTestPath = resolve(MONOREPO_ROOT, '.env.test');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

if (existsSync(envTestPath)) {
  // Existing process env (CI / CLI) wins over file
  loadEnv({ path: envTestPath, override: false });
} else {
  loadEnv({ path: resolve(MONOREPO_ROOT, '.env'), override: false });
  loadEnv({ path: resolve(MONOREPO_ROOT, '.env.local'), override: false });
}

async function truncateAllTables(
  dataSource: import('typeorm').DataSource,
): Promise<void> {
  const dbName = process.env.DB_NAME as string;
  const rows: Array<{ TABLE_NAME: string }> = await dataSource.query(
    `SELECT TABLE_NAME AS TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ?
       AND TABLE_TYPE = 'BASE TABLE'
       AND TABLE_NAME NOT IN ('migrations', 'typeorm_metadata')`,
    [dbName],
  );

  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const row of rows) {
      const table = row.TABLE_NAME;
      await dataSource.query(`TRUNCATE TABLE \`${table}\``);
    }
  } finally {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  console.log(`✓ truncated ${rows.length} tables in ${dbName}`);
}

async function main(): Promise<void> {
  const dbName = process.env.DB_NAME ?? '(empty)';
  const allowTruncate = process.env.ALLOW_DB_TRUNCATE === '1';

  const { default: AppDataSource } = await import('../src/database/data-source');
  const { seedTestRbac } =
    await import('../src/database/seeds/test-rbac-seed');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    console.log(`→ running migrations on ${dbName} …`);
    await AppDataSource.runMigrations();
    console.log('✓ migrations applied');

    if (allowTruncate) {
      console.warn(
        `⚠ ALLOW_DB_TRUNCATE=1 — truncating all tables in "${dbName}"`,
      );
      await truncateAllTables(AppDataSource);
    } else {
      console.log(
        '→ skip truncate (shared DB mode). Set ALLOW_DB_TRUNCATE=1 to wipe.',
      );
    }

    await seedTestRbac(false);
    console.log(
      allowTruncate
        ? '✓ test DB reset complete (truncated + seed)'
        : '✓ test DB prepare complete (seed-only, no truncate)',
    );
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
