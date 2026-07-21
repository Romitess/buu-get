import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common/utils/app-logger';
import {
  ExternalCallbackPayload,
  ExternalCallbackResult,
  ThaidEndpoint,
} from './types/thaid.types';

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
}
