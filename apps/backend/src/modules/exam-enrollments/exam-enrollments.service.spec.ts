import type { Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import type { AuthenticatedUser } from 'src/common/utils/authz.util';
import { evaluateRegistrationWindow } from 'src/common/utils/exam-registration-window.util';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import { EXAM_TYPE } from '../exam/constants/exam.constants';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
  ExamVerifyStatus,
} from './entities/exam-enrollment.entity';
import { ExamEnrollmentsService } from './exam-enrollments.service';
import {
  ExamSession,
  ExamSessionStatus,
} from '../exam-sessions/entities/exam-session.entity';
import { ExamSessionLocation } from '../exam-session-locations/entities/exam-session-location.entity';
import { ExamPasscode } from '../exam/entities/exam-passcode.entity';
import { ExamPasscodeLog } from '../exam/entities/exam-passcode-log.entity';
import { User } from '../users/entities/user.entity';
import { TestTakerIdService } from './test-taker-id.service';
import { PlatformGatewayService } from '../platform-gateway/platform-gateway.service';
import type { RequestFixDto } from './dto/request-fix.dto';

type MockFn = jest.Mock;

type EnrollmentRepoMock = {
  findAndCount: MockFn;
  find: MockFn;
  findOne: MockFn;
  findOneOrFail: MockFn;
  save: MockFn;
  merge: MockFn;
  create: MockFn;
  update: MockFn;
  createQueryBuilder: MockFn;
  manager: { save: MockFn };
};

jest.mock('src/common/utils/exam-registration-window.util', () => ({
  evaluateRegistrationWindow: jest.fn(() => 'open'),
}));

jest.mock('./entities/exam-enrollment.entity', () => ({
  ExamEnrollment: class ExamEnrollment {},
  ExamEnrollmentStatus: {
    UNPAID: 0,
    PAID: 1,
    SEAT_ASSIGNED: 2,
    SEAT_PUBLISHED: 3,
    ATTENDED: 4,
    CANCELLED: 5,
    MISSING: 6,
  },
  ExamVerifyStatus: {
    UNCHECKED: 0,
    PASS: 1,
    WAIT_FIXED: 2,
    CANCELLED: 3,
  },
}));

jest.mock('../exam-location-seats/entities/exam-location-seat.entity', () => ({
  ExamLocationSeat: class ExamLocationSeat {},
}));

jest.mock(
  '../exam-session-locations/entities/exam-session-location.entity',
  () => ({
    ExamSessionLocation: class ExamSessionLocation {},
  }),
);

jest.mock('../exam-sessions/entities/exam-session.entity', () => ({
  ExamSession: class ExamSession {},
  ExamSessionStatus: {
    DRAFT: 0,
    OPEN: 1,
    SEAT_ALLOCATED: 2,
    VOUCHER_SENT: 3,
    COMPLETED: 4,
    CANCELLED: 5,
  },
}));

jest.mock('../exam/entities/exam-passcode.entity', () => ({
  ExamPasscode: class ExamPasscode {},
}));

jest.mock('../exam/entities/exam-passcode-log.entity', () => ({
  ExamPasscodeLog: class ExamPasscodeLog {},
}));

jest.mock('../users/entities/user.entity', () => ({
  User: class User {},
}));

type QueryBuilderMock = {
  select: jest.Mock;
  addSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  groupBy: jest.Mock;
  addGroupBy: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  innerJoin: jest.Mock;
  leftJoin: jest.Mock;
  clone: jest.Mock;
  getRawMany: jest.Mock;
  getRawOne: jest.Mock;
  getOne: jest.Mock;
};

const createQueryBuilderMock = (
  overrides: Partial<QueryBuilderMock> = {},
): QueryBuilderMock => {
  const qb = {
    select: jest.fn(),
    addSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    groupBy: jest.fn(),
    addGroupBy: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    innerJoin: jest.fn(),
    leftJoin: jest.fn(),
    clone: jest.fn(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
    getOne: jest.fn().mockResolvedValue(null),
    ...overrides,
  };

  const chain = () => qb;
  qb.select.mockImplementation(chain);
  qb.addSelect.mockImplementation(chain);
  qb.where.mockImplementation(chain);
  qb.andWhere.mockImplementation(chain);
  qb.groupBy.mockImplementation(chain);
  qb.addGroupBy.mockImplementation(chain);
  qb.orderBy.mockImplementation(chain);
  qb.addOrderBy.mockImplementation(chain);
  qb.skip.mockImplementation(chain);
  qb.take.mockImplementation(chain);
  qb.innerJoin.mockImplementation(chain);
  qb.leftJoin.mockImplementation(chain);
  qb.clone.mockImplementation(() => qb);
  return qb;
};

describe('ExamEnrollmentsService', () => {
  let service: ExamEnrollmentsService;
  let examEnrollmentRepository: EnrollmentRepoMock;
  let examSessionRepository: {
    find: MockFn;
    findOne: MockFn;
  };
  let examSessionLocationRepository: {
    find: MockFn;
    findOne: MockFn;
  };
  let examPasscodeRepository: { findOne: MockFn };
  let userRepository: { findOne: MockFn };
  let examPasscodeLogRepository: { create: MockFn; save: MockFn };
  let dataSource: { transaction: MockFn };
  let testTakerIdService: { assign: MockFn };
  let platformGatewayService: { sendEmail: MockFn };
  let evaluateWindowMock: jest.MockedFunction<
    typeof evaluateRegistrationWindow
  >;

  const adminUser: AuthenticatedUser = {
    userId: 99,
    email: 'admin@buu.ac.th',
    role: RoleEnum.ADMIN,
  };
  const candidateUser: AuthenticatedUser = {
    userId: 7,
    email: 'candidate@buu.ac.th',
    role: RoleEnum.CANDIDATE,
  };

  const openExam = {
    EXAM_ID: 100,
    EXAM_TYPE: EXAM_TYPE.GENERAL,
    EXAM_NAME: 'BUU-GET Round 1',
    EXAM_REG_START_DATE: '2025-01-01T00:00:00+07:00',
    EXAM_REG_END_DATE: '2025-12-31T23:59:59+07:00',
    EXAM_DATE: '2025-06-01',
    EXAM_ROUND: '1',
    EXAM_FISCAL_YEAR: '2568',
  };

  const baseSession = {
    SS_ID: 10,
    EXAM_ID: 100,
    SS_CAPACITY: 50,
    SS_START_TIME: '09:00:00',
    SS_END_TIME: '12:00:00',
    SS_SESSION_STATUS: ExamSessionStatus.OPEN,
    EXAM: openExam,
  } as unknown as ExamSession;

  const baseUser = {
    USER_ID: 7,
    USER_NATIONAL_ID: '1234567890123',
    USER_EMAIL: 'candidate@buu.ac.th',
    PROFILE: {
      userTitleTh: 'นาย',
      userFullnameTh: 'ทดสอบ ระบบ',
      userRemark: null,
    },
  } as unknown as User;

  const createService = (): ExamEnrollmentsService =>
    new ExamEnrollmentsService(
      examEnrollmentRepository as unknown as Repository<ExamEnrollment>,
      examSessionRepository as unknown as Repository<ExamSession>,
      examSessionLocationRepository as unknown as Repository<ExamSessionLocation>,
      {} as never,
      examPasscodeRepository as unknown as Repository<ExamPasscode>,
      userRepository as unknown as Repository<User>,
      {} as never,
      platformGatewayService as unknown as PlatformGatewayService,
      examPasscodeLogRepository as unknown as Repository<ExamPasscodeLog>,
      dataSource as never,
      testTakerIdService as unknown as TestTakerIdService,
    );

  const mockCreateFlowQueryBuilders = (opts?: {
    activeCounts?: Array<{ SESSION_ID: number; CNT: string }>;
    existingEnrollment?: ExamEnrollment | null;
  }) => {
    const countQb = createQueryBuilderMock({
      getRawMany: jest.fn().mockResolvedValue(opts?.activeCounts ?? []),
    });
    const dupQb = createQueryBuilderMock({
      getOne: jest.fn().mockResolvedValue(opts?.existingEnrollment ?? null),
    });
    examEnrollmentRepository.createQueryBuilder
      .mockReturnValueOnce(countQb)
      .mockReturnValueOnce(dupQb);
    return { countQb, dupQb };
  };

  beforeEach(() => {
    evaluateWindowMock = evaluateRegistrationWindow as jest.MockedFunction<
      typeof evaluateRegistrationWindow
    >;
    evaluateWindowMock.mockReturnValue('open');

    examEnrollmentRepository = {
      findAndCount: jest.fn().mockResolvedValue([[{ ERM_ID: 10 }], 1]),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn(async (entity: unknown) => entity),
      merge: jest.fn(
        (entity: ExamEnrollment, dto: Partial<ExamEnrollment>) => ({
          ...entity,
          ...dto,
        }),
      ),
      create: jest.fn(
        (dto: Partial<ExamEnrollment>) =>
          ({
            ...dto,
            ERM_STATUS: ExamEnrollmentStatus.UNPAID,
          }) as unknown as ExamEnrollment,
      ),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(),
      manager: { save: jest.fn().mockResolvedValue(undefined) },
    };
    examSessionRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    examSessionLocationRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    examPasscodeRepository = {
      findOne: jest.fn(),
    };
    userRepository = {
      findOne: jest.fn(),
    };
    examPasscodeLogRepository = {
      create: jest.fn((data: unknown) => data),
      save: jest.fn(async (entity: unknown) => entity),
    };
    dataSource = {
      transaction: jest.fn(),
    };
    testTakerIdService = {
      assign: jest.fn().mockResolvedValue(undefined),
    };
    platformGatewayService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };
    service = createService();
  });

  describe('findAll', () => {
    it('ENR-U-047: returns paginated enrollments with defaults DESC', async () => {
      // Arrange — defaults set in beforeEach

      // Act
      const result = await service.findAll();

      // Assert
      expect(examEnrollmentRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: PAGINATION_DEFAULT_LIMIT,
          order: { ERM_ID: 'DESC' },
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(PAGINATION_DEFAULT_PAGE);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('ENR-U-048: throws NotFound when enrollment is missing', async () => {
      // Arrange
      examEnrollmentRepository.findOne.mockResolvedValue(null);

      // Act + Assert
      await expect(service.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      USER_ID: 7,
      SESSION_ID: 10,
    };

    const setupHappyCreate = (session: ExamSession = baseSession) => {
      examSessionRepository.findOne.mockResolvedValue(session);
      userRepository.findOne.mockResolvedValue(baseUser);
      examSessionRepository.find.mockResolvedValue([session]);
      mockCreateFlowQueryBuilders({ activeCounts: [] });
      examEnrollmentRepository.create.mockImplementation(
        (dto: Partial<ExamEnrollment>) => ({
          ...dto,
          ERM_ID: undefined,
          ERM_STATUS: ExamEnrollmentStatus.UNPAID,
        }),
      );
      examEnrollmentRepository.save.mockImplementation(
        async (entity: ExamEnrollment) => ({ ...entity, ERM_ID: 55 }),
      );
      examEnrollmentRepository.findOneOrFail.mockResolvedValue({
        ERM_ID: 55,
        USER_ID: 7,
        SESSION_ID: session.SS_ID,
        ERM_STATUS: ExamEnrollmentStatus.UNPAID,
      });
    };

    it('ENR-U-001: creates regular enrollment as UNPAID', async () => {
      // Arrange
      setupHappyCreate();

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result.ERM_STATUS).toBe(ExamEnrollmentStatus.UNPAID);
      expect(examEnrollmentRepository.save).toHaveBeenCalled();
      expect(examPasscodeLogRepository.save).not.toHaveBeenCalled();
    });

    it('ENR-U-002: creates SPECIAL as PAID and writes passcode log', async () => {
      // Arrange
      const specialSession = {
        ...baseSession,
        EXAM: { ...openExam, EXAM_TYPE: EXAM_TYPE.SPECIAL },
      } as unknown as ExamSession;
      setupHappyCreate(specialSession);
      examPasscodeRepository.findOne.mockResolvedValue({
        PASSCODE_ID: 3,
        PASSCODE: 'ABC123',
        EXAM_ID: 100,
        NATIONAL_ID: '1234567890123',
      });
      examEnrollmentRepository.findOneOrFail.mockResolvedValue({
        ERM_ID: 55,
        USER_ID: 7,
        SESSION_ID: 10,
        ERM_STATUS: ExamEnrollmentStatus.PAID,
        ERM_VERIFY_STATUS: ExamVerifyStatus.UNCHECKED,
      });

      // Act
      const result = await service.create({
        ...createDto,
        PASSCODE: 'ABC123',
      });

      // Assert
      expect(examEnrollmentRepository.create).toHaveBeenCalled();
      const savedArg = examEnrollmentRepository.save.mock
        .calls[0][0] as ExamEnrollment;
      expect(savedArg.ERM_STATUS).toBe(ExamEnrollmentStatus.PAID);
      expect(examPasscodeLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          EXAM_ID: 100,
          PASSCODE_ID: 3,
          PASSCODE: 'ABC123',
        }),
      );
      expect(examPasscodeLogRepository.save).toHaveBeenCalled();
      expect(result.ERM_STATUS).toBe(ExamEnrollmentStatus.PAID);
    });

    it('ENR-U-003: rejects SPECIAL create without PASSCODE', async () => {
      // Arrange
      const specialSession = {
        ...baseSession,
        EXAM: { ...openExam, EXAM_TYPE: EXAM_TYPE.SPECIAL },
      } as unknown as ExamSession;
      examSessionRepository.findOne.mockResolvedValue(specialSession);
      userRepository.findOne.mockResolvedValue(baseUser);
      examSessionRepository.find.mockResolvedValue([specialSession]);
      mockCreateFlowQueryBuilders();

      // Act + Assert
      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('ENR-U-004: rejects SPECIAL create with invalid PASSCODE', async () => {
      // Arrange
      const specialSession = {
        ...baseSession,
        EXAM: { ...openExam, EXAM_TYPE: EXAM_TYPE.SPECIAL },
      } as unknown as ExamSession;
      examSessionRepository.findOne.mockResolvedValue(specialSession);
      userRepository.findOne.mockResolvedValue(baseUser);
      examSessionRepository.find.mockResolvedValue([specialSession]);
      mockCreateFlowQueryBuilders();
      examPasscodeRepository.findOne.mockResolvedValue(null);

      // Act + Assert
      await expect(
        service.create({ ...createDto, PASSCODE: 'BAD' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('ENR-U-005: rejects when registration window is not_open', async () => {
      // Arrange
      examSessionRepository.findOne.mockResolvedValue(baseSession);
      userRepository.findOne.mockResolvedValue(baseUser);
      examSessionRepository.find.mockResolvedValue([baseSession]);
      mockCreateFlowQueryBuilders();
      evaluateWindowMock.mockReturnValue('not_open');

      // Act + Assert
      await expect(service.create(createDto)).rejects.toMatchObject({
        response: expect.objectContaining({ message: 'REGISTRATION_NOT_OPEN' }),
      });
    });

    it('ENR-U-006: rejects when registration window is closed', async () => {
      // Arrange
      examSessionRepository.findOne.mockResolvedValue(baseSession);
      userRepository.findOne.mockResolvedValue(baseUser);
      examSessionRepository.find.mockResolvedValue([baseSession]);
      mockCreateFlowQueryBuilders();
      evaluateWindowMock.mockReturnValue('closed');

      // Act + Assert
      await expect(service.create(createDto)).rejects.toMatchObject({
        response: expect.objectContaining({ message: 'REGISTRATION_CLOSED' }),
      });
    });

    it('ENR-U-007: rejects when exam has started', async () => {
      // Arrange
      examSessionRepository.findOne.mockResolvedValue(baseSession);
      userRepository.findOne.mockResolvedValue(baseUser);
      examSessionRepository.find.mockResolvedValue([baseSession]);
      mockCreateFlowQueryBuilders();
      evaluateWindowMock.mockReturnValue('exam_started');

      // Act + Assert
      await expect(service.create(createDto)).rejects.toMatchObject({
        response: expect.objectContaining({ message: 'EXAM_STARTED' }),
      });
    });

    it('ENR-U-008: rejects invalid window as REGISTRATION_CLOSED', async () => {
      // Arrange
      examSessionRepository.findOne.mockResolvedValue(baseSession);
      userRepository.findOne.mockResolvedValue(baseUser);
      examSessionRepository.find.mockResolvedValue([baseSession]);
      mockCreateFlowQueryBuilders();
      evaluateWindowMock.mockReturnValue('invalid');

      // Act + Assert
      await expect(service.create(createDto)).rejects.toMatchObject({
        response: expect.objectContaining({ message: 'REGISTRATION_CLOSED' }),
      });
    });

    it('ENR-U-009: rejects FULL when session and sisters are at capacity', async () => {
      // Arrange
      const fullSession = {
        ...baseSession,
        SS_CAPACITY: 2,
      } as unknown as ExamSession;
      const sister = {
        ...baseSession,
        SS_ID: 11,
        SS_CAPACITY: 2,
      } as unknown as ExamSession;
      examSessionRepository.findOne.mockResolvedValue(fullSession);
      userRepository.findOne.mockResolvedValue(baseUser);
      examSessionRepository.find.mockResolvedValue([fullSession, sister]);
      mockCreateFlowQueryBuilders({
        activeCounts: [
          { SESSION_ID: 10, CNT: '2' },
          { SESSION_ID: 11, CNT: '2' },
        ],
      });

      // Act + Assert
      await expect(service.create(createDto)).rejects.toMatchObject({
        response: expect.objectContaining({ message: 'FULL' }),
      });
    });

    it('ENR-U-010: rewrites SESSION_ID to sister with capacity', async () => {
      // Arrange
      const fullSession = {
        ...baseSession,
        SS_CAPACITY: 2,
      } as unknown as ExamSession;
      const sister = {
        ...baseSession,
        SS_ID: 11,
        SS_CAPACITY: 5,
        EXAM: openExam,
      } as unknown as ExamSession;
      examSessionRepository.findOne.mockResolvedValue(fullSession);
      userRepository.findOne.mockResolvedValue(baseUser);
      examSessionRepository.find.mockResolvedValue([fullSession, sister]);
      mockCreateFlowQueryBuilders({
        activeCounts: [
          { SESSION_ID: 10, CNT: '2' },
          { SESSION_ID: 11, CNT: '1' },
        ],
      });
      examEnrollmentRepository.create.mockImplementation(
        (dto: Partial<ExamEnrollment>) => ({
          ...dto,
          ERM_STATUS: ExamEnrollmentStatus.UNPAID,
        }),
      );
      examEnrollmentRepository.save.mockImplementation(
        async (entity: ExamEnrollment) => ({ ...entity, ERM_ID: 88 }),
      );
      examEnrollmentRepository.findOneOrFail.mockResolvedValue({
        ERM_ID: 88,
        SESSION_ID: 11,
        ERM_STATUS: ExamEnrollmentStatus.UNPAID,
      });

      // Act
      const dto = { USER_ID: 7, SESSION_ID: 10 };
      await service.create(dto);

      // Assert
      expect(dto.SESSION_ID).toBe(11);
      expect(examEnrollmentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ SESSION_ID: 11 }),
      );
    });

    it('ENR-U-011: rejects duplicate active enrollment in same slot', async () => {
      // Arrange
      examSessionRepository.findOne.mockResolvedValue(baseSession);
      userRepository.findOne.mockResolvedValue(baseUser);
      examSessionRepository.find.mockResolvedValue([baseSession]);
      mockCreateFlowQueryBuilders({
        existingEnrollment: {
          ERM_ID: 1,
          USER_ID: 7,
        } as ExamEnrollment,
      });

      // Act + Assert
      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('ENR-U-012: throws NotFound when session is missing', async () => {
      // Arrange
      examSessionRepository.findOne.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(baseUser);

      // Act + Assert
      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('ENR-U-013: throws NotFound when user is missing', async () => {
      // Arrange
      examSessionRepository.findOne.mockResolvedValue(baseSession);
      userRepository.findOne.mockResolvedValue(null);

      // Act + Assert
      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('ENR-U-014: normalizes PHYSICAL_STATUS ไม่มีข้อมูลข้างต้น to ทั่วไป', async () => {
      // Arrange
      setupHappyCreate();

      // Act
      await service.create({
        ...createDto,
        PHYSICAL_STATUS: 'ไม่มีข้อมูลข้างต้น',
      });

      // Assert
      const created = examEnrollmentRepository.create.mock.results[0]
        ?.value as ExamEnrollment;
      // create returns entity; physical status is set on enrollment after create
      const savedArg = examEnrollmentRepository.save.mock
        .calls[0][0] as ExamEnrollment;
      expect(savedArg.ERM_PHYSICAL_STATUS).toBe('ทั่วไป');
      expect(created).toBeDefined();
    });
  });

  describe('validatePasscode', () => {
    it('ENR-U-015: succeeds for SPECIAL with matching passcode', async () => {
      // Arrange
      examSessionRepository.findOne.mockResolvedValue({
        ...baseSession,
        EXAM: { ...openExam, EXAM_TYPE: EXAM_TYPE.SPECIAL },
      });
      userRepository.findOne.mockResolvedValue(baseUser);
      examPasscodeRepository.findOne.mockResolvedValue({
        PASSCODE_ID: 1,
        PASSCODE: 'OK',
      });

      // Act + Assert
      await expect(
        service.validatePasscode(7, { SESSION_ID: 10, PASSCODE: 'OK' }),
      ).resolves.toBeUndefined();
    });

    it('ENR-U-016: no-ops for non-SPECIAL exam type', async () => {
      // Arrange
      examSessionRepository.findOne.mockResolvedValue(baseSession);

      // Act
      await service.validatePasscode(7, { SESSION_ID: 10, PASSCODE: 'ANY' });

      // Assert
      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(examPasscodeRepository.findOne).not.toHaveBeenCalled();
    });

    it('ENR-U-017: rejects invalid passcode for SPECIAL', async () => {
      // Arrange
      examSessionRepository.findOne.mockResolvedValue({
        ...baseSession,
        EXAM: { ...openExam, EXAM_TYPE: EXAM_TYPE.SPECIAL },
      });
      userRepository.findOne.mockResolvedValue(baseUser);
      examPasscodeRepository.findOne.mockResolvedValue(null);

      // Act + Assert
      await expect(
        service.validatePasscode(7, { SESSION_ID: 10, PASSCODE: 'BAD' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('checkIn', () => {
    it('ENR-U-018: sets ATTENDED and check-in time for eligible enrollment', async () => {
      // Arrange
      const enrollment = {
        ERM_ID: 1,
        ERM_STATUS: ExamEnrollmentStatus.PAID,
      } as ExamEnrollment;
      examEnrollmentRepository.findOne
        .mockResolvedValueOnce(enrollment)
        .mockResolvedValueOnce({
          ...enrollment,
          ERM_STATUS: ExamEnrollmentStatus.ATTENDED,
        });
      examEnrollmentRepository.save.mockImplementation(
        async (e: ExamEnrollment) => e,
      );

      // Act
      const result = await service.checkIn(1, {});

      // Assert
      expect(examEnrollmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ERM_STATUS: ExamEnrollmentStatus.ATTENDED,
          ERM_ATTEND_CHECK_IN_TIME: expect.any(Date),
        }),
      );
      expect(result.ERM_STATUS).toBe(ExamEnrollmentStatus.ATTENDED);
    });

    it('ENR-U-019: uses explicit check-in timestamp from DTO', async () => {
      // Arrange
      const stamp = '2025-06-01T09:15:00.000Z';
      const enrollment = {
        ERM_ID: 1,
        ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
      } as ExamEnrollment;
      examEnrollmentRepository.findOne
        .mockResolvedValueOnce(enrollment)
        .mockResolvedValueOnce(enrollment);
      examEnrollmentRepository.save.mockImplementation(
        async (e: ExamEnrollment) => e,
      );

      // Act
      await service.checkIn(1, { ERM_ATTEND_CHECK_IN_TIME: stamp });

      // Assert
      const saved = examEnrollmentRepository.save.mock
        .calls[0][0] as ExamEnrollment;
      expect(saved.ERM_ATTEND_CHECK_IN_TIME).toEqual(new Date(stamp));
    });

    it('ENR-U-020: rejects checkIn for UNPAID', async () => {
      // Arrange
      examEnrollmentRepository.findOne.mockResolvedValue({
        ERM_ID: 1,
        ERM_STATUS: ExamEnrollmentStatus.UNPAID,
      });

      // Act + Assert
      await expect(service.checkIn(1, {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('ENR-U-021: rejects checkIn for CANCELLED', async () => {
      // Arrange
      examEnrollmentRepository.findOne.mockResolvedValue({
        ERM_ID: 1,
        ERM_STATUS: ExamEnrollmentStatus.CANCELLED,
      });

      // Act + Assert
      await expect(service.checkIn(1, {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('ENR-U-022: throws NotFound when enrollment missing', async () => {
      // Arrange
      examEnrollmentRepository.findOne.mockResolvedValue(null);

      // Act + Assert
      await expect(service.checkIn(999, {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('ENR-U-023: admin PAID + seat assignment becomes SEAT_ASSIGNED', async () => {
      // Arrange
      const enrollment = {
        ERM_ID: 1,
        USER_ID: 7,
        SESSION_ID: 10,
        ERM_STATUS: ExamEnrollmentStatus.PAID,
        ERM_SEAT_LABEL: null,
        SL_ID: null,
        VOUCHERS: [],
      } as unknown as ExamEnrollment;
      jest.spyOn(service, 'findOne').mockResolvedValue(enrollment);
      examSessionLocationRepository.findOne.mockResolvedValue({
        SL_ID: 5,
        SS_ID: 10,
      });
      examSessionRepository.find.mockResolvedValue([
        {
          SS_ID: 10,
          SS_SESSION_STATUS: ExamSessionStatus.OPEN,
        } as ExamSession,
      ]);
      examEnrollmentRepository.find.mockResolvedValue([
        { ...enrollment, VOUCHERS: [] } as ExamEnrollment,
      ]);
      examEnrollmentRepository.findOne.mockResolvedValue(null);
      examEnrollmentRepository.save
        .mockResolvedValueOnce({
          ...enrollment,
          SL_ID: 5,
          ERM_SEAT_LABEL: 'A1',
          ERM_STATUS: ExamEnrollmentStatus.PAID,
        })
        .mockResolvedValueOnce({
          ...enrollment,
          SL_ID: 5,
          ERM_SEAT_LABEL: 'A1',
          ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
        });
      (service.findOne as jest.Mock).mockResolvedValue({
        ...enrollment,
        SL_ID: 5,
        ERM_SEAT_LABEL: 'A1',
        ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
      });

      // Act
      const result = await service.update(
        1,
        { ERM_SEAT_LABEL: 'A1', SL_ID: 5 },
        adminUser,
      );

      // Assert
      expect(result.ERM_STATUS).toBe(ExamEnrollmentStatus.SEAT_ASSIGNED);
      expect(examEnrollmentRepository.save).toHaveBeenCalledTimes(2);
    });

    it('ENR-U-024: admin clearing seat on SEAT_ASSIGNED reverts to PAID', async () => {
      // Arrange
      const enrollment = {
        ERM_ID: 1,
        USER_ID: 7,
        SESSION_ID: 10,
        ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
        ERM_SEAT_LABEL: 'A1',
        SL_ID: 5,
        VOUCHERS: [],
      } as unknown as ExamEnrollment;
      jest.spyOn(service, 'findOne').mockResolvedValue(enrollment);
      examSessionLocationRepository.findOne.mockResolvedValue({
        SL_ID: 5,
        SS_ID: 10,
      });
      examSessionRepository.find.mockResolvedValue([
        {
          SS_ID: 10,
          SS_SESSION_STATUS: ExamSessionStatus.SEAT_ALLOCATED,
        } as ExamSession,
      ]);
      examEnrollmentRepository.find.mockResolvedValue([
        { ...enrollment, VOUCHERS: [] } as ExamEnrollment,
      ]);
      examEnrollmentRepository.save
        .mockResolvedValueOnce({
          ...enrollment,
          SL_ID: null,
          ERM_SEAT_LABEL: null,
          ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
        })
        .mockResolvedValueOnce({
          ...enrollment,
          SL_ID: null,
          ERM_SEAT_LABEL: null,
          ERM_STATUS: ExamEnrollmentStatus.PAID,
        });
      (service.findOne as jest.Mock).mockResolvedValue({
        ...enrollment,
        SL_ID: null,
        ERM_SEAT_LABEL: null,
        ERM_STATUS: ExamEnrollmentStatus.PAID,
      });

      // Act
      const result = await service.update(
        1,
        { ERM_SEAT_LABEL: null, SL_ID: null } as never,
        adminUser,
      );

      // Assert
      expect(result.ERM_STATUS).toBe(ExamEnrollmentStatus.PAID);
    });

    it('ENR-U-025: candidate can cancel own UNPAID enrollment', async () => {
      // Arrange
      const enrollment = {
        ERM_ID: 1,
        USER_ID: 7,
        SESSION_ID: 10,
        ERM_STATUS: ExamEnrollmentStatus.UNPAID,
        VOUCHERS: [],
      } as unknown as ExamEnrollment;
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(enrollment)
        .mockResolvedValue({
          ...enrollment,
          ERM_STATUS: ExamEnrollmentStatus.CANCELLED,
        });
      examEnrollmentRepository.save.mockResolvedValue({
        ...enrollment,
        ERM_STATUS: ExamEnrollmentStatus.CANCELLED,
      });

      // Act
      const result = await service.update(
        1,
        { ERM_STATUS: ExamEnrollmentStatus.CANCELLED },
        candidateUser,
      );

      // Assert
      expect(result.ERM_STATUS).toBe(ExamEnrollmentStatus.CANCELLED);
    });

    it('ENR-U-026: candidate cannot cancel non-UNPAID enrollment', async () => {
      // Arrange
      const enrollment = {
        ERM_ID: 1,
        USER_ID: 7,
        SESSION_ID: 10,
        ERM_STATUS: ExamEnrollmentStatus.PAID,
        VOUCHERS: [],
      } as unknown as ExamEnrollment;
      jest.spyOn(service, 'findOne').mockResolvedValue(enrollment);

      // Act + Assert
      await expect(
        service.update(
          1,
          { ERM_STATUS: ExamEnrollmentStatus.CANCELLED },
          candidateUser,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('ENR-U-027: candidate forbidden from non-cancel field updates', async () => {
      // Arrange
      const enrollment = {
        ERM_ID: 1,
        USER_ID: 7,
        SESSION_ID: 10,
        ERM_STATUS: ExamEnrollmentStatus.UNPAID,
        VOUCHERS: [],
      } as unknown as ExamEnrollment;
      jest.spyOn(service, 'findOne').mockResolvedValue(enrollment);

      // Act + Assert
      await expect(
        service.update(1, { ERM_SEAT_LABEL: 'A1', SL_ID: 5 }, candidateUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('ENR-U-028: candidate forbidden from updating another user enrollment', async () => {
      // Arrange
      const enrollment = {
        ERM_ID: 1,
        USER_ID: 99,
        SESSION_ID: 10,
        ERM_STATUS: ExamEnrollmentStatus.UNPAID,
        VOUCHERS: [],
      } as unknown as ExamEnrollment;
      jest.spyOn(service, 'findOne').mockResolvedValue(enrollment);

      // Act + Assert
      await expect(
        service.update(
          1,
          { ERM_STATUS: ExamEnrollmentStatus.CANCELLED },
          candidateUser,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('ENR-U-029: rejects duplicate seat assignment with Conflict', async () => {
      // Arrange
      const enrollment = {
        ERM_ID: 1,
        USER_ID: 7,
        SESSION_ID: 10,
        ERM_STATUS: ExamEnrollmentStatus.PAID,
        ERM_SEAT_LABEL: null,
        SL_ID: null,
        VOUCHERS: [],
      } as unknown as ExamEnrollment;
      jest.spyOn(service, 'findOne').mockResolvedValue(enrollment);
      examSessionLocationRepository.findOne.mockResolvedValue({
        SL_ID: 5,
        SS_ID: 10,
      });
      examSessionRepository.find.mockResolvedValue([
        {
          SS_ID: 10,
          SS_SESSION_STATUS: ExamSessionStatus.OPEN,
        } as ExamSession,
      ]);
      examEnrollmentRepository.find.mockResolvedValue([
        { ...enrollment, VOUCHERS: [] } as ExamEnrollment,
      ]);
      examEnrollmentRepository.findOne.mockResolvedValue({
        ERM_ID: 2,
        SL_ID: 5,
        ERM_SEAT_LABEL: 'A1',
      });

      // Act + Assert
      await expect(
        service.update(1, { ERM_SEAT_LABEL: 'A1', SL_ID: 5 }, adminUser),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('ENR-U-030: seat label requires SL_ID', async () => {
      // Arrange
      const enrollment = {
        ERM_ID: 1,
        USER_ID: 7,
        SESSION_ID: 10,
        ERM_STATUS: ExamEnrollmentStatus.PAID,
        ERM_SEAT_LABEL: null,
        SL_ID: null,
        VOUCHERS: [],
      } as unknown as ExamEnrollment;
      jest.spyOn(service, 'findOne').mockResolvedValue(enrollment);

      // Act + Assert
      await expect(
        service.update(1, { ERM_SEAT_LABEL: 'A1' }, adminUser),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('ENR-U-031: SL_ID requires seat label', async () => {
      // Arrange
      const enrollment = {
        ERM_ID: 1,
        USER_ID: 7,
        SESSION_ID: 10,
        ERM_STATUS: ExamEnrollmentStatus.PAID,
        ERM_SEAT_LABEL: null,
        SL_ID: null,
        VOUCHERS: [],
      } as unknown as ExamEnrollment;
      jest.spyOn(service, 'findOne').mockResolvedValue(enrollment);

      // Act + Assert
      await expect(
        service.update(1, { SL_ID: 5 }, adminUser),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('ENR-U-032: rejects SL that does not belong to enrollment session', async () => {
      // Arrange
      const enrollment = {
        ERM_ID: 1,
        USER_ID: 7,
        SESSION_ID: 10,
        ERM_STATUS: ExamEnrollmentStatus.PAID,
        ERM_SEAT_LABEL: null,
        SL_ID: null,
        VOUCHERS: [],
      } as unknown as ExamEnrollment;
      jest.spyOn(service, 'findOne').mockResolvedValue(enrollment);
      examSessionLocationRepository.findOne.mockResolvedValue({
        SL_ID: 5,
        SS_ID: 99,
      });

      // Act + Assert
      await expect(
        service.update(1, { ERM_SEAT_LABEL: 'A1', SL_ID: 5 }, adminUser),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('bulkAssignSeats seat-editing guard', () => {
    const baseEnrollment = {
      ERM_ID: 1,
      SESSION_ID: 10,
      ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
      VOUCHERS: [],
    } as unknown as ExamEnrollment;
    const baseSessionForBulk = {
      SS_ID: 10,
      SS_SESSION_STATUS: ExamSessionStatus.SEAT_ALLOCATED,
    } as ExamSession;
    const baseSessionLocation = {
      SL_ID: 5,
      SS_ID: 10,
    } as ExamSessionLocation;
    const bulkDto = {
      sessionIds: [10],
      assignments: [{ ermId: 1, slId: 5, seatLabel: 'A1', sortOrder: 1 }],
    };

    beforeEach(() => {
      examEnrollmentRepository.find
        .mockResolvedValueOnce([baseEnrollment])
        .mockResolvedValueOnce([baseEnrollment]);
      examSessionRepository.find
        .mockResolvedValueOnce([baseSessionForBulk])
        .mockResolvedValueOnce([baseSessionForBulk]);
      examSessionLocationRepository.find.mockResolvedValue([
        baseSessionLocation,
      ]);
    });

    it('ENR-U-036: allows bulkAssignSeats happy path → SEAT_ASSIGNED + session SEAT_ALLOCATED', async () => {
      // Arrange
      const updatedEnrollment = {
        ...baseEnrollment,
        ERM_SEAT_LABEL: 'A1',
        SL_ID: 5,
        ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
      } as unknown as ExamEnrollment;
      const manager = {
        update: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
        find: jest.fn().mockResolvedValue([updatedEnrollment]),
      };
      dataSource.transaction.mockImplementation(
        (
          callback: (entityManager: {
            update: jest.Mock;
            save: jest.Mock;
            find: jest.Mock;
          }) => unknown,
        ) => Promise.resolve(callback(manager)),
      );

      // Act
      const result = await service.bulkAssignSeats(bulkDto);

      // Assert
      expect(result).toEqual([updatedEnrollment]);
      expect(testTakerIdService.assign).toHaveBeenCalledWith(manager, [1]);
      expect(manager.update).toHaveBeenCalledWith(
        ExamSession,
        expect.anything(),
        { SS_SESSION_STATUS: ExamSessionStatus.SEAT_ALLOCATED },
      );
    });

    it('ENR-U-033: rejects bulkAssignSeats when session vouchers were already issued', async () => {
      // Arrange
      examSessionRepository.find.mockReset();
      examSessionRepository.find
        .mockResolvedValueOnce([
          {
            ...baseSessionForBulk,
            SS_SESSION_STATUS: ExamSessionStatus.VOUCHER_SENT,
          } as ExamSession,
        ])
        .mockResolvedValueOnce([
          {
            ...baseSessionForBulk,
            SS_SESSION_STATUS: ExamSessionStatus.VOUCHER_SENT,
          } as ExamSession,
        ]);

      // Act + Assert
      await expect(service.bulkAssignSeats(bulkDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('ENR-U-035: rejects bulkAssignSeats when enrollment already has a voucher', async () => {
      // Arrange
      examEnrollmentRepository.find.mockReset();
      examEnrollmentRepository.find
        .mockResolvedValueOnce([baseEnrollment])
        .mockResolvedValueOnce([
          {
            ...baseEnrollment,
            VOUCHERS: [{ VC_ID: 99, ERM_ID: 1, VC_CODE: 'VC-1' }],
          },
        ]);

      // Act + Assert
      await expect(service.bulkAssignSeats(bulkDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('ENR-U-034: rejects bulkAssignSeats when enrollment status is seat published', async () => {
      // Arrange
      examEnrollmentRepository.find.mockReset();
      examEnrollmentRepository.find
        .mockResolvedValueOnce([
          {
            ...baseEnrollment,
            ERM_STATUS: ExamEnrollmentStatus.SEAT_PUBLISHED,
          },
        ])
        .mockResolvedValueOnce([
          {
            ...baseEnrollment,
            ERM_STATUS: ExamEnrollmentStatus.SEAT_PUBLISHED,
            VOUCHERS: [],
          },
        ]);

      // Act + Assert
      await expect(service.bulkAssignSeats(bulkDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('ENR-U-037: rejects duplicate ermId in request', async () => {
      // Arrange
      examEnrollmentRepository.find.mockReset();
      examSessionRepository.find.mockReset();

      // Act + Assert
      await expect(
        service.bulkAssignSeats({
          sessionIds: [10],
          assignments: [
            { ermId: 1, slId: 5, seatLabel: 'A1', sortOrder: 1 },
            { ermId: 1, slId: 5, seatLabel: 'A2', sortOrder: 2 },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('ENR-U-038: rejects duplicate seat in request', async () => {
      // Arrange
      const e1 = {
        ERM_ID: 1,
        SESSION_ID: 10,
        ERM_STATUS: ExamEnrollmentStatus.PAID,
        VOUCHERS: [],
      } as unknown as ExamEnrollment;
      const e2 = {
        ERM_ID: 2,
        SESSION_ID: 10,
        ERM_STATUS: ExamEnrollmentStatus.PAID,
        VOUCHERS: [],
      } as unknown as ExamEnrollment;
      examEnrollmentRepository.find
        .mockReset()
        .mockResolvedValueOnce([e1, e2])
        .mockResolvedValueOnce([e1, e2]);
      examSessionRepository.find
        .mockReset()
        .mockResolvedValueOnce([baseSessionForBulk])
        .mockResolvedValueOnce([baseSessionForBulk]);
      examSessionLocationRepository.find.mockResolvedValue([
        baseSessionLocation,
      ]);

      // Act + Assert
      await expect(
        service.bulkAssignSeats({
          sessionIds: [10],
          assignments: [
            { ermId: 1, slId: 5, seatLabel: 'A1', sortOrder: 1 },
            { ermId: 2, slId: 5, seatLabel: 'A1', sortOrder: 2 },
          ],
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('ENR-U-039: rejects enrollment not included in sessionIds', async () => {
      // Arrange
      const e1 = {
        ERM_ID: 1,
        SESSION_ID: 99,
        ERM_STATUS: ExamEnrollmentStatus.PAID,
        VOUCHERS: [],
      } as unknown as ExamEnrollment;
      examEnrollmentRepository.find
        .mockReset()
        .mockResolvedValueOnce([e1])
        .mockResolvedValueOnce([e1]);
      examSessionRepository.find
        .mockReset()
        .mockResolvedValueOnce([baseSessionForBulk])
        .mockResolvedValueOnce([baseSessionForBulk]);
      examSessionLocationRepository.find.mockResolvedValue([
        baseSessionLocation,
      ]);

      // Act + Assert
      await expect(service.bulkAssignSeats(bulkDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('ENR-U-040: rejects SL belonging to wrong session', async () => {
      // Arrange
      examEnrollmentRepository.find
        .mockReset()
        .mockResolvedValueOnce([baseEnrollment])
        .mockResolvedValueOnce([baseEnrollment]);
      examSessionRepository.find
        .mockReset()
        .mockResolvedValueOnce([baseSessionForBulk])
        .mockResolvedValueOnce([baseSessionForBulk]);
      examSessionLocationRepository.find.mockResolvedValue([
        { SL_ID: 5, SS_ID: 99 } as ExamSessionLocation,
      ]);

      // Act + Assert
      await expect(service.bulkAssignSeats(bulkDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('ENR-U-041: throws NotFound when enrollment or session is missing', async () => {
      // Arrange
      examEnrollmentRepository.find.mockReset().mockResolvedValueOnce([]);
      examSessionRepository.find.mockReset();

      // Act + Assert
      await expect(service.bulkAssignSeats(bulkDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update seat-editing guard', () => {
    it('ENR-U-035: rejects seat-field updates when enrollment already has a voucher', async () => {
      // Arrange
      const enrollment = {
        ERM_ID: 1,
        SESSION_ID: 10,
        ERM_STATUS: ExamEnrollmentStatus.SEAT_PUBLISHED,
        ERM_SEAT_LABEL: 'A1',
        SL_ID: 5,
        VOUCHERS: [{ VC_ID: 99, ERM_ID: 1, VC_CODE: 'VC-1' }],
      } as unknown as ExamEnrollment;

      jest.spyOn(service, 'findOne').mockResolvedValue(enrollment);
      examSessionLocationRepository.findOne.mockResolvedValue({
        SL_ID: 5,
        SS_ID: 10,
      });
      examSessionRepository.find.mockResolvedValue([
        {
          SS_ID: 10,
          SS_SESSION_STATUS: ExamSessionStatus.VOUCHER_SENT,
        } as ExamSession,
      ]);
      examEnrollmentRepository.find.mockResolvedValue([enrollment]);

      // Act + Assert
      await expect(
        service.update(
          1,
          {
            ERM_SEAT_LABEL: 'B2',
            SL_ID: 5,
          },
          adminUser,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(examEnrollmentRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('allocateSeats', () => {
    it('ENR-U-042: promotes all PAID enrollments to SEAT_ASSIGNED', async () => {
      // Arrange
      const paid = [
        { ERM_ID: 1, ERM_STATUS: ExamEnrollmentStatus.PAID },
        { ERM_ID: 2, ERM_STATUS: ExamEnrollmentStatus.PAID },
      ] as ExamEnrollment[];
      examEnrollmentRepository.find.mockResolvedValue(paid);
      examEnrollmentRepository.save.mockImplementation(
        async (entities: ExamEnrollment[]) => entities,
      );

      // Act
      const result = await service.allocateSeats(10);

      // Assert
      expect(result).toHaveLength(2);
      expect(
        result.every(
          (e) => e.ERM_STATUS === ExamEnrollmentStatus.SEAT_ASSIGNED,
        ),
      ).toBe(true);
    });

    it('ENR-U-043: throws NotFound when no PAID enrollments exist', async () => {
      // Arrange
      examEnrollmentRepository.find.mockResolvedValue([]);

      // Act + Assert
      await expect(service.allocateSeats(10)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('requestFix', () => {
    it('ENR-U-044: sets WAIT_FIXED and sends email when user has email', async () => {
      // Arrange
      const enrollment = {
        ERM_ID: 12,
        USER_ID: 7,
        ERM_VERIFY_STATUS: ExamVerifyStatus.UNCHECKED,
        USER: {
          USER_EMAIL: 'candidate@buu.ac.th',
          PROFILE: {
            userTitleTh: 'นาย',
            userFullnameTh: 'ทดสอบ',
            userRemark: null,
          },
        },
        SESSION: { EXAM: { EXAM_NAME: 'BUU-GET' } },
      } as unknown as ExamEnrollment;
      jest.spyOn(service, 'findOne').mockResolvedValue(enrollment);
      examEnrollmentRepository.save.mockResolvedValue(enrollment);

      // Act
      const fixDto: RequestFixDto = {
        reasons: ['ชื่อผิด'],
        notes: 'กรุณาแก้',
        fixDeadline: '2026-05-30',
        profileUrl: 'https://example.com/user/profile',
      };
      const result = await service.requestFix(12, fixDto);

      // Assert
      expect(result).toEqual({ success: true });
      expect(enrollment.ERM_VERIFY_STATUS).toBe(ExamVerifyStatus.WAIT_FIXED);
      expect(platformGatewayService.sendEmail).toHaveBeenCalledWith(
        'BUU-GET',
        'candidate@buu.ac.th',
        expect.stringContaining('แจ้งเตือนแก้ไขข้อมูล'),
        expect.any(String),
      );
    });

    it('ENR-U-045: returns success true when user has no email', async () => {
      // Arrange
      const enrollment = {
        ERM_ID: 12,
        USER_ID: 7,
        ERM_VERIFY_STATUS: ExamVerifyStatus.UNCHECKED,
        USER: {
          USER_EMAIL: null,
          PROFILE: {
            userTitleTh: 'นาย',
            userFullnameTh: 'ทดสอบ',
            userRemark: null,
          },
        },
        SESSION: { EXAM: { EXAM_NAME: 'BUU-GET' } },
      } as unknown as ExamEnrollment;
      jest.spyOn(service, 'findOne').mockResolvedValue(enrollment);
      examEnrollmentRepository.save.mockResolvedValue(enrollment);
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      const result = await service.requestFix(12, {
        reasons: ['ชื่อผิด'],
        fixDeadline: '2026-05-30',
        profileUrl: 'https://example.com/user/profile',
      });

      // Assert
      expect(result).toEqual({ success: true });
      expect(platformGatewayService.sendEmail).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('handleCronCancelExpiredEnrollments', () => {
    it('ENR-U-046: cancels UNPAID enrollments older than 30 minutes', async () => {
      // Arrange
      examEnrollmentRepository.update.mockResolvedValue({
        affected: 3,
        raw: [],
        generatedMaps: [],
      });

      // Act
      await service.handleCronCancelExpiredEnrollments();

      // Assert
      expect(examEnrollmentRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ERM_STATUS: ExamEnrollmentStatus.UNPAID,
        }),
        { ERM_STATUS: ExamEnrollmentStatus.CANCELLED },
      );
    });
  });

  describe('findExecutiveTestTakers', () => {
    it('ENR-U-049: queries ATTENDED enrollments only', async () => {
      // Arrange
      const qb = createQueryBuilderMock({
        getRawOne: jest.fn().mockResolvedValue({ total: '1' }),
        getRawMany: jest.fn().mockResolvedValue([
          {
            enrollmentId: '1',
            examId: '100',
            testTakerId: 'TT-001',
            title: 'นาย',
            fullName: 'ทดสอบ',
            examRoundCount: '2',
            status: String(ExamEnrollmentStatus.ATTENDED),
          },
        ]),
      });
      const cloneQb = createQueryBuilderMock({
        getRawOne: jest.fn().mockResolvedValue({ total: '1' }),
      });
      qb.clone.mockReturnValue(cloneQb);
      examEnrollmentRepository.createQueryBuilder.mockReturnValue(qb);

      // Act
      const result = await service.findExecutiveTestTakers({});

      // Assert
      expect(qb.where).toHaveBeenCalledWith(
        'enrollment.ERM_STATUS = :attendedStatus',
        { attendedStatus: ExamEnrollmentStatus.ATTENDED },
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(ExamEnrollmentStatus.ATTENDED);
      expect(result.total).toBe(1);
    });
  });

  describe('findByUserId', () => {
    it('ENR-U-051: selects certificate PDF fields for user history list', async () => {
      examEnrollmentRepository.find.mockResolvedValue([]);

      await service.findByUserId(7);

      expect(examEnrollmentRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { USER_ID: 7 },
          relations: expect.arrayContaining([
            'USER.IMAGE',
            'SCORE.CERTIFICATES',
            'SCORE.LINES',
          ]),
          select: expect.objectContaining({
            ERM_TEST_TAKER: true,
            USER: expect.objectContaining({
              USER_CODE: true,
              IMAGE: expect.objectContaining({
                USER_IMAGE_URL: true,
              }),
            }),
            SESSION: expect.objectContaining({
              EXAM: expect.objectContaining({
                EXAM_FISCAL_YEAR: true,
              }),
            }),
            SCORE: expect.objectContaining({
              SC_LANG_USE_SCORE: true,
              SC_READING_SCORE: true,
              SC_TOTAL_SCORE: true,
              SC_BAND_LEVEL: true,
              LINES: expect.objectContaining({
                SCL_NAME_EN: true,
                SCL_SCORE: true,
                SCL_MAX_SCORE: true,
              }),
            }),
          }),
        }),
      );
    });
  });

  describe('findExamHistoryByEnrollmentId', () => {
    it('ENR-U-050: returns ATTENDED rounds only in exam history', async () => {
      // Arrange
      examEnrollmentRepository.findOne.mockResolvedValue({
        ERM_ID: 1,
        USER_ID: 7,
        USER: {
          PROFILE: { userTitleTh: 'นาย', userFullnameTh: 'ทดสอบ' },
          IMAGE: null,
        },
      });
      examEnrollmentRepository.find.mockResolvedValue([
        {
          ERM_ID: 1,
          ERM_STATUS: ExamEnrollmentStatus.ATTENDED,
          SESSION: {
            EXAM: {
              EXAM_ROUND: '1',
              EXAM_FISCAL_YEAR: '2568',
              EXAM_DATE: '2025-06-01',
            },
          },
          SCORE: null,
          CREATED_AT: new Date('2025-06-01'),
        },
        {
          ERM_ID: 2,
          ERM_STATUS: ExamEnrollmentStatus.PAID,
          SESSION: {
            EXAM: {
              EXAM_ROUND: '2',
              EXAM_FISCAL_YEAR: '2568',
              EXAM_DATE: '2025-07-01',
            },
          },
          SCORE: null,
          CREATED_AT: new Date('2025-07-01'),
        },
        {
          ERM_ID: 3,
          ERM_STATUS: ExamEnrollmentStatus.ATTENDED,
          SESSION: {
            EXAM: {
              EXAM_ROUND: '3',
              EXAM_FISCAL_YEAR: '2568',
              EXAM_DATE: '2025-08-01',
            },
          },
          SCORE: null,
          CREATED_AT: new Date('2025-08-01'),
        },
      ] as unknown);

      // Act
      const result = await service.findExamHistoryByEnrollmentId(1);

      // Assert
      expect(result.examHistory).toHaveLength(2);
      expect(result.examHistory.every((row) => row.index >= 1)).toBe(true);
      expect(result.examHistory.map((r) => r.examRound)).toEqual([
        '1/2568',
        '3/2568',
      ]);
    });
  });
});
