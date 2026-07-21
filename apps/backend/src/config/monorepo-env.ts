import { config as loadEnv } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

/** Monorepo root (`buu-get/`) — stable จาก `src/config` และ `dist/config` */
export const MONOREPO_ROOT = resolve(__dirname, '../../../..');

const MONOREPO_ENV_FILES = ['.env', '.env.local'] as const;

/** Absolute paths ของไฟล์ env ที่ monorepo root (เฉพาะที่มีอยู่จริง) */
export function getMonorepoEnvFilePaths(): string[] {
  return MONOREPO_ENV_FILES.map((fileName) =>
    resolve(MONOREPO_ROOT, fileName),
  ).filter((filePath) => existsSync(filePath));
}

/** โหลด `.env` / `.env.local` จาก monorepo root — ไฟล์หลัง override ไฟล์ก่อน */
export function loadMonorepoEnv(): void {
  for (const envPath of getMonorepoEnvFilePaths()) {
    loadEnv({ path: envPath, override: true });
  }
}
