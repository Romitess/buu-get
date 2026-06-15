import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receipt } from './entities/receipt.entity';
import { CreateReceiptDto, UpdateReceiptDto } from './dto/receipt.dto';

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Receipt)
    private readonly receiptsRepository: Repository<Receipt>,
  ) {}

  async create(createReceiptDto: CreateReceiptDto): Promise<Receipt> {
    const receipt = this.receiptsRepository.create(createReceiptDto);
    return this.receiptsRepository.save(receipt);
  }

  async findAll(): Promise<Receipt[]> {
    return this.receiptsRepository.find({ relations: ['TRANSACTION'] });
  }

  async findOne(id: number): Promise<Receipt> {
    const receipt = await this.receiptsRepository.findOne({
      where: { RC_ID: id },
      relations: ['TRANSACTION'],
    });
    if (!receipt) {
      throw new NotFoundException(`Receipt with ID ${id} not found`);
    }
    return receipt;
  }

  async update(
    id: number,
    updateReceiptDto: UpdateReceiptDto,
  ): Promise<Receipt> {
    const receipt = await this.findOne(id);
    Object.assign(receipt, updateReceiptDto);
    return this.receiptsRepository.save(receipt);
  }

  async remove(id: number): Promise<void> {
    const receipt = await this.findOne(id);
    await this.receiptsRepository.softRemove(receipt);
  }
}
