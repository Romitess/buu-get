import { NotFoundException } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import { FundSourcesService } from './fund-sources.service';
import { FundSource } from './entities/fund-source.entity';
import { CreateFundSourceDto } from './dto/create-fund-source.dto';
import { UpdateFundSourceDto } from './dto/update-fund-source.dto';
import { DailyRevenueQueryDto } from './dto/daily-revenue-query.dto';
import { TransactionPaymentStatus } from '../transactions/entities/transaction.entity';
import { ExamEnrollmentStatus } from '../exam-enrollments/entities/exam-enrollment.entity';

type MockQueryBuilder = {
  innerJoin: jest.Mock;
  andWhere: jest.Mock;
  select: jest.Mock;
  groupBy: jest.Mock;
  getRawMany: jest.Mock;
};

const createQueryBuilderMock = (
  rawRows: Array<{
    examName: string;
    amount: string | number;
    paidCount?: string | number;
  }> = [],
): MockQueryBuilder => {
  const qb: MockQueryBuilder = {
    innerJoin: jest.fn(),
    andWhere: jest.fn(),
    select: jest.fn(),
    groupBy: jest.fn(),
    getRawMany: jest.fn().mockResolvedValue(rawRows),
  };
  qb.innerJoin.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  qb.select.mockReturnValue(qb);
  qb.groupBy.mockReturnValue(qb);
  return qb;
};

describe('FundSourcesService', () => {
  let service: FundSourcesService;
  let fundSourcesRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    softRemove: jest.Mock;
  };
  let transactionRepo: {
    createQueryBuilder: jest.Mock;
  };
  let dataSource: {
    getRepository: jest.Mock;
  };
  let queryBuilder: MockQueryBuilder;

  const baseDto: CreateFundSourceDto = {
    FS_ACCOUNT_CODE: 'ACC-001',
    FS_NAME: 'ทุนสนับสนุนการศึกษา',
    FS_OPEN_STATUS: true,
  };

  const existingFundSource = {
    FS_ID: 1,
    FS_ACCOUNT_CODE: 'ACC-001',
    FS_NAME: 'ทุนสนับสนุนการศึกษา',
    FS_OPEN_STATUS: true,
    CREATED_AT: new Date('2026-01-01T00:00:00.000Z'),
    UPDATED_AT: new Date('2026-01-01T00:00:00.000Z'),
    DELETED_AT: null,
  } as FundSource;

  beforeEach(() => {
    fundSourcesRepository = {
      create: jest.fn().mockImplementation((payload: unknown) => payload),
      save: jest
        .fn()
        .mockImplementation((entity: FundSource) =>
          Promise.resolve({ ...entity, FS_ID: entity.FS_ID ?? 1 }),
        ),
      find: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn().mockResolvedValue(undefined),
    };

    queryBuilder = createQueryBuilderMock();
    transactionRepo = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    dataSource = {
      getRepository: jest.fn(() => transactionRepo),
    };

    service = new FundSourcesService(
      fundSourcesRepository as unknown as Repository<FundSource>,
      dataSource as unknown as DataSource,
    );
  });

  describe('create', () => {
    it('should persist DTO via repository.create then save (FUND-U-001)', async () => {
      // Arrange
      const createdEntity = { ...baseDto } as FundSource;
      fundSourcesRepository.create.mockReturnValue(createdEntity);
      fundSourcesRepository.save.mockResolvedValue({
        ...createdEntity,
        FS_ID: 10,
      });

      // Act
      const result = await service.create(baseDto);

      // Assert
      expect(fundSourcesRepository.create).toHaveBeenCalledWith(baseDto);
      expect(fundSourcesRepository.save).toHaveBeenCalledWith(createdEntity);
      expect(result.FS_ID).toBe(10);
      expect(result.FS_ACCOUNT_CODE).toBe('ACC-001');
      expect(result.FS_NAME).toBe('ทุนสนับสนุนการศึกษา');
    });

    it('should pass DTO without FS_OPEN_STATUS so DB default applies (FUND-U-002)', async () => {
      // Arrange
      const dtoWithoutStatus: CreateFundSourceDto = {
        FS_ACCOUNT_CODE: 'ACC-002',
        FS_NAME: 'ทุนวิจัย',
      };
      const createdEntity = { ...dtoWithoutStatus } as FundSource;
      fundSourcesRepository.create.mockReturnValue(createdEntity);
      fundSourcesRepository.save.mockResolvedValue({
        ...createdEntity,
        FS_ID: 11,
        FS_OPEN_STATUS: true,
      });

      // Act
      const result = await service.create(dtoWithoutStatus);

      // Assert
      expect(fundSourcesRepository.create).toHaveBeenCalledWith(
        dtoWithoutStatus,
      );
      expect(fundSourcesRepository.create.mock.calls[0][0]).not.toHaveProperty(
        'FS_OPEN_STATUS',
      );
      expect(fundSourcesRepository.save).toHaveBeenCalledWith(createdEntity);
      expect(result.FS_OPEN_STATUS).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return repository.find() with no filters (FUND-U-003)', async () => {
      // Arrange
      const rows = [existingFundSource];
      fundSourcesRepository.find.mockResolvedValue(rows);

      // Act
      const result = await service.findAll();

      // Assert
      expect(fundSourcesRepository.find).toHaveBeenCalledWith();
      expect(fundSourcesRepository.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('findOne', () => {
    it('should return entity when FundSource exists (FUND-U-004)', async () => {
      // Arrange
      fundSourcesRepository.findOne.mockResolvedValue(existingFundSource);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(fundSourcesRepository.findOne).toHaveBeenCalledWith({
        where: { FS_ID: 1 },
      });
      expect(result).toEqual(existingFundSource);
    });

    it('should throw NotFoundException when FundSource is missing (FUND-U-005)', async () => {
      // Arrange
      fundSourcesRepository.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'FundSource with ID 999 not found',
      );
    });
  });

  describe('update', () => {
    it('should merge DTO onto entity then save (FUND-U-006)', async () => {
      // Arrange
      const dto: UpdateFundSourceDto = {
        FS_NAME: 'ทุนปรับปรุง',
        FS_OPEN_STATUS: false,
      };
      const entity = { ...existingFundSource };
      fundSourcesRepository.findOne.mockResolvedValue(entity);
      fundSourcesRepository.save.mockImplementation((saved: FundSource) =>
        Promise.resolve(saved),
      );

      // Act
      const result = await service.update(1, dto);

      // Assert
      expect(fundSourcesRepository.findOne).toHaveBeenCalledWith({
        where: { FS_ID: 1 },
      });
      expect(fundSourcesRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          FS_ID: 1,
          FS_ACCOUNT_CODE: 'ACC-001',
          FS_NAME: 'ทุนปรับปรุง',
          FS_OPEN_STATUS: false,
        }),
      );
      expect(result.FS_NAME).toBe('ทุนปรับปรุง');
      expect(result.FS_OPEN_STATUS).toBe(false);
    });

    it('should throw NotFoundException and not save when missing (FUND-U-007)', async () => {
      // Arrange
      fundSourcesRepository.findOne.mockResolvedValue(null);
      const dto: UpdateFundSourceDto = { FS_NAME: 'Nope' };

      // Act / Assert
      await expect(service.update(42, dto)).rejects.toThrow(NotFoundException);
      await expect(service.update(42, dto)).rejects.toThrow(
        'FundSource with ID 42 not found',
      );
      expect(fundSourcesRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should softRemove existing FundSource (FUND-U-008)', async () => {
      // Arrange
      fundSourcesRepository.findOne.mockResolvedValue(existingFundSource);

      // Act
      await service.remove(1);

      // Assert
      expect(fundSourcesRepository.findOne).toHaveBeenCalledWith({
        where: { FS_ID: 1 },
      });
      expect(fundSourcesRepository.softRemove).toHaveBeenCalledWith(
        existingFundSource,
      );
    });

    it('should throw NotFoundException when FundSource is missing (FUND-U-009)', async () => {
      // Arrange
      fundSourcesRepository.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.remove(77)).rejects.toThrow(NotFoundException);
      await expect(service.remove(77)).rejects.toThrow(
        'FundSource with ID 77 not found',
      );
      expect(fundSourcesRepository.softRemove).not.toHaveBeenCalled();
    });
  });

  describe('getDailyRevenue', () => {
    it('should map raw rows to 1-based index and sum totalAmount (FUND-U-016)', async () => {
      // Arrange
      queryBuilder = createQueryBuilderMock([
        { examName: 'Exam A', amount: '100.50', paidCount: '2' },
        { examName: 'Exam B', amount: 200, paidCount: 1 },
      ]);
      transactionRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      // Act
      const result = await service.getDailyRevenue({});

      // Assert
      expect(result.rows).toEqual([
        { index: 1, examName: 'Exam A', amount: 100.5 },
        { index: 2, examName: 'Exam B', amount: 200 },
      ]);
      expect(result.totalAmount).toBe(300.5);
      expect(result.paidCount).toBe(3);
    });

    it('should filter APPROVED payment status and active enrollment statuses (FUND-U-017)', async () => {
      // Arrange
      queryBuilder = createQueryBuilderMock([]);
      transactionRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      // Act
      await service.getDailyRevenue({});

      // Assert
      expect(dataSource.getRepository).toHaveBeenCalled();
      expect(transactionRepo.createQueryBuilder).toHaveBeenCalledWith(
        'transaction',
      );
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'transaction.ENROLLMENT',
        'enrollment',
      );
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'enrollment.SESSION',
        'session',
      );
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'session.EXAM',
        'exam',
      );
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'exam.FUND_SOURCE',
        'fundSource',
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'enrollment.ERM_STATUS IN (:...activeStatuses)',
        {
          activeStatuses: [
            ExamEnrollmentStatus.PAID,
            ExamEnrollmentStatus.SEAT_ASSIGNED,
            ExamEnrollmentStatus.SEAT_PUBLISHED,
            ExamEnrollmentStatus.ATTENDED,
          ],
        },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'transaction.TRANX_PAYMENT_STATUS = :approvedStatus',
        {
          approvedStatus: TransactionPaymentStatus.APPROVED,
        },
      );
    });

    it('should apply startDate, endDate, and examName filters when provided (FUND-U-018)', async () => {
      // Arrange
      queryBuilder = createQueryBuilderMock([]);
      transactionRepo.createQueryBuilder.mockReturnValue(queryBuilder);
      const query: DailyRevenueQueryDto = {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        examName: 'BUU',
      };

      // Act
      await service.getDailyRevenue(query);

      // Assert
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'COALESCE(transaction.TRANX_PAID_AT, transaction.TRANX_CREATED_AT) >= :startDate',
        { startDate: '2026-01-01 00:00:00' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'COALESCE(transaction.TRANX_PAID_AT, transaction.TRANX_CREATED_AT) <= :endDate',
        { endDate: '2026-01-31 23:59:59' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'exam.EXAM_NAME LIKE :examName',
        { examName: '%BUU%' },
      );
    });
  });
});
