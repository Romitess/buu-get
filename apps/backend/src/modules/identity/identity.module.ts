import { Module } from '@nestjs/common';
import { IDENTITY_PROVIDER } from './identity-provider.tokens';
import { StubIdentityProvider } from './stub-identity.provider';
import { ThaidModule } from '../thaid/thaid.module';
import { ThaidIdentityProvider } from '../thaid/thaid-identity.provider';

@Module({
  imports: [ThaidModule],
  providers: [
    StubIdentityProvider,
    {
      provide: IDENTITY_PROVIDER,
      useExisting: ThaidIdentityProvider,
    },
  ],
  exports: [IDENTITY_PROVIDER, StubIdentityProvider],
})
export class IdentityModule {}
