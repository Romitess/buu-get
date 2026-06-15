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
import { BankReconcilesService } from './bank-reconciles.service';
import {
  CreateBankReconcileDto,
  UpdateBankReconcileDto,
} from './dto/bank-reconcile.dto';
import { BankReconcile } from './entities/bank-reconcile.entity';

@ApiTags('Bank Reconciles')
@Controller('bank-reconciles')
export class BankReconcilesController {
  constructor(private readonly bankReconcilesService: BankReconcilesService) {}

  @Post()
  @ApiOperation({ summary: 'สร้างรายการกระทบยอดธนาคารใหม่' })
  @ApiResponse({
    status: 201,
    description: 'สร้างรายการกระทบยอดธนาคารสำเร็จ',
    type: BankReconcile,
  })
  create(
    @Body() createBankReconcileDto: CreateBankReconcileDto,
  ): Promise<BankReconcile> {
    return this.bankReconcilesService.create(createBankReconcileDto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลรายการกระทบยอดธนาคารทั้งหมด' })
  @ApiResponse({
    status: 200,
    description: 'รายการกระทบยอดธนาคารทั้งหมด',
    type: [BankReconcile],
  })
  findAll(): Promise<BankReconcile[]> {
    return this.bankReconcilesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลรายการกระทบยอดธนาคารด้วย ID' })
  @ApiResponse({
    status: 200,
    description: 'ข้อมูลรายการกระทบยอดธนาคารที่พบ',
    type: BankReconcile,
  })
  @ApiResponse({ status: 404, description: 'ไม่พบรายการกระทบยอดธนาคาร' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<BankReconcile> {
    return this.bankReconcilesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลรายการกระทบยอดธนาคาร' })
  @ApiResponse({
    status: 200,
    description: 'แก้ไขรายการกระทบยอดธนาคารสำเร็จ',
    type: BankReconcile,
  })
  @ApiResponse({ status: 404, description: 'ไม่พบรายการกระทบยอดธนาคาร' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBankReconcileDto: UpdateBankReconcileDto,
  ): Promise<BankReconcile> {
    return this.bankReconcilesService.update(id, updateBankReconcileDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบข้อมูลรายการกระทบยอดธนาคาร (Soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'ลบรายการกระทบยอดธนาคารสำเร็จ',
  })
  @ApiResponse({ status: 404, description: 'ไม่พบรายการกระทบยอดธนาคาร' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.bankReconcilesService.remove(id);
  }
}
