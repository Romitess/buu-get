import { BadRequestException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { ReceiptNumberService } from './receipt-number.service';
import { Receipt, ReceiptStatus } from './entities/receipt.entity';
import { ReceiptSequence } from './entities/receipt-sequence.entity';

type ReceiptRepoMock = {
  find: jest.MockedFunction<Repository<Receipt>['find']>;
  save: jest.MockedFunction<Repository<Receipt>['save']>;
};

type SeqRepoMock = {
  findOne: jest.MockedFunction<Repository<ReceiptSequence>['findOne']>;
  create: jest.MockedFunction<Repository<ReceiptSequence>['create']>;
  save: jest.MockedFunction<Repository<ReceiptSequence>['save']>;
};

describe('ReceiptNumberService', () => {
  let service: ReceiptNumberService;
  let manager: Partial<EntityManager>;
  let receiptRepo: ReceiptRepoMock;
  let seqRepo: SeqRepoMock;

  beforeEach(() => {
    service = new ReceiptNumberService();
    receiptRepo = {
      find: jest.fn(),
      save: jest.fn().mockImplementation((r: Receipt) => Promise.resolve(r)),
    };
    seqRepo = {
      findOne: jest.fn(),
      create: jest
        .fn()
        .mockImplementation(
          (d: Partial<ReceiptSequence>) => d as ReceiptSequence,
        ),
      save: jest
        .fn()
        .mockImplementation((s: ReceiptSequence) => Promise.resolve(s)),
    };
    manager = {
      getRepository: jest.fn().mockImplementation((entity: unknown) => {
        if (entity === Receipt) return receiptRepo;
        if (entity === ReceiptSequence) return seqRepo;
        return undefined;
      }),
    };
  });

  describe('assignOnIssue', () => {
    it('should assign a new receipt number for ISSUED status', async () => {
      // Arrange
      const receipt = {
        RC_ID: 100,
        RC_STATUS: ReceiptStatus.UNISSUED,
        RC_NO: null,
        TRANSACTION: {
          TRANX_PAID_AT: new Date('2026-08-10T10:00:00Z'),
          ENROLLMENT: {
            SESSION: {
              EXAM: {
                EXAM_FISCAL_YEAR: '2026',
              },
            },
          },
        },
      } as unknown as Receipt;

      receiptRepo.find.mockResolvedValue([receipt]);
      seqRepo.findOne.mockResolvedValue({
        RSEQ_FISCAL_YEAR_BE: '2569',
        RSEQ_LAST_NO: 10,
      } as ReceiptSequence);

      // Act
      await service.assignOnIssue(manager as EntityManager, [100]);

      // Assert
      expect(receipt.RC_NO).toBe('256900011');
      expect(receipt.RC_STATUS).toBe(ReceiptStatus.ISSUED);
      expect(receipt.RC_ISSUED_AT).toBeDefined();
      expect(seqRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ RSEQ_LAST_NO: 11 }),
      );
      expect(receiptRepo.save).toHaveBeenCalled();
    });

    it('should use fallback year if exam fiscal year is missing', async () => {
      // Arrange
      const receipt = {
        RC_ID: 101,
        RC_NO: null,
        TRANSACTION: {
          TRANX_PAID_AT: new Date('2026-08-10T10:00:00Z'),
        },
      } as unknown as Receipt;

      receiptRepo.find.mockResolvedValue([receipt]);
      seqRepo.findOne.mockResolvedValue(null);

      // Act
      await service.assignOnIssue(manager as EntityManager, [101]);

      // Assert
      expect(receipt.RC_NO).toBe('256900001'); // 2026 + 543 = 2569
    });

    it('should throw BadRequestException on sequence overflow', async () => {
      // Arrange
      const receipt = {
        RC_ID: 102,
        RC_NO: null,
      } as unknown as Receipt;
      receiptRepo.find.mockResolvedValue([receipt]);
      seqRepo.findOne.mockResolvedValue({
        RSEQ_LAST_NO: 99999,
        RSEQ_FISCAL_YEAR_BE: '2569',
      } as ReceiptSequence);

      // Act & Assert
      await expect(
        service.assignOnIssue(manager as EntityManager, [102]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not re-assign if RC_NO already exists (idempotent)', async () => {
      // Arrange
      const receipt = {
        RC_ID: 103,
        RC_NO: '256900001',
        RC_STATUS: ReceiptStatus.VOIDED,
      } as unknown as Receipt;
      receiptRepo.find.mockResolvedValue([receipt]);

      // Act
      await service.assignOnIssue(manager as EntityManager, [103]);

      // Assert
      expect(receipt.RC_NO).toBe('256900001');
      expect(seqRepo.save).not.toHaveBeenCalled();
    });
  });
});
