export type ThaidEnvName = 'sandbox' | 'production';
export type ThaidVerifyType = 'pin' | 'face' | 'pin_face';

export const THAID_SANDBOX_ISSUER = 'https://imauthsbx.bora.dopa.go.th';
export const THAID_PRODUCTION_ISSUER = 'https://imauth.bora.dopa.go.th';
export const THAID_SANDBOX_REDIRECT_URI =
  'https://buu-get-dev.buu.ac.th/api/sandbox/callback';
export const THAID_PRODUCTION_REDIRECT_URI =
  'https://buu-get.buu.ac.th/api/thaid/callback';
export const DEFAULT_THAID_SCOPE =
  'openid pid name name_en birthdate title title_en';

export interface ThaidRuntimeConfig {
  env: ThaidEnvName;
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  verifyType: ThaidVerifyType;
}

export interface ThaidEnvInput {
  THAID_ENV?: string;
  THAID_ISSUER?: string;
  THAID_CLIENT_ID?: string;
  THAID_CLIENT_SECRET?: string;
  THAID_REDIRECT_URI?: string;
  THAID_SCOPE?: string;
  THAID_VERIFY_TYPE?: string;
}

/** ตัด slash ท้าย เพื่อให้ redirect_uri ตรงกับที่ลงทะเบียนทุกตัวอักษร */
export function normalizeRedirectUri(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export function resolveThaidConfig(input: ThaidEnvInput): ThaidRuntimeConfig {
  const env: ThaidEnvName =
    input.THAID_ENV === 'production' ? 'production' : 'sandbox';
  const issuerDefault =
    env === 'production' ? THAID_PRODUCTION_ISSUER : THAID_SANDBOX_ISSUER;
  const redirectDefault =
    env === 'production'
      ? THAID_PRODUCTION_REDIRECT_URI
      : THAID_SANDBOX_REDIRECT_URI;
  const verifyType: ThaidVerifyType =
    input.THAID_VERIFY_TYPE === 'face' || input.THAID_VERIFY_TYPE === 'pin_face'
      ? input.THAID_VERIFY_TYPE
      : 'pin';

  return {
    env,
    issuer: (input.THAID_ISSUER?.trim() || issuerDefault).replace(/\/+$/, ''),
    clientId: input.THAID_CLIENT_ID?.trim() ?? '',
    clientSecret: input.THAID_CLIENT_SECRET?.trim() ?? '',
    redirectUri: normalizeRedirectUri(
      input.THAID_REDIRECT_URI?.trim() || redirectDefault,
    ),
    scope: input.THAID_SCOPE?.trim() || DEFAULT_THAID_SCOPE,
    verifyType,
  };
}

export function callbackSourceForEnv(env: ThaidEnvName): 'sandbox' | 'thaid' {
  return env === 'production' ? 'thaid' : 'sandbox';
}
