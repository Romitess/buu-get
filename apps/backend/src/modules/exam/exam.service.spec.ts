import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
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
  find: jest.Mock;
  findOne: jest.Mock;
  findAndCount: jest.Mock;
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
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
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
  let platformGatewayService: { sendEmail: jest.Mock };

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
    platformGatewayService = module.get(PlatformGatewayService);
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

  describe('findAll', () => {
    it('should select EXAM_FISCAL_YEAR so list titles can include budget year', async () => {
      examRepository.findAndCount.mockResolvedValue([
        [
          {
            EXAM_ID: 1,
            EXAM_NAME: 'BUU-GET',
            EXAM_ROUND: '1',
            EXAM_FISCAL_YEAR: '2026',
            SESSIONS: [],
          },
        ],
        1,
      ]);

      const exams = await service.findAll();

      expect(examRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            EXAM_ROUND: true,
            EXAM_FISCAL_YEAR: true,
          }),
          skip: 0,
          take: 10,
        }),
      );
      expect(exams.data[0]?.EXAM_FISCAL_YEAR).toBe('2026');
      expect(exams.meta.total).toBe(1);
    });
  });

  describe('findPublishedSchedule', () => {
    it('should load only published exams without pagination', async () => {
      examRepository.find.mockResolvedValue([
        {
          EXAM_ID: 2,
          EXAM_PUBLISHED: true,
          EXAM_FISCAL_YEAR: '2026',
          SESSIONS: [],
        },
      ]);

      const exams = await service.findPublishedSchedule();

      expect(examRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { EXAM_PUBLISHED: true },
          select: expect.objectContaining({
            EXAM_FISCAL_YEAR: true,
            EXAM_PUBLISHED: true,
          }),
        }),
      );
      expect(exams).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should omit PASSCODES and hide unpublished exams by default', async () => {
      examRepository.findOne.mockResolvedValue({
        EXAM_ID: 9,
        EXAM_PUBLISHED: false,
        SESSIONS: [],
      });

      await expect(service.findOne(9)).rejects.toBeInstanceOf(NotFoundException);
      expect(examRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: expect.not.arrayContaining(['PASSCODES']),
        }),
      );
    });

    it('should allow unpublished exams for exam admins', async () => {
      examRepository.findOne.mockResolvedValue({
        EXAM_ID: 9,
        EXAM_PUBLISHED: false,
        SESSIONS: [],
      });

      const exam = await service.findOne(9, { allowUnpublished: true });
      expect(exam.EXAM_ID).toBe(9);
    });
  });

  describe('notifyExamChanges', () => {
    it('should include round and fiscal year in change notification email', async () => {
      platformGatewayService.sendEmail.mockResolvedValue(undefined);
      examRepository.findOne.mockResolvedValue({
        EXAM_ID: 7,
        EXAM_NAME: 'BUU-GET',
        EXAM_ROUND: '1',
        EXAM_FISCAL_YEAR: '2026',
      });
      examEnrollmentRepository.find.mockResolvedValue([
        {
          ERM_ID: 1,
          USER_ID: 10,
          SESSION_ID: 20,
          SESSION: { SS_ID: 20, EXAM_ID: 7 },
          USER: {
            USER_ID: 10,
            USER_EMAIL: 'candidate@example.com',
            PROFILE: {
              userProfileId: 1,
              userTitleTh: 'นาย',
              userFullnameTh: 'ทดสอบ',
            },
          },
        },
      ]);

      const result = service.notifyExamChanges(7, {
        changes: [{ label: 'วันที่สอบ', oldValue: 'A', newValue: 'B' }],
      });
      expect(result).toEqual({ success: true });

      await new Promise((resolve) => setImmediate(resolve));

      expect(examRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            EXAM_ROUND: true,
            EXAM_FISCAL_YEAR: true,
          }),
        }),
      );
      expect(platformGatewayService.sendEmail).toHaveBeenCalled();
      const html = platformGatewayService.sendEmail.mock
        .calls[0]?.[3] as string;
      expect(html).toContain('1/2026');
    });
  });

  describe('createPasscodes', () => {
    const editableQb = () => ({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    });

    it('should reject passcode item missing required ID/name pair (EXAM-U-004)', async () => {
      // Arrange
      examRepository.exists.mockResolvedValue(true);
      examEnrollmentRepository.createQueryBuilder.mockReturnValue(editableQb());

      // Act / Assert
      await expect(
        service.createPasscodes(1, {
          passcodes: [{ passcode: 'ABC123', nationalId: ' ', fullName: ' ' }],
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
          passcodes: [
            {
              passcode: 'ABC123',
              nationalId: '1103700000000',
              fullName: 'Test',
            },
          ],
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(examPasscodeRepository.delete).not.toHaveBeenCalled();
    });

    it('should trim fallback identity fields, normalize passcode, and replace passcodes (EXAM-U-006)', async () => {
      // Arrange
      examRepository.exists.mockResolvedValue(true);
      examEnrollmentRepository.createQueryBuilder.mockReturnValue(editableQb());
      examPasscodeRepository.exists.mockResolvedValue(false);
      examPasscodeRepository.create.mockImplementation(
        (payload: Record<string, unknown>) => payload,
      );
      examPasscodeRepository.save.mockResolvedValue([
        {
          EXAM_ID: 9,
          NATIONAL_ID: 'AA7788',
          FULL_NAME: 'John Smith',
          PASSCODE: 'AB12CD',
        },
      ]);

      // Act
      const result = await service.createPasscodes(9, {
        passcodes: [
          {
            passcode: ' ab12cd ',
            passportNo: ' AA7788 ',
            fullNameEn: ' John Smith ',
          },
        ],
      });

      // Assert
      expect(examPasscodeRepository.exists).toHaveBeenCalled();
      expect(examPasscodeRepository.delete).toHaveBeenCalledWith({
        EXAM_ID: 9,
      });
      expect(examPasscodeRepository.create).toHaveBeenCalledWith({
        EXAM_ID: 9,
        NATIONAL_ID: 'AA7788',
        FULL_NAME: 'John Smith',
        PASSCODE: 'AB12CD',
      });
      expect(result).toEqual([
        {
          EXAM_ID: 9,
          NATIONAL_ID: 'AA7788',
          FULL_NAME: 'John Smith',
          PASSCODE: 'AB12CD',
        },
      ]);
    });

    it('should reject passcodes already used on another exam (EXAM-U-007)', async () => {
      // Arrange
      examRepository.exists.mockResolvedValue(true);
      examEnrollmentRepository.createQueryBuilder.mockReturnValue(editableQb());
      examPasscodeRepository.exists.mockResolvedValue(true);
      examPasscodeRepository.create.mockImplementation(
        (payload: Record<string, unknown>) => payload,
      );

      // Act / Assert
      await expect(
        service.createPasscodes(10, {
          passcodes: [
            {
              passcode: 'SHARE1',
              nationalId: '1103700000001',
              fullName: 'A',
            },
            {
              passcode: 'SHARE1',
              nationalId: '1103700000002',
              fullName: 'B',
            },
          ],
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(examPasscodeRepository.delete).not.toHaveBeenCalled();
      expect(examPasscodeRepository.save).not.toHaveBeenCalled();
    });

    it('should allow the same shared passcode on every row of this exam (EXAM-U-008)', async () => {
      // Arrange
      examRepository.exists.mockResolvedValue(true);
      examEnrollmentRepository.createQueryBuilder.mockReturnValue(editableQb());
      examPasscodeRepository.exists.mockResolvedValue(false);
      examPasscodeRepository.create.mockImplementation(
        (payload: Record<string, unknown>) => payload,
      );
      const saved = [
        {
          EXAM_ID: 11,
          NATIONAL_ID: '1',
          FULL_NAME: 'A',
          PASSCODE: 'SHARED',
        },
        {
          EXAM_ID: 11,
          NATIONAL_ID: '2',
          FULL_NAME: 'B',
          PASSCODE: 'SHARED',
        },
      ];
      examPasscodeRepository.save.mockResolvedValue(saved);

      // Act
      const result = await service.createPasscodes(11, {
        passcodes: [
          { passcode: 'shared', nationalId: '1', fullName: 'A' },
          { passcode: 'SHARED', nationalId: '2', fullName: 'B' },
        ],
      });

      // Assert
      expect(examPasscodeRepository.delete).toHaveBeenCalledWith({
        EXAM_ID: 11,
      });
      expect(examPasscodeRepository.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual(saved);
    });
  });
});
