import { BadRequestException, Injectable } from '@nestjs/common';
import {
  IdentityAuthStartOptions,
  IdentityAuthStartResult,
  IdentityCallbackPayload,
  IdentityCallbackResult,
  IdentityProvider,
} from '../identity/identity-provider.interface';
import { ThaidIntent } from './entities/thaid-auth-state.entity';
import { ThaidHandoffService } from './thaid-handoff.service';
import { ThaidIdTokenClaims } from './thaid-jwt';
import { ThaidOidcClient } from './thaid-oidc.client';
import { readThaidAddressText } from './thaid-profile-map';
import { readQueryParam } from './thaid.utils';
import { ThaidAccountService } from './thaid-account.service';

@Injectable()
export class ThaidIdentityProvider implements IdentityProvider {
  constructor(
    private readonly oidc: ThaidOidcClient,
    private readonly handoff: ThaidHandoffService,
    private readonly accounts: ThaidAccountService,
  ) {}

  async startAuth(
    options?: IdentityAuthStartOptions,
  ): Promise<IdentityAuthStartResult> {
    const intent: ThaidIntent =
      options?.intent === 'register' ? 'register' : 'login';
    this.oidc.requireConfig();
    const state = await this.handoff.createState(intent);
    return {
      authorizationUrl: this.oidc.buildAuthorizeUrl(state),
      state,
    };
  }

  async handleCallback(
    payload: IdentityCallbackPayload,
  ): Promise<IdentityCallbackResult> {
    const code = readQueryParam(payload.query, 'code');
    const state = readQueryParam(payload.query, 'state');
    if (!code || !state) {
      throw new BadRequestException('missing code or state');
    }

    const intent = await this.handoff.consumeState(state);
    if (!intent) {
      throw new BadRequestException('invalid state');
    }

    const tokens = await this.oidc.exchangeCode(code);
    const claims = await this.oidc.verifyIdToken(tokens.idToken);
    if (!claims.address && tokens.accessToken) {
      const userinfo = await this.oidc.fetchUserInfo(tokens.accessToken);
      const address = userinfo ? readThaidAddressText(userinfo) : undefined;
      if (address) {
        claims.address = address;
      }
    }
    return {
      subject: claims.pid,
      claims: {
        ...claims,
        intent,
      },
    };
  }

  async linkToUser(userId: number, identitySubject: string): Promise<void> {
    await this.accounts.linkToUser(userId, identitySubject);
  }
}

export function readThaidClaims(claims: Record<string, unknown>): {
  intent: ThaidIntent;
  identity: ThaidIdTokenClaims;
} {
  const pid = claims.pid;
  if (typeof pid !== 'string') {
    throw new BadRequestException('missing pid');
  }
  const intent: ThaidIntent =
    claims.intent === 'register' ? 'register' : 'login';
  return {
    intent,
    identity: {
      pid,
      sub: optionalString(claims.sub),
      name: optionalString(claims.name),
      nameEn: optionalString(claims.nameEn),
      birthdate: optionalString(claims.birthdate),
      title: optionalString(claims.title),
      titleEn: optionalString(claims.titleEn),
      address: optionalString(claims.address),
    },
  };
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}
