import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionProfile } from './entities/transaction-profile.entity';
import { CreateTransactionProfileDto } from './dto/create-transaction-profile.dto';
import { UpdateTransactionProfileDto } from './dto/update-transaction-profile.dto';

@Injectable()
export class TransactionProfilesService {
  constructor(
    @InjectRepository(TransactionProfile)
    private readonly transactionProfileRepository: Repository<TransactionProfile>,
  ) {}

  async create(
    createDto: CreateTransactionProfileDto,
  ): Promise<TransactionProfile> {
    const profile = this.transactionProfileRepository.create(createDto);
    return await this.transactionProfileRepository.save(profile);
  }

  async findAll(): Promise<TransactionProfile[]> {
    return await this.transactionProfileRepository.find({
      relations: ['TRANSACTION'],
    });
  }

  async findOne(id: number): Promise<TransactionProfile> {
    const profile = await this.transactionProfileRepository.findOne({
      where: { TP_ID: id },
      relations: ['TRANSACTION'],
    });
    if (!profile) {
      throw new NotFoundException(
        `Transaction Profile with ID ${id} not found`,
      );
    }
    return profile;
  }

  async update(
    id: number,
    updateDto: UpdateTransactionProfileDto,
  ): Promise<TransactionProfile> {
    const profile = await this.findOne(id);
    Object.assign(profile, updateDto);
    return await this.transactionProfileRepository.save(profile);
  }

  async remove(id: number): Promise<void> {
    const profile = await this.findOne(id);
    await this.transactionProfileRepository.softRemove(profile);
  }
}
