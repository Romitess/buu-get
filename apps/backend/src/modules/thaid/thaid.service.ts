import { BadRequestException, Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common/utils/app-logger';
import {
  ExternalCallbackPayload,
  ExternalCallbackResult,
  IdentityCallbackRedirect,
  IdentityCallbackSource,
  IdentityCallbackStatus,
  ThaidEndpoint,
  ThaidSessionResponse,
} from './types/thaid.types';
import { readQueryParam } from './thaid.utils';
import { ThaidAccountService } from './thaid-account.service';
import { callbackSourceForEnv } from './thaid-config';
import { ThaidHandoffService } from './thaid-handoff.service';
import {
  readThaidClaims,
  ThaidIdentityProvider,
} from './thaid-identity.provider';
import { ThaidOidcClient } from './thaid-oidc.client';

const IDENTITY_CALLBACK_PATH = '/#/thaid/callback';

@Injectable()
export class ThaidService {
  private readonly logger = new AppLogger(ThaidService.name);

  constructor(
    private readonly identity: ThaidIdentityProvider,
    private readonly accounts: ThaidAccountService,
    private readonly handoff: ThaidHandoffService,
    private readonly oidc: ThaidOidcClient,
  ) {}

  handleCallback(
    endpoint: ThaidEndpoint,
    payload: ExternalCallbackPayload,
  ): ExternalCallbackResult {
    const receivedAt = new Date().toISOString();

    this.logger.log(
      `[${endpoint}] callback received — body keys: ${Object.keys(payload.body).join(', ') || '(empty)'}, query keys: ${Object.keys(payload.query).join(', ') || '(empty)'}`,
    );

    return {
      ok: true,
      endpoint,
      receivedAt,
      body: payload.body,
      query: payload.query,
    };
  }

  async beginIdentity(
    intent: 'login' | 'register',
  ): Promise<IdentityCallbackRedirect> {
    const started = await this.identity.startAuth({ intent });
    if (!started.authorizationUrl) {
      throw new BadRequestException('ThaID authorize URL is missing');
    }
    return { url: started.authorizationUrl, statusCode: 302 };
  }

  async completeIdentityCallback(
    source: IdentityCallbackSource,
    query: Record<string, unknown>,
    frontendOrigin?: string,
  ): Promise<IdentityCallbackRedirect> {
    const code = readQueryParam(query, 'code');
    const error = readQueryParam(query, 'error');
    const status = this.resolveIdentityStatus(code, error);

    this.logger.log(
      `[identity:${source}] callback received — status=${status}, hasCode=${code !== undefined}`,
    );

    if (status !== 'success' || !code) {
      return this.redirectStatus(status, frontendOrigin);
    }

    const expected = callbackSourceForEnv(this.oidc.getConfig().env);
    if (source !== expected) {
      this.logger.warn(
        `[identity:${source}] callback source does not match THAID_ENV`,
      );
      return this.redirectStatus('error', frontendOrigin);
    }

    try {
      const verified = await this.identity.handleCallback({
        query,
        body: {},
      });
      if (!verified.subject) {
        return this.redirectStatus('error', frontendOrigin);
      }
      const { intent, identity } = readThaidClaims(verified.claims);
      const sessionPayload = await this.accounts.resolve(intent, identity);
      const ticket = await this.handoff.createSessionTicket(sessionPayload);
      return this.redirectTicket(ticket, frontendOrigin);
    } catch (err) {
      const name = err instanceof Error ? err.name : 'Error';
      const message = err instanceof Error ? err.message : '';
      this.logger.warn(
        `[identity:${source}] callback failed: ${name}${message ? `: ${message}` : ''}`,
      );
      return this.redirectStatus('error', frontendOrigin);
    }
  }

  async exchangeSession(ticket: string): Promise<ThaidSessionResponse> {
    const payload = await this.handoff.consumeSessionTicket(ticket);
    if (!payload) {
      throw new BadRequestException('ตั๋ว ThaID ไม่ถูกต้องหรือหมดอายุ');
    }
    if (payload.outcome === 'prefill') {
      return payload;
    }
    const login = await this.accounts.issueLoginForUser(payload.userId);
    return {
      outcome: 'login',
      notice: payload.notice,
      received: payload.received,
      login,
    };
  }

  private redirectStatus(
    status: IdentityCallbackStatus,
    frontendOrigin?: string,
  ): IdentityCallbackRedirect {
    const params = new URLSearchParams({ status });
    return {
      url: this.frontendUrl(params, frontendOrigin),
      statusCode: 302,
    };
  }

  private redirectTicket(
    ticket: string,
    frontendOrigin?: string,
  ): IdentityCallbackRedirect {
    const params = new URLSearchParams({ ticket });
    const url = this.frontendUrl(params, frontendOrigin);
    return { url, statusCode: 302 };
  }

  private frontendUrl(
    params: URLSearchParams,
    frontendOrigin?: string,
  ): string {
    const path = `${IDENTITY_CALLBACK_PATH}?${params.toString()}`;
    const origin = frontendOrigin?.replace(/\/$/, '');
    return origin ? `${origin}${path}` : path;
  }

  private resolveIdentityStatus(
    code: string | undefined,
    error: string | undefined,
  ): IdentityCallbackStatus {
    if (error !== undefined) {
      return error === 'access_denied' ? 'denied' : 'error';
    }
    if (code !== undefined) {
      return 'success';
    }
    return 'unknown';
  }
}
