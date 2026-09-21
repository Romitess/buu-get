import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadGatewayException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import axios, { AxiosError } from 'axios';
import { PlatformGatewayService } from './platform-gateway.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

const SECRET_PASSWORD = 'super-secret-password-xyz';

function axiosHttpError(status: number, data: unknown): AxiosError {
  const error = new AxiosError(`Request failed with status code ${status}`);
  error.response = {
    status,
    data,
    statusText: 'Error',
    headers: {},
    config: { headers: {} } as never,
  };
  return error;
}

describe('PlatformGatewayService', () => {
  let service: PlatformGatewayService;
  let cache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let configs: Record<string, unknown>;

  beforeEach(async () => {
    configs = {
      domain: 'https://kong-dev.buu.ac.th',
      noti: '',
      requestTokenAPI: {
        path: '/oauth2/token/',
        client_secret: 'client-secret',
        client_id: 'client-id',
        grant_type: 'password',
        authenticated_userid: 'hrd-kong',
      },
      loginBuu: {
        path: '/service-api/ldap.loginBuu',
        provision_key: 'login-buu-provision-key',
        scope: 'read',
        secret: false,
      },
    };
    cache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformGatewayService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => configs[key]),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: cache,
        },
        {
          provide: SystemSettingsService,
          useValue: {
            getString: jest.fn().mockResolvedValue('BUU-GET'),
          },
        },
      ],
    }).compile();

    service = module.get<PlatformGatewayService>(PlatformGatewayService);
  });

  it('instantiates with config and cache dependencies', () => {
    expect(service).toBeDefined();
  });

  describe('loginBuu', () => {
    let postSpy: jest.SpiedFunction<typeof axios.post>;
    let sendNotiSpy: jest.SpiedFunction<PlatformGatewayService['sendNoti']>;
    let logErrorSpy: jest.SpiedFunction<Logger['error']>;

    beforeEach(() => {
      postSpy = jest.spyOn(axios, 'post');
      sendNotiSpy = jest.spyOn(service, 'sendNoti');
      logErrorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
    });

    afterEach(() => {
      postSpy.mockRestore();
      sendNotiSpy.mockRestore();
      logErrorSpy.mockRestore();
    });

    function loggedText(): string {
      return logErrorSpy.mock.calls
        .map((args) => args.map(String).join(' '))
        .join('\n');
    }

    it('does not POST when loginBuu provision_key is empty', async () => {
      (configs.loginBuu as { provision_key: string }).provision_key = '';
      cache.get.mockResolvedValue(undefined);

      await expect(
        service.loginBuu('staff02', SECRET_PASSWORD),
      ).rejects.toBeInstanceOf(BadGatewayException);
      expect(postSpy).not.toHaveBeenCalled();
    });

    it('maps requestToken HTTP 400 to 502 and sendNoti once without logging password', async () => {
      cache.get.mockResolvedValue(undefined);
      postSpy.mockRejectedValue(
        axiosHttpError(400, { error: 'invalid_provision_key' }),
      );

      await expect(
        service.loginBuu('staff02', SECRET_PASSWORD),
      ).rejects.toMatchObject({
        status: 502,
        message: 'ไม่สามารถเชื่อมต่อระบบยืนยันตัวตนของมหาวิทยาลัยได้',
      });
      expect(sendNotiSpy).toHaveBeenCalledTimes(1);
      expect(loggedText()).toContain('requestToken loginBuu failed status=400');
      expect(loggedText()).not.toContain(SECRET_PASSWORD);
      expect(postSpy).toHaveBeenCalledWith(
        'https://kong-dev.buu.ac.th/service-api/ldap.loginBuu/oauth2/token/',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-forwarded-proto': 'https',
          }),
        }),
      );
      const tokenBody = postSpy.mock.calls[0][1] as URLSearchParams;
      expect(tokenBody.get('grant_type')).toBe('password');
      expect(tokenBody.get('provision_key')).toBe('login-buu-provision-key');
      expect(tokenBody.get('client_id')).toBe('client-id');
    });

    it('strips wrapping quotes from provision_key before requesting a token', async () => {
      (configs.loginBuu as { provision_key: string }).provision_key =
        '"quoted-key"';
      cache.get.mockResolvedValue(undefined);
      postSpy.mockRejectedValue(
        axiosHttpError(400, { error: 'invalid_grant' }),
      );

      await expect(
        service.loginBuu('staff02', SECRET_PASSWORD),
      ).rejects.toBeInstanceOf(BadGatewayException);

      const tokenBody = postSpy.mock.calls[0][1] as URLSearchParams;
      expect(tokenBody.get('provision_key')).toBe('quoted-key');
    });

    it('returns LDAP 200 fail body so AuthService can still 401', async () => {
      cache.get.mockResolvedValue({
        access_token: 'tok',
        refresh_token: 'ref',
        expires_in: 3600,
      });
      postSpy.mockResolvedValue({
        data: {
          status: 'fail',
          message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
        },
      });

      await expect(
        service.loginBuu('staff02', SECRET_PASSWORD),
      ).resolves.toEqual({
        status: 'fail',
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
      });
      expect(sendNotiSpy).not.toHaveBeenCalled();
    });

    it('returns LDAP 400 fail body so AuthService can still 401 without sendNoti', async () => {
      cache.get.mockResolvedValue({
        access_token: 'tok',
        refresh_token: 'ref',
        expires_in: 3600,
      });
      postSpy.mockRejectedValue(
        axiosHttpError(400, {
          status: 'fail',
          message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
        }),
      );

      await expect(
        service.loginBuu('staff02', SECRET_PASSWORD),
      ).resolves.toEqual({
        status: 'fail',
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
      });
      expect(sendNotiSpy).not.toHaveBeenCalled();
    });

    it('forwards LDAP success and sends boolean secret without logging password', async () => {
      cache.get.mockResolvedValue({
        access_token: 'tok',
        refresh_token: 'ref',
        expires_in: 3600,
      });
      const successBody = {
        status: 'success',
        result: {
          fullname: 'Staff Demo',
          email: 'staff02@go.buu.ac.th',
          facultyname: '',
          citizenid: '1100700000002',
        },
      };
      postSpy.mockResolvedValue({ data: successBody });

      await expect(
        service.loginBuu('staff02', SECRET_PASSWORD),
      ).resolves.toEqual(successBody);

      expect(postSpy).toHaveBeenCalledWith(
        'https://kong-dev.buu.ac.th/service-api/ldap.loginBuu',
        {
          username: 'staff02',
          password: SECRET_PASSWORD,
          secret: false,
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer tok',
          }),
        }),
      );
      expect(loggedText()).not.toContain(SECRET_PASSWORD);
    });
  });
});
