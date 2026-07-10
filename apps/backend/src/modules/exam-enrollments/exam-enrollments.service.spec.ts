import type { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from './entities/exam-enrollment.entity';
import { ExamEnrollmentsService } from './exam-enrollments.service';
import {
  ExamSession,
  ExamSessionStatus,
} from '../exam-sessions/entities/exam-session.entity';
import { ExamSessionLocation } from '../exam-session-locations/entities/exam-session-location.entity';
import { TestTakerIdService } from './test-taker-id.service';

jest.mock('./entities/exam-enrollment.entity', () => ({
  ExamEnrollment: class ExamEnrollment {},
  ExamEnrollmentStatus: {
    UNPAID: 0,
    PAID: 1,
    SEAT_ASSIGNED: 2,
    SEAT_PUBLISHED: 3,
    ATTENDED: 4,
    CANCELLED: 5,
  },
  ExamVerifyStatus: {},
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

describe('ExamEnrollmentsService', () => {
  let service: ExamEnrollmentsService;
  let examEnrollmentRepository: jest.Mocked<
    Pick<
      Repository<ExamEnrollment>,
      'findAndCount' | 'find' | 'findOne' | 'save' | 'merge'
    >
  >;
  let examSessionRepository: jest.Mocked<Pick<Repository<ExamSession>, 'find'>>;
  let examSessionLocationRepository: jest.Mocked<
    Pick<Repository<ExamSessionLocation>, 'find' | 'findOne'>
  >;
  let dataSource: { transaction: jest.Mock };
  let testTakerIdService: jest.Mocked<Pick<TestTakerIdService, 'assign'>>;

  const createService = (): ExamEnrollmentsService =>
    new ExamEnrollmentsService(
      examEnrollmentRepository as unknown as Repository<ExamEnrollment>,
      examSessionRepository as unknown as Repository<ExamSession>,
      examSessionLocationRepository as unknown as Repository<ExamSessionLocation>,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      dataSource as never,
      testTakerIdService as never,
    );

  beforeEach(() => {
    examEnrollmentRepository = {
      findAndCount: jest.fn().mockResolvedValue([[{ ERM_ID: 10 }], 1]),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(
        (entity, dto) => ({ ...entity, ...dto }) as ExamEnrollment,
      ),
    };
    examSessionRepository = {
      find: jest.fn(),
    };
    examSessionLocationRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn(),
    };
    testTakerIdService = {
      assign: jest.fn().mockResolvedValue(undefined),
    };
    service = createService();
  });

  describe('findAll', () => {
    it('returns paginated enrollments with defaults', async () => {
      const result = await service.findAll();

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

  describe('bulkAssignSeats seat-editing guard', () => {
    const baseEnrollment = {
      ERM_ID: 1,
      SESSION_ID: 10,
      ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
      VOUCHERS: [],
    } as unknown as ExamEnrollment;
    const baseSession = {
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
        .mockResolvedValueOnce([baseSession])
        .mockResolvedValueOnce([baseSession]);
      examSessionLocationRepository.find.mockResolvedValue([
        baseSessionLocation,
      ]);
    });

    it('allows bulkAssignSeats when seats are confirmed but vouchers were not issued', async () => {
      const updatedEnrollment = {
        ...baseEnrollment,
        ERM_SEAT_LABEL: 'A1',
        SL_ID: 5,
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

      const result = await service.bulkAssignSeats(bulkDto);

      expect(result).toEqual([updatedEnrollment]);
      expect(testTakerIdService.assign).toHaveBeenCalledWith(manager, [1]);
    });

    it('rejects bulkAssignSeats when session vouchers were already issued', async () => {
      examSessionRepository.find.mockReset();
      examSessionRepository.find
        .mockResolvedValueOnce([
          {
            ...baseSession,
            SS_SESSION_STATUS: ExamSessionStatus.VOUCHER_SENT,
          } as ExamSession,
        ])
        .mockResolvedValueOnce([
          {
            ...baseSession,
            SS_SESSION_STATUS: ExamSessionStatus.VOUCHER_SENT,
          } as ExamSession,
        ]);

      await expect(service.bulkAssignSeats(bulkDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('rejects bulkAssignSeats when enrollment already has a voucher', async () => {
      examEnrollmentRepository.find.mockReset();
      examEnrollmentRepository.find
        .mockResolvedValueOnce([baseEnrollment])
        .mockResolvedValueOnce([
          {
            ...baseEnrollment,
            VOUCHERS: [{ VC_ID: 99, ERM_ID: 1, VC_CODE: 'VC-1' }],
          } as unknown as ExamEnrollment,
        ]);

      await expect(service.bulkAssignSeats(bulkDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('rejects bulkAssignSeats when enrollment status is seat published', async () => {
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

      await expect(service.bulkAssignSeats(bulkDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('update seat-editing guard', () => {
    it('rejects seat-field updates when enrollment already has a voucher', async () => {
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
      } as ExamSessionLocation);
      examSessionRepository.find.mockResolvedValue([
        {
          SS_ID: 10,
          SS_SESSION_STATUS: ExamSessionStatus.VOUCHER_SENT,
        } as ExamSession,
      ]);
      examEnrollmentRepository.find.mockResolvedValue([enrollment]);

      await expect(
        service.update(1, {
          ERM_SEAT_LABEL: 'B2',
          SL_ID: 5,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(examEnrollmentRepository.save).not.toHaveBeenCalled();
    });
  });
});
