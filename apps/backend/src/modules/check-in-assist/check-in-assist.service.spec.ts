import { GoneException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CheckInAssistService } from './check-in-assist.service';
import {
  CheckInAssistSession,
  CheckInAssistSessionStatus,
} from './entities/check-in-assist-session.entity';
import {
  CheckInAssistEvent,
  CheckInAssistEventType,
} from './entities/check-in-assist-event.entity';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';
import { Exam } from '../exam/entities/exam.entity';
import { ExamEnrollmentsService } from '../exam-enrollments/exam-enrollments.service';
import { RoleEnum } from '../roles/enums/role.enum';
import type { AuthenticatedUser } from 'src/common/utils/authz.util';

describe('CheckInAssistService', () => {
  let service: CheckInAssistService;

  const sessionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  const eventRepository = {
    createQueryBuilder: jest.fn(),
  };
  const enrollmentRepository = {
    createQueryBuilder: jest.fn(),
  };
  const examRepository = {
    findOne: jest.fn(),
  };
  const examEnrollmentsService = {
    checkIn: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(),
  };

  const hostUser: AuthenticatedUser = {
    userId: 10,
    role: RoleEnum.ADMIN,
    roles: [RoleEnum.ADMIN],
    email: 'host@test.local',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckInAssistService,
        {
          provide: getRepositoryToken(CheckInAssistSession),
          useValue: sessionRepository,
        },
        {
          provide: getRepositoryToken(CheckInAssistEvent),
          useValue: eventRepository,
        },
        {
          provide: getRepositoryToken(ExamEnrollment),
          useValue: enrollmentRepository,
        },
        { provide: getRepositoryToken(Exam), useValue: examRepository },
        { provide: ExamEnrollmentsService, useValue: examEnrollmentsService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(CheckInAssistService);
  });

  describe('createSession', () => {
    it('creates an active assist session with join token', async () => {
      examRepository.findOne.mockResolvedValue({
        EXAM_ID: 5,
        EXAM_NAME: 'ENG',
      });
      sessionRepository.create.mockImplementation((input) => {
        const session = new CheckInAssistSession();
        Object.assign(session, input);
        return session;
      });
      sessionRepository.save.mockImplementation(async (input) => ({
        ...input,
        CAS_ID: 99,
        JOIN_TOKEN: 'abc123',
        EXPIRES_AT: new Date('2030-01-01T00:00:00.000Z'),
      }));

      const result = await service.createSession(hostUser, {
        examId: 5,
        sessionIds: [1, 2],
      });

      expect(result.casId).toBe(99);
      expect(result.joinToken).toBe('abc123');
      expect(sessionRepository.save).toHaveBeenCalled();
    });

    it('throws when exam does not exist', async () => {
      examRepository.findOne.mockResolvedValue(null);
      await expect(
        service.createSession(hostUser, { examId: 404, sessionIds: [1] }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('submitScan', () => {
    const activeSession = {
      CAS_ID: 7,
      EXAM_ID: 5,
      HOST_USER_ID: 10,
      JOIN_TOKEN: 'token',
      STATUS: CheckInAssistSessionStatus.ACTIVE,
      EXPIRES_AT: new Date('2030-01-01T00:00:00.000Z'),
      getSessionIds: () => [101],
      setSessionIds: jest.fn(),
    } as unknown as CheckInAssistSession;

    const appendEventMock = jest.fn();

    beforeEach(() => {
      sessionRepository.findOne.mockResolvedValue(activeSession);
      appendEventMock.mockReset();
      jest
        .spyOn(service as never, 'appendEvent' as never)
        .mockImplementation(appendEventMock as never);
    });

    it('returns INVALID_CODE for empty normalized input', async () => {
      appendEventMock.mockResolvedValue({
        seq: 1,
        type: CheckInAssistEventType.INVALID_CODE,
        scannedCode: '!!!',
        scannerUserId: 10,
        at: new Date().toISOString(),
      });

      const qb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      };
      enrollmentRepository.createQueryBuilder.mockReturnValue(qb);

      await service.submitScan(7, hostUser, '!!!');

      expect(appendEventMock).toHaveBeenCalledWith(
        activeSession,
        expect.objectContaining({ type: CheckInAssistEventType.INVALID_CODE }),
      );
    });

    it('returns CHECKED_IN when enrollment is eligible', async () => {
      const enrollment = {
        ERM_ID: 50,
        ERM_STATUS: ExamEnrollmentStatus.PAID,
        ERM_SEAT_LABEL: 'A1',
        ERM_TEST_TAKER: 'ENG123456',
        USER: {
          USER_NATIONAL_ID: '123',
          PROFILE: { userTitleTh: 'นาย', userFullnameTh: 'Test' },
        },
        SESSION: {
          EXAM: {
            EXAM_ROUND: '1',
            EXAM_FISCAL_YEAR: '2568',
            EXAM_TYPE: 'General',
          },
        },
        VOUCHERS: [{ VC_CODE: 'VC-1' }],
      } as unknown as ExamEnrollment;

      const qb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(enrollment),
      };
      enrollmentRepository.createQueryBuilder.mockReturnValue(qb);

      examEnrollmentsService.checkIn.mockResolvedValue({
        ...enrollment,
        ERM_STATUS: ExamEnrollmentStatus.ATTENDED,
      });

      appendEventMock.mockResolvedValue({
        seq: 2,
        type: CheckInAssistEventType.CHECKED_IN,
        scannedCode: 'ENG123456',
        scannerUserId: 10,
        at: new Date().toISOString(),
        candidate: {
          ermId: 50,
          attendanceStatus: ExamEnrollmentStatus.ATTENDED,
        },
      });

      const result = await service.submitScan(7, hostUser, 'ENG123456');

      expect(examEnrollmentsService.checkIn).toHaveBeenCalledWith(50, {});
      expect(result.type).toBe(CheckInAssistEventType.CHECKED_IN);
    });

    it('returns ALREADY_CHECKED_IN without calling checkIn again', async () => {
      const enrollment = {
        ERM_ID: 50,
        ERM_STATUS: ExamEnrollmentStatus.ATTENDED,
        ERM_SEAT_LABEL: 'A1',
        USER: { PROFILE: { userTitleTh: 'นาย', userFullnameTh: 'Test' } },
        SESSION: { EXAM: {} },
        VOUCHERS: [],
      } as unknown as ExamEnrollment;

      const qb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(enrollment),
      };
      enrollmentRepository.createQueryBuilder.mockReturnValue(qb);

      appendEventMock.mockResolvedValue({
        seq: 3,
        type: CheckInAssistEventType.ALREADY_CHECKED_IN,
        scannedCode: 'ENG123456',
        scannerUserId: 10,
        at: new Date().toISOString(),
      });

      await service.submitScan(7, hostUser, 'ENG123456');

      expect(examEnrollmentsService.checkIn).not.toHaveBeenCalled();
      expect(appendEventMock).toHaveBeenCalledWith(
        activeSession,
        expect.objectContaining({
          type: CheckInAssistEventType.ALREADY_CHECKED_IN,
        }),
      );
    });
  });

  describe('getSessionByToken', () => {
    it('throws GoneException when session is closed', async () => {
      sessionRepository.findOne.mockResolvedValue({
        CAS_ID: 1,
        EXAM_ID: 5,
        STATUS: CheckInAssistSessionStatus.CLOSED,
        EXPIRES_AT: new Date('2030-01-01T00:00:00.000Z'),
        getSessionIds: () => [1],
      });

      await expect(service.getSessionByToken('token')).rejects.toBeInstanceOf(
        GoneException,
      );
    });
  });
});
