import { Module } from '@nestjs/common';
import { IDENTITY_PROVIDER } from './identity-provider.tokens';
import { StubIdentityProvider } from './stub-identity.provider';

@Module({
  providers: [
    StubIdentityProvider,
    {
      provide: IDENTITY_PROVIDER,
      useExisting: StubIdentityProvider,
    },
  ],
  exports: [IDENTITY_PROVIDER, StubIdentityProvider],
})
export class IdentityModule {}
