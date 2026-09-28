import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { EntityManager, Repository } from 'typeorm';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import { AuthenticatedUser } from 'src/common/utils/authz.util';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
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
    manager: {
      transaction: jest.Mock;
    };
  };
  let receiptNumberService: {
    assignOnIssue: jest.Mock;
  };
  let platformGatewayService: {
    getPublicFileStream: jest.Mock;
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
      manager: {
        transaction: jest
          .fn()
          .mockImplementation((cb: (em: EntityManager) => unknown) =>
            cb({} as unknown as EntityManager),
          ),
      },
    };
    receiptNumberService = {
      assignOnIssue: jest.fn(),
    };
    platformGatewayService = {
      getPublicFileStream: jest.fn(),
    };
    service = new ReceiptsService(
      receiptsRepository as unknown as Repository<Receipt>,
      receiptNumberService,
      platformGatewayService as never,
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
    it('should Object.assign status and save when not triggering number assignment (RCPT-U-008)', async () => {
      // Arrange
      const existing = {
        RC_ID: 7,
        TRANX_ID: 1,
        RC_STATUS: ReceiptStatus.ISSUED, // Already issued
        RC_NO: '256900001',
        RC_SIGNATURE_ID: 'sig',
      } as Receipt;
      receiptsRepository.findOne.mockResolvedValue(existing);
      const dto: UpdateReceiptDto = { RC_SIGNATURE_ID: 'new-sig' };

      // Act
      const result = await service.update(7, dto);

      // Assert
      expect(receiptsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          RC_ID: 7,
          RC_SIGNATURE_ID: 'new-sig',
        }),
      );
      expect(result.RC_SIGNATURE_ID).toBe('new-sig');
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

    it('should call receiptNumberService.assignOnIssue when status changes to ISSUED (RCPT-U-014)', async () => {
      // Arrange
      const unissued = {
        RC_ID: 9,
        TRANX_ID: 3,
        RC_STATUS: ReceiptStatus.UNISSUED,
        RC_NO: null,
      } as Receipt;
      receiptsRepository.findOne.mockResolvedValue(unissued);
      const dto: UpdateReceiptDto = { RC_STATUS: ReceiptStatus.ISSUED };

      // Act
      await service.update(9, dto);

      // Assert
      expect(receiptsRepository.manager.transaction).toHaveBeenCalled();
      expect(receiptNumberService.assignOnIssue).toHaveBeenCalledWith(
        expect.anything(),
        [9],
      );
    });

    it('should call findOne for post-issue reload only after transaction commits (RCPT-U-015)', async () => {
      const callOrder: string[] = [];
      const unissued = {
        RC_ID: 9,
        TRANX_ID: 3,
        RC_STATUS: ReceiptStatus.UNISSUED,
        RC_NO: null,
      } as Receipt;
      const issued = {
        RC_ID: 9,
        TRANX_ID: 3,
        RC_STATUS: ReceiptStatus.ISSUED,
        RC_NO: '256900001',
      } as Receipt;

      receiptsRepository.findOne
        .mockImplementationOnce(async () => {
          callOrder.push('findOne-pre');
          return unissued;
        })
        .mockImplementationOnce(async () => {
          callOrder.push('findOne-post');
          return issued;
        });

      receiptsRepository.manager.transaction.mockImplementation(
        async (cb: (em: unknown) => unknown) => {
          callOrder.push('transaction-start');
          await cb({});
          callOrder.push('transaction-commit');
        },
      );

      const result = await service.update(9, {
        RC_STATUS: ReceiptStatus.ISSUED,
      });

      expect(callOrder).toEqual([
        'findOne-pre',
        'transaction-start',
        'transaction-commit',
        'findOne-post',
      ]);
      expect(result).toBe(issued);
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
    const ownerUser: AuthenticatedUser = {
      userId: 10,
      email: 'owner@example.com',
      role: RoleEnum.CANDIDATE,
    };
    const financeUser: AuthenticatedUser = {
      userId: 99,
      email: 'finance@example.com',
      role: RoleEnum.FINANCE,
    };

    it('should throw NotFoundException when receipt for transaction is missing (RCPT-U-011)', async () => {
      // Arrange
      receiptsRepository.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.downloadReceipt(42, ownerUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.downloadReceipt(42, ownerUser)).rejects.toThrow(
        'Receipt for Transaction ID 42 not found',
      );
      expect(receiptsRepository.findOne).toHaveBeenCalledWith({
        where: { TRANX_ID: 42 },
        relations: [
          'TRANSACTION',
          'TRANSACTION.ENROLLMENT',
          'TRANSACTION.ENROLLMENT.SESSION',
          'TRANSACTION.ENROLLMENT.SESSION.EXAM',
        ],
      });
    });

    it('should throw ForbiddenException when receipt is not ISSUED (RCPT-U-012)', async () => {
      // Arrange
      receiptsRepository.findOne.mockResolvedValue({
        RC_ID: 1,
        TRANX_ID: 5,
        RC_STATUS: ReceiptStatus.UNISSUED,
        RC_VERIFY_CODE: 'VERIFYCODE000001',
        CREATED_AT: new Date('2026-07-01T00:00:00+07:00'),
        TRANSACTION: { ENROLLMENT: { USER_ID: 10 } },
      });

      // Act / Assert
      await expect(service.downloadReceipt(5, ownerUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.downloadReceipt(5, ownerUser)).rejects.toThrow(
        'Receipt is not in ISSUED status',
      );

      // Arrange (VOIDED)
      receiptsRepository.findOne.mockResolvedValue({
        RC_ID: 2,
        TRANX_ID: 6,
        RC_STATUS: ReceiptStatus.VOIDED,
        RC_VERIFY_CODE: 'VERIFYCODE000002',
        CREATED_AT: new Date('2026-07-01T00:00:00+07:00'),
        TRANSACTION: { ENROLLMENT: { USER_ID: 10 } },
      });

      // Act / Assert
      await expect(service.downloadReceipt(6, ownerUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when issued receipt has no stored file (RCPT-U-013)', async () => {
      receiptsRepository.findOne.mockResolvedValue({
        RC_ID: 1,
        TRANX_ID: 11,
        RC_NO: '256900001',
        RC_STATUS: ReceiptStatus.ISSUED,
        RC_VERIFY_CODE: 'ABCDEFGH12345678',
        CREATED_AT: new Date('2026-07-01T00:00:00+07:00'),
        TRANSACTION: { ENROLLMENT: { USER_ID: 10 } },
      });

      await expect(service.downloadReceipt(11, ownerUser)).rejects.toThrow(
        NotFoundException,
      );
      expect(platformGatewayService.getPublicFileStream).not.toHaveBeenCalled();
    });

    it('should stream archived receipt from MinIO when RC_FILE_PATH is set', async () => {
      const { Readable } = await import('stream');
      receiptsRepository.findOne.mockResolvedValue({
        RC_ID: 1,
        TRANX_ID: 11,
        RC_STATUS: ReceiptStatus.ISSUED,
        RC_FILE_PATH: '/receipts/256900001.pdf',
        RC_VERIFY_CODE: 'ABCDEFGH12345678',
        CREATED_AT: new Date('2026-07-01T00:00:00+07:00'),
        TRANSACTION: { ENROLLMENT: { USER_ID: 10 } },
      });
      platformGatewayService.getPublicFileStream.mockResolvedValue({
        stream: Readable.from([Buffer.from('%PDF-1.4 archived')]),
        contentType: 'application/pdf',
      });

      const result = await service.downloadReceipt(11, ownerUser);

      expect(platformGatewayService.getPublicFileStream).toHaveBeenCalledWith(
        '/receipts/256900001.pdf',
      );
      expect(Buffer.from(result).toString('utf8')).toContain('%PDF-1.4 archived');
    });

    it('should allow finance role to download another user receipt', async () => {
      receiptsRepository.findOne.mockResolvedValue({
        RC_ID: 1,
        TRANX_ID: 11,
        RC_NO: '256900001',
        RC_NAME: 'Owner',
        RC_STATUS: ReceiptStatus.ISSUED,
        RC_FILE_PATH: '/receipts/256900001.pdf',
        RC_VERIFY_CODE: 'ABCDEFGH12345678',
        CREATED_AT: new Date('2026-07-01T00:00:00+07:00'),
        TRANSACTION: { ENROLLMENT: { USER_ID: 10 } },
      });
      const { Readable } = await import('stream');
      platformGatewayService.getPublicFileStream.mockResolvedValue({
        stream: Readable.from([Buffer.from('%PDF-1.4 archived')]),
        contentType: 'application/pdf',
      });

      const result = await service.downloadReceipt(11, financeUser);
      expect(result.byteLength).toBeGreaterThan(0);
    });

    it('should forbid non-owner non-finance download', async () => {
      receiptsRepository.findOne.mockResolvedValue({
        RC_ID: 1,
        TRANX_ID: 11,
        RC_STATUS: ReceiptStatus.ISSUED,
        RC_VERIFY_CODE: 'ABCDEFGH12345678',
        CREATED_AT: new Date('2026-07-01T00:00:00+07:00'),
        TRANSACTION: { ENROLLMENT: { USER_ID: 10 } },
      });

      const stranger: AuthenticatedUser = {
        userId: 55,
        email: 'other@example.com',
        role: RoleEnum.CANDIDATE,
      };
      await expect(service.downloadReceipt(11, stranger)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
