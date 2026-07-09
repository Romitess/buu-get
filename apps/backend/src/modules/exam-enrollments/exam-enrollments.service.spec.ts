import type { Repository } from 'typeorm';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import { ExamEnrollment } from './entities/exam-enrollment.entity';
import { ExamEnrollmentsService } from './exam-enrollments.service';

jest.mock('./entities/exam-enrollment.entity', () => ({
  ExamEnrollment: class ExamEnrollment {},
  ExamEnrollmentStatus: {},
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
  ExamSessionStatus: {},
}));

describe('ExamEnrollmentsService', () => {
  let service: ExamEnrollmentsService;
  let examEnrollmentRepository: jest.Mocked<
    Pick<Repository<ExamEnrollment>, 'findAndCount'>
  >;

  beforeEach(() => {
    examEnrollmentRepository = {
      findAndCount: jest.fn().mockResolvedValue([[{ ERM_ID: 10 }], 1]),
    };
    service = new ExamEnrollmentsService(
      examEnrollmentRepository as unknown as Repository<ExamEnrollment>,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
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
});
