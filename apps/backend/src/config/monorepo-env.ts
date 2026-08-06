import { config as loadEnv } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

/** Monorepo root (`buu-get/`) — stable จาก `src/config` และ `dist/config` */
export const MONOREPO_ROOT = resolve(__dirname, '../../../..');

const MONOREPO_ENV_FILES = ['.env', '.env.local'] as const;

/** Absolute paths ของไฟล์ env ที่ monorepo root (เฉพาะที่มีอยู่จริง) */
export function getMonorepoEnvFilePaths(): string[] {
  if (process.env.NODE_ENV === 'test') {
    const testEnv = resolve(MONOREPO_ROOT, '.env.test');
    if (existsSync(testEnv)) {
      return [testEnv];
    }
  }

  return MONOREPO_ENV_FILES.map((fileName) =>
    resolve(MONOREPO_ROOT, fileName),
  ).filter((filePath) => existsSync(filePath));
}

/**
 * โหลด env จาก monorepo root — ไฟล์หลัง override ไฟล์ก่อน
 * เมื่อ NODE_ENV=test ใช้เฉพาะ `.env.test` (ไม่ผสมกับ `.env` ของ dev)
 */
export function loadMonorepoEnv(): void {
  for (const envPath of getMonorepoEnvFilePaths()) {
    loadEnv({ path: envPath, override: true });
  }
}
