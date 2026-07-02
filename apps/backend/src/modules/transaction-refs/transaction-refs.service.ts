import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { TransactionRef } from './entities/transaction-ref.entity';
import {
  CreateTransactionRefDto,
  UpdateTransactionRefDto,
} from './dto/transaction-ref.dto';
import { TransactionRefSearchQueryDto } from './dto/transaction-ref-search-query.dto';
import { TransactionRefSearchPage } from './interfaces/transaction-ref-search.interface';

@Injectable()
export class TransactionRefsService {
  constructor(
    @InjectRepository(TransactionRef)
    private readonly transactionRefRepository: Repository<TransactionRef>,
  ) {}

  async create(
    createTransactionRefDto: CreateTransactionRefDto,
  ): Promise<TransactionRef> {
    const transactionRef = this.transactionRefRepository.create(
      createTransactionRefDto,
    );
    return this.transactionRefRepository.save(transactionRef);
  }

  async findAll(): Promise<TransactionRef[]> {
    return this.transactionRefRepository.find({
      relations: ['TRANSACTION', 'BANK_RECONCILE'],
    });
  }

  async search(
    query: TransactionRefSearchQueryDto,
  ): Promise<TransactionRefSearchPage> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const ref1 = query.ref1?.trim();
    const ref2 = query.ref2?.trim();
    const name = query.name?.trim().toLowerCase();

    const qb = this.transactionRefRepository
      .createQueryBuilder('transactionRef')
      .leftJoinAndSelect('transactionRef.TRANSACTION', 'transaction')
      .leftJoinAndSelect('transaction.ENROLLMENT', 'enrollment')
      .leftJoinAndSelect('enrollment.USER', 'user')
      .leftJoinAndSelect('user.PROFILE', 'profile')
      .leftJoinAndSelect('enrollment.SESSION', 'session')
      .leftJoinAndSelect('session.EXAM', 'exam')
      .select([
        'transactionRef.TSR_ID',
        'transactionRef.TRANX_ID',
        'transactionRef.BR_ID',
        'transactionRef.TSC_REF1',
        'transactionRef.TSC_REF2',
        'transactionRef.TSC_REF3',
        'transactionRef.TSC_REF4',
        'transactionRef.TSC_BANK_REF',
        'transactionRef.TSC_PARTNER_REF',
        'transactionRef.CREATED_AT',
        'transactionRef.UPDATED_AT',
        'transaction.TRANX_ID',
        'transaction.ERM_ID',
        'transaction.TRANX_AMOUNT',
        'transaction.TRANX_PAYMENT_STATUS',
        'enrollment.ERM_ID',
        'enrollment.ERM_STATUS',
        'user.USER_ID',
        'profile.userProfileId',
        'profile.userFullnameTh',
        'profile.userFullnameEn',
        'session.SS_ID',
        'exam.EXAM_ID',
        'exam.EXAM_NAME',
        'exam.EXAM_ROUND',
        'exam.EXAM_FEE',
      ]);

    if (ref1) {
      qb.andWhere('transactionRef.TSC_REF1 LIKE :ref1', {
        ref1: `%${ref1}%`,
      });
    }

    if (ref2) {
      qb.andWhere('transactionRef.TSC_REF2 LIKE :ref2', {
        ref2: `%${ref2}%`,
      });
    }

    if (name) {
      qb.andWhere(
        new Brackets((innerQb) => {
          innerQb
            .where('LOWER(profile.userFullnameTh) LIKE :name', {
              name: `%${name}%`,
            })
            .orWhere('LOWER(profile.userFullnameEn) LIKE :name', {
              name: `%${name}%`,
            });
        }),
      );
    }

    const [data, total] = await qb
      .orderBy('transactionRef.CREATED_AT', 'DESC')
      .addOrderBy('transactionRef.TSR_ID', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: number): Promise<TransactionRef> {
    const transactionRef = await this.transactionRefRepository.findOne({
      where: { TSR_ID: id },
      relations: ['TRANSACTION', 'BANK_RECONCILE'],
    });
    if (!transactionRef) {
      throw new NotFoundException(`TransactionRef with ID ${id} not found`);
    }
    return transactionRef;
  }

  async update(
    id: number,
    updateTransactionRefDto: UpdateTransactionRefDto,
  ): Promise<TransactionRef> {
    await this.findOne(id);
    await this.transactionRefRepository.update(id, updateTransactionRefDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const transactionRef = await this.findOne(id);
    await this.transactionRefRepository.softRemove(transactionRef);
  }
}
