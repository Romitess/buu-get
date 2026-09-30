import { createPublicKey, verify, type JsonWebKey } from 'crypto';

export interface ThaidIdTokenClaims {
  pid: string;
  sub?: string;
  name?: string;
  nameEn?: string;
  birthdate?: string;
  title?: string;
  titleEn?: string;
}

interface RsaJwk {
  kty?: string;
  kid?: string;
  n?: string;
  e?: string;
  alg?: string;
  use?: string;
}

export class ThaidTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ThaidTokenError';
  }
}

function decodeBase64UrlJson(segment: string): Record<string, unknown> {
  const json = Buffer.from(segment, 'base64url').toString('utf8');
  const parsed: unknown = JSON.parse(json);
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ThaidTokenError('jwt segment is not an object');
  }
  return parsed as Record<string, unknown>;
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function audienceMatches(
  payload: Record<string, unknown>,
  clientId: string,
): boolean {
  const aud = payload.aud;
  if (typeof aud === 'string') {
    return aud === clientId;
  }
  if (Array.isArray(aud)) {
    return aud.some((item) => item === clientId);
  }
  return false;
}

/**
 * ตรวจ RS256 id_token กับ JWK ในชุดเดียวกัน แล้วอ่าน claims ที่ BUU GET ใช้
 * ไม่ยิงเครือข่าย
 */
export function verifyThaidIdToken(
  idToken: string,
  keys: RsaJwk[],
  expected: { issuer: string; clientId: string; nowSeconds?: number },
): ThaidIdTokenClaims {
  const parts = idToken.split('.');
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    throw new ThaidTokenError('id_token shape');
  }
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeBase64UrlJson(encodedHeader);
  if (header.alg !== 'RS256') {
    throw new ThaidTokenError('unsupported alg');
  }
  const kid = readString(header, 'kid');
  const jwk = keys.find((key) => key.kty === 'RSA' && key.kid === kid);
  if (!jwk?.n || !jwk.e) {
    throw new ThaidTokenError('jwks key');
  }

  const publicKey = createPublicKey({
    key: jwk as JsonWebKey,
    format: 'jwk',
  });
  const signature = Buffer.from(encodedSignature, 'base64url');
  const signed = Buffer.from(`${encodedHeader}.${encodedPayload}`);
  const valid = verify('RSA-SHA256', signed, publicKey, signature);
  if (!valid) {
    throw new ThaidTokenError('signature');
  }

  const payload = decodeBase64UrlJson(encodedPayload);
  const issuer = expected.issuer.replace(/\/+$/, '');
  const iss = readString(payload, 'iss')?.replace(/\/+$/, '');
  if (iss !== issuer) {
    throw new ThaidTokenError('issuer');
  }
  if (!audienceMatches(payload, expected.clientId)) {
    throw new ThaidTokenError('audience');
  }
  const exp = payload.exp;
  const now = expected.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (typeof exp !== 'number' || exp <= now) {
    throw new ThaidTokenError('expired');
  }

  const pid = readString(payload, 'pid');
  if (!pid || !/^\d{13}$/.test(pid)) {
    throw new ThaidTokenError('pid');
  }

  return {
    pid,
    sub: readString(payload, 'sub'),
    name: readString(payload, 'name'),
    nameEn: readString(payload, 'name_en'),
    birthdate: readString(payload, 'birthdate'),
    title: readString(payload, 'title'),
    titleEn: readString(payload, 'title_en'),
  };
}

/** แปลงวันเกิด YYYY-MM-DD เป็น Date ตอนเที่ยง UTC เพื่อไม่ให้วันเลื่อนเมื่อเขียนคอลัมน์ DATE */
export function parseThaidBirthdate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}
