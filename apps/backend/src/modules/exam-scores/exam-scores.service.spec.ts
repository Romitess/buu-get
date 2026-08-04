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

  it('inserts when no score exists for ERM_ID', async () => {
    const dto = buildDto();
    const created = { SCORES_ID: 1, ERM_ID: 521 } as ExamScore;

    examScoreRepository.findOne.mockResolvedValue(null);
    examScoreRepository.create.mockReturnValue(created);

    const result = await service.create(dto);

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

  it('updates existing score instead of inserting duplicate ERM_ID', async () => {
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

    const result = await service.create(dto);

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

  it('restores soft-deleted score on upsert', async () => {
    const dto = buildDto();
    const existing = {
      SCORES_ID: 50,
      ERM_ID: 521,
      DELETED_AT: new Date(),
    } as ExamScore;

    examScoreRepository.findOne.mockResolvedValue(existing);

    await service.create(dto);

    expect(mockManager.save).toHaveBeenCalledWith(
      ExamScore,
      expect.objectContaining({
        SCORES_ID: 50,
        DELETED_AT: null,
      }),
    );
  });

  it('uses criteria-based band level instead of trusting legacy payload band', async () => {
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

    await service.create(dto);

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
    const dto = buildDto();
    const existing = {
      SCORES_ID: 88,
      ERM_ID: 521,
      DELETED_AT: null,
    } as ExamScore;

    examScoreRepository.findOne.mockResolvedValue(existing);
    scoreCriteriaService.resolveBandLevel.mockResolvedValue(null);

    await service.create(dto);

    expect(mockManager.save).toHaveBeenCalledWith(
      ExamScore,
      expect.objectContaining({
        SCORES_ID: 88,
        SC_TOTAL_SCORE: 45,
        SC_BAND_LEVEL: null,
      }),
    );
  });
});
