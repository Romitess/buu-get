import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentConfigsService } from './payment-configs.service';
import {
  CreatePaymentConfigDto,
  UpdatePaymentConfigDto,
} from './dto/payment-config.dto';
import { PaymentConfig } from './entities/payment-config.entity';

@ApiTags('Payment Configs')
@Controller('payment-configs')
export class PaymentConfigsController {
  constructor(private readonly paymentConfigsService: PaymentConfigsService) {}

  @Post()
  @ApiOperation({ summary: 'สร้างการตั้งค่าการชำระเงินใหม่' })
  @ApiResponse({ status: HttpStatus.CREATED, type: PaymentConfig })
  async create(
    @Body() createPaymentConfigDto: CreatePaymentConfigDto,
  ): Promise<PaymentConfig> {
    return this.paymentConfigsService.create(createPaymentConfigDto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลการตั้งค่าการชำระเงินทั้งหมด' })
  @ApiResponse({ status: HttpStatus.OK, type: [PaymentConfig] })
  async findAll(): Promise<PaymentConfig[]> {
    return this.paymentConfigsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลการตั้งค่าการชำระเงินตามรหัส' })
  @ApiResponse({ status: HttpStatus.OK, type: PaymentConfig })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PaymentConfig> {
    return this.paymentConfigsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลการตั้งค่าการชำระเงิน' })
  @ApiResponse({ status: HttpStatus.OK, type: PaymentConfig })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentConfigDto: UpdatePaymentConfigDto,
  ): Promise<PaymentConfig> {
    return this.paymentConfigsService.update(id, updatePaymentConfigDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบข้อมูลการตั้งค่าการชำระเงิน (Soft Delete)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.paymentConfigsService.remove(id);
  }
}
