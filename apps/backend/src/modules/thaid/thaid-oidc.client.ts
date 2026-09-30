import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AppLogger } from 'src/common/utils/app-logger';
import { EnvironmentVariables } from 'src/config/env.validation';
import { resolveThaidConfig, ThaidRuntimeConfig } from './thaid-config';
import {
  ThaidIdTokenClaims,
  ThaidTokenError,
  verifyThaidIdToken,
} from './thaid-jwt';

interface JwksCache {
  issuer: string;
  keys: Array<{ kty?: string; kid?: string; n?: string; e?: string }>;
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
      THAID_SCOPE: this.configService.get('THAID_SCOPE', { infer: true }),
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
    });
    const basic = Buffer.from(
      `${config.clientId}:${config.clientSecret}`,
    ).toString('base64');

    try {
      const response = await axios.post<unknown>(
        `${config.issuer}/api/v2/oauth2/token/`,
        body.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basic}`,
          },
          timeout: 15000,
        },
      );
      const idToken = readIdToken(response.data);
      if (!idToken) {
        throw new ThaidTokenError('id_token missing');
      }
      return idToken;
    } catch (error) {
      if (error instanceof ThaidTokenError) {
        throw error;
      }
      const oauthError = readOauthError(error);
      this.logger.warn(
        `token exchange failed: ${oauthError ?? 'request_failed'}`,
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

function readOauthError(error: unknown): string | undefined {
  if (!axios.isAxiosError(error) || !error.response) {
    return undefined;
  }
  const data: unknown = error.response.data;
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return undefined;
  }
  const code = (data as Record<string, unknown>).error;
  return typeof code === 'string' ? code : undefined;
}
