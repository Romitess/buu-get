import { Injectable, NotImplementedException } from '@nestjs/common';
import type {
  IdentityAuthStartOptions,
  IdentityAuthStartResult,
  IdentityCallbackPayload,
  IdentityCallbackResult,
  IdentityProvider,
} from './identity-provider.interface';

const NOT_CONFIGURED =
  'IdentityProvider is not configured (ThaiD OIDC stub — not wired to login UI)';

/**
 * Stub IdentityProvider — throws until a real OIDC adapter is registered.
 * Intentionally does not touch userThaidSynced or auth login flows.
 */
@Injectable()
export class StubIdentityProvider implements IdentityProvider {
  async startAuth(
    _options?: IdentityAuthStartOptions,
  ): Promise<IdentityAuthStartResult> {
    throw new NotImplementedException(NOT_CONFIGURED);
  }

  async handleCallback(
    _payload: IdentityCallbackPayload,
  ): Promise<IdentityCallbackResult> {
    throw new NotImplementedException(NOT_CONFIGURED);
  }

  async linkToUser(
    _userId: number,
    _identitySubject: string,
  ): Promise<void> {
    throw new NotImplementedException(NOT_CONFIGURED);
  }
}
