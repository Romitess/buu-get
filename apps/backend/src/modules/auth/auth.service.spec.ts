import {
  BadGatewayException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MoodleSyncService } from '../moodle/moodle-sync.service';
import { PlatformGatewayService } from '../platform-gateway/platform-gateway.service';
import { RoleEnum } from '../roles/enums/role.enum';
import { RolesService } from '../roles/roles.service';
import { UserImage } from '../user-image/entities/user-image.entity';
import { UserProfileService } from '../user-profile/user-profile.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';

jest.mock('bcrypt');

/** Access private helpers without `any` for unit isolation. */
type AuthServicePrivate = {
  deriveName: (
    fullName: string | undefined,
    email: string,
  ) => { firstname: string; lastname: string };
  persistRegisterProfileImage: (
    profileImage: string | undefined,
    userId: number,
  ) => Promise<void>;
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmail' | 'findById'>>;
  let memberSessionCodesService: {
    allocateUserCode: jest.Mock;
  };
  let rolesService: jest.Mocked<Pick<RolesService, 'findByName'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;
  let platformGatewayService: jest.Mocked<
    Pick<PlatformGatewayService, 'sendEmail' | 'uploadBuffer' | 'loginBuu'>
  >;
  let moodleSyncService: jest.Mocked<Pick<MoodleSyncService, 'createUser'>>;
  let msgPersonsService: {
    findForLogin: jest.Mock;
    findEntityById: jest.Mock;
  };
  let cacheManager: jest.Mocked<Pick<Cache, 'set' | 'get' | 'del'>>;
  let thaidHandoff: {
    peekRegisterProof: jest.Mock;
    consumeRegisterProof: jest.Mock;
  };
  let queryRunnerManager: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: typeof queryRunnerManager;
  };
  let userImageRepo: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let dataSource: {
    createQueryRunner: jest.Mock;
    getRepository: jest.Mock;
  };

  const candidateRole = {
    ROLE_ID: 1,
    ROLE_NAME: RoleEnum.CANDIDATE,
  } as Role;

  const baseRegisterDto = (): RegisterDto => ({
    email: 'New.User@Example.com',
    password: 'password1234',
    userType: 'thai',
    nationalId: '1234567890123',
    country: 'Thailand',
    titleTH: 'นาย',
    titleEN: 'Mr.',
    fullName: 'สมชาย ใจดี',
    englishName: 'Somchai Jaidee',
    phone: '0812345678',
    birthdate: '2005 07 22',
    educationLevel: 'ปริญญาตรี',
    faculty: 'คณะวิทยาการสารสนเทศ',
    institution: 'มหาวิทยาลัยบูรพา',
    address: ' 104/13 ถ.มาบมะยม ',
  });

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    memberSessionCodesService = {
      allocateUserCode: jest.fn().mockResolvedValue('2569100042'),
    };
    rolesService = {
      findByName: jest.fn().mockResolvedValue(candidateRole),
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-jwt-token') };
    platformGatewayService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
      uploadBuffer: jest.fn(),
      loginBuu: jest.fn(),
    };
    moodleSyncService = {
      createUser: jest.fn().mockResolvedValue(9001),
    };
    msgPersonsService = {
      findForLogin: jest.fn(),
      findEntityById: jest.fn(),
    };
    cacheManager = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(undefined),
    };
    thaidHandoff = {
      peekRegisterProof: jest.fn().mockResolvedValue(null),
      consumeRegisterProof: jest.fn().mockResolvedValue(undefined),
    };

    queryRunnerManager = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn(
        (_entity: unknown, data: Record<string, unknown>) => data,
      ),
      save: jest.fn((entity: Record<string, unknown>) => {
        if (
          entity.USER_EMAIL !== undefined ||
          entity.USER_PASSWORD !== undefined
        ) {
          return { ...entity, USER_ID: 42 };
        }
        return { ...entity, userId: entity.userId ?? 42 };
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };

    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: queryRunnerManager,
    };

    userImageRepo = {
      create: jest.fn((data: Record<string, unknown>) => data),
      save: jest.fn().mockResolvedValue(undefined),
    };

    dataSource = {
      createQueryRunner: jest.fn(() => queryRunner as unknown as QueryRunner),
      getRepository: jest.fn(
        () => userImageRepo as unknown as Repository<UserImage>,
      ),
    };

    (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    service = new AuthService(
      usersService as unknown as UsersService,
      {} as UserProfileService,
      rolesService as unknown as RolesService,
      jwtService as unknown as JwtService,
      dataSource as unknown as DataSource,
      platformGatewayService as unknown as PlatformGatewayService,
      moodleSyncService as unknown as MoodleSyncService,
      msgPersonsService as never,
      cacheManager as unknown as Cache,
      memberSessionCodesService as never,
      thaidHandoff as never,
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
      expect(response.user.actorType).toBe('user');
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

    // AUTH-U-005
    it('should fallback primary role to candidate when ROLES_ID is empty', async () => {
      // Arrange
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.findByEmail.mockResolvedValue({
        USER_ID: 3,
        USER_EMAIL: 'norole@example.com',
        USER_PASSWORD: 'hashed',
        ROLES_ID: [],
        PROFILE: null,
      } as unknown as Awaited<ReturnType<UsersService['findByEmail']>>);

      // Act
      const response = await service.login({
        email: 'norole@example.com',
        password: 'password1234',
      });

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 3,
        email: 'norole@example.com',
        role: RoleEnum.CANDIDATE,
        roles: [RoleEnum.CANDIDATE],
      });
      expect(response.user.role).toBe(RoleEnum.CANDIDATE);
      expect(response.user.roles).toEqual([RoleEnum.CANDIDATE]);
    });

    // AUTH-U-006
    it('should use first role as primary when user has multiple roles', async () => {
      // Arrange
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.findByEmail.mockResolvedValue({
        USER_ID: 4,
        USER_EMAIL: 'multi@example.com',
        USER_PASSWORD: 'hashed',
        ROLES_ID: [
          { ROLE_NAME: RoleEnum.STAFF },
          { ROLE_NAME: RoleEnum.ADMIN },
        ],
        PROFILE: null,
      } as unknown as Awaited<ReturnType<UsersService['findByEmail']>>);

      // Act
      const response = await service.login({
        email: 'multi@example.com',
        password: 'password1234',
      });

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 4,
        email: 'multi@example.com',
        role: RoleEnum.STAFF,
        roles: [RoleEnum.STAFF, RoleEnum.ADMIN],
      });
      expect(response.user.role).toBe(RoleEnum.STAFF);
      expect(response.user.roles).toEqual([RoleEnum.STAFF, RoleEnum.ADMIN]);
    });
  });

  describe('loginBuu', () => {
    it('returns person JWT when LDAP and MSG_T_PERSON match', async () => {
      platformGatewayService.loginBuu.mockResolvedValue({
        status: 'success',
        result: {
          fullname: 'Staff Demo',
          email: 'staff02@go.buu.ac.th',
          facultyname: '',
          citizenid: '1100700000002',
        },
      });
      msgPersonsService.findForLogin.mockResolvedValue({
        PSN_ID: 'DEMOSTAFF2',
        PSN_EMAIL_BUU: 'staff02@go.buu.ac.th',
        PSN_USERNAME: 'staff02',
        PSN_IDCARD: '1100700000002',
        PSN_RETIRE: 'N',
        ROLES: [{ ROLE_NAME: RoleEnum.STAFF }],
      });

      const response = await service.loginBuu({
        username: 'staff02',
        password: 'secret',
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        typ: 'person',
        sub: 'DEMOSTAFF2',
        email: 'staff02@go.buu.ac.th',
        role: RoleEnum.STAFF,
        roles: [RoleEnum.STAFF],
      });
      expect(response.user.actorType).toBe('person');
      expect(response.user.psnId).toBe('DEMOSTAFF2');
      expect(response.user.id).toBeUndefined();
    });

    it('returns person JWT when assigned proctor role is present', async () => {
      platformGatewayService.loginBuu.mockResolvedValue({
        status: 'success',
        result: {
          fullname: 'Proctor Demo',
          email: 'proctor@go.buu.ac.th',
          facultyname: '',
          citizenid: '1100700000003',
        },
      });
      msgPersonsService.findForLogin.mockResolvedValue({
        PSN_ID: 'DEMOPROC01',
        PSN_EMAIL_BUU: 'proctor@go.buu.ac.th',
        PSN_USERNAME: 'proctor01',
        PSN_IDCARD: '1100700000003',
        PSN_RETIRE: 'N',
        ROLES: [{ ROLE_NAME: RoleEnum.PROCTOR }],
      });

      const response = await service.loginBuu({
        username: 'proctor01',
        password: 'secret',
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        typ: 'person',
        sub: 'DEMOPROC01',
        email: 'proctor@go.buu.ac.th',
        role: RoleEnum.PROCTOR,
        roles: [RoleEnum.PROCTOR],
      });
      expect(response.user.actorType).toBe('person');
      expect(response.user.role).toBe(RoleEnum.PROCTOR);
    });

    it('throws when LDAP fails', async () => {
      platformGatewayService.loginBuu.mockResolvedValue({
        status: 'fail',
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
      });

      await expect(
        service.loginBuu({ username: 'bad', password: 'bad' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('does not map gateway connection failure to UnauthorizedException', async () => {
      platformGatewayService.loginBuu.mockRejectedValue(
        new BadGatewayException(
          'ไม่สามารถเชื่อมต่อระบบยืนยันตัวตนของมหาวิทยาลัยได้',
        ),
      );

      await expect(
        service.loginBuu({ username: 'staff02', password: 'secret' }),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });

    it('throws when person is not found in MSG_T_PERSON', async () => {
      platformGatewayService.loginBuu.mockResolvedValue({
        status: 'success',
        result: {
          fullname: 'X',
          email: 'x@buu.ac.th',
          facultyname: '',
          citizenid: '1100700000999',
        },
      });
      msgPersonsService.findForLogin.mockResolvedValue(null);

      await expect(
        service.loginBuu({ username: 'staff02', password: 'secret' }),
      ).rejects.toThrow('ไม่พบบุคลากรในระบบ');
    });

    it('throws when person has no PERSON_ROLES', async () => {
      platformGatewayService.loginBuu.mockResolvedValue({
        status: 'success',
        result: {
          fullname: 'X',
          email: 'x@buu.ac.th',
          facultyname: '',
          citizenid: '1100700000002',
        },
      });
      msgPersonsService.findForLogin.mockResolvedValue({
        PSN_ID: 'DEMOSTAFF2',
        PSN_EMAIL_BUU: 'staff02@go.buu.ac.th',
        PSN_USERNAME: 'staff02',
        ROLES: [],
      });

      await expect(
        service.loginBuu({ username: 'staff02', password: 'secret' }),
      ).rejects.toThrow('บัญชีบุคลากรยังไม่มีสิทธิ์ในระบบ');
    });
  });

  describe('sendOtp', () => {
    // AUTH-U-007
    it('should throw when email is already registered', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue({
        USER_ID: 1,
        USER_EMAIL: 'taken@example.com',
      } as Awaited<ReturnType<UsersService['findByEmail']>>);

      // Act & Assert
      await expect(service.sendOtp('taken@example.com')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.sendOtp('taken@example.com')).rejects.toThrow(
        'อีเมลนี้ถูกใช้งานในระบบแล้ว',
      );
      expect(cacheManager.set).not.toHaveBeenCalled();
      expect(platformGatewayService.sendEmail).not.toHaveBeenCalled();
    });

    // AUTH-U-008
    it('should cache OTP and send email when email is available', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(null);
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      // Act
      const result = await service.sendOtp('fresh@example.com');

      // Assert
      const expectedOtp = Math.floor(100000 + 0.5 * 900000).toString();
      expect(cacheManager.set).toHaveBeenCalledWith(
        'otp_fresh@example.com',
        expectedOtp,
        300000,
      );
      expect(platformGatewayService.sendEmail).toHaveBeenCalledWith(
        'BUU-GET',
        'fresh@example.com',
        expect.stringContaining(expectedOtp),
        expect.stringContaining(expectedOtp),
      );
      expect(result).toEqual({ success: true });

      jest.spyOn(Math, 'random').mockRestore();
    });

    // AUTH-U-009
    it('should throw BadRequestException when gateway email send fails', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(null);
      platformGatewayService.sendEmail.mockRejectedValue(
        new Error('gateway down'),
      );

      // Act & Assert
      await expect(service.sendOtp('fresh@example.com')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.sendOtp('fresh@example.com')).rejects.toThrow(
        'ไม่สามารถส่งอีเมล OTP ได้ กรุณาลองใหม่อีกครั้ง',
      );
    });
  });

  describe('verifyOtp', () => {
    // AUTH-U-010
    it('should return success and delete OTP when code matches', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue('123456');

      // Act
      const result = await service.verifyOtp('user@example.com', '123456');

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith('otp_user@example.com');
      expect(cacheManager.del).toHaveBeenCalledWith('otp_user@example.com');
      expect(result).toEqual({ success: true });
    });

    // AUTH-U-011
    it('should throw when OTP does not match stored value', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue('123456');

      // Act & Assert
      await expect(
        service.verifyOtp('user@example.com', '999999'),
      ).rejects.toThrow(BadRequestException);
      expect(cacheManager.del).not.toHaveBeenCalled();
    });

    // AUTH-U-012
    it('should throw when OTP is missing or expired', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        service.verifyOtp('user@example.com', '123456'),
      ).rejects.toThrow('รหัส OTP ไม่ถูกต้องหรือหมดอายุ');
      expect(cacheManager.del).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    // AUTH-U-013
    it('should register user successfully on happy path', async () => {
      // Arrange
      const dto = baseRegisterDto();

      // Act
      const result = await service.register(dto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('password1234', 'salt');
      expect(rolesService.findByName).toHaveBeenCalledWith(RoleEnum.CANDIDATE);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(moodleSyncService.createUser).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Registration successful',
        userId: 42,
      });
    });

    // AUTH-U-014
    it('should normalize email to trimmed lowercase before save', async () => {
      // Arrange
      const dto = baseRegisterDto();
      dto.email = '  Mixed.Case@Example.COM  ';

      // Act
      await service.register(dto);

      // Assert
      expect(queryRunnerManager.create).toHaveBeenCalledWith(
        User,
        expect.objectContaining({ USER_EMAIL: 'mixed.case@example.com' }),
      );
      expect(moodleSyncService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'mixed.case@example.com',
          email: 'mixed.case@example.com',
        }),
        expect.any(Object),
        queryRunnerManager,
      );
    });

    // AUTH-U-015
    it('should reject duplicate email and rollback', async () => {
      // Arrange
      queryRunnerManager.findOne.mockResolvedValueOnce({
        USER_ID: 99,
        USER_EMAIL: 'new.user@example.com',
      });

      // Act & Assert
      await expect(service.register(baseRegisterDto())).rejects.toThrow(
        'อีเมลนี้ถูกใช้งานแล้ว',
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    // AUTH-U-016
    it('should reject duplicate national ID for thai userType', async () => {
      // Arrange
      queryRunnerManager.findOne
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ USER_ID: 7 }); // national ID check

      // Act & Assert
      await expect(service.register(baseRegisterDto())).rejects.toThrow(
        'เลขบัตรประชาชนนี้ถูกใช้งานแล้ว',
      );
      expect(queryRunnerManager.findOne).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          where: { USER_NATIONAL_ID: '1234567890123' },
        }),
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    // AUTH-U-017
    it('should reject duplicate passport for foreigner userType', async () => {
      // Arrange
      const dto = baseRegisterDto();
      dto.userType = 'foreigner';
      dto.nationalId = 'P1234567';
      queryRunnerManager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ USER_ID: 8 });

      // Act & Assert
      await expect(service.register(dto)).rejects.toThrow(
        'Passport number already exists',
      );
      expect(queryRunnerManager.findOne).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          where: { USER_PASSPORT_NO: 'P1234567' },
        }),
      );
    });

    // AUTH-U-018
    it('should set national ID for thai and passport for foreigner', async () => {
      // Arrange — thai
      const thaiDto = baseRegisterDto();
      thaiDto.userType = 'thai';
      thaiDto.nationalId = '1111111111111';

      // Act
      await service.register(thaiDto);

      // Assert
      expect(queryRunnerManager.create).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          USER_NATIONAL_ID: '1111111111111',
          USER_PASSPORT_NO: undefined,
        }),
      );

      // Arrange — foreigner (reset mocks for second call)
      queryRunnerManager.create.mockClear();
      queryRunnerManager.findOne.mockResolvedValue(null);
      const foreignDto = baseRegisterDto();
      foreignDto.userType = 'foreigner';
      foreignDto.nationalId = 'AB123456';

      // Act
      await service.register(foreignDto);

      // Assert
      expect(queryRunnerManager.create).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          USER_NATIONAL_ID: undefined,
          USER_PASSPORT_NO: 'AB123456',
        }),
      );
    });

    // AUTH-U-019
    it('should always set userThaidSynced false on register (thai or foreigner)', async () => {
      // Arrange & Act — thai
      await service.register(baseRegisterDto());

      // Assert — nationality alone must not mark ThaiD synced
      expect(queryRunnerManager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ userThaidSynced: false }),
      );

      // Arrange & Act — foreigner
      queryRunnerManager.create.mockClear();
      queryRunnerManager.findOne.mockResolvedValue(null);
      const foreignDto = baseRegisterDto();
      foreignDto.userType = 'foreigner';
      foreignDto.nationalId = 'XY999';

      await service.register(foreignDto);

      // Assert
      expect(queryRunnerManager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ userThaidSynced: false }),
      );
    });

    it('sets userThaidSynced when the ThaID proof matches the national id', async () => {
      thaidHandoff.peekRegisterProof.mockResolvedValue({ pid: '1234567890123' });
      const dto = baseRegisterDto();
      dto.thaidRegistrationToken = 'proof-token';

      await service.register(dto);

      expect(queryRunnerManager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ userThaidSynced: true }),
      );
      expect(thaidHandoff.consumeRegisterProof).toHaveBeenCalledWith('proof-token');
    });

    it('rejects a ThaID proof that does not match the national id', async () => {
      thaidHandoff.peekRegisterProof.mockResolvedValue({ pid: '9999999999999' });
      const dto = baseRegisterDto();
      dto.thaidRegistrationToken = 'proof-token';

      await expect(service.register(dto)).rejects.toThrow(
        'เลขบัตรประชาชนไม่ตรงกับข้อมูลจาก ThaID',
      );
      expect(queryRunner.connect).not.toHaveBeenCalled();
    });

    // AUTH-U-020
    it('should parse spaced birthdate into Date for profile', async () => {
      // Arrange
      const dto = baseRegisterDto();
      dto.birthdate = '2005 07 22';

      // Act
      await service.register(dto);

      // Assert
      const createCalls = queryRunnerManager.create.mock.calls as Array<
        [unknown, Record<string, unknown> | undefined]
      >;
      const profileCreateCall = createCalls.find(
        (call) =>
          call[1] !== undefined &&
          typeof call[1] === 'object' &&
          'userDateOfBirth' in call[1],
      );
      expect(profileCreateCall).toBeDefined();
      const profileData = profileCreateCall![1] as {
        userDateOfBirth: Date | null;
      };
      expect(profileData.userDateOfBirth).toBeInstanceOf(Date);
      expect(profileData.userDateOfBirth!.getFullYear()).toBe(2005);
      expect(profileData.userDateOfBirth!.getMonth()).toBe(6); // July = 6
      expect(profileData.userDateOfBirth!.getDate()).toBe(22);
    });

    // AUTH-U-021
    it('should store null birthdate when parse is invalid', async () => {
      // Arrange
      const dto = baseRegisterDto();
      dto.birthdate = 'not-a-date';

      // Act
      await service.register(dto);

      // Assert
      const createCalls = queryRunnerManager.create.mock.calls as Array<
        [unknown, Record<string, unknown> | undefined]
      >;
      const profileCreateCall = createCalls.find(
        (call) =>
          call[1] !== undefined &&
          typeof call[1] === 'object' &&
          'userDateOfBirth' in call[1],
      );
      const profileData = profileCreateCall![1] as {
        userDateOfBirth: Date | null;
      };
      expect(profileData.userDateOfBirth).toBeNull();
    });

    // AUTH-U-022
    it('should rollback when Moodle createUser fails', async () => {
      // Arrange
      moodleSyncService.createUser.mockRejectedValue(
        new Error('Moodle unavailable'),
      );

      // Act & Assert
      await expect(service.register(baseRegisterDto())).rejects.toThrow(
        'Moodle unavailable',
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    // AUTH-U-023
    it('should still succeed when profile image persist throws after commit', async () => {
      // Arrange
      const dto = baseRegisterDto();
      dto.profileImage = 'data:image/png;base64,AAAA';
      platformGatewayService.uploadBuffer.mockRejectedValue(
        new Error('upload failed'),
      );

      // Act
      const result = await service.register(dto);

      // Assert
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Registration successful',
        userId: 42,
      });
    });
  });

  describe('persistRegisterProfileImage', () => {
    const priv = () => service as unknown as AuthServicePrivate;

    // AUTH-U-024
    it('should skip upload and save when data URL is invalid', async () => {
      // Arrange
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      // Act
      await priv().persistRegisterProfileImage('data:not-valid', 42);

      // Assert
      expect(platformGatewayService.uploadBuffer).not.toHaveBeenCalled();
      expect(dataSource.getRepository).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    // AUTH-U-025
    it('should save plain path directly without upload', async () => {
      // Arrange
      const plainPath = '/user_images/42/profile.jpg';

      // Act
      await priv().persistRegisterProfileImage(plainPath, 42);

      // Assert
      expect(platformGatewayService.uploadBuffer).not.toHaveBeenCalled();
      expect(dataSource.getRepository).toHaveBeenCalledWith(UserImage);
      expect(userImageRepo.create).toHaveBeenCalledWith({
        USER_ID: 42,
        USER_IMAGE_URL: plainPath,
      });
      expect(userImageRepo.save).toHaveBeenCalled();
    });
  });

  describe('deriveName', () => {
    const priv = () => service as unknown as AuthServicePrivate;

    // AUTH-U-026
    it('should split full name into firstname and lastname for Moodle', () => {
      // Arrange / Act
      const result = priv().deriveName('Somchai Jaidee Extra', 'x@y.com');

      // Assert
      expect(result).toEqual({
        firstname: 'Somchai',
        lastname: 'Jaidee Extra',
      });
    });

    // AUTH-U-027
    it('should fallback to email local-part when full name is empty', () => {
      // Arrange / Act
      const result = priv().deriveName('   ', 'localpart@example.com');

      // Assert
      expect(result).toEqual({
        firstname: 'localpart',
        lastname: 'localpart',
      });
    });
  });

  describe('getProfile', () => {
    // AUTH-U-028
    it('should map user and profile fields for response', async () => {
      // Arrange
      usersService.findById.mockResolvedValue({
        USER_ID: 10,
        USER_CODE: 'U00000010',
        USER_EMAIL: 'profile@example.com',
        USER_NATIONAL_ID: '1234567890123',
        USER_PASSPORT_NO: null,
        USER_STATUS: 'ACTIVE',
        ROLES_ID: [{ ROLE_NAME: RoleEnum.STAFF }],
        PROFILE: {
          userTitleTh: 'นาย',
          userFullnameTh: 'สมชาย',
          userTitleEn: 'Mr.',
          userFullnameEn: 'Somchai',
          userDateOfBirth: '1990-01-15',
          userPhone: '0811111111',
          userEducation: 'ปริญญาตรี',
          userCountry: 'Thailand',
          userAddress: 'addr',
          userFaculty: 'IS',
          userInstitution: 'BUU',
          userThaidSynced: true,
          userRemark: 'note',
        },
        IMAGE: { USER_IMAGE_URL: '/img/10.jpg' },
      } as unknown as Awaited<ReturnType<UsersService['findById']>>);

      // Act
      const profile = await service.getProfile({
        actorType: 'user',
        userId: 10,
        email: 'profile@example.com',
        role: RoleEnum.STAFF,
        roles: [RoleEnum.STAFF],
      });

      // Assert
      expect(profile).toMatchObject({
        id: 10,
        actorType: 'user',
        userCode: 'U00000010',
        email: 'profile@example.com',
        nationalId: '1234567890123',
        status: 'ACTIVE',
        role: RoleEnum.STAFF,
        roles: [RoleEnum.STAFF],
        titleTH: 'นาย',
        fullNameTH: 'สมชาย',
        titleEN: 'Mr.',
        fullNameEN: 'Somchai',
        phone: '0811111111',
        thaidSynced: true,
        remark: 'note',
        userImagePath: '/img/10.jpg',
      });
    });

    // AUTH-U-029
    it('should throw when user is not found', async () => {
      // Arrange
      usersService.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getProfile({
          actorType: 'user',
          userId: 999,
          email: 'x@example.com',
          role: RoleEnum.CANDIDATE,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getProfile({
          actorType: 'user',
          userId: 999,
          email: 'x@example.com',
          role: RoleEnum.CANDIDATE,
        }),
      ).rejects.toThrow('User not found');
    });

    // AUTH-U-030
    it('should fallback roles to candidate when ROLES_ID is empty', async () => {
      // Arrange
      usersService.findById.mockResolvedValue({
        USER_ID: 11,
        USER_CODE: 'U00000011',
        USER_EMAIL: 'empty-roles@example.com',
        USER_NATIONAL_ID: null,
        USER_PASSPORT_NO: null,
        USER_STATUS: 'ACTIVE',
        ROLES_ID: [],
        PROFILE: null,
        IMAGE: null,
      } as unknown as Awaited<ReturnType<UsersService['findById']>>);

      // Act
      const profile = await service.getProfile({
        actorType: 'user',
        userId: 11,
        email: 'empty-roles@example.com',
        role: RoleEnum.CANDIDATE,
      });

      // Assert
      expect(profile.role).toBe(RoleEnum.CANDIDATE);
      expect(profile.roles).toEqual([RoleEnum.CANDIDATE]);
    });
  });
});
