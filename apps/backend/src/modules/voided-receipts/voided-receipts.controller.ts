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
import { VoidedReceiptsService } from './voided-receipts.service';
import { CreateVoidedReceiptDto } from './dto/create-voided-receipt.dto';
import { UpdateVoidedReceiptDto } from './dto/update-voided-receipt.dto';
import { VoidedReceipt } from './entities/voided-receipt.entity';

@ApiTags('Voided Receipts')
@Controller('voided-receipts')
export class VoidedReceiptsController {
  constructor(private readonly voidedReceiptsService: VoidedReceiptsService) {}

  @Post()
  @ApiOperation({ summary: 'บันทึกการยกเลิกใบเสร็จ' })
  @ApiResponse({ status: 201, type: VoidedReceipt })
  async create(
    @Body() createDto: CreateVoidedReceiptDto,
  ): Promise<VoidedReceipt> {
    return await this.voidedReceiptsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงรายการใบเสร็จที่ถูกยกเลิกทั้งหมด' })
  @ApiResponse({ status: 200, type: [VoidedReceipt] })
  async findAll(): Promise<VoidedReceipt[]> {
    return await this.voidedReceiptsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลการยกเลิกใบเสร็จตาม ID' })
  @ApiResponse({ status: 200, type: VoidedReceipt })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<VoidedReceipt> {
    return await this.voidedReceiptsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลการยกเลิกใบเสร็จ' })
  @ApiResponse({ status: 200, type: VoidedReceipt })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateVoidedReceiptDto,
  ): Promise<VoidedReceipt> {
    return await this.voidedReceiptsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบข้อมูลการยกเลิกใบเสร็จ (Soft Delete)' })
  @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.voidedReceiptsService.remove(id);
  }
}
