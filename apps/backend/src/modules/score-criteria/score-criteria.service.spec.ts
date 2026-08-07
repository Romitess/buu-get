import type { Repository } from 'typeorm';
import { ScoreCriteriaService } from './score-criteria.service';
import { ScoreCriteria } from './entities/score-criteria.entity';
import { BandRuleDto, SaveBandRulesDto } from './dto/save-band-rules.dto';

describe('ScoreCriteriaService', () => {
  let service: ScoreCriteriaService;
  let scoreCriteriaRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  const validRules: BandRuleDto[] = [
    {
      id: '1',
      band: '1',
      minScore: 0,
      maxScore: 49,
      cefr: 'A1',
      descriptor: 'Beginner',
    },
    {
      id: '2',
      band: '2',
      minScore: 50,
      maxScore: 74,
      cefr: 'A2',
      descriptor: 'Elementary',
    },
    {
      id: '3',
      band: '3',
      minScore: 75,
      maxScore: 100,
      cefr: 'B1',
      descriptor: 'Intermediate',
    },
  ];

  beforeEach(() => {
    scoreCriteriaRepository = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((payload: unknown) => payload),
      save: jest
        .fn()
        .mockImplementation((entity: ScoreCriteria) =>
          Promise.resolve({ ...entity, SCR_ID: entity.SCR_ID ?? 1 }),
        ),
    };

    service = new ScoreCriteriaService(
      scoreCriteriaRepository as unknown as Repository<ScoreCriteria>,
    );
  });

  describe('getBandRules', () => {
    it('should return empty array when no active criteria (CRI-U-001)', async () => {
      // Arrange
      scoreCriteriaRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getBandRules();

      // Assert
      expect(result).toEqual({ bandRules: [] });
    });

    it('should return empty array when SCR_CONTENT is malformed JSON (CRI-U-001)', async () => {
      // Arrange
      scoreCriteriaRepository.findOne.mockResolvedValue({
        SCR_ID: 1,
        SCR_ACTIVE: true,
        SCR_CONTENT: '{not-json',
      });

      // Act
      const result = await service.getBandRules();

      // Assert
      expect(result).toEqual({ bandRules: [] });
    });

    it('should filter invalid rule objects and keep valid ones (CRI-U-002)', async () => {
      // Arrange
      const mixedContent = JSON.stringify([
        validRules[0],
        { id: 1, band: 'x' },
        null,
        'string-rule',
        {
          id: '2',
          band: '2',
          minScore: '50',
          maxScore: 74,
          cefr: 'A2',
          descriptor: 'bad types',
        },
        validRules[1],
      ]);
      scoreCriteriaRepository.findOne.mockResolvedValue({
        SCR_ID: 1,
        SCR_ACTIVE: true,
        SCR_CONTENT: mixedContent,
      });

      // Act
      const result = await service.getBandRules();

      // Assert
      expect(result.bandRules).toEqual([validRules[0], validRules[1]]);
    });
  });

  describe('resolveBandLevel', () => {
    beforeEach(() => {
      scoreCriteriaRepository.findOne.mockResolvedValue({
        SCR_ID: 1,
        SCR_ACTIVE: true,
        SCR_CONTENT: JSON.stringify(validRules),
      });
    });

    it('should match inclusive boundaries (CRI-U-003)', async () => {
      // Arrange / Act / Assert
      await expect(service.resolveBandLevel(0)).resolves.toBe('A1');
      await expect(service.resolveBandLevel(49)).resolves.toBe('A1');
      await expect(service.resolveBandLevel(50)).resolves.toBe('A2');
      await expect(service.resolveBandLevel(74)).resolves.toBe('A2');
      await expect(service.resolveBandLevel(75)).resolves.toBe('B1');
      await expect(service.resolveBandLevel(100)).resolves.toBe('B1');
    });

    it('should return null on non-finite score (CRI-U-004)', async () => {
      // Arrange / Act / Assert
      await expect(service.resolveBandLevel(Number.NaN)).resolves.toBeNull();
      await expect(
        service.resolveBandLevel(Number.POSITIVE_INFINITY),
      ).resolves.toBeNull();
      await expect(
        service.resolveBandLevel(Number.NEGATIVE_INFINITY),
      ).resolves.toBeNull();
      expect(scoreCriteriaRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return null when no range matches (CRI-U-005)', async () => {
      // Arrange
      const gappedRules: BandRuleDto[] = [
        {
          id: '1',
          band: '1',
          minScore: 0,
          maxScore: 40,
          cefr: 'A1',
          descriptor: 'Beginner',
        },
        {
          id: '2',
          band: '2',
          minScore: 60,
          maxScore: 100,
          cefr: 'B1',
          descriptor: 'Intermediate',
        },
      ];
      scoreCriteriaRepository.findOne.mockResolvedValue({
        SCR_ID: 1,
        SCR_ACTIVE: true,
        SCR_CONTENT: JSON.stringify(gappedRules),
      });

      // Act / Assert
      await expect(service.resolveBandLevel(50)).resolves.toBeNull();
      await expect(service.resolveBandLevel(101)).resolves.toBeNull();
      await expect(service.resolveBandLevel(-1)).resolves.toBeNull();
    });
  });

  describe('saveBandRules', () => {
    const dto: SaveBandRulesDto = { bandRules: validRules };

    it('should update existing active row (CRI-U-006)', async () => {
      // Arrange
      const existing = {
        SCR_ID: 5,
        SCR_ACTIVE: true,
        SCR_CONTENT: '[]',
      } as ScoreCriteria;
      scoreCriteriaRepository.findOne.mockResolvedValue(existing);

      // Act
      const result = await service.saveBandRules(dto);

      // Assert
      expect(scoreCriteriaRepository.create).not.toHaveBeenCalled();
      expect(scoreCriteriaRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          SCR_ID: 5,
          SCR_CONTENT: JSON.stringify(validRules),
        }),
      );
      expect(result).toEqual({ bandRules: validRules });
    });

    it('should create active row when none exists (CRI-U-007)', async () => {
      // Arrange
      scoreCriteriaRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.saveBandRules(dto);

      // Assert
      expect(scoreCriteriaRepository.create).toHaveBeenCalledWith({
        SCR_CONTENT: JSON.stringify(validRules),
        SCR_ACTIVE: true,
      });
      expect(scoreCriteriaRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ bandRules: validRules });
    });
  });
});
