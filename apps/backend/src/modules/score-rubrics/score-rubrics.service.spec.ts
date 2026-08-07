import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import { ScoreRubricsService } from './score-rubrics.service';
import { ScoreRubric } from './entities/score-rubric.entity';
import { ScoreRubricItem } from './entities/score-rubric-item.entity';
import { Exam } from '../exam/entities/exam.entity';
import {
  CreateScoreRubricDto,
  UpdateScoreRubricDto,
} from './dto/score-rubric.dto';

type MockQueryBuilder = {
  innerJoin: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  getCount: jest.Mock;
};

const createUsageQueryBuilder = (count: number): MockQueryBuilder => {
  const qb: MockQueryBuilder = {
    innerJoin: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    getCount: jest.fn().mockResolvedValue(count),
  };
  qb.innerJoin.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  return qb;
};

describe('ScoreRubricsService', () => {
  let service: ScoreRubricsService;
  let rubricRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    softRemove: jest.Mock;
  };
  let rubricItemRepository: Record<string, never>;
  let examRepository: {
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let mockManager: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    softDelete: jest.Mock;
  };
  let dataSource: {
    transaction: jest.Mock;
  };

  const baseItems: ScoreRubricItem[] = [
    {
      SRBI_ID: 1,
      SRB_ID: 10,
      SRBI_NAME_TH: 'คำศัพท์',
      SRBI_NAME_EN: 'Vocab',
      SRBI_CODE: 'LANG_USE',
      SRBI_MAX_SCORE: 50,
      SRBI_SORT_ORDER: 1,
      DELETED_AT: null,
    } as ScoreRubricItem,
    {
      SRBI_ID: 2,
      SRB_ID: 10,
      SRBI_NAME_TH: 'อ่าน',
      SRBI_NAME_EN: 'Reading',
      SRBI_CODE: 'READING',
      SRBI_MAX_SCORE: 50,
      SRBI_SORT_ORDER: 2,
      DELETED_AT: null,
    } as ScoreRubricItem,
  ];

  const nonDefaultRubric = {
    SRB_ID: 10,
    SRB_NAME_TH: 'ชุดกำหนดเอง',
    SRB_NAME_EN: 'Custom',
    SRB_IS_DEFAULT: false,
    ITEMS: baseItems,
  } as ScoreRubric;

  beforeEach(() => {
    rubricRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn().mockResolvedValue(undefined),
    };
    rubricItemRepository = {};
    examRepository = {
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn(() => createUsageQueryBuilder(0)),
    };

    mockManager = {
      create: jest.fn((_entity: unknown, payload: unknown) => payload),
      save: jest.fn((entity: unknown) => {
        if (Array.isArray(entity)) {
          return Promise.resolve(entity);
        }
        const record = entity as ScoreRubric;
        return Promise.resolve({
          ...record,
          SRB_ID: record.SRB_ID ?? 10,
        });
      }),
      findOne: jest.fn().mockResolvedValue(nonDefaultRubric),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };

    dataSource = {
      transaction: jest.fn(
        async (cb: (manager: typeof mockManager) => Promise<unknown>) =>
          cb(mockManager),
      ),
    };

    service = new ScoreRubricsService(
      rubricRepository as unknown as Repository<ScoreRubric>,
      rubricItemRepository as unknown as Repository<ScoreRubricItem>,
      examRepository as unknown as Repository<Exam>,
      dataSource as unknown as DataSource,
    );
  });

  describe('create', () => {
    it('should create rubric with items and default max score mapping (RUB-U-001)', async () => {
      // Arrange
      const dto: CreateScoreRubricDto = {
        nameTh: 'ชุดใหม่',
        nameEn: 'New Rubric',
        items: [
          {
            nameTh: 'คำศัพท์',
            nameEn: 'Vocab',
            sortOrder: 2,
            code: 'LANG_USE',
          },
          {
            nameTh: 'อ่าน',
            nameEn: 'Reading',
            sortOrder: 1,
            maxScore: 40,
            code: 'READING',
          },
        ],
      };
      const savedRubric = {
        SRB_ID: 10,
        SRB_NAME_TH: 'ชุดใหม่',
        SRB_NAME_EN: 'New Rubric',
        SRB_IS_DEFAULT: false,
        ITEMS: [
          {
            SRBI_ID: 2,
            SRBI_NAME_TH: 'อ่าน',
            SRBI_NAME_EN: 'Reading',
            SRBI_CODE: 'READING',
            SRBI_MAX_SCORE: 40,
            SRBI_SORT_ORDER: 1,
            DELETED_AT: null,
          },
          {
            SRBI_ID: 1,
            SRBI_NAME_TH: 'คำศัพท์',
            SRBI_NAME_EN: 'Vocab',
            SRBI_CODE: 'LANG_USE',
            SRBI_MAX_SCORE: 50,
            SRBI_SORT_ORDER: 2,
            DELETED_AT: null,
          },
        ],
      } as ScoreRubric;
      mockManager.findOne.mockResolvedValue(savedRubric);

      // Act
      const result = await service.create(dto);

      // Assert
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(mockManager.create).toHaveBeenCalledWith(
        ScoreRubric,
        expect.objectContaining({
          SRB_NAME_TH: 'ชุดใหม่',
          SRB_NAME_EN: 'New Rubric',
          SRB_IS_DEFAULT: false,
        }),
      );
      expect(mockManager.create).toHaveBeenCalledWith(
        ScoreRubricItem,
        expect.objectContaining({
          SRBI_NAME_TH: 'คำศัพท์',
          SRBI_MAX_SCORE: 50,
          SRBI_SORT_ORDER: 2,
        }),
      );
      expect(mockManager.create).toHaveBeenCalledWith(
        ScoreRubricItem,
        expect.objectContaining({
          SRBI_NAME_TH: 'อ่าน',
          SRBI_MAX_SCORE: 40,
          SRBI_SORT_ORDER: 1,
        }),
      );
      expect(result.id).toBe(10);
      expect(result.items.map((item) => item.sortOrder)).toEqual([1, 2]);
      expect(result.items[0].maxScore).toBe(40);
      expect(result.items[1].maxScore).toBe(50);
    });
  });

  describe('update', () => {
    it('should block item edits for default rubric (RUB-U-002)', async () => {
      // Arrange
      rubricRepository.findOne.mockResolvedValue({
        ...nonDefaultRubric,
        SRB_IS_DEFAULT: true,
      });
      const dto: UpdateScoreRubricDto = {
        items: [
          {
            nameTh: 'ใหม่',
            nameEn: 'New',
            sortOrder: 1,
            maxScore: 50,
          },
        ],
      };

      // Act & Assert
      await expect(service.update(10, dto)).rejects.toThrow(
        /ไม่สามารถแก้ไขรายการของชุดเกณฑ์เริ่มต้นได้/,
      );
      await expect(service.update(10, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should block items when rubric used by saved scores (RUB-U-003)', async () => {
      // Arrange
      rubricRepository.findOne.mockResolvedValue(nonDefaultRubric);
      examRepository.createQueryBuilder.mockReturnValue(
        createUsageQueryBuilder(3),
      );
      const dto: UpdateScoreRubricDto = {
        items: [
          {
            nameTh: 'ใหม่',
            nameEn: 'New',
            sortOrder: 1,
            maxScore: 50,
          },
        ],
      };

      // Act & Assert
      await expect(service.update(10, dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      await expect(service.update(10, dto)).rejects.toThrow(
        /ไม่สามารถแก้ไขรายการในชุดเกณฑ์ที่ถูกใช้กับคะแนนที่บันทึกแล้ว/,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should soft-delete old items then replace when items provided (RUB-U-004)', async () => {
      // Arrange
      rubricRepository.findOne.mockResolvedValue(nonDefaultRubric);
      const dto: UpdateScoreRubricDto = {
        nameTh: 'ชุดอัปเดต',
        items: [
          {
            nameTh: 'ใหม่-1',
            nameEn: 'New-1',
            sortOrder: 1,
            maxScore: 40,
            code: 'LANG_USE',
          },
          {
            nameTh: 'ใหม่-2',
            nameEn: 'New-2',
            sortOrder: 2,
            maxScore: 60,
            code: 'READING',
          },
        ],
      };
      mockManager.findOne.mockResolvedValue({
        ...nonDefaultRubric,
        SRB_NAME_TH: 'ชุดอัปเดต',
        ITEMS: [
          {
            SRBI_ID: 11,
            SRBI_NAME_TH: 'ใหม่-1',
            SRBI_NAME_EN: 'New-1',
            SRBI_CODE: 'LANG_USE',
            SRBI_MAX_SCORE: 40,
            SRBI_SORT_ORDER: 1,
            DELETED_AT: null,
          },
          {
            SRBI_ID: 12,
            SRBI_NAME_TH: 'ใหม่-2',
            SRBI_NAME_EN: 'New-2',
            SRBI_CODE: 'READING',
            SRBI_MAX_SCORE: 60,
            SRBI_SORT_ORDER: 2,
            DELETED_AT: null,
          },
        ],
      });

      // Act
      const result = await service.update(10, dto);

      // Assert
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(mockManager.softDelete).toHaveBeenCalledWith(ScoreRubricItem, {
        SRB_ID: 10,
      });
      expect(mockManager.create).toHaveBeenCalledWith(
        ScoreRubricItem,
        expect.objectContaining({
          SRB_ID: 10,
          SRBI_NAME_TH: 'ใหม่-1',
          SRBI_MAX_SCORE: 40,
        }),
      );
      expect(mockManager.create).toHaveBeenCalledWith(
        ScoreRubricItem,
        expect.objectContaining({
          SRB_ID: 10,
          SRBI_NAME_TH: 'ใหม่-2',
          SRBI_MAX_SCORE: 60,
        }),
      );
      expect(mockManager.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ SRBI_NAME_TH: 'ใหม่-1' }),
          expect.objectContaining({ SRBI_NAME_TH: 'ใหม่-2' }),
        ]),
      );
      expect(result.nameTh).toBe('ชุดอัปเดต');
      expect(result.items).toHaveLength(2);
      expect(result.items.map((item) => item.maxScore)).toEqual([40, 60]);
    });
  });

  describe('findOne', () => {
    it('should throw NotFound when rubric is missing (RUB-U-008)', async () => {
      // Arrange
      rubricRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.findOne(999)).rejects.toThrow(
        /ScoreRubric with ID 999 not found/,
      );
    });
  });

  describe('findAll', () => {
    it('should hide soft-deleted items in response (RUB-U-009)', async () => {
      // Arrange
      rubricRepository.find.mockResolvedValue([
        {
          ...nonDefaultRubric,
          ITEMS: [
            baseItems[0],
            {
              ...baseItems[1],
              DELETED_AT: new Date('2026-01-01T00:00:00Z'),
            },
          ],
        },
      ]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(rubricRepository.find).toHaveBeenCalledWith({
        relations: ['ITEMS'],
        order: { SRB_ID: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].items).toHaveLength(1);
      expect(result[0].items[0]).toEqual(
        expect.objectContaining({
          id: 1,
          nameTh: 'คำศัพท์',
          code: 'LANG_USE',
        }),
      );
    });
  });

  describe('remove', () => {
    it('should block default rubric deletion (RUB-U-005)', async () => {
      // Arrange
      rubricRepository.findOne.mockResolvedValue({
        ...nonDefaultRubric,
        SRB_IS_DEFAULT: true,
      });

      // Act & Assert
      await expect(service.remove(10)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.remove(10)).rejects.toThrow(
        /ไม่สามารถลบชุดเกณฑ์เริ่มต้นได้/,
      );
      expect(rubricRepository.softRemove).not.toHaveBeenCalled();
    });

    it('should block rubric referenced by exam (RUB-U-006)', async () => {
      // Arrange
      rubricRepository.findOne.mockResolvedValue(nonDefaultRubric);
      examRepository.count.mockResolvedValue(2);

      // Act & Assert
      await expect(service.remove(10)).rejects.toBeInstanceOf(
        ConflictException,
      );
      await expect(service.remove(10)).rejects.toThrow(
        /ไม่สามารถลบชุดเกณฑ์ที่ถูกใช้กับรอบสอบแล้ว/,
      );
      expect(rubricRepository.softRemove).not.toHaveBeenCalled();
    });
  });

  describe('assertRubricUsable', () => {
    it('should reject zero active items (RUB-U-007)', async () => {
      // Arrange
      rubricRepository.findOne.mockResolvedValue({
        ...nonDefaultRubric,
        ITEMS: [
          {
            ...baseItems[0],
            DELETED_AT: new Date(),
          },
        ],
      });

      // Act & Assert
      await expect(service.assertRubricUsable(10)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.assertRubricUsable(10)).rejects.toThrow(
        /ชุดเกณฑ์คะแนนต้องมีอย่างน้อย 1 รายการ/,
      );
    });

    it('should throw NotFound when rubric is missing', async () => {
      // Arrange
      rubricRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.assertRubricUsable(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
