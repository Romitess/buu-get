import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  BankReconcileImportResult,
  BankReconcileMatchResult,
  BankReconcilesService,
  PendingPaymentImportRow,
  TestExportExamOption,
  TestExportRow,
} from './bank-reconciles.service';
import type { SignedReceiptDraft } from '../receipts/receipt-issue.service';
import {
  TestExportExamOptionDto,
  TestExportQueryDto,
  TestExportRowDto,
} from './dto/test-export.dto';
import { BankReconcile } from './entities/bank-reconcile.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FINANCE_ROLES } from '../../common/constants/role-groups';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  UpdateBankReconcileRefsDto,
  VerifyBankReconcilesDto,
} from './dto/bank-reconcile.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/utils/authz.util';

@ApiTags('Bank Reconciles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles(...FINANCE_ROLES)
@Controller('bank-reconciles')
export class BankReconcilesController {
  constructor(private readonly bankReconcilesService: BankReconcilesService) {}

  @Post('import-preview')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'อ่านไฟล์รายการชำระเงินเพื่อตรวจสอบ โดยยังไม่บันทึก',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'อ่านไฟล์สำเร็จ ยังไม่บันทึกลงฐานข้อมูล',
  })
  previewImport(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BankReconcileImportResult> {
    return this.bankReconcilesService.previewImport(file, user);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'นำเข้าไฟล์รายการชำระเงินจากธนาคาร' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'นำเข้าไฟล์รายการชำระเงินสำเร็จ',
  })
  importFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BankReconcileImportResult> {
    return this.bankReconcilesService.importFile(file, user);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลรายการกระทบยอดธนาคารทั้งหมด' })
  @ApiResponse({
    status: 200,
    description: 'รายการกระทบยอดธนาคารแบบแบ่งหน้า',
  })
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<BankReconcile>> {
    return this.bankReconcilesService.findAll(query);
  }

  @Get('test-export/exams')
  @ApiOperation({
    summary: 'ดึงรายการรอบสอบที่ export CSV ทดสอบการนำเข้าได้',
  })
  @ApiResponse({
    status: 200,
    description: 'รายการรอบสอบที่มีค่าธรรมเนียมและมี TransactionRef',
    type: [TestExportExamOptionDto],
  })
  listTestExportExams(): Promise<TestExportExamOption[]> {
    return this.bankReconcilesService.listTestExportExams();
  }

  @Get('test-export')
  @ApiOperation({ summary: 'ดึงแถว CSV ทดสอบการนำเข้าการชำระเงินตามรอบสอบ' })
  @ApiResponse({
    status: 200,
    description: 'แถวข้อมูลสำหรับ export CSV',
    type: [TestExportRowDto],
  })
  getTestExportRows(
    @Query() query: TestExportQueryDto,
  ): Promise<TestExportRow[]> {
    return this.bankReconcilesService.getTestExportRows(query.examId);
  }

  @Post('verify')
  @ApiOperation({ summary: 'ตรวจสอบและจับคู่ข้อมูลการชำระเงิน' })
  @ApiResponse({
    status: 201,
    description: 'ตรวจสอบข้อมูลการชำระเงินสำเร็จ',
    type: [BankReconcile],
  })
  verifyData(
    @Body() verifyBankReconcilesDto: VerifyBankReconcilesDto = {},
  ): Promise<BankReconcile[]> {
    return this.bankReconcilesService.verifyData(verifyBankReconcilesDto.brIds);
  }

  @Patch(':id/refs')
  @ApiOperation({ summary: 'แก้ไข Ref ของรายการกระทบยอดธนาคาร' })
  @ApiResponse({
    status: 200,
    description: 'แก้ไข Ref ของรายการกระทบยอดธนาคารสำเร็จ',
    type: BankReconcile,
  })
  updateRefs(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBankReconcileRefsDto: UpdateBankReconcileRefsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BankReconcile> {
    return this.bankReconcilesService.updateRefs(
      id,
      updateBankReconcileRefsDto,
      user,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'ลบข้อมูลนำเข้าทั้งหมดแบบ Soft delete' })
  @ApiResponse({
    status: 200,
    description: 'ลบข้อมูลนำเข้าทั้งหมดสำเร็จ',
  })
  clearAll(): Promise<void> {
    return this.bankReconcilesService.clearAll();
  }

  @Post('match')
  @ApiOperation({ summary: 'จับคู่รายการจากไฟล์กับระบบ' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ref1: { type: 'string' },
              ref2: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Matched data returned' })
  matchRefs(
    @Body('refs') refs: Array<{ ref1: string; ref2: string }>,
  ): Promise<BankReconcileMatchResult[]> {
    return this.bankReconcilesService.matchRefs(refs);
  }

  @Get('esign-ready')
  @ApiOperation({
    summary: 'ตรวจสอบว่าดึงลายเซ็น e-sign ของบัญชีบุคลากรปัจจุบันได้',
  })
  @ApiResponse({ status: 200, description: 'พร้อมออกใบเสร็จด้วยลายเซ็น' })
  ensureEsignReady(
    @CurrentUser() user: AuthenticatedUser,
  ): ReturnType<BankReconcilesService['ensureEsignReady']> {
    return this.bankReconcilesService.ensureEsignReady(user);
  }

  @Post('confirm-payment')
  @ApiOperation({ summary: 'ยืนยันการชำระเงินและเปลี่ยนสถานะ' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tranxIds: {
          type: 'array',
          items: { type: 'number' },
        },
        importRows: {
          type: 'array',
          description:
            'รายการจากไฟล์ที่ยังไม่บันทึก จะถูกบันทึกในชุดเดียวกับออกใบเสร็จ',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Confirmed successfully' })
  confirmPayment(
    @Body('tranxIds') tranxIds: number[],
    @Body('importRows') importRows: PendingPaymentImportRow[] = [],
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{
    success: boolean;
    updated: number;
    receipts: SignedReceiptDraft[];
  }> {
    return this.bankReconcilesService.confirmPayment(
      tranxIds,
      user,
      importRows ?? [],
    );
  }
}
