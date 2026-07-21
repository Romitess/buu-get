import type { Repository } from 'typeorm';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import { Transaction } from './entities/transaction.entity';
import { TransactionsService } from './transactions.service';

jest.mock('./entities/transaction.entity', () => ({
  Transaction: class Transaction {},
  TransactionChannel: {},
  TransactionMatchStatus: {},
  TransactionPaymentMethod: {},
  TransactionPaymentStatus: {},
}));

jest.mock('../receipts/entities/receipt.entity', () => ({
  Receipt: class Receipt {},
  ReceiptStatus: { ISSUED: 'ISSUED' },
}));

jest.mock('../exam-enrollments/entities/exam-enrollment.entity', () => ({
  ExamEnrollment: class ExamEnrollment {},
  ExamEnrollmentStatus: { PAID: 'PAID' },
}));

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionsRepository: jest.Mocked<
    Pick<Repository<Transaction>, 'findAndCount'>
  >;

  beforeEach(() => {
    transactionsRepository = {
      findAndCount: jest.fn().mockResolvedValue([[{ TRANX_ID: 1 }], 1]),
    };
    service = new TransactionsService(
      transactionsRepository as unknown as Repository<Transaction>,
      {} as never,
    );
  });

  describe('findAll', () => {
    it('returns paginated transactions with defaults', async () => {
      const result = await service.findAll();

      expect(transactionsRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['ENROLLMENT'],
        skip: 0,
        take: PAGINATION_DEFAULT_LIMIT,
        order: { TRANX_ID: 'DESC' },
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(PAGINATION_DEFAULT_PAGE);
      expect(result.meta.total).toBe(1);
    });

    it('honors page and limit query params', async () => {
      await service.findAll({ page: 2, limit: 25 });

      expect(transactionsRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 25,
          take: 25,
        }),
      );
    });
  });
});
