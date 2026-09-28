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
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FINANCE_ROLES } from 'src/common/constants/role-groups';
import { AuthenticatedUser } from 'src/common/utils/authz.util';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ReceiptsService } from './receipts.service';
import { CreateReceiptDto, UpdateReceiptDto } from './dto/receipt.dto';
import { Receipt } from './entities/receipt.entity';

@ApiTags('Receipts')
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post()
  @Roles(...FINANCE_ROLES)
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
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'ดึงข้อมูลใบเสร็จทั้งหมด' })
  @ApiResponse({ status: 200, description: 'รายการใบเสร็จแบบแบ่งหน้า' })
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Receipt>> {
    return this.receiptsService.findAll(query);
  }

  @Get('issued')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'ดึงข้อมูลใบเสร็จที่ออกแล้วทั้งหมด' })
  @ApiResponse({
    status: 200,
    description: 'รายการใบเสร็จที่ออกแล้วแบบแบ่งหน้า',
  })
  findIssued(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Receipt>> {
    return this.receiptsService.findIssued(query);
  }

  @Get(':id')
  @Roles(...FINANCE_ROLES)
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
  @Roles(...FINANCE_ROLES)
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
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'ลบข้อมูลใบเสร็จ (Soft delete)' })
  @ApiResponse({ status: 200, description: 'ลบใบเสร็จสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบใบเสร็จ' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.receiptsService.remove(id);
  }

  @Get(':tranxId/download')
  @ApiOperation({
    summary: 'ดาวน์โหลดใบเสร็จรับเงินด้วยรหัสธุรกรรม',
    description:
      'ส่ง unsigned=true เพื่อสร้าง PDF ใหม่แบบไม่มีลายเซ็น (ไม่ดึงไฟล์ archive จาก MinIO)',
  })
  @ApiResponse({ status: 200, description: 'ไฟล์ใบเสร็จรับเงิน PDF' })
  @ApiResponse({ status: 403, description: 'ใบเสร็จยังไม่ออก' })
  @ApiResponse({ status: 404, description: 'ไม่พบใบเสร็จ' })
  async downloadReceipt(
    @Param('tranxId', ParseIntPipe) tranxId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
    @Query('unsigned') unsigned?: string,
  ): Promise<StreamableFile> {
    const forceUnsigned =
      unsigned === '1' || unsigned?.toLowerCase() === 'true';
    const buffer = await this.receiptsService.downloadReceipt(tranxId, user, {
      unsigned: forceUnsigned,
    });
    const filename = forceUnsigned
      ? `receipt-${tranxId}-unsigned.pdf`
      : `receipt-${tranxId}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }
}
