import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionRef } from './entities/transaction-ref.entity';
import {
  CreateTransactionRefDto,
  UpdateTransactionRefDto,
} from './dto/transaction-ref.dto';

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
