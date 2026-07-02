import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { UserProfileModule } from '../user-profile/user-profile.module';
import { RolesModule } from '../roles/roles.module';
import { UserImageModule } from '../user-image/user-image.module';
import { PlatformGatewayModule } from '../platform-gateway/platform-gateway.module';
import { MoodleModule } from '../moodle/moodle.module';

@Module({
  imports: [
    UsersModule,
    UserProfileModule,
    RolesModule,
    UserImageModule,
    PlatformGatewayModule,
    MoodleModule,
    CacheModule.register(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '1d', // Token หมดอายุใน 1 วัน
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
