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
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { EXAM_ADMIN_ROLES } from 'src/common/constants/role-groups';
import { ExamVouchersService } from './exam-vouchers.service';
import { CreateExamVoucherDto } from './dto/create-exam-voucher.dto';
import { UpdateExamVoucherDto } from './dto/update-exam-voucher.dto';
import { SendVoucherTicketDto } from './dto/send-voucher-ticket.dto';
import { BulkIssueVouchersDto } from './dto/bulk-issue-vouchers.dto';
import { ExamVoucher } from './entities/exam-voucher.entity';

@ApiTags('exam-vouchers')
@Controller('exam-vouchers')
export class ExamVouchersController {
  constructor(private readonly examVouchersService: ExamVouchersService) {}

  @Post()
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({ summary: 'สร้างบัตรสอบใหม่' })
  @ApiCreatedResponse({ type: ExamVoucher })
  async create(
    @Body() createExamVoucherDto: CreateExamVoucherDto,
  ): Promise<ExamVoucher> {
    return await this.examVouchersService.create(createExamVoucherDto);
  }

  @Post('enrollment/:ermId')
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({ summary: 'สร้างบัตรสอบจากรหัสใบสมัคร' })
  @ApiCreatedResponse({ type: ExamVoucher })
  async createFromEnrollment(
    @Param('ermId', ParseIntPipe) ermId: number,
  ): Promise<ExamVoucher> {
    return await this.examVouchersService.createFromEnrollment(ermId);
  }

  @Get()
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({ summary: 'ดึงข้อมูลบัตรสอบทั้งหมด' })
  @ApiOkResponse({ type: ExamVoucher, isArray: true })
  async findAll(): Promise<ExamVoucher[]> {
    return await this.examVouchersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลบัตรสอบตาม ID' })
  @ApiOkResponse({ type: ExamVoucher })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ExamVoucher> {
    return await this.examVouchersService.findOne(id);
  }

  @Patch(':id')
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({ summary: 'แก้ไขข้อมูลบัตรสอบ' })
  @ApiOkResponse({ type: ExamVoucher })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExamVoucherDto: UpdateExamVoucherDto,
  ): Promise<ExamVoucher> {
    return await this.examVouchersService.update(id, updateExamVoucherDto);
  }

  @Delete(':id')
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({ summary: 'ลบบัตรสอบ' })
  @ApiOkResponse({ description: 'ลบข้อมูลสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.examVouchersService.remove(id);
  }

  @Post('send-ticket')
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({ summary: 'ส่งอีเมลรูปภาพบัตรสอบ' })
  @ApiOkResponse({ description: 'ส่งอีเมลสำเร็จ' })
  async sendTicket(
    @Body() sendVoucherTicketDto: SendVoucherTicketDto,
  ): Promise<{ success: boolean }> {
    return await this.examVouchersService.sendVoucherEmail(
      sendVoucherTicketDto,
    );
  }

  @Post('bulk-issue')
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({
    summary: 'ออกบัตรสอบและส่งอีเมลหาผู้เข้าสอบพร้อมกันแบบ Batch',
  })
  @ApiOkResponse({ description: 'ดำเนินการแบบ Batch สำเร็จ' })
  async bulkIssue(
    @Body() bulkIssueVouchersDto: BulkIssueVouchersDto,
  ): Promise<{ success: boolean }> {
    return await this.examVouchersService.bulkIssueVouchers(
      bulkIssueVouchersDto,
    );
  }
}
