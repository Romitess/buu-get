import type { Repository } from 'typeorm';
import { ExamScoresService } from './exam-scores.service';
import { ExamScore } from './entities/exam-score.entity';
import { CreateExamScoreDto } from './dto/create-exam-score.dto';

describe('ExamScoresService.create (upsert by ERM_ID)', () => {
  let service: ExamScoresService;
  let repository: jest.Mocked<
    Pick<Repository<ExamScore>, 'findOne' | 'create' | 'save'>
  >;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new ExamScoresService(
      repository as unknown as Repository<ExamScore>,
    );
  });

  it('inserts when no score exists for ERM_ID', async () => {
    const dto: CreateExamScoreDto = {
      ERM_ID: 521,
      SC_LANG_USE_SCORE: 20,
      SC_READING_SCORE: 25,
      SC_TOTAL_SCORE: 45,
      SC_BAND_LEVEL: 1,
    };
    const created = { SCORES_ID: 1, ...dto } as ExamScore;

    repository.findOne.mockResolvedValue(null);
    repository.create.mockReturnValue(created);
    repository.save.mockResolvedValue(created);

    const result = await service.create(dto);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { ERM_ID: 521 },
      withDeleted: true,
    });
    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(created);
    expect(result.SCORES_ID).toBe(1);
  });

  it('updates existing score instead of inserting duplicate ERM_ID', async () => {
    const dto: CreateExamScoreDto = {
      ERM_ID: 521,
      SC_LANG_USE_SCORE: 30,
      SC_READING_SCORE: 40,
      SC_TOTAL_SCORE: 70,
      SC_BAND_LEVEL: 3,
    };
    const existing = {
      SCORES_ID: 99,
      ERM_ID: 521,
      SC_LANG_USE_SCORE: 10,
      SC_READING_SCORE: 10,
      SC_TOTAL_SCORE: 20,
      SC_BAND_LEVEL: 0,
      DELETED_AT: null,
    } as ExamScore;

    repository.findOne.mockResolvedValue(existing);
    repository.save.mockResolvedValue(existing);

    const result = await service.create(dto);

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        SCORES_ID: 99,
        ERM_ID: 521,
        SC_LANG_USE_SCORE: 30,
        SC_READING_SCORE: 40,
        SC_TOTAL_SCORE: 70,
        SC_BAND_LEVEL: 3,
      }),
    );
    expect(result.SCORES_ID).toBe(99);
  });

  it('restores soft-deleted score then updates scores', async () => {
    const dto: CreateExamScoreDto = {
      ERM_ID: 521,
      SC_LANG_USE_SCORE: 22,
      SC_READING_SCORE: 23,
      SC_TOTAL_SCORE: 45,
      SC_BAND_LEVEL: 1,
    };
    const existing = {
      SCORES_ID: 88,
      ERM_ID: 521,
      DELETED_AT: new Date('2026-01-01'),
    } as ExamScore;

    repository.findOne.mockResolvedValue(existing);
    repository.save.mockResolvedValue(existing);

    const result = await service.create(dto);

    expect(result.DELETED_AT).toBeNull();
    expect(result.SC_TOTAL_SCORE).toBe(45);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
