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
}
