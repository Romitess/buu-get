import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { MoodleSyncService } from '../moodle/moodle-sync.service';
import { PlatformGatewayService } from '../platform-gateway/platform-gateway.service';
import { RoleEnum } from '../roles/enums/role.enum';
import { RolesService } from '../roles/roles.service';
import { UserProfileService } from '../user-profile/user-profile.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmail'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(() => {
    usersService = { findByEmail: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('signed-jwt-token') };

    service = new AuthService(
      usersService as unknown as UsersService,
      {} as UserProfileService,
      {} as RolesService,
      jwtService as unknown as JwtService,
      {} as DataSource,
      {} as PlatformGatewayService,
      {} as MoodleSyncService,
      {} as Cache,
    );
  });

  describe('login', () => {
    it('returns JWT from JwtService on valid credentials', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.findByEmail.mockResolvedValue({
        USER_ID: 1,
        USER_EMAIL: 'student@example.com',
        USER_PASSWORD: 'hashed',
        ROLES_ID: [{ ROLE_NAME: RoleEnum.CANDIDATE }],
        PROFILE: { userRemark: 'from-email' },
      } as Awaited<ReturnType<UsersService['findByEmail']>>);

      const loginDto: LoginDto = {
        email: 'student@example.com',
        password: 'password1234',
      };

      const response = await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'student@example.com',
        role: RoleEnum.CANDIDATE,
        roles: [RoleEnum.CANDIDATE],
      });
      expect(response.accessToken).toBe('signed-jwt-token');
      expect(response.user.id).toBe(1);
      expect(response.user.remark).toBe('from-email');
    });

    it('returns null remark when profile has no remark', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.findByEmail.mockResolvedValue({
        USER_ID: 2,
        USER_EMAIL: 'plain@example.com',
        USER_PASSWORD: 'hashed',
        ROLES_ID: [{ ROLE_NAME: RoleEnum.CANDIDATE }],
        PROFILE: undefined,
      } as unknown as Awaited<ReturnType<UsersService['findByEmail']>>);

      const response = await service.login({
        email: 'plain@example.com',
        password: 'password1234',
      });

      expect(response.user.remark).toBeNull();
    });

    it('throws on invalid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      usersService.findByEmail.mockResolvedValue({
        USER_ID: 1,
        USER_EMAIL: 'student@example.com',
        USER_PASSWORD: 'hashed',
      } as Awaited<ReturnType<UsersService['findByEmail']>>);

      await expect(
        service.login({ email: 'student@example.com', password: 'wrong' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'missing@example.com', password: 'pass' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
