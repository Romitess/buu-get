import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AppLogger } from 'src/common/utils/app-logger';
import { EnvironmentVariables } from 'src/config/env.validation';
import { resolveThaidConfig, ThaidRuntimeConfig } from './thaid-config';
import {
  ThaidIdTokenClaims,
  ThaidJwk,
  ThaidTokenError,
  verifyThaidIdToken,
} from './thaid-jwt';

interface JwksCache {
  issuer: string;
  keys: ThaidJwk[];
  fetchedAt: number;
}

const JWKS_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class ThaidOidcClient {
  private readonly logger = new AppLogger(ThaidOidcClient.name);
  private jwksCache: JwksCache | null = null;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  getConfig(): ThaidRuntimeConfig {
    return resolveThaidConfig({
      THAID_ENV: this.configService.get('THAID_ENV', { infer: true }),
      THAID_ISSUER: this.configService.get('THAID_ISSUER', { infer: true }),
      THAID_CLIENT_ID: this.configService.get('THAID_CLIENT_ID', {
        infer: true,
      }),
      THAID_CLIENT_SECRET: this.configService.get('THAID_CLIENT_SECRET', {
        infer: true,
      }),
      THAID_REDIRECT_URI: this.configService.get('THAID_REDIRECT_URI', {
        infer: true,
      }),
      THAID_VERIFY_TYPE: this.configService.get('THAID_VERIFY_TYPE', {
        infer: true,
      }),
    });
  }

  requireConfig(): ThaidRuntimeConfig {
    const config = this.getConfig();
    if (!config.clientId || !config.clientSecret) {
      throw new ServiceUnavailableException('ThaID client is not configured');
    }
    return config;
  }

  buildAuthorizeUrl(state: string): string {
    const config = this.requireConfig();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      verify_type: config.verifyType,
      state,
    });
    return `${config.issuer}/api/v2/oauth2/auth/?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<string> {
    const config = this.requireConfig();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });

    try {
      const response = await axios.post<unknown>(
        `${config.issuer}/api/v2/oauth2/token/`,
        body.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 15000,
        },
      );
      const idToken = readIdToken(response.data);
      if (!idToken) {
        this.logger.warn(
          `token exchange response has no id_token: status=${response.status} fields=${listBodyFields(response.data)}`,
        );
        throw new ThaidTokenError('id_token missing');
      }
      return idToken;
    } catch (error) {
      if (error instanceof ThaidTokenError) {
        throw error;
      }
      this.logger.warn(
        describeTokenExchangeFailure(error, {
          tokenUrl: `${config.issuer}/api/v2/oauth2/token/`,
          redirectUri: config.redirectUri,
          clientIdLength: config.clientId.length,
          clientSecretLength: config.clientSecret.length,
        }),
      );
      throw new ThaidTokenError('token exchange');
    }
  }

  async verifyIdToken(idToken: string): Promise<ThaidIdTokenClaims> {
    const config = this.requireConfig();
    const keys = await this.loadJwks(config.issuer);
    return verifyThaidIdToken(idToken, keys, {
      issuer: config.issuer,
      clientId: config.clientId,
    });
  }

  private async loadJwks(issuer: string): Promise<JwksCache['keys']> {
    const cached = this.jwksCache;
    if (
      cached &&
      cached.issuer === issuer &&
      Date.now() - cached.fetchedAt < JWKS_TTL_MS
    ) {
      return cached.keys;
    }

    const wellKnown = await axios.get<unknown>(
      `${issuer}/.well-known/openid-configuration`,
      { timeout: 15000 },
    );
    const jwksUri = readJwksUri(wellKnown.data);
    if (!jwksUri) {
      throw new ThaidTokenError('jwks_uri');
    }
    const jwks = await axios.get<unknown>(jwksUri, { timeout: 15000 });
    const keys = readJwksKeys(jwks.data);
    this.jwksCache = { issuer, keys, fetchedAt: Date.now() };
    return keys;
  }
}

function readIdToken(data: unknown): string | undefined {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return undefined;
  }
  const idToken = (data as Record<string, unknown>).id_token;
  return typeof idToken === 'string' && idToken.length > 0
    ? idToken
    : undefined;
}

function readJwksUri(data: unknown): string | undefined {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return undefined;
  }
  const uri = (data as Record<string, unknown>).jwks_uri;
  return typeof uri === 'string' && uri.length > 0 ? uri : undefined;
}

function readJwksKeys(data: unknown): JwksCache['keys'] {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return [];
  }
  const keys = (data as Record<string, unknown>).keys;
  if (!Array.isArray(keys)) {
    return [];
  }
  return keys.filter(
    (key): key is JwksCache['keys'][number] =>
      key !== null && typeof key === 'object' && !Array.isArray(key),
  );
}

const REDACTED_BODY_KEYS = new Set([
  'client_secret',
  'code',
  'access_token',
  'id_token',
  'refresh_token',
  'authorization',
]);

export interface TokenExchangeLogContext {
  tokenUrl: string;
  redirectUri: string;
  clientIdLength: number;
  clientSecretLength: number;
}

/** สรุปความล้มเหลวตอนแลก token โดยไม่ใส่ secret, code หรือ token */
export function describeTokenExchangeFailure(
  error: unknown,
  context: TokenExchangeLogContext,
): string {
  const parts = [
    'token exchange failed',
    'auth=client_secret_post',
    'authorizationHeader=absent',
    `tokenUrl=${context.tokenUrl}`,
    `redirectUri=${context.redirectUri}`,
    `clientIdLength=${context.clientIdLength}`,
    `clientSecretLength=${context.clientSecretLength}`,
  ];

  if (!axios.isAxiosError(error)) {
    const message = error instanceof Error ? error.message : 'request_failed';
    parts.push('status=none', `message=${quoteLog(message)}`);
    return parts.join(' ');
  }

  parts.push(`status=${error.response?.status ?? 'none'}`);
  if (error.code) {
    parts.push(`code=${error.code}`);
  }
  const wwwAuthenticate = readHeader(
    error.response?.headers,
    'www-authenticate',
  );
  if (wwwAuthenticate) {
    parts.push(`wwwAuthenticate=${quoteLog(wwwAuthenticate)}`);
  }
  const body = summarizeTokenErrorBody(error.response?.data);
  if (body) {
    parts.push(body);
  } else if (!error.response) {
    parts.push(`message=${quoteLog(error.message)}`);
  }
  return parts.join(' ');
}

function summarizeTokenErrorBody(data: unknown): string | undefined {
  if (typeof data === 'string') {
    const text = data.trim();
    if (text.length === 0) {
      return undefined;
    }
    return `body=${quoteLog(redactFormSecrets(text))}`;
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return undefined;
  }
  const record = data as Record<string, unknown>;
  const bits: string[] = [];
  const error = readBodyString(record, 'error');
  const description = readBodyString(record, 'error_description');
  const errorUri = readBodyString(record, 'error_uri');
  if (error) {
    bits.push(`error=${error}`);
  }
  if (description) {
    bits.push(`description=${quoteLog(description)}`);
  }
  if (errorUri) {
    bits.push(`errorUri=${errorUri}`);
  }
  const extra = Object.keys(record).filter(
    (key) =>
      key !== 'error' &&
      key !== 'error_description' &&
      key !== 'error_uri' &&
      !REDACTED_BODY_KEYS.has(key),
  );
  if (extra.length > 0) {
    bits.push(`fields=${extra.join(',')}`);
  }
  return bits.length > 0 ? bits.join(' ') : undefined;
}

function listBodyFields(data: unknown): string {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return typeof data;
  }
  return (
    Object.keys(data)
      .map((key) => (REDACTED_BODY_KEYS.has(key) ? `${key}=redacted` : key))
      .join(',') || 'none'
  );
}

function readBodyString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readHeader(headers: unknown, name: string): string | undefined {
  if (headers === null || typeof headers !== 'object') {
    return undefined;
  }
  const value = (headers as Record<string, unknown>)[name];
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string');
    return typeof first === 'string' && first.trim().length > 0
      ? first.trim()
      : undefined;
  }
  return undefined;
}

function redactFormSecrets(value: string): string {
  return value.replace(
    /(client_secret|code|access_token|id_token|refresh_token)=([^&\s]+)/gi,
    '$1=redacted',
  );
}

function quoteLog(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim().slice(0, 300);
  return `"${compact.replace(/"/g, "'")}"`;
}
