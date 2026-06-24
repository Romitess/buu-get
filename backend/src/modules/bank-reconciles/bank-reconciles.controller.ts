import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
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
} from './bank-reconciles.service';
import { BankReconcile } from './entities/bank-reconcile.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleEnum } from '../roles/enums/role.enum';
import { UpdateBankReconcileRefsDto } from './dto/bank-reconcile.dto';

interface AuthenticatedRequest {
  user: {
    userId: number;
    email: string;
    role: RoleEnum;
  };
}

@ApiTags('Bank Reconciles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bank-reconciles')
export class BankReconcilesController {
  constructor(private readonly bankReconcilesService: BankReconcilesService) {}

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
    @Request() request: AuthenticatedRequest,
  ): Promise<BankReconcileImportResult> {
    return this.bankReconcilesService.importFile(file, request.user.userId);
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

  @Post('verify')
  @ApiOperation({ summary: 'ตรวจสอบและจับคู่ข้อมูลการชำระเงิน' })
  @ApiResponse({
    status: 201,
    description: 'ตรวจสอบข้อมูลการชำระเงินสำเร็จ',
    type: [BankReconcile],
  })
  verifyData(): Promise<BankReconcile[]> {
    return this.bankReconcilesService.verifyData();
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
    @Request() request: AuthenticatedRequest,
  ): Promise<BankReconcile> {
    return this.bankReconcilesService.updateRefs(
      id,
      updateBankReconcileRefsDto,
      request.user.userId,
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
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Confirmed successfully' })
  confirmPayment(
    @Body('tranxIds') tranxIds: number[],
  ): Promise<{ success: boolean; updated: number }> {
    return this.bankReconcilesService.confirmPayment(tranxIds);
  }
}
