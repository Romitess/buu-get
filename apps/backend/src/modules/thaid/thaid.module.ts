import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfile } from '../user-profile/entities/user-profile.entity';
import { User } from '../users/entities/user.entity';
import { ThaidAuthState } from './entities/thaid-auth-state.entity';
import { ThaidHandoff } from './entities/thaid-handoff.entity';
import { ThaidAccountService } from './thaid-account.service';
import { ThaidController } from './thaid.controller';
import { ThaidHandoffService } from './thaid-handoff.service';
import { ThaidIdentityController } from './thaid-identity.controller';
import { ThaidIdentityProvider } from './thaid-identity.provider';
import { ThaidOidcClient } from './thaid-oidc.client';
import { ThaidService } from './thaid.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ThaidAuthState, ThaidHandoff, User, UserProfile]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [ThaidController, ThaidIdentityController],
  providers: [
    ThaidService,
    ThaidOidcClient,
    ThaidHandoffService,
    ThaidAccountService,
    ThaidIdentityProvider,
  ],
  exports: [ThaidHandoffService, ThaidIdentityProvider],
})
export class ThaidModule {}
