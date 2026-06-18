import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FundSource } from './entities/fund-source.entity';
import { CreateFundSourceDto } from './dto/create-fund-source.dto';
import { UpdateFundSourceDto } from './dto/update-fund-source.dto';
import { DailyRevenueQueryDto } from './dto/daily-revenue-query.dto';
import { DailyRevenueSummary } from './interfaces/daily-revenue.interface';
import { Transaction } from '../transactions/entities/transaction.entity';
import { ExamEnrollmentStatus } from '../exam-enrollments/entities/exam-enrollment.entity';

interface RawDailyRevenueRow {
  department: string;
  examName: string;
  amount: string | number;
}

interface RawDepartmentRow {
  faculty: string;
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

    // Date filters (comparing against TRANX_PAID_AT)
    if (query.startDate) {
      qb.andWhere('transaction.TRANX_PAID_AT >= :startDate', {
        startDate: `${query.startDate} 00:00:00`,
      });
    }
    if (query.endDate) {
      qb.andWhere('transaction.TRANX_PAID_AT <= :endDate', {
        endDate: `${query.endDate} 23:59:59`,
      });
    }

    // Department filter
    if (query.department) {
      qb.andWhere('fundSource.FS_FACULTY = :department', {
        department: query.department,
      });
    }

    // Exam name filter
    if (query.examName) {
      qb.andWhere('exam.EXAM_NAME LIKE :examName', {
        examName: `%${query.examName}%`,
      });
    }

    qb.select([
      'fundSource.FS_FACULTY AS department',
      'exam.EXAM_NAME AS examName',
      'SUM(transaction.TRANX_AMOUNT) AS amount',
    ]);

    qb.groupBy('fundSource.FS_FACULTY');
    qb.addGroupBy('exam.EXAM_NAME');

    const rawRows = await qb.getRawMany<RawDailyRevenueRow>();

    const rows = rawRows.map((row, idx) => ({
      index: idx + 1,
      department: row.department,
      examName: row.examName,
      amount: Number(row.amount),
    }));

    const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);

    return {
      rows,
      totalAmount,
    };
  }

  async getDepartments(): Promise<{ label: string; value: string }[]> {
    const departments = await this.fundSourcesRepository
      .createQueryBuilder('fs')
      .select('DISTINCT fs.FS_FACULTY', 'faculty')
      .where('fs.FS_FACULTY IS NOT NULL')
      .andWhere("fs.FS_FACULTY != ''")
      .getRawMany<RawDepartmentRow>();

    return departments.map((d) => ({
      label: d.faculty,
      value: d.faculty,
    }));
  }
}
