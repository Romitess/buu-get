import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoidedReceipt } from './entities/voided-receipt.entity';
import { CreateVoidedReceiptDto } from './dto/create-voided-receipt.dto';
import { UpdateVoidedReceiptDto } from './dto/update-voided-receipt.dto';

@Injectable()
export class VoidedReceiptsService {
  constructor(
    @InjectRepository(VoidedReceipt)
    private readonly voidedReceiptRepository: Repository<VoidedReceipt>,
  ) {}

  async create(createDto: CreateVoidedReceiptDto): Promise<VoidedReceipt> {
    const voidedReceipt = this.voidedReceiptRepository.create(createDto);
    return await this.voidedReceiptRepository.save(voidedReceipt);
  }

  async findAll(): Promise<VoidedReceipt[]> {
    return await this.voidedReceiptRepository.find({
      relations: ['RECEIPT', 'USER'],
    });
  }

  async findOne(id: number): Promise<VoidedReceipt> {
    const voidedReceipt = await this.voidedReceiptRepository.findOne({
      where: { VR_ID: id },
      relations: ['RECEIPT', 'USER'],
    });
    if (!voidedReceipt) {
      throw new NotFoundException(`Voided Receipt with ID ${id} not found`);
    }
    return voidedReceipt;
  }

  async update(
    id: number,
    updateDto: UpdateVoidedReceiptDto,
  ): Promise<VoidedReceipt> {
    const voidedReceipt = await this.findOne(id);
    Object.assign(voidedReceipt, updateDto);
    return await this.voidedReceiptRepository.save(voidedReceipt);
  }

  async remove(id: number): Promise<void> {
    const voidedReceipt = await this.findOne(id);
    await this.voidedReceiptRepository.softRemove(voidedReceipt);
  }
}
