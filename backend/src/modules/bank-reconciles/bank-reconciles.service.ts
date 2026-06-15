import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankReconcile } from './entities/bank-reconcile.entity';
import {
  CreateBankReconcileDto,
  UpdateBankReconcileDto,
} from './dto/bank-reconcile.dto';

@Injectable()
export class BankReconcilesService {
  constructor(
    @InjectRepository(BankReconcile)
    private readonly bankReconcilesRepository: Repository<BankReconcile>,
  ) {}

  async create(
    createBankReconcileDto: CreateBankReconcileDto,
  ): Promise<BankReconcile> {
    const bankReconcile = this.bankReconcilesRepository.create(
      createBankReconcileDto,
    );
    return this.bankReconcilesRepository.save(bankReconcile);
  }

  async findAll(): Promise<BankReconcile[]> {
    return this.bankReconcilesRepository.find({
      relations: ['USER', 'TRANSACTION'],
    });
  }

  async findOne(id: number): Promise<BankReconcile> {
    const bankReconcile = await this.bankReconcilesRepository.findOne({
      where: { BR_ID: id },
      relations: ['USER', 'TRANSACTION'],
    });
    if (!bankReconcile) {
      throw new NotFoundException(`BankReconcile with ID ${id} not found`);
    }
    return bankReconcile;
  }

  async update(
    id: number,
    updateBankReconcileDto: UpdateBankReconcileDto,
  ): Promise<BankReconcile> {
    const bankReconcile = await this.findOne(id);
    Object.assign(bankReconcile, updateBankReconcileDto);
    return this.bankReconcilesRepository.save(bankReconcile);
  }

  async remove(id: number): Promise<void> {
    const bankReconcile = await this.findOne(id);
    await this.bankReconcilesRepository.softRemove(bankReconcile);
  }
}
