import { generateKeyPairSync, sign, type KeyObject } from 'crypto';
import { ThaidTokenError, verifyThaidIdToken } from './thaid-jwt';

function signToken(
  payload: Record<string, unknown>,
  privateKey: ReturnType<typeof generateKeyPairSync>['privateKey'],
  kid = 'test-key',
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const data = `${header}.${body}`;
  const signature = sign('RSA-SHA256', Buffer.from(data), privateKey).toString(
    'base64url',
  );
  return `${data}.${signature}`;
}

function signEs256Token(
  payload: Record<string, unknown>,
  privateKey: KeyObject,
  kid: string,
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'ES256', kid, typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const data = `${header}.${body}`;
  const signature = sign('sha256', Buffer.from(data), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  }).toString('base64url');
  return `${data}.${signature}`;
}

describe('verifyThaidIdToken', () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const jwk = publicKey.export({ format: 'jwk' });
  const keys = [{ ...jwk, kid: 'test-key' }];
  const now = 1_700_000_000;

  const validPayload = {
    iss: 'https://imauthsbx.bora.dopa.go.th',
    aud: 'client-id',
    exp: now + 60,
    pid: '1234567890123',
    name: 'ทดสอบ ระบบ',
    name_en: 'Test User',
    birthdate: '1990-01-02',
    title: 'นาย',
    title_en: 'Mr.',
  };

  it('accepts a token signed by the matching JWKS key', () => {
    const token = signToken(validPayload, privateKey);
    expect(
      verifyThaidIdToken(token, keys, {
        issuer: 'https://imauthsbx.bora.dopa.go.th',
        clientId: 'client-id',
        nowSeconds: now,
      }),
    ).toEqual({
      pid: '1234567890123',
      sub: undefined,
      name: 'ทดสอบ ระบบ',
      nameEn: 'Test User',
      birthdate: '1990-01-02',
      title: 'นาย',
      titleEn: 'Mr.',
      address: undefined,
    });
  });

  it('turns house_address.raw into address text', () => {
    const token = signToken(
      {
        ...validPayload,
        name: 'นาย ภัทรพล สุดประเสริฐ',
        house_address: {
          id: '12345678901',
          formatted: 'ไม่ใช้ค่านี้',
          raw: '99/12#5###สุขุมวิท#คลองเตย#คลองเตย#กรุงเทพมหานคร',
        },
      },
      privateKey,
    );

    expect(
      verifyThaidIdToken(token, keys, {
        issuer: 'https://imauthsbx.bora.dopa.go.th',
        clientId: 'client-id',
        nowSeconds: now,
      }).address,
    ).toBe('99/12 หมู่ที่ 5 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร');
  });

  it('rejects a token signed by another key', () => {
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const token = signToken(validPayload, other.privateKey);
    expect(() =>
      verifyThaidIdToken(token, keys, {
        issuer: 'https://imauthsbx.bora.dopa.go.th',
        clientId: 'client-id',
        nowSeconds: now,
      }),
    ).toThrow(ThaidTokenError);
  });

  it('accepts an ES256 token signed by a P-256 key', () => {
    const pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const ecJwk = pair.publicKey.export({ format: 'jwk' });
    const token = signEs256Token(validPayload, pair.privateKey, 'ec-key');

    expect(
      verifyThaidIdToken(token, [{ ...ecJwk, kid: 'ec-key' }], {
        issuer: 'https://imauthsbx.bora.dopa.go.th',
        clientId: 'client-id',
        nowSeconds: now,
      }),
    ).toMatchObject({ pid: '1234567890123' });
  });

  it('rejects an ES256 token when the curve is not P-256', () => {
    const pair = generateKeyPairSync('ec', { namedCurve: 'secp384r1' });
    const ecJwk = pair.publicKey.export({ format: 'jwk' });
    const token = signEs256Token(validPayload, pair.privateKey, 'p384-key');

    expect(() =>
      verifyThaidIdToken(token, [{ ...ecJwk, kid: 'p384-key' }], {
        issuer: 'https://imauthsbx.bora.dopa.go.th',
        clientId: 'client-id',
        nowSeconds: now,
      }),
    ).toThrow(ThaidTokenError);
  });

  it('rejects the wrong issuer or audience', () => {
    const token = signToken(validPayload, privateKey);
    expect(() =>
      verifyThaidIdToken(token, keys, {
        issuer: 'https://imauth.bora.dopa.go.th',
        clientId: 'client-id',
        nowSeconds: now,
      }),
    ).toThrow(ThaidTokenError);
    expect(() =>
      verifyThaidIdToken(token, keys, {
        issuer: 'https://imauthsbx.bora.dopa.go.th',
        clientId: 'other-client',
        nowSeconds: now,
      }),
    ).toThrow(ThaidTokenError);
  });
});
