import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionStatusHistory } from './entities/transaction-status-history.entity';
import { CreateTransactionStatusHistoryDto } from './dto/transaction-status-history.dto';

@Injectable()
export class TransactionStatusHistoryService {
  constructor(
    @InjectRepository(TransactionStatusHistory)
    private readonly statusHistoryRepository: Repository<TransactionStatusHistory>,
  ) {}

  async create(
    createDto: CreateTransactionStatusHistoryDto,
  ): Promise<TransactionStatusHistory> {
    const history = this.statusHistoryRepository.create(createDto);
    return this.statusHistoryRepository.save(history);
  }

  async findAllByTransaction(
    tranxId: number,
  ): Promise<TransactionStatusHistory[]> {
    return this.statusHistoryRepository.find({
      where: { TRANX_ID: tranxId },
      order: { CREATED_AT: 'DESC' },
    });
  }

  async findOne(id: number): Promise<TransactionStatusHistory> {
    const history = await this.statusHistoryRepository.findOne({
      where: { TSH_ID: id },
      relations: ['TRANSACTION'],
    });
    if (!history) {
      throw new NotFoundException(`History log with ID ${id} not found`);
    }
    return history;
  }
}
