import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from './dto/transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { CreatePendingPaymentDto } from './dto/create-pending-payment.dto';
import type { PendingPaymentResult } from './transactions.service';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'สร้างธุรกรรมใหม่' })
  @ApiResponse({
    status: 201,
    description: 'สร้างธุรกรรมสำเร็จ',
    type: Transaction,
  })
  create(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    return this.transactionsService.create(createTransactionDto);
  }

  @Post('pending-payment')
  @ApiOperation({
    summary: 'Create a pending QR transaction and unissued receipt',
  })
  createPendingPayment(
    @Body() dto: CreatePendingPaymentDto,
  ): Promise<PendingPaymentResult> {
    return this.transactionsService.createPendingPayment(dto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลธุรกรรมทั้งหมด' })
  @ApiResponse({
    status: 200,
    description: 'รายการธุรกรรมทั้งหมด',
    type: [Transaction],
  })
  findAll(): Promise<Transaction[]> {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลธุรกรรมด้วย ID' })
  @ApiResponse({
    status: 200,
    description: 'ข้อมูลธุรกรรมที่พบ',
    type: Transaction,
  })
  @ApiResponse({ status: 404, description: 'ไม่พบธุรกรรม' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Transaction> {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลธุรกรรม' })
  @ApiResponse({
    status: 200,
    description: 'แก้ไขธุรกรรมสำเร็จ',
    type: Transaction,
  })
  @ApiResponse({ status: 404, description: 'ไม่พบธุรกรรม' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  @Patch('by-erm/:ermId')
  @ApiOperation({ summary: 'แก้ไขข้อมูลธุรกรรมด้วย ERM_ID' })
  @ApiResponse({
    status: 200,
    description: 'แก้ไขธุรกรรมสำเร็จ',
    type: Transaction,
  })
  @ApiResponse({ status: 404, description: 'ไม่พบธุรกรรม' })
  updateByErmId(
    @Param('ermId', ParseIntPipe) ermId: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction | null> {
    return this.transactionsService.updateByErmId(ermId, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบข้อมูลธุรกรรม (Soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'ลบธุรกรรมสำเร็จ',
  })
  @ApiResponse({ status: 404, description: 'ไม่พบธุรกรรม' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.transactionsService.remove(id);
  }
}
