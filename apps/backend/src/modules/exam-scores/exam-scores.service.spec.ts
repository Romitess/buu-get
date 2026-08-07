import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExamScoresService } from './exam-scores.service';
import { ExamScore } from './entities/exam-score.entity';
import { ExamScoreLine } from './entities/exam-score-line.entity';
import { CreateExamScoreDto } from './dto/create-exam-score.dto';
import { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';
import { ScoreRubricItem } from '../score-rubrics/entities/score-rubric-item.entity';
import { SCORE_RUBRIC_ITEM_CODE } from '../score-rubrics/constants/score-rubric-codes';
import { ScoreCriteriaService } from '../score-criteria/score-criteria.service';

describe('ExamScoresService.create (upsert by ERM_ID)', () => {
  let service: ExamScoresService;
  let examScoreRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let examScoreLineRepository: {
    create: jest.Mock;
  };
  let enrollmentRepository: {
    findOne: jest.Mock;
  };
  let mockManager: {
    save: jest.Mock;
    delete: jest.Mock;
    findOne: jest.Mock;
  };
  let dataSource: {
    transaction: jest.Mock;
  };
  let scoreCriteriaService: {
    resolveBandLevel: jest.Mock;
  };

  const rubricItems = [
    {
      SRBI_ID: 1,
      SRBI_NAME_TH: 'คำศัพท์และไวยากรณ์',
      SRBI_NAME_EN: 'Vocabulary & Grammar',
      SRBI_MAX_SCORE: 50,
      SRBI_SORT_ORDER: 1,
      SRBI_CODE: SCORE_RUBRIC_ITEM_CODE.LANG_USE,
      DELETED_AT: null,
    },
    {
      SRBI_ID: 2,
      SRBI_NAME_TH: 'ทักษะการอ่าน',
      SRBI_NAME_EN: 'Reading',
      SRBI_MAX_SCORE: 50,
      SRBI_SORT_ORDER: 2,
      SRBI_CODE: SCORE_RUBRIC_ITEM_CODE.READING,
      DELETED_AT: null,
    },
  ] as ScoreRubricItem[];

  const enrollment = {
    ERM_ID: 521,
    SESSION: {
      EXAM: {
        SRB_ID: 1,
        SCORE_RUBRIC: { ITEMS: rubricItems },
      },
    },
  } as ExamEnrollment;

  const buildDto = (
    overrides: Partial<CreateExamScoreDto> = {},
  ): CreateExamScoreDto => ({
    ERM_ID: 521,
    lines: [
      { SRBI_ID: 1, score: 20 },
      { SRBI_ID: 2, score: 25 },
    ],
    ...overrides,
  });

  beforeEach(() => {
    examScoreRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    examScoreLineRepository = {
      create: jest.fn(
        (payload: Partial<ExamScoreLine>) => payload as ExamScoreLine,
      ),
    };
    enrollmentRepository = {
      findOne: jest.fn().mockResolvedValue(enrollment),
    };

    mockManager = {
      save: jest.fn((_entity, payload: ExamScore) =>
        Promise.resolve({
          ...payload,
          SCORES_ID: payload.SCORES_ID ?? 1,
        }),
      ),
      delete: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn().mockResolvedValue({
        SCORES_ID: 1,
        ERM_ID: 521,
        SC_TOTAL_SCORE: 45,
        SC_LANG_USE_SCORE: 20,
        SC_READING_SCORE: 25,
        SC_BAND_LEVEL: 'A2',
        LINES: [],
      }),
    };

    dataSource = {
      transaction: jest.fn(
        async (cb: (manager: typeof mockManager) => Promise<ExamScore>) =>
          cb(mockManager),
      ),
    };
    scoreCriteriaService = {
      resolveBandLevel: jest.fn().mockResolvedValue('A2'),
    };

    service = new ExamScoresService(
      examScoreRepository as never,
      examScoreLineRepository as never,
      enrollmentRepository as never,
      dataSource as never,
      scoreCriteriaService as unknown as ScoreCriteriaService,
    );
  });

  it('should insert when no score exists for ERM_ID (SCR-U-001)', async () => {
    // Arrange
    const dto = buildDto();
    const created = { SCORES_ID: 1, ERM_ID: 521 } as ExamScore;

    examScoreRepository.findOne.mockResolvedValue(null);
    examScoreRepository.create.mockReturnValue(created);

    // Act
    const result = await service.create(dto);

    // Assert
    expect(enrollmentRepository.findOne).toHaveBeenCalled();
    expect(examScoreRepository.create).toHaveBeenCalledWith({ ERM_ID: 521 });
    expect(scoreCriteriaService.resolveBandLevel).toHaveBeenCalledWith(45);
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(mockManager.save).toHaveBeenCalled();
    expect(mockManager.delete).toHaveBeenCalledWith(ExamScoreLine, {
      SCORES_ID: 1,
    });
    expect(result.SCORES_ID).toBe(1);
  });

  it('should update existing score instead of inserting duplicate ERM_ID (SCR-U-001)', async () => {
    // Arrange
    const dto = buildDto({
      lines: [
        { SRBI_ID: 1, score: 30 },
        { SRBI_ID: 2, score: 40 },
      ],
    });
    scoreCriteriaService.resolveBandLevel.mockResolvedValue('B1');
    const existing = {
      SCORES_ID: 99,
      ERM_ID: 521,
      SC_LANG_USE_SCORE: 10,
      SC_READING_SCORE: 10,
      SC_TOTAL_SCORE: 20,
      SC_BAND_LEVEL: null,
      DELETED_AT: null,
    } as ExamScore;

    examScoreRepository.findOne.mockResolvedValue(existing);
    mockManager.findOne.mockResolvedValue({
      ...existing,
      SC_TOTAL_SCORE: 70,
      SC_LANG_USE_SCORE: 30,
      SC_READING_SCORE: 40,
      SC_BAND_LEVEL: 'B1',
      LINES: [],
    });

    // Act
    const result = await service.create(dto);

    // Assert
    expect(examScoreRepository.create).not.toHaveBeenCalled();
    expect(mockManager.save).toHaveBeenCalledWith(
      ExamScore,
      expect.objectContaining({
        SCORES_ID: 99,
        ERM_ID: 521,
        SC_LANG_USE_SCORE: 30,
        SC_READING_SCORE: 40,
        SC_TOTAL_SCORE: 70,
        SC_BAND_LEVEL: 'B1',
      }),
    );
    expect(result.SC_TOTAL_SCORE).toBe(70);
  });

  it('should restore soft-deleted score on upsert (SCR-U-002)', async () => {
    // Arrange
    const dto = buildDto();
    const existing = {
      SCORES_ID: 50,
      ERM_ID: 521,
      DELETED_AT: new Date(),
    } as ExamScore;

    examScoreRepository.findOne.mockResolvedValue(existing);

    // Act
    await service.create(dto);

    // Assert
    expect(mockManager.save).toHaveBeenCalledWith(
      ExamScore,
      expect.objectContaining({
        SCORES_ID: 50,
        DELETED_AT: null,
      }),
    );
  });

  it('uses criteria-based band level instead of trusting legacy payload band', async () => {
    // Arrange
    const dto = buildDto({
      lines: [
        { SRBI_ID: 1, score: 35 },
        { SRBI_ID: 2, score: 40 },
      ],
      SC_BAND_LEVEL: 1,
    });
    const existing = {
      SCORES_ID: 77,
      ERM_ID: 521,
      DELETED_AT: null,
    } as ExamScore;

    examScoreRepository.findOne.mockResolvedValue(existing);
    scoreCriteriaService.resolveBandLevel.mockResolvedValue('B2');

    // Act
    await service.create(dto);

    // Assert
    expect(scoreCriteriaService.resolveBandLevel).toHaveBeenCalledWith(75);
    expect(mockManager.save).toHaveBeenCalledWith(
      ExamScore,
      expect.objectContaining({
        SCORES_ID: 77,
        SC_TOTAL_SCORE: 75,
        SC_BAND_LEVEL: 'B2',
      }),
    );
  });

  it('stores null band when total score does not match any active criteria', async () => {
    // Arrange
    const dto = buildDto();
    const existing = {
      SCORES_ID: 88,
      ERM_ID: 521,
      DELETED_AT: null,
    } as ExamScore;

    examScoreRepository.findOne.mockResolvedValue(existing);
    scoreCriteriaService.resolveBandLevel.mockResolvedValue(null);

    // Act
    await service.create(dto);

    // Assert
    expect(mockManager.save).toHaveBeenCalledWith(
      ExamScore,
      expect.objectContaining({
        SCORES_ID: 88,
        SC_TOTAL_SCORE: 45,
        SC_BAND_LEVEL: null,
      }),
    );
  });

  it('should reject duplicate SRBI_ID in payload (SCR-U-003)', async () => {
    // Arrange
    const dto = buildDto({
      lines: [
        { SRBI_ID: 1, score: 20 },
        { SRBI_ID: 1, score: 25 },
      ],
    });

    // Act & Assert
    await expect(service.create(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('should reject missing required rubric item score (SCR-U-004)', async () => {
    // Arrange
    const dto = buildDto({
      lines: [{ SRBI_ID: 1, score: 20 }],
    });

    // Act & Assert
    await expect(service.create(dto)).rejects.toThrow(
      /ต้องระบุคะแนนสำหรับ "ทักษะการอ่าน"/,
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('should reject line not in rubric (SCR-U-005)', async () => {
    // Arrange
    const dto = buildDto({
      lines: [
        { SRBI_ID: 1, score: 20 },
        { SRBI_ID: 2, score: 25 },
        { SRBI_ID: 999, score: 10 },
      ],
    });

    // Act & Assert
    await expect(service.create(dto)).rejects.toThrow(
      /รายการคะแนน SRBI_ID=999 ไม่อยู่ในชุดเกณฑ์ของรอบสอบ/,
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('should reject score below 0 (SCR-U-006)', async () => {
    // Arrange
    const dto = buildDto({
      lines: [
        { SRBI_ID: 1, score: -1 },
        { SRBI_ID: 2, score: 25 },
      ],
    });

    // Act & Assert
    await expect(service.create(dto)).rejects.toThrow(/คะแนนต้องไม่ต่ำกว่า 0/);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('should reject score above item max (SCR-U-007)', async () => {
    // Arrange
    const dto = buildDto({
      lines: [
        { SRBI_ID: 1, score: 51 },
        { SRBI_ID: 2, score: 25 },
      ],
    });

    // Act & Assert
    await expect(service.create(dto)).rejects.toThrow(
      /คะแนน "คำศัพท์และไวยากรณ์" เกินคะแนนเต็ม \(50\)/,
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  describe('reject when enrollment/exam/rubric not usable (SCR-U-008)', () => {
    it('should throw NotFound when enrollment is missing', async () => {
      // Arrange
      enrollmentRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(buildDto())).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequest when exam has no score rubric', async () => {
      // Arrange
      enrollmentRepository.findOne.mockResolvedValue({
        ERM_ID: 521,
        SESSION: {
          EXAM: {
            SRB_ID: null,
            SCORE_RUBRIC: null,
          },
        },
      });

      // Act & Assert
      await expect(service.create(buildDto())).rejects.toThrow(
        /รอบสอบนี้ยังไม่ได้กำหนดชุดเกณฑ์คะแนน/,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequest when rubric has zero active items', async () => {
      // Arrange
      enrollmentRepository.findOne.mockResolvedValue({
        ERM_ID: 521,
        SESSION: {
          EXAM: {
            SRB_ID: 1,
            SCORE_RUBRIC: {
              ITEMS: [
                {
                  SRBI_ID: 1,
                  SRBI_NAME_TH: 'deleted',
                  SRBI_NAME_EN: 'deleted',
                  SRBI_MAX_SCORE: 50,
                  SRBI_SORT_ORDER: 1,
                  SRBI_CODE: SCORE_RUBRIC_ITEM_CODE.LANG_USE,
                  DELETED_AT: new Date(),
                },
              ],
            },
          },
        },
      });

      // Act & Assert
      await expect(service.create(buildDto())).rejects.toThrow(
        /ชุดเกณฑ์คะแนนของรอบสอบไม่มีรายการ/,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const existingScore = {
      SCORES_ID: 42,
      ERM_ID: 521,
      SC_LANG_USE_SCORE: 10,
      SC_READING_SCORE: 10,
      SC_TOTAL_SCORE: 20,
      SC_BAND_LEVEL: 'A1',
      DELETED_AT: null,
      LINES: [],
    } as unknown as ExamScore;

    it('should rewrite lines and recalculate when lines provided (SCR-U-009)', async () => {
      // Arrange
      examScoreRepository.findOne.mockResolvedValue(existingScore);
      scoreCriteriaService.resolveBandLevel.mockResolvedValue('B1');
      mockManager.findOne.mockResolvedValue({
        ...existingScore,
        SC_LANG_USE_SCORE: 30,
        SC_READING_SCORE: 40,
        SC_TOTAL_SCORE: 70,
        SC_BAND_LEVEL: 'B1',
        LINES: [
          { SRBI_ID: 1, SCL_SCORE: 30 },
          { SRBI_ID: 2, SCL_SCORE: 40 },
        ],
      });

      // Act
      const result = await service.update(42, {
        lines: [
          { SRBI_ID: 1, score: 30 },
          { SRBI_ID: 2, score: 40 },
        ],
      });

      // Assert
      expect(enrollmentRepository.findOne).toHaveBeenCalled();
      expect(scoreCriteriaService.resolveBandLevel).toHaveBeenCalledWith(70);
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(mockManager.delete).toHaveBeenCalledWith(ExamScoreLine, {
        SCORES_ID: 42,
      });
      expect(mockManager.save).toHaveBeenCalledWith(
        ExamScore,
        expect.objectContaining({
          SCORES_ID: 42,
          SC_LANG_USE_SCORE: 30,
          SC_READING_SCORE: 40,
          SC_TOTAL_SCORE: 70,
          SC_BAND_LEVEL: 'B1',
        }),
      );
      expect(mockManager.save).toHaveBeenCalledWith(
        ExamScoreLine,
        expect.any(Array),
      );
      expect(result.SC_TOTAL_SCORE).toBe(70);
      expect(result.SC_BAND_LEVEL).toBe('B1');
    });

    it('should skip recalc branch when lines omitted (SCR-U-010)', async () => {
      // Arrange
      examScoreRepository.findOne.mockResolvedValue({ ...existingScore });
      examScoreRepository.save.mockImplementation((entity: ExamScore) =>
        Promise.resolve(entity),
      );

      // Act
      const result = await service.update(42, {
        SC_BAND_LEVEL: 'B2',
      });

      // Assert
      expect(enrollmentRepository.findOne).not.toHaveBeenCalled();
      expect(scoreCriteriaService.resolveBandLevel).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(examScoreRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          SCORES_ID: 42,
          SC_BAND_LEVEL: 'B2',
        }),
      );
      expect(result.SC_BAND_LEVEL).toBe('B2');
    });

    it('should skip recalc branch when lines is empty array (SCR-U-010)', async () => {
      // Arrange
      examScoreRepository.findOne.mockResolvedValue({ ...existingScore });
      examScoreRepository.save.mockImplementation((entity: ExamScore) =>
        Promise.resolve(entity),
      );

      // Act
      await service.update(42, { lines: [] });

      // Assert
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(scoreCriteriaService.resolveBandLevel).not.toHaveBeenCalled();
      expect(examScoreRepository.save).toHaveBeenCalled();
    });
  });
});

describe('ExamScoresService.findAll', () => {
  let service: ExamScoresService;
  let queryBuilder: {
    leftJoinAndSelect: jest.Mock;
    innerJoin: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    getManyAndCount: jest.Mock;
  };

  beforeEach(() => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    const examScoreRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    service = new ExamScoresService(
      examScoreRepository as never,
      {} as never,
      {} as never,
      {} as never,
      { resolveBandLevel: jest.fn() } as never,
    );
  });

  it('filters by examId via enrollment session join', async () => {
    await service.findAll({ examId: 12, page: 1, limit: 20 });

    expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
      'enrollment.SESSION',
      'session',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'session.EXAM_ID = :examId',
      { examId: 12 },
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
  });

  it('filters by sessionId when provided', async () => {
    await service.findAll({ examId: 12, sessionId: 5 });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'enrollment.SESSION_ID = :sessionId',
      { sessionId: 5 },
    );
  });
});
