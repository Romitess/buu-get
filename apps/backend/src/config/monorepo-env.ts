import { config as loadEnv } from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';

const MONOREPO_ENV_FILES = ['.env', '.env.local'] as const;

function hasEnvFile(dir: string): boolean {
  return MONOREPO_ENV_FILES.some((fileName) =>
    existsSync(resolve(dir, fileName)),
  );
}

function isMonorepoRoot(dir: string): boolean {
  const packageJsonPath = resolve(dir, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      workspaces?: unknown;
    };
    return packageJson.workspaces != null;
  } catch {
    return false;
  }
}

/**
 * Resolve monorepo root from any emit layout (`dist/config`, `dist/src/config`, `src/config`).
 * Prefer a package.json with `workspaces`; fall back to a directory that has `.env` / `.env.local`.
 */
function resolveMonorepoRoot(startDir: string): string {
  let current = startDir;
  let envFallback: string | undefined;

  for (;;) {
    if (isMonorepoRoot(current)) {
      return current;
    }
    if (envFallback === undefined && hasEnvFile(current)) {
      envFallback = current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return envFallback ?? resolve(startDir, '../../../..');
    }
    current = parent;
  }
}

/** Monorepo root (`buu-get/`) — stable จาก `src/config`, `dist/config`, และ `dist/src/config` */
export const MONOREPO_ROOT = resolveMonorepoRoot(__dirname);

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
