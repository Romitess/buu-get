import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import { generateReceiptVerifyCode } from 'src/common/utils/verification-code.util';
import { ReceiptsService } from './receipts.service';
import { CreateReceiptDto, UpdateReceiptDto } from './dto/receipt.dto';
import { Receipt, ReceiptStatus } from './entities/receipt.entity';

jest.mock('src/common/utils/verification-code.util', () => ({
  generateReceiptVerifyCode: jest.fn(() => 'ABCDEFGH12345678'),
}));

describe('ReceiptsService', () => {
  let service: ReceiptsService;
  let receiptsRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    softRemove: jest.Mock;
  };

  const mockedGenerateReceiptVerifyCode =
    generateReceiptVerifyCode as jest.MockedFunction<
      typeof generateReceiptVerifyCode
    >;

  beforeEach(() => {
    receiptsRepository = {
      create: jest.fn().mockImplementation((payload: unknown) => payload),
      save: jest
        .fn()
        .mockImplementation((entity: Receipt) =>
          Promise.resolve({ ...entity, RC_ID: entity.RC_ID ?? 1 }),
        ),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn().mockResolvedValue(undefined),
    };
    service = new ReceiptsService(
      receiptsRepository as unknown as Repository<Receipt>,
    );
    mockedGenerateReceiptVerifyCode.mockClear();
    mockedGenerateReceiptVerifyCode.mockReturnValue('ABCDEFGH12345678');
  });

  describe('create', () => {
    it('should persist receipt with auto-generated RC_VERIFY_CODE (RCPT-U-001)', async () => {
      // Arrange
      const dto: CreateReceiptDto = {
        TRANX_ID: 10,
        RC_SIGNATURE_ID: 'sig-abc',
      };
      const expectedCode = 'ABCDEFGH12345678';

      // Act
      const result = await service.create(dto);

      // Assert
      expect(mockedGenerateReceiptVerifyCode).toHaveBeenCalledTimes(1);
      expect(receiptsRepository.create).toHaveBeenCalledWith({
        ...dto,
        RC_VERIFY_CODE: expectedCode,
      });
      expect(receiptsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          TRANX_ID: 10,
          RC_SIGNATURE_ID: 'sig-abc',
          RC_VERIFY_CODE: expectedCode,
        }),
      );
      expect(result.RC_VERIFY_CODE).toBe(expectedCode);
    });

    it('should always set RC_VERIFY_CODE via util so client cannot set it via DTO (RCPT-U-002)', async () => {
      // Arrange
      const dto = {
        TRANX_ID: 10,
        RC_SIGNATURE_ID: 'sig-abc',
        RC_VERIFY_CODE: 'CLIENTINJECTED!!',
      } as CreateReceiptDto & { RC_VERIFY_CODE: string };
      mockedGenerateReceiptVerifyCode.mockReturnValue('SERVERGENERATED01');

      // Act
      await service.create(dto);

      // Assert
      expect(mockedGenerateReceiptVerifyCode).toHaveBeenCalled();
      expect(receiptsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          RC_VERIFY_CODE: 'SERVERGENERATED01',
        }),
      );
      expect(receiptsRepository.create).not.toHaveBeenCalledWith(
        expect.objectContaining({
          RC_VERIFY_CODE: 'CLIENTINJECTED!!',
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when receipt is missing (RCPT-U-003)', async () => {
      // Arrange
      receiptsRepository.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Receipt with ID 999 not found',
      );
    });

    it('should load receipt with TRANSACTION relation (RCPT-U-004)', async () => {
      // Arrange
      const receipt = {
        RC_ID: 5,
        TRANX_ID: 20,
        TRANSACTION: { TRANX_ID: 20 },
      } as Receipt;
      receiptsRepository.findOne.mockResolvedValue(receipt);

      // Act
      const result = await service.findOne(5);

      // Assert
      expect(receiptsRepository.findOne).toHaveBeenCalledWith({
        where: { RC_ID: 5 },
        relations: ['TRANSACTION'],
      });
      expect(result).toEqual(receipt);
      expect(result.TRANSACTION).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should use default page=1 limit=10 ordered by RC_ID DESC (RCPT-U-005)', async () => {
      // Arrange
      const rows = [{ RC_ID: 2 }, { RC_ID: 1 }] as Receipt[];
      receiptsRepository.findAndCount.mockResolvedValue([rows, 2]);

      // Act
      const result = await service.findAll({});

      // Assert
      expect(receiptsRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['TRANSACTION'],
        skip: 0,
        take: PAGINATION_DEFAULT_LIMIT,
        order: { RC_ID: 'DESC' },
      });
      expect(result.meta.page).toBe(PAGINATION_DEFAULT_PAGE);
      expect(result.meta.limit).toBe(PAGINATION_DEFAULT_LIMIT);
      expect(result.meta.total).toBe(2);
      expect(result.data).toEqual(rows);
    });

    it('should apply custom page/limit with correct skip (RCPT-U-006)', async () => {
      // Arrange
      receiptsRepository.findAndCount.mockResolvedValue([[], 100]);

      // Act
      const result = await service.findAll({ page: 3, limit: 25 });

      // Assert
      expect(receiptsRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['TRANSACTION'],
        skip: 50,
        take: 25,
        order: { RC_ID: 'DESC' },
      });
      expect(result.meta.page).toBe(3);
      expect(result.meta.limit).toBe(25);
    });
  });

  describe('findIssued', () => {
    it('should filter ISSUED only with deep TRANSACTION relations (RCPT-U-007)', async () => {
      // Arrange
      const rows = [{ RC_ID: 1, RC_STATUS: ReceiptStatus.ISSUED }] as Receipt[];
      receiptsRepository.findAndCount.mockResolvedValue([rows, 1]);

      // Act
      const result = await service.findIssued({});

      // Assert
      expect(receiptsRepository.findAndCount).toHaveBeenCalledWith({
        where: { RC_STATUS: ReceiptStatus.ISSUED },
        relations: [
          'TRANSACTION',
          'TRANSACTION.ENROLLMENT',
          'TRANSACTION.ENROLLMENT.USER',
          'TRANSACTION.ENROLLMENT.USER.PROFILE',
          'TRANSACTION.ENROLLMENT.SESSION',
          'TRANSACTION.ENROLLMENT.SESSION.EXAM',
          'TRANSACTION.ENROLLMENT.SESSION.EXAM.FUND_SOURCE',
          'TRANSACTION.BANK_RECONCILES',
          'TRANSACTION.BANK_RECONCILES.USER',
          'TRANSACTION.BANK_RECONCILES.USER.PROFILE',
        ],
        skip: 0,
        take: PAGINATION_DEFAULT_LIMIT,
        order: {
          RC_ISSUED_AT: 'DESC',
          CREATED_AT: 'DESC',
          RC_ID: 'DESC',
        },
      });
      expect(result.data).toEqual(rows);
    });
  });

  describe('update', () => {
    it('should Object.assign status without state-machine guard (RCPT-U-008)', async () => {
      // Arrange
      const existing = {
        RC_ID: 7,
        TRANX_ID: 1,
        RC_STATUS: ReceiptStatus.UNISSUED,
        RC_SIGNATURE_ID: 'sig',
      } as Receipt;
      receiptsRepository.findOne.mockResolvedValue(existing);
      const dto: UpdateReceiptDto = { RC_STATUS: ReceiptStatus.ISSUED };

      // Act
      const result = await service.update(7, dto);

      // Assert
      expect(receiptsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          RC_ID: 7,
          RC_STATUS: ReceiptStatus.ISSUED,
        }),
      );
      expect(result.RC_STATUS).toBe(ReceiptStatus.ISSUED);
    });

    it('should allow reverse ISSUED→UNISSUED and ISSUED→VOIDED (RCPT-U-009)', async () => {
      // Arrange
      const issued = {
        RC_ID: 8,
        TRANX_ID: 2,
        RC_STATUS: ReceiptStatus.ISSUED,
        RC_SIGNATURE_ID: 'sig',
      } as Receipt;
      receiptsRepository.findOne.mockResolvedValue({ ...issued });

      // Act
      const unissuedResult = await service.update(8, {
        RC_STATUS: ReceiptStatus.UNISSUED,
      });

      // Assert
      expect(unissuedResult.RC_STATUS).toBe(ReceiptStatus.UNISSUED);

      // Arrange (VOIDED path)
      receiptsRepository.findOne.mockResolvedValue({ ...issued });

      // Act
      const voidedResult = await service.update(8, {
        RC_STATUS: ReceiptStatus.VOIDED,
      });

      // Assert
      expect(voidedResult.RC_STATUS).toBe(ReceiptStatus.VOIDED);
      expect(receiptsRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('remove', () => {
    it('should softRemove existing receipt (RCPT-U-010)', async () => {
      // Arrange
      const receipt = {
        RC_ID: 3,
        TRANX_ID: 9,
        RC_STATUS: ReceiptStatus.UNISSUED,
      } as Receipt;
      receiptsRepository.findOne.mockResolvedValue(receipt);

      // Act
      await service.remove(3);

      // Assert
      expect(receiptsRepository.softRemove).toHaveBeenCalledWith(receipt);
    });
  });

  describe('downloadReceipt', () => {
    it('should throw NotFoundException when receipt for transaction is missing (RCPT-U-011)', async () => {
      // Arrange
      receiptsRepository.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.downloadReceipt(42)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.downloadReceipt(42)).rejects.toThrow(
        'Receipt for Transaction ID 42 not found',
      );
      expect(receiptsRepository.findOne).toHaveBeenCalledWith({
        where: { TRANX_ID: 42 },
      });
    });

    it('should throw ForbiddenException when receipt is not ISSUED (RCPT-U-012)', async () => {
      // Arrange
      receiptsRepository.findOne.mockResolvedValue({
        RC_ID: 1,
        TRANX_ID: 5,
        RC_STATUS: ReceiptStatus.UNISSUED,
      });

      // Act / Assert
      await expect(service.downloadReceipt(5)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.downloadReceipt(5)).rejects.toThrow(
        'Receipt is not in ISSUED status',
      );

      // Arrange (VOIDED)
      receiptsRepository.findOne.mockResolvedValue({
        RC_ID: 2,
        TRANX_ID: 6,
        RC_STATUS: ReceiptStatus.VOIDED,
      });

      // Act / Assert
      await expect(service.downloadReceipt(6)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return stub PDF bytes when receipt is ISSUED (RCPT-U-013)', async () => {
      // Arrange
      receiptsRepository.findOne.mockResolvedValue({
        RC_ID: 1,
        TRANX_ID: 11,
        RC_STATUS: ReceiptStatus.ISSUED,
      });

      // Act
      const result = await service.downloadReceipt(11);

      // Assert
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.byteLength).toBeGreaterThan(0);
      const header = Buffer.from(result.subarray(0, 5)).toString('utf8');
      expect(header).toBe('%PDF-');
    });
  });
});
