import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  ENROLLMENT_ADMIN_ROLES,
  EXECUTIVE_ROLES,
} from 'src/common/constants/role-groups';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  assertSelfOrRoles,
  AuthenticatedUser,
} from 'src/common/utils/authz.util';
import { ExamEnrollmentsService } from './exam-enrollments.service';
import { CreateExamEnrollmentDto } from './dto/create-exam-enrollment.dto';
import { UpdateExamEnrollmentDto } from './dto/update-exam-enrollment.dto';
import { MatchExamEnrollmentDto } from './dto/match-exam-enrollment.dto';
import { RequestFixDto } from './dto/request-fix.dto';
import { BulkSeatAssignmentDto } from './dto/bulk-seat-assignment.dto';
import { ExamEnrollment } from './entities/exam-enrollment.entity';
import { ValidatePasscodeDto } from './dto/validate-passcode.dto';
import { ExamEnrollmentQueryDto } from './dto/exam-enrollment-query.dto';
import { ExecutiveTestTakerQueryDto } from './dto/executive-test-taker-query.dto';
import { ExecutiveTestTakerPage } from './interfaces/executive-test-taker.interface';
import { ExecutiveExamHistoryResponse } from './interfaces/executive-exam-history.interface';

@ApiTags('exam-enrollments')
@Controller('exam-enrollments')
export class ExamEnrollmentsController {
  constructor(
    private readonly examEnrollmentsService: ExamEnrollmentsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'สร้างข้อมูลการสมัครสอบใหม่' })
  @ApiCreatedResponse({ type: ExamEnrollment })
  async create(
    @Body() createExamEnrollmentDto: CreateExamEnrollmentDto,
  ): Promise<ExamEnrollment> {
    return await this.examEnrollmentsService.create(createExamEnrollmentDto);
  }

  @Post('validate-passcode')
  @ApiOperation({ summary: 'ตรวจสอบ Passcode ก่อนสมัครสอบรอบพิเศษ' })
  @ApiOkResponse({ description: 'Passcode ถูกต้อง' })
  async validatePasscode(
    @Body() validatePasscodeDto: ValidatePasscodeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ valid: true }> {
    await this.examEnrollmentsService.validatePasscode(
      user.userId,
      validatePasscodeDto,
    );
    return { valid: true };
  }

  @Get()
  @Roles(...ENROLLMENT_ADMIN_ROLES)
  @ApiOperation({ summary: 'ดึงข้อมูลการสมัครสอบทั้งหมด' })
  @ApiOkResponse({ description: 'รายการการสมัครสอบแบบแบ่งหน้า' })
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ExamEnrollment>> {
    return await this.examEnrollmentsService.findAll(query);
  }

  @Get('executive/test-takers')
  @Roles(...EXECUTIVE_ROLES)
  @ApiOperation({ summary: 'ค้นหาผู้เข้าสอบสำหรับผู้บริหาร' })
  async findExecutiveTestTakers(
    @Query() query: ExecutiveTestTakerQueryDto,
  ): Promise<ExecutiveTestTakerPage> {
    return await this.examEnrollmentsService.findExecutiveTestTakers(query);
  }

  @Get('executive/test-takers/:enrollmentId/exam-history')
  @Roles(...EXECUTIVE_ROLES)
  @ApiOperation({ summary: 'ดึงประวัติการสอบรายบุคคลสำหรับผู้บริหาร' })
  @ApiOkResponse({ description: 'ข้อมูลประวัติการสอบพร้อมคะแนน' })
  async findExamHistoryByEnrollmentId(
    @Param('enrollmentId', ParseIntPipe) enrollmentId: number,
  ): Promise<ExecutiveExamHistoryResponse> {
    return await this.examEnrollmentsService.findExamHistoryByEnrollmentId(
      enrollmentId,
    );
  }

  @Post('match-import')
  @Roles(...ENROLLMENT_ADMIN_ROLES)
  @ApiOperation({ summary: 'ค้นหาผู้สมัครจากรหัสอ้างอิง (Ref1, Ref2)' })
  @ApiOkResponse({ type: ExamEnrollment, isArray: true })
  async findMatchedEnrollments(
    @Body() matchExamEnrollmentDto: MatchExamEnrollmentDto,
  ): Promise<ExamEnrollment[]> {
    return await this.examEnrollmentsService.findMatchedEnrollments(
      matchExamEnrollmentDto.refs,
    );
  }

  @Get('exam/:examId')
  @ApiOperation({ summary: 'ดึงข้อมูลผู้สมัครสอบตามรหัสการสอบ' })
  @ApiOkResponse({ type: ExamEnrollment, isArray: true })
  async findByExamId(
    @Param('examId', ParseIntPipe) examId: number,
    @Query() query: ExamEnrollmentQueryDto,
  ): Promise<{ data: ExamEnrollment[]; total: number; totalPaid: number }> {
    return await this.examEnrollmentsService.findByExamId(examId, query);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'ดึงข้อมูลการสมัครสอบตามรหัสผู้ใช้งาน' })
  @ApiOkResponse({ type: ExamEnrollment, isArray: true })
  async findByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExamEnrollment[]> {
    assertSelfOrRoles(user, userId, ENROLLMENT_ADMIN_ROLES);
    return await this.examEnrollmentsService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลการสมัครสอบตาม ID' })
  @ApiOkResponse({ type: ExamEnrollment })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ExamEnrollment> {
    return await this.examEnrollmentsService.findOne(id);
  }

  @Patch('bulk-seat-assignments')
  @Roles(...ENROLLMENT_ADMIN_ROLES)
  @ApiOperation({
    summary: 'Assign seats to multiple exam enrollments atomically',
  })
  @ApiOkResponse({ type: ExamEnrollment, isArray: true })
  async bulkAssignSeats(
    @Body() bulkSeatAssignmentDto: BulkSeatAssignmentDto,
  ): Promise<ExamEnrollment[]> {
    return await this.examEnrollmentsService.bulkAssignSeats(
      bulkSeatAssignmentDto,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลการสมัครสอบ' })
  @ApiOkResponse({ type: ExamEnrollment })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExamEnrollmentDto: UpdateExamEnrollmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExamEnrollment> {
    return await this.examEnrollmentsService.update(
      id,
      updateExamEnrollmentDto,
      user,
    );
  }

  @Delete(':id')
  @Roles(...ENROLLMENT_ADMIN_ROLES)
  @ApiOperation({ summary: 'ลบข้อมูลการสมัครสอบ' })
  @ApiOkResponse({ description: 'ลบข้อมูลสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.examEnrollmentsService.remove(id);
  }

  @Post('sessions/:sessionId/allocate')
  @Roles(...ENROLLMENT_ADMIN_ROLES)
  @ApiOperation({ summary: 'จัดที่นั่งสอบสำหรับรอบสอบ' })
  @ApiOkResponse({ type: ExamEnrollment, isArray: true })
  async allocateSeats(
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ): Promise<ExamEnrollment[]> {
    return await this.examEnrollmentsService.allocateSeats(sessionId);
  }

  @Post(':id/request-fix')
  @Roles(...ENROLLMENT_ADMIN_ROLES)
  @ApiOperation({ summary: 'ส่งคำขอแก้ไขข้อมูลไปยังผู้สมัคร' })
  @ApiOkResponse({ description: 'ส่งคำขอแก้ไขและส่งอีเมลสำเร็จ' })
  async requestFix(
    @Param('id', ParseIntPipe) id: number,
    @Body() requestFixDto: RequestFixDto,
  ): Promise<{ success: boolean }> {
    return await this.examEnrollmentsService.requestFix(id, requestFixDto);
  }
}
