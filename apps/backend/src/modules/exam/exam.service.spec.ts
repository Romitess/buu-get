import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExamService } from './exam.service';
import { Exam } from './entities/exam.entity';
import { ExamPasscode } from './entities/exam-passcode.entity';
import { ExamPasscodeLog } from './entities/exam-passcode-log.entity';
import { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';
import { MoodleSyncService } from '../moodle/moodle-sync.service';
import { PlatformGatewayService } from '../platform-gateway/platform-gateway.service';
import { ScoreRubricsService } from '../score-rubrics/score-rubrics.service';
import { ExamScoresService } from '../exam-scores/exam-scores.service';
import { CreateExamDto } from './dto/create-exam.dto';

type MockRepo = {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  update: jest.Mock;
  merge: jest.Mock;
  exists: jest.Mock;
  delete: jest.Mock;
  softRemove: jest.Mock;
  createQueryBuilder: jest.Mock;
};

const createMockRepo = (): MockRepo => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  merge: jest.fn(),
  exists: jest.fn(),
  delete: jest.fn(),
  softRemove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('ExamService', () => {
  let service: ExamService;
  let examRepository: MockRepo;
  let examPasscodeRepository: MockRepo;
  let examEnrollmentRepository: MockRepo;
  let scoreRubricsService: { assertRubricUsable: jest.Mock };
  let examScoresService: { examHasSavedScores: jest.Mock };
  let moodleSyncService: { createCourse: jest.Mock; courseCategoryId: number };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamService,
        { provide: getRepositoryToken(Exam), useFactory: createMockRepo },
        {
          provide: getRepositoryToken(ExamPasscode),
          useFactory: createMockRepo,
        },
        {
          provide: getRepositoryToken(ExamPasscodeLog),
          useFactory: createMockRepo,
        },
        {
          provide: getRepositoryToken(ExamEnrollment),
          useFactory: createMockRepo,
        },
        {
          provide: MoodleSyncService,
          useValue: { createCourse: jest.fn(), courseCategoryId: 1 },
        },
        { provide: PlatformGatewayService, useValue: { sendEmail: jest.fn() } },
        {
          provide: ScoreRubricsService,
          useValue: { assertRubricUsable: jest.fn() },
        },
        {
          provide: ExamScoresService,
          useValue: { examHasSavedScores: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ExamService);
    examRepository = module.get(getRepositoryToken(Exam));
    examPasscodeRepository = module.get(getRepositoryToken(ExamPasscode));
    examEnrollmentRepository = module.get(getRepositoryToken(ExamEnrollment));
    scoreRubricsService = module.get(ScoreRubricsService);
    examScoresService = module.get(ExamScoresService);
    moodleSyncService = module.get(MoodleSyncService);
  });

  describe('create', () => {
    it('should normalize period end dates before saving (EXAM-U-001)', async () => {
      // Arrange
      const dto: CreateExamDto = {
        EXAM_NAME: 'Exam A',
        SRB_ID: 3,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_REG_END_DATE: '2026-09-10',
        EXAM_PAY_END_DATE: '2026-09-11T00:00:00Z',
      };
      examRepository.create.mockImplementation((payload: CreateExamDto) => ({
        EXAM_ID: 10,
        EXAM_ROUND: '1',
        ...payload,
      }));
      examRepository.save.mockResolvedValue({
        EXAM_ID: 10,
        EXAM_ROUND: '1',
        ...dto,
      });
      moodleSyncService.createCourse.mockResolvedValue(999);
      scoreRubricsService.assertRubricUsable.mockResolvedValue(undefined);

      // Act
      await service.create(dto, 1001);

      // Assert — pay end keeps its own normalized value (not overwritten by reg)
      expect(examRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          EXAM_REG_END_DATE: '2026-09-10T23:59:59+07:00',
          EXAM_PAY_END_DATE: '2026-09-11T23:59:59+07:00',
        }),
      );
    });

    it('should preserve explicit payment period datetime on create', async () => {
      const dto: CreateExamDto = {
        EXAM_NAME: 'Exam Sync Pay',
        SRB_ID: 3,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_REG_START_DATE: '2026-08-11T09:00:00+07:00',
        EXAM_REG_END_DATE: '2026-08-20T16:30:00+07:00',
        EXAM_PAY_START_DATE: '2026-08-11T09:00:00+07:00',
        EXAM_PAY_END_DATE: '2026-08-25T18:00:00+07:00',
      };
      examRepository.create.mockImplementation((payload: CreateExamDto) => ({
        EXAM_ID: 12,
        EXAM_ROUND: '1',
        ...payload,
      }));
      examRepository.save.mockResolvedValue({
        EXAM_ID: 12,
        EXAM_ROUND: '1',
        ...dto,
      });
      moodleSyncService.createCourse.mockResolvedValue(999);
      scoreRubricsService.assertRubricUsable.mockResolvedValue(undefined);

      await service.create(dto, 1001);

      expect(examRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          EXAM_PAY_START_DATE: '2026-08-11T09:00:00+07:00',
          EXAM_PAY_END_DATE: '2026-08-25T18:00:00+07:00',
        }),
      );
    });

    it('should leave payment fields unset for special exams', async () => {
      const dto: CreateExamDto = {
        EXAM_NAME: 'Exam Special',
        SRB_ID: 3,
        EXAM_TYPE: 'รอบพิเศษ',
        EXAM_REG_START_DATE: '2026-08-11T09:00:00+07:00',
        EXAM_REG_END_DATE: '2026-08-20T16:30:00+07:00',
        EXAM_PAY_START_DATE: undefined,
        EXAM_PAY_END_DATE: undefined,
      };
      examRepository.create.mockImplementation((payload: CreateExamDto) => ({
        EXAM_ID: 13,
        EXAM_ROUND: '1',
        ...payload,
      }));
      examRepository.save.mockResolvedValue({
        EXAM_ID: 13,
        EXAM_ROUND: '1',
        ...dto,
      });
      moodleSyncService.createCourse.mockResolvedValue(999);
      scoreRubricsService.assertRubricUsable.mockResolvedValue(undefined);

      await service.create(dto, 1001);

      expect(examRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          EXAM_REG_START_DATE: '2026-08-11T09:00:00+07:00',
          EXAM_REG_END_DATE: '2026-08-20T16:30:00+07:00',
        }),
      );
      const createdPayload = examRepository.create.mock
        .calls[0]?.[0] as CreateExamDto;
      expect(createdPayload.EXAM_PAY_START_DATE).toBeUndefined();
      expect(createdPayload.EXAM_PAY_END_DATE).toBeUndefined();
    });

    it('should validate score rubric usability before create (EXAM-U-002)', async () => {
      // Arrange
      const dto: CreateExamDto = { EXAM_NAME: 'Exam B', SRB_ID: 88 };
      scoreRubricsService.assertRubricUsable.mockRejectedValue(
        new BadRequestException('rubric unusable'),
      );

      // Act / Assert
      await expect(service.create(dto, 7)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(scoreRubricsService.assertRubricUsable).toHaveBeenCalledWith(88);
      expect(examRepository.save).not.toHaveBeenCalled();
    });

    it('should return saved exam without waiting for Moodle sync', async () => {
      // Arrange
      const dto: CreateExamDto = { EXAM_NAME: 'Exam C', SRB_ID: 3 };
      examRepository.create.mockImplementation((payload: CreateExamDto) => ({
        EXAM_ID: 11,
        EXAM_ROUND: '1',
        ...payload,
      }));
      examRepository.save.mockResolvedValue({
        EXAM_ID: 11,
        EXAM_ROUND: '1',
        ...dto,
      });
      let resolveMoodle!: (value: number) => void;
      moodleSyncService.createCourse.mockImplementation(
        () =>
          new Promise<number>((resolve) => {
            resolveMoodle = resolve;
          }),
      );
      scoreRubricsService.assertRubricUsable.mockResolvedValue(undefined);

      // Act — must resolve even while Moodle is still pending
      const saved = await service.create(dto, 1001);

      // Assert
      expect(saved.EXAM_ID).toBe(11);
      expect(moodleSyncService.createCourse).toHaveBeenCalled();
      resolveMoodle(999);
    });
  });

  describe('update', () => {
    it('should block rubric change when scores already exist (EXAM-U-003)', async () => {
      // Arrange
      examRepository.findOne.mockResolvedValue({
        EXAM_ID: 5,
        SRB_ID: 1,
        SESSIONS: [],
        FUND_SOURCE: null,
      });
      examScoresService.examHasSavedScores.mockResolvedValue(true);

      // Act / Assert
      await expect(service.update(5, { SRB_ID: 2 })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(examRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('createPasscodes', () => {
    it('should reject passcode item missing required ID/name pair (EXAM-U-004)', async () => {
      // Arrange
      examRepository.exists.mockResolvedValue(true);
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      examEnrollmentRepository.createQueryBuilder.mockReturnValue(qb);

      // Act / Assert
      await expect(
        service.createPasscodes(1, {
          passcodes: [{ passcode: 'A-001', nationalId: ' ', fullName: ' ' }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should block passcode replace when active enrollments exist (EXAM-U-005)', async () => {
      // Arrange
      examRepository.exists.mockResolvedValue(true);
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      };
      examEnrollmentRepository.createQueryBuilder.mockReturnValue(qb);

      // Act / Assert
      await expect(
        service.createPasscodes(3, {
          passcodes: [{ passcode: 'P-01', nationalId: '1103700000000' }],
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(examPasscodeRepository.delete).not.toHaveBeenCalled();
    });

    it('should trim fallback identity fields and replace passcodes (EXAM-U-006)', async () => {
      // Arrange
      examRepository.exists.mockResolvedValue(true);
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      examEnrollmentRepository.createQueryBuilder.mockReturnValue(qb);
      examPasscodeRepository.create.mockImplementation(
        (payload: Record<string, unknown>) => payload,
      );
      examPasscodeRepository.save.mockResolvedValue([
        {
          EXAM_ID: 9,
          NATIONAL_ID: 'AA7788',
          FULL_NAME: 'John Smith',
          PASSCODE: 'P-09',
        },
      ]);

      // Act
      const result = await service.createPasscodes(9, {
        passcodes: [
          {
            passcode: 'P-09',
            passportNo: ' AA7788 ',
            fullNameEn: ' John Smith ',
          },
        ],
      });

      // Assert
      expect(examPasscodeRepository.delete).toHaveBeenCalledWith({
        EXAM_ID: 9,
      });
      expect(examPasscodeRepository.create).toHaveBeenCalledWith({
        EXAM_ID: 9,
        NATIONAL_ID: 'AA7788',
        FULL_NAME: 'John Smith',
        PASSCODE: 'P-09',
      });
      expect(result).toEqual([
        {
          EXAM_ID: 9,
          NATIONAL_ID: 'AA7788',
          FULL_NAME: 'John Smith',
          PASSCODE: 'P-09',
        },
      ]);
    });
  });
});
