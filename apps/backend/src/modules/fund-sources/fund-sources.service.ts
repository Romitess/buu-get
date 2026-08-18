import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FundSource } from './entities/fund-source.entity';
import { CreateFundSourceDto } from './dto/create-fund-source.dto';
import { UpdateFundSourceDto } from './dto/update-fund-source.dto';
import { DailyRevenueQueryDto } from './dto/daily-revenue-query.dto';
import { DailyRevenueSummary } from './interfaces/daily-revenue.interface';
import {
  Transaction,
  TransactionPaymentStatus,
} from '../transactions/entities/transaction.entity';
import { ExamEnrollmentStatus } from '../exam-enrollments/entities/exam-enrollment.entity';

interface RawDailyRevenueRow {
  examName: string;
  amount: string | number;
  paidCount: string | number;
}

@Injectable()
export class FundSourcesService {
  constructor(
    @InjectRepository(FundSource)
    private readonly fundSourcesRepository: Repository<FundSource>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createFundSourceDto: CreateFundSourceDto): Promise<FundSource> {
    const fundSource = this.fundSourcesRepository.create(createFundSourceDto);
    return this.fundSourcesRepository.save(fundSource);
  }

  async findAll(): Promise<FundSource[]> {
    return this.fundSourcesRepository.find();
  }

  async findOne(id: number): Promise<FundSource> {
    const fundSource = await this.fundSourcesRepository.findOne({
      where: { FS_ID: id },
    });
    if (!fundSource) {
      throw new NotFoundException(`FundSource with ID ${id} not found`);
    }
    return fundSource;
  }

  async update(
    id: number,
    updateFundSourceDto: UpdateFundSourceDto,
  ): Promise<FundSource> {
    const fundSource = await this.findOne(id);
    Object.assign(fundSource, updateFundSourceDto);
    return this.fundSourcesRepository.save(fundSource);
  }

  async remove(id: number): Promise<void> {
    const fundSource = await this.findOne(id);
    await this.fundSourcesRepository.softRemove(fundSource);
  }

  async getDailyRevenue(
    query: DailyRevenueQueryDto,
  ): Promise<DailyRevenueSummary> {
    const qb = this.dataSource
      .getRepository(Transaction)
      .createQueryBuilder('transaction')
      .innerJoin('transaction.ENROLLMENT', 'enrollment')
      .innerJoin('enrollment.SESSION', 'session')
      .innerJoin('session.EXAM', 'exam')
      .innerJoin('exam.FUND_SOURCE', 'fundSource');

    // Filter by paid status
    qb.andWhere('enrollment.ERM_STATUS IN (:...activeStatuses)', {
      activeStatuses: [
        ExamEnrollmentStatus.PAID,
        ExamEnrollmentStatus.SEAT_ASSIGNED,
        ExamEnrollmentStatus.SEAT_PUBLISHED,
        ExamEnrollmentStatus.ATTENDED,
      ],
    });
    qb.andWhere('transaction.TRANX_PAYMENT_STATUS = :approvedStatus', {
      approvedStatus: TransactionPaymentStatus.APPROVED,
    });

    // Date filters (comparing against TRANX_PAID_AT or fallback to TRANX_CREATED_AT)
    if (query.startDate) {
      qb.andWhere(
        'COALESCE(transaction.TRANX_PAID_AT, transaction.TRANX_CREATED_AT) >= :startDate',
        {
          startDate: `${query.startDate} 00:00:00`,
        },
      );
    }
    if (query.endDate) {
      qb.andWhere(
        'COALESCE(transaction.TRANX_PAID_AT, transaction.TRANX_CREATED_AT) <= :endDate',
        {
          endDate: `${query.endDate} 23:59:59`,
        },
      );
    }

    // Exam name filter
    if (query.examName) {
      qb.andWhere('exam.EXAM_NAME LIKE :examName', {
        examName: `%${query.examName}%`,
      });
    }

    qb.select([
      'exam.EXAM_NAME AS examName',
      'SUM(transaction.TRANX_AMOUNT) AS amount',
      'COUNT(transaction.TRANX_ID) AS paidCount',
    ]);

    qb.groupBy('exam.EXAM_NAME');

    const rawRows = await qb.getRawMany<RawDailyRevenueRow>();

    const rows = rawRows.map((row, idx) => ({
      index: idx + 1,
      examName: row.examName,
      amount: Number(row.amount),
    }));

    const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);
    const paidCount = rawRows.reduce(
      (sum, row) => sum + Number(row.paidCount || 0),
      0,
    );

    return {
      rows,
      totalAmount,
      paidCount,
    };
  }
}
