import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common/utils/app-logger';
import {
  ExternalCallbackPayload,
  ExternalCallbackResult,
  IdentityCallbackRedirect,
  IdentityCallbackSource,
  IdentityCallbackStatus,
  ThaidEndpoint,
} from './types/thaid.types';
import { readQueryParam } from './thaid.utils';

const IDENTITY_CALLBACK_PATH = '/#/thaid/callback';

@Injectable()
export class ThaidService {
  private readonly logger = new AppLogger(ThaidService.name);

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

  buildIdentityCallbackRedirect(
    source: IdentityCallbackSource,
    query: Record<string, unknown>,
    frontendOrigin?: string,
  ): IdentityCallbackRedirect {
    const code = readQueryParam(query, 'code');
    const error = readQueryParam(query, 'error');
    const hasState = readQueryParam(query, 'state') !== undefined;
    const status = this.resolveIdentityStatus(code, error);

    this.logger.log(
      `[identity:${source}] callback received — status=${status}, hasCode=${code !== undefined}, hasState=${hasState}`,
    );

    const params = new URLSearchParams({ status });
    const path = `${IDENTITY_CALLBACK_PATH}?${params.toString()}`;
    const origin = frontendOrigin?.replace(/\/$/, '');

    return {
      url: origin ? `${origin}${path}` : path,
      statusCode: 302,
    };
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
