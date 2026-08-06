import type { Repository } from 'typeorm';
import { ExamRuleVouchersService } from './exam-rule-vouchers.service';
import { ExamRuleVoucher } from './entities/exam-rule-voucher.entity';
import { SaveRegulationsDto } from './dto/save-regulations.dto';

describe('ExamRuleVouchersService', () => {
  let service: ExamRuleVouchersService;
  let examRuleVoucherRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };

  const baseDto: SaveRegulationsDto = {
    regulationsEn: '1. Bring your ID card.',
    regulationsTh: '1. นำบัตรประชาชนมาด้วย',
  };

  const makeRule = (
    overrides: Partial<ExamRuleVoucher> = {},
  ): ExamRuleVoucher => ({
    EXRV_ID: 1,
    CONTENT_EN: 'EN content',
    CONTENT_TH: 'TH content',
    CREATED_AT: new Date('2026-01-01T00:00:00.000Z'),
    UPDATED_AT: new Date('2026-01-01T00:00:00.000Z'),
    DELETED_AT: null,
    ...overrides,
  });

  beforeEach(() => {
    examRuleVoucherRepository = {
      create: jest.fn().mockImplementation((payload: unknown) => payload),
      save: jest
        .fn()
        .mockImplementation((entity: ExamRuleVoucher) =>
          Promise.resolve({ ...entity, EXRV_ID: entity.EXRV_ID ?? 1 }),
        ),
      find: jest.fn().mockResolvedValue([]),
    };
    service = new ExamRuleVouchersService(
      examRuleVoucherRepository as unknown as Repository<ExamRuleVoucher>,
    );
  });

  describe('getRegulations', () => {
    it('should return empty strings when no rows exist (ERV-U-001)', async () => {
      // Arrange
      examRuleVoucherRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getRegulations();

      // Assert
      expect(result).toEqual({ regulationsEn: '', regulationsTh: '' });
    });

    it('should map CONTENT_EN/CONTENT_TH from the latest row (ERV-U-002)', async () => {
      // Arrange
      examRuleVoucherRepository.find.mockResolvedValue([
        makeRule({
          EXRV_ID: 5,
          CONTENT_EN: 'English rules',
          CONTENT_TH: 'กฎภาษาไทย',
        }),
      ]);

      // Act
      const result = await service.getRegulations();

      // Assert
      expect(result).toEqual({
        regulationsEn: 'English rules',
        regulationsTh: 'กฎภาษาไทย',
      });
    });

    it('should coerce null CONTENT_EN/CONTENT_TH to empty strings (ERV-U-003)', async () => {
      // Arrange
      examRuleVoucherRepository.find.mockResolvedValue([
        makeRule({ CONTENT_EN: null, CONTENT_TH: null }),
      ]);

      // Act
      const result = await service.getRegulations();

      // Assert
      expect(result).toEqual({ regulationsEn: '', regulationsTh: '' });
    });

    it('should query with order EXRV_ID DESC and take 1 (ERV-U-004)', async () => {
      // Arrange
      examRuleVoucherRepository.find.mockResolvedValue([]);

      // Act
      await service.getRegulations();

      // Assert
      expect(examRuleVoucherRepository.find).toHaveBeenCalledWith({
        order: { EXRV_ID: 'DESC' },
        take: 1,
      });
      expect(examRuleVoucherRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveRegulations', () => {
    it('should update the latest row and not call create (ERV-U-005)', async () => {
      // Arrange
      const existing = makeRule({ EXRV_ID: 3 });
      examRuleVoucherRepository.find.mockResolvedValue([existing]);

      // Act
      await service.saveRegulations(baseDto);

      // Assert
      expect(examRuleVoucherRepository.create).not.toHaveBeenCalled();
      expect(existing.CONTENT_EN).toBe(baseDto.regulationsEn);
      expect(existing.CONTENT_TH).toBe(baseDto.regulationsTh);
      expect(examRuleVoucherRepository.save).toHaveBeenCalledWith(existing);
      expect(examRuleVoucherRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create and save a new row when the table is empty (ERV-U-006)', async () => {
      // Arrange
      examRuleVoucherRepository.find.mockResolvedValue([]);
      const created = {
        CONTENT_EN: baseDto.regulationsEn,
        CONTENT_TH: baseDto.regulationsTh,
      };
      examRuleVoucherRepository.create.mockReturnValue(created);

      // Act
      await service.saveRegulations(baseDto);

      // Assert
      expect(examRuleVoucherRepository.create).toHaveBeenCalledWith({
        CONTENT_EN: baseDto.regulationsEn,
        CONTENT_TH: baseDto.regulationsTh,
      });
      expect(examRuleVoucherRepository.save).toHaveBeenCalledWith(created);
    });

    it('should return DTO regulationsEn/regulationsTh on either path (ERV-U-007)', async () => {
      // Arrange — update path
      examRuleVoucherRepository.find.mockResolvedValue([makeRule()]);

      // Act
      const updateResult = await service.saveRegulations(baseDto);

      // Assert
      expect(updateResult).toEqual({
        regulationsEn: baseDto.regulationsEn,
        regulationsTh: baseDto.regulationsTh,
      });

      // Arrange — create path
      examRuleVoucherRepository.find.mockResolvedValue([]);
      const createDto: SaveRegulationsDto = {
        regulationsEn: 'New EN',
        regulationsTh: 'New TH',
      };

      // Act
      const createResult = await service.saveRegulations(createDto);

      // Assert
      expect(createResult).toEqual({
        regulationsEn: 'New EN',
        regulationsTh: 'New TH',
      });
    });

    it('should save only the latest row when multiple exist (ERV-U-008)', async () => {
      // Arrange — find returns take:1 so only the latest is in the array
      const latest = makeRule({
        EXRV_ID: 10,
        CONTENT_EN: 'old EN',
        CONTENT_TH: 'old TH',
      });
      examRuleVoucherRepository.find.mockResolvedValue([latest]);

      // Act
      await service.saveRegulations(baseDto);

      // Assert
      expect(examRuleVoucherRepository.find).toHaveBeenCalledWith({
        order: { EXRV_ID: 'DESC' },
        take: 1,
      });
      expect(examRuleVoucherRepository.create).not.toHaveBeenCalled();
      expect(examRuleVoucherRepository.save).toHaveBeenCalledTimes(1);
      expect(examRuleVoucherRepository.save).toHaveBeenCalledWith(latest);
      expect(latest.CONTENT_EN).toBe(baseDto.regulationsEn);
      expect(latest.CONTENT_TH).toBe(baseDto.regulationsTh);
    });
  });
});
