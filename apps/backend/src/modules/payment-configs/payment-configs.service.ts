import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentConfig } from './entities/payment-config.entity';
import {
  CreatePaymentConfigDto,
  UpdatePaymentConfigDto,
} from './dto/payment-config.dto';

@Injectable()
export class PaymentConfigsService {
  constructor(
    @InjectRepository(PaymentConfig)
    private readonly paymentConfigRepository: Repository<PaymentConfig>,
  ) {}

  async create(
    createPaymentConfigDto: CreatePaymentConfigDto,
  ): Promise<PaymentConfig> {
    const paymentConfig = this.paymentConfigRepository.create(
      createPaymentConfigDto,
    );
    return this.paymentConfigRepository.save(paymentConfig);
  }

  async findAll(): Promise<PaymentConfig[]> {
    return this.paymentConfigRepository.find();
  }

  async findOne(id: number): Promise<PaymentConfig> {
    const paymentConfig = await this.paymentConfigRepository.findOne({
      where: { PC_ID: id },
      relations: ['TRANSACTIONS'],
    });
    if (!paymentConfig) {
      throw new NotFoundException(`PaymentConfig with ID ${id} not found`);
    }
    return paymentConfig;
  }

  async update(
    id: number,
    updatePaymentConfigDto: UpdatePaymentConfigDto,
  ): Promise<PaymentConfig> {
    await this.findOne(id);
    await this.paymentConfigRepository.update(id, updatePaymentConfigDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const paymentConfig = await this.findOne(id);
    await this.paymentConfigRepository.softRemove(paymentConfig);
  }
}
