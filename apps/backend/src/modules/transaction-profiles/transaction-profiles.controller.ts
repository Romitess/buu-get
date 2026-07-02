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
import { TransactionProfilesService } from './transaction-profiles.service';
import { CreateTransactionProfileDto } from './dto/create-transaction-profile.dto';
import { UpdateTransactionProfileDto } from './dto/update-transaction-profile.dto';
import { TransactionProfile } from './entities/transaction-profile.entity';

@ApiTags('Transaction Profiles')
@Controller('transaction-profiles')
export class TransactionProfilesController {
  constructor(
    private readonly transactionProfilesService: TransactionProfilesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'สร้างโปรไฟล์ธุรกรรมใหม่' })
  @ApiResponse({ status: 201, type: TransactionProfile })
  async create(
    @Body() createDto: CreateTransactionProfileDto,
  ): Promise<TransactionProfile> {
    return await this.transactionProfilesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลโปรไฟล์ธุรกรรมทั้งหมด' })
  @ApiResponse({ status: 200, type: [TransactionProfile] })
  async findAll(): Promise<TransactionProfile[]> {
    return await this.transactionProfilesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลโปรไฟล์ธุรกรรมตาม ID' })
  @ApiResponse({ status: 200, type: TransactionProfile })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TransactionProfile> {
    return await this.transactionProfilesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลโปรไฟล์ธุรกรรม' })
  @ApiResponse({ status: 200, type: TransactionProfile })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTransactionProfileDto,
  ): Promise<TransactionProfile> {
    return await this.transactionProfilesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบข้อมูลโปรไฟล์ธุรกรรม (Soft Delete)' })
  @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.transactionProfilesService.remove(id);
  }
}
