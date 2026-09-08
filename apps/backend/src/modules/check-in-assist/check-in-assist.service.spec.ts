import {
  ForbiddenException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CheckInAssistService } from './check-in-assist.service';
import {
  CheckInAssistSession,
  CheckInAssistSessionMode,
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
import { ExamSessionLocation } from '../exam-session-locations/entities/exam-session-location.entity';
import { ExamSessionLocationProctor } from '../exam-session-locations/entities/exam-session-location-proctor.entity';
import { ExamEnrollmentsService } from '../exam-enrollments/exam-enrollments.service';
import { RoleEnum } from '../roles/enums/role.enum';
import type { AuthenticatedUser } from 'src/common/utils/authz.util';
import { getBangkokDateOnly } from 'src/common/utils/calendar-date.util';

describe('CheckInAssistService', () => {
  let service: CheckInAssistService;

  const sessionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
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
  const sessionLocationRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const proctorAssignmentRepository = {
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
        {
          provide: getRepositoryToken(ExamSessionLocation),
          useValue: sessionLocationRepository,
        },
        {
          provide: getRepositoryToken(ExamSessionLocationProctor),
          useValue: proctorAssignmentRepository,
        },
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
      SESSION_IDS_JSON: JSON.stringify([101]),
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

    it('returns WRONG_ROOM without calling checkIn when room station SL_ID mismatches', async () => {
      const roomSession = {
        ...activeSession,
        MODE: CheckInAssistSessionMode.ROOM_STATION,
        SL_ID: 12,
      } as unknown as CheckInAssistSession;
      sessionRepository.findOne.mockResolvedValue(roomSession);

      const enrollment = {
        ERM_ID: 50,
        ERM_STATUS: ExamEnrollmentStatus.PAID,
        SL_ID: 99,
        ERM_SEAT_LABEL: 'B2',
        USER: { PROFILE: { userTitleTh: 'นาย', userFullnameTh: 'Test' } },
        SESSION: {
          SS_START_TIME: '09:00:00',
          SS_END_TIME: '11:00:00',
          EXAM: {},
        },
        SESSION_LOCATION: {
          LOCATION: {
            LOCATION_NAME: 'อาคารเรียนรวม',
            LOCATION_ROOM_NO: '101',
            LOCATION_FLOOR_NO: 1,
          },
        },
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
        seq: 4,
        type: CheckInAssistEventType.WRONG_ROOM,
        scannedCode: 'ENG123456',
        scannerUserId: 10,
        at: new Date().toISOString(),
      });

      await service.submitScan(7, hostUser, 'ENG123456');

      expect(examEnrollmentsService.checkIn).not.toHaveBeenCalled();
      expect(appendEventMock).toHaveBeenCalledWith(
        roomSession,
        expect.objectContaining({
          type: CheckInAssistEventType.WRONG_ROOM,
          expectedRoom: expect.objectContaining({
            slId: 99,
            roomNo: '101',
          }),
        }),
      );
    });
  });

  describe('openRoomStation', () => {
    const room = {
      SL_ID: 12,
      SS_ID: 101,
      SS_NAME: 'อ.สมชาย',
      SESSION: {
        SS_ID: 101,
        EXAM_ID: 5,
        SS_START_TIME: '09:00:00',
        SS_END_TIME: '11:00:00',
        EXAM: {
          EXAM_ID: 5,
          EXAM_NAME: 'ENG',
          EXAM_DATE: getBangkokDateOnly(),
        },
      },
      LOCATION: {
        LOCATION_NAME: 'อาคารเรียนรวม',
        LOCATION_ROOM_NO: '101',
        LOCATION_FLOOR_NO: 1,
      },
      PROCTORS: [],
    };

    it('forbids a proctor who is not assigned to the room', async () => {
      const proctorUser: AuthenticatedUser = {
        userId: 88,
        role: RoleEnum.PROCTOR,
        roles: [RoleEnum.PROCTOR],
        email: 'proctor@test.local',
      };
      sessionLocationRepository.findOne.mockResolvedValue(room);
      proctorAssignmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.openRoomStation(proctorUser, 12),
      ).rejects.toBeInstanceOf(ForbiddenException);
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
