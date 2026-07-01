import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionStatusHistoryService } from './transaction-status-history.service';
import { CreateTransactionStatusHistoryDto } from './dto/transaction-status-history.dto';
import { TransactionStatusHistory } from './entities/transaction-status-history.entity';

@ApiTags('Transaction Status History')
@Controller('transaction-status-history')
export class TransactionStatusHistoryController {
  constructor(
    private readonly statusHistoryService: TransactionStatusHistoryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'บันทึกประวัติการเปลี่ยนสถานะ' })
  @ApiResponse({ status: HttpStatus.CREATED, type: TransactionStatusHistory })
  async create(
    @Body() createDto: CreateTransactionStatusHistoryDto,
  ): Promise<TransactionStatusHistory> {
    return this.statusHistoryService.create(createDto);
  }

  @Get('transaction/:tranxId')
  @ApiOperation({ summary: 'ดึงข้อมูลประวัติทั้งหมดของธุรกรรม' })
  @ApiResponse({ status: HttpStatus.OK, type: [TransactionStatusHistory] })
  async findAllByTransaction(
    @Param('tranxId', ParseIntPipe) tranxId: number,
  ): Promise<TransactionStatusHistory[]> {
    return this.statusHistoryService.findAllByTransaction(tranxId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลประวัติรายรายการ' })
  @ApiResponse({ status: HttpStatus.OK, type: TransactionStatusHistory })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TransactionStatusHistory> {
    return this.statusHistoryService.findOne(id);
  }
}
