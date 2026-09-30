import {
  AUDIT_DENYLIST_NORMALIZED,
  normalizeAuditKey,
} from 'src/modules/audit-logs/constants/audit.constants';

export function parseClientBrowser(userAgent?: string | null): string {
  if (!userAgent) {
    return 'Other';
  }
  const ua = userAgent;

  if (/MSIE/i.test(ua) && !/Opera/i.test(ua)) {
    return 'Internet Explorer';
  }
  if (/Firefox/i.test(ua)) {
    return 'Mozilla Firefox';
  }
  if (/Chrome/i.test(ua)) {
    return 'Google Chrome';
  }
  if (/Safari/i.test(ua)) {
    return 'Apple Safari';
  }
  if (/Opera/i.test(ua)) {
    return 'Opera';
  }
  if (/Netscape/i.test(ua)) {
    return 'Netscape';
  }
  return 'Other';
}

export function parseClientEquipment(userAgent?: string | null): string {
  if (!userAgent) {
    return 'Desktop';
  }
  const ua = userAgent.toLowerCase();

  const isTablet =
    /(tablet|ipad|playbook)|(android(?!.*(mobi|opera mini)))/i.test(ua);
  if (isTablet) {
    return 'Tablet';
  }

  const isMobile =
    /(up.browser|up.link|mmp|symbian|smartphone|midp|wap|phone|android|iemobile)/i.test(
      ua,
    );
  if (isMobile) {
    return 'Mobile';
  }

  return 'Desktop';
}

/** Strip IPv4-mapped IPv6 and map loopback ::1 → 127.0.0.1. */
export function normalizeClientIp(raw?: string | null): string | null {
  if (raw == null) {
    return null;
  }
  let ip = raw.trim();
  if (ip.length === 0) {
    return null;
  }
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice('::ffff:'.length);
  }
  if (ip === '::1') {
    ip = '127.0.0.1';
  }
  return ip.slice(0, 45);
}

type HeaderMap = Record<string, unknown> | undefined | null;

function headerString(headers: HeaderMap, name: string): string {
  if (!headers) {
    return '';
  }
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (raw == null || raw === '') {
    return '';
  }
  const value = Array.isArray(raw)
    ? String(raw[0])
    : typeof raw === 'string'
      ? raw
      : '';
  try {
    return decodeURIComponent(value.trim());
  } catch {
    return value.trim();
  }
}

/**
 * Resolve client IP: x-forwarded-for → x-real-ip → requestIp → socketIp.
 */
export function resolveClientIp(input: {
  headers?: HeaderMap;
  requestIp?: string | null;
  socketIp?: string | null;
}): string | null {
  const headers = input.headers;
  const forwarded = headerString(headers, 'x-forwarded-for');
  if (forwarded.length > 0) {
    return normalizeClientIp(forwarded.split(',')[0]);
  }
  const realIp = headerString(headers, 'x-real-ip');
  if (realIp.length > 0) {
    return normalizeClientIp(realIp);
  }
  return normalizeClientIp(input.requestIp ?? input.socketIp ?? null);
}

export function decodeGraylogHeader(headers: HeaderMap, name: string): string {
  return headerString(headers, name);
}

/**
 * Menu labels from SPA headers when present; otherwise empty strings.
 */
export function menuContextFromHeaders(headers: HeaderMap): {
  menuPath: string;
  menu: string;
  subMenu: string;
} {
  const menuPath = decodeGraylogHeader(headers, 'x-current-menu-path');
  const menuLabel = decodeGraylogHeader(headers, 'x-current-menu-label');
  const submenuLabel = decodeGraylogHeader(headers, 'x-current-submenu-label');
  return {
    menuPath,
    menu: menuLabel || menuPath,
    subMenu: submenuLabel,
  };
}

/**
 * Prefer SPA page URL (referer / x-page-url); fall back to API URL.
 */
export function resolvePageUrl(input: {
  headers?: HeaderMap;
  protocol?: string;
  host?: string;
  apiUrl?: string;
}): string {
  const headers = input.headers;
  const explicit =
    decodeGraylogHeader(headers, 'x-page-url') ||
    decodeGraylogHeader(headers, 'x-path');
  const referer =
    decodeGraylogHeader(headers, 'referer') ||
    decodeGraylogHeader(headers, 'referrer');
  const menuPath = decodeGraylogHeader(headers, 'x-current-menu-path');
  const originHeader = decodeGraylogHeader(headers, 'origin');

  for (const candidate of [explicit, referer].filter(Boolean)) {
    if (/^https?:\/\//i.test(candidate)) {
      try {
        const parsed = new URL(candidate);
        if ((parsed.pathname === '/' || parsed.pathname === '') && menuPath) {
          const origin = parsed.origin.replace(/\/$/, '');
          const path = menuPath.startsWith('/') ? menuPath : `/${menuPath}`;
          return `${origin}${path}`;
        }
        if (parsed.pathname !== '/' && parsed.pathname !== '') {
          return candidate;
        }
      } catch {
        // ignore invalid URL
      }
      continue;
    }
    if (candidate.startsWith('/')) {
      const origin =
        originHeader && /^https?:\/\//i.test(originHeader)
          ? originHeader.replace(/\/$/, '')
          : '';
      return origin ? `${origin}${candidate}` : candidate;
    }
  }

  if (menuPath) {
    const origin =
      originHeader && /^https?:\/\//i.test(originHeader)
        ? originHeader.replace(/\/$/, '')
        : '';
    if (origin) {
      const path = menuPath.startsWith('/') ? menuPath : `/${menuPath}`;
      return `${origin}${path}`;
    }
    return menuPath.startsWith('/') ? menuPath : `/${menuPath}`;
  }

  const apiUrl = input.apiUrl || '';
  return `${input.protocol || 'http'}://${input.host || 'localhost'}${apiUrl}`;
}

/**
 * Derive menu / sub_menu from `/api/{menu}/{sub…}` when SPA headers are absent.
 */
export function menuFromApiPath(path: string): {
  menu: string;
  subMenu: string;
} {
  const parts = path.split('/').filter((part) => part.length > 0);
  const start = parts[0] === 'api' ? 1 : 0;
  const menu = parts[start] ?? 'api';
  const rest = parts.slice(start + 1);
  return {
    menu,
    subMenu: rest.length > 0 ? rest.join('/') : '',
  };
}

/**
 * Extract full incoming HTTP request URL from request context and headers.
 */
export function extractFullRequestUrl(input: {
  headers?: HeaderMap;
  protocol?: string;
  host?: string;
  originalUrl?: string;
}): string {
  const headers = input.headers;
  const fwdProto = decodeGraylogHeader(headers, 'x-forwarded-proto');
  const proto = fwdProto
    ? fwdProto.split(',')[0].trim()
    : input.protocol || 'http';
  const fwdHost = decodeGraylogHeader(headers, 'x-forwarded-host');
  const host = fwdHost
    ? fwdHost.split(',')[0].trim()
    : decodeGraylogHeader(headers, 'host') || input.host || 'localhost';
  const originalUrl = input.originalUrl || '';
  return `${proto}://${host}${originalUrl}`;
}

/**
 * Extract parameters as JSON array string e.g. '["12"]'.
 * Checks route params first, then non-denylisted query values.
 */
export function extractRequestParameter(input: {
  params?: Record<string, unknown> | null;
  query?: Record<string, unknown> | null;
}): string {
  if (input.params && typeof input.params === 'object') {
    const paramValues = Object.values(input.params).filter(
      (v) => v !== undefined && v !== null && v !== '',
    );
    if (paramValues.length > 0) {
      return JSON.stringify(paramValues.map(String));
    }
  }
  if (input.query && typeof input.query === 'object') {
    const queryEntries = Object.entries(input.query).filter(([key, val]) => {
      if (val === undefined || val === null || val === '') {
        return false;
      }
      const norm = normalizeAuditKey(key);
      return !AUDIT_DENYLIST_NORMALIZED.has(norm);
    });
    if (queryEntries.length > 0) {
      return JSON.stringify(queryEntries.map(([, val]) => String(val)));
    }
  }
  return '[]';
}

/**
 * Sanitize request body before sending to Graylog (masks secrets and limits large buffers).
 */
export function sanitizeAccessData(value: unknown, depth = 0): unknown {
  if (depth > 6) {
    return '[MaxDepth]';
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAccessData(item, depth + 1));
  }
  if (value !== null && typeof value === 'object') {
    if (Buffer.isBuffer(value)) {
      return `[Buffer ${value.length} bytes]`;
    }
    const valObj = value as Record<string, unknown>;
    if (
      typeof valObj.buffer !== 'undefined' &&
      typeof valObj.mimetype === 'string'
    ) {
      const fileName =
        typeof valObj.originalname === 'string' ? valObj.originalname : '';
      return `[File ${fileName} ${valObj.mimetype}]`;
    }
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(valObj)) {
      const norm = normalizeAuditKey(key);
      if (AUDIT_DENYLIST_NORMALIZED.has(norm)) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = sanitizeAccessData(nested, depth + 1);
      }
    }
    return result;
  }
  return value;
}

/**
 * Serialize request body to JSON string with denylist masking and max size cap.
 */
export function extractAccessData(
  body: unknown,
  maxBytes = 4096,
): string | undefined {
  if (body == null) {
    return undefined;
  }
  if (typeof body === 'object' && Object.keys(body).length === 0) {
    return undefined;
  }
  try {
    const sanitized = sanitizeAccessData(body);
    const json = JSON.stringify(sanitized);
    if (json.length > maxBytes) {
      return `${json.slice(0, maxBytes - 3)}...`;
    }
    return json;
  } catch {
    return undefined;
  }
}
