const UNRESOLVABLE_BACKEND_HOSTS = [
  'buu-get-back-dev.buu.ac.th',
  'buu-get-back.buu.ac.th',
] as const;

const DEFAULT_PRODUCTION_API_BASE = '/api';

function isUnresolvableBackendHost(url: string): boolean {
  try {
    if (url.startsWith('/')) {
      return false;
    }
    const hostname = new URL(url).hostname;
    return UNRESOLVABLE_BACKEND_HOSTS.some((host) => hostname === host);
  } catch {
    return false;
  }
}

/** prod: /api + override host ที่ไม่มี DNS | dev: ใช้ค่าจาก .env ตามที่ส่งมา */
export function resolveApiBaseUrl(options: {
  dev: boolean;
  fromEnv?: string | undefined;
}): string | undefined {
  const fromEnv = options.fromEnv?.trim();

  if (options.dev) {
    return fromEnv || undefined;
  }

  if (!fromEnv || isUnresolvableBackendHost(fromEnv)) {
    return DEFAULT_PRODUCTION_API_BASE;
  }

  return fromEnv;
}

export { DEFAULT_PRODUCTION_API_BASE };
