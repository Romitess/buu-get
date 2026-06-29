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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionRefsService } from './transaction-refs.service';
import {
  CreateTransactionRefDto,
  UpdateTransactionRefDto,
} from './dto/transaction-ref.dto';
import { TransactionRefSearchQueryDto } from './dto/transaction-ref-search-query.dto';
import { TransactionRef } from './entities/transaction-ref.entity';
import { TransactionRefSearchPage } from './interfaces/transaction-ref-search.interface';

@ApiTags('Transaction Refs')
@Controller('transaction-refs')
export class TransactionRefsController {
  constructor(
    private readonly transactionRefsService: TransactionRefsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'สร้างข้อมูลอ้างอิงธุรกรรมใหม่' })
  @ApiResponse({ status: HttpStatus.CREATED, type: TransactionRef })
  async create(
    @Body() createTransactionRefDto: CreateTransactionRefDto,
  ): Promise<TransactionRef> {
    return this.transactionRefsService.create(createTransactionRefDto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลอ้างอิงธุรกรรมทั้งหมด' })
  @ApiResponse({ status: HttpStatus.OK, type: [TransactionRef] })
  async findAll(): Promise<TransactionRef[]> {
    return this.transactionRefsService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'ค้นหาข้อมูลอ้างอิงธุรกรรมพร้อมแบ่งหน้า' })
  @ApiResponse({ status: HttpStatus.OK })
  async search(
    @Query() query: TransactionRefSearchQueryDto,
  ): Promise<TransactionRefSearchPage> {
    return this.transactionRefsService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลอ้างอิงธุรกรรมตามรหัส' })
  @ApiResponse({ status: HttpStatus.OK, type: TransactionRef })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TransactionRef> {
    return this.transactionRefsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลอ้างอิงธุรกรรม' })
  @ApiResponse({ status: HttpStatus.OK, type: TransactionRef })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionRefDto: UpdateTransactionRefDto,
  ): Promise<TransactionRef> {
    return this.transactionRefsService.update(id, updateTransactionRefDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบข้อมูลอ้างอิงธุรกรรม (Soft Delete)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.transactionRefsService.remove(id);
  }
}
