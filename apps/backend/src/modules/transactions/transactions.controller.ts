import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FINANCE_ROLES } from 'src/common/constants/role-groups';
import { AuthenticatedUser } from 'src/common/utils/authz.util';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { TransactionsService } from './transactions.service';
import { UpdateTransactionDto } from './dto/transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { CreatePendingPaymentDto } from './dto/create-pending-payment.dto';
import type { PendingPaymentResult } from './transactions.service';
import { CreateTransactionFlowDto } from './dto/create-transaction-flow.dto';
import { ConfirmPaymentFlowDto } from './dto/confirm-payment-flow.dto';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'สร้างธุรกรรมใหม่' })
  @ApiResponse({
    status: 201,
    description: 'สร้างธุรกรรมสำเร็จ',
  })
  createTransactionForFlow(
    @Body() createDto: CreateTransactionFlowDto,
  ): Promise<{ TRANX_ID: number }> {
    return this.transactionsService.createTransactionForFlow(createDto);
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
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'ดึงข้อมูลธุรกรรมทั้งหมด' })
  @ApiResponse({
    status: 200,
    description: 'รายการธุรกรรมแบบแบ่งหน้า',
  })
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Transaction>> {
    return this.transactionsService.findAll(query);
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

  @Patch(':tranxId/confirm')
  @ApiOperation({ summary: 'ยืนยันการชำระเงิน (FLOW 2)' })
  @ApiResponse({
    status: 200,
    description: 'ยืนยันการชำระเงินสำเร็จ',
  })
  confirmPaymentFlow(
    @Param('tranxId', ParseIntPipe) tranxId: number,
    @Body() confirmDto: ConfirmPaymentFlowDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.transactionsService.confirmPaymentFlow(tranxId, confirmDto, user);
  }

  @Patch(':tranxId/expire')
  @ApiOperation({ summary: 'ทำให้ธุรกรรมหมดอายุ (FLOW 3)' })
  @ApiResponse({
    status: 200,
    description: 'ทำให้ธุรกรรมหมดอายุสำเร็จ',
  })
  expireTransaction(
    @Param('tranxId', ParseIntPipe) tranxId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.transactionsService.expireTransaction(tranxId, user);
  }

  @Patch('by-erm/:ermId')
  @Roles(...FINANCE_ROLES)
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

  @Patch(':id')
  @Roles(...FINANCE_ROLES)
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

  @Delete(':id')
  @Roles(...FINANCE_ROLES)
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
