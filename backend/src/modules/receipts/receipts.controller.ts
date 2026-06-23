import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  StreamableFile,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReceiptsService } from './receipts.service';
import { CreateReceiptDto, UpdateReceiptDto } from './dto/receipt.dto';
import { Receipt } from './entities/receipt.entity';

@ApiTags('Receipts')
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post()
  @ApiOperation({ summary: 'สร้างใบเสร็จใหม่' })
  @ApiResponse({
    status: 201,
    description: 'สร้างใบเสร็จสำเร็จ',
    type: Receipt,
  })
  create(@Body() createReceiptDto: CreateReceiptDto): Promise<Receipt> {
    return this.receiptsService.create(createReceiptDto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลใบเสร็จทั้งหมด' })
  @ApiResponse({
    status: 200,
    description: 'รายการใบเสร็จทั้งหมด',
    type: [Receipt],
  })
  findAll(): Promise<Receipt[]> {
    return this.receiptsService.findAll();
  }

  @Get('issued')
  @ApiOperation({ summary: 'ดึงข้อมูลใบเสร็จที่ออกแล้วทั้งหมด' })
  @ApiResponse({
    status: 200,
    description: 'รายการใบเสร็จที่มีสถานะออกใบเสร็จแล้ว',
    type: [Receipt],
  })
  findIssued(): Promise<Receipt[]> {
    return this.receiptsService.findIssued();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลใบเสร็จด้วย ID' })
  @ApiResponse({
    status: 200,
    description: 'ข้อมูลใบเสร็จที่พบ',
    type: Receipt,
  })
  @ApiResponse({ status: 404, description: 'ไม่พบใบเสร็จ' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Receipt> {
    return this.receiptsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลใบเสร็จ' })
  @ApiResponse({
    status: 200,
    description: 'แก้ไขใบเสร็จสำเร็จ',
    type: Receipt,
  })
  @ApiResponse({ status: 404, description: 'ไม่พบใบเสร็จ' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReceiptDto: UpdateReceiptDto,
  ): Promise<Receipt> {
    return this.receiptsService.update(id, updateReceiptDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบข้อมูลใบเสร็จ (Soft delete)' })
  @ApiResponse({ status: 200, description: 'ลบใบเสร็จสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบใบเสร็จ' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.receiptsService.remove(id);
  }

  @Get(':tranxId/download')
  @ApiOperation({ summary: 'ดาวน์โหลดใบเสร็จรับเงินด้วยรหัสธุรกรรม' })
  @ApiResponse({ status: 200, description: 'ไฟล์ใบเสร็จรับเงิน PDF' })
  @ApiResponse({ status: 403, description: 'ใบเสร็จยังไม่ออก' })
  @ApiResponse({ status: 404, description: 'ไม่พบใบเสร็จ' })
  async downloadReceipt(
    @Param('tranxId', ParseIntPipe) tranxId: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.receiptsService.downloadReceipt(tranxId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${tranxId}.pdf"`,
    });
    return new StreamableFile(buffer);
  }
}
