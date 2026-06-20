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
import { ExamEnrollmentsService } from './exam-enrollments.service';
import { CreateExamEnrollmentDto } from './dto/create-exam-enrollment.dto';
import { UpdateExamEnrollmentDto } from './dto/update-exam-enrollment.dto';
import { MatchExamEnrollmentDto } from './dto/match-exam-enrollment.dto';
import { RequestFixDto } from './dto/request-fix.dto';
import { BulkSeatAssignmentDto } from './dto/bulk-seat-assignment.dto';
import { ExamEnrollment } from './entities/exam-enrollment.entity';
import { ExamEnrollmentQueryDto } from './dto/exam-enrollment-query.dto';

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

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลการสมัครสอบทั้งหมด' })
  @ApiOkResponse({ type: ExamEnrollment, isArray: true })
  async findAll(): Promise<ExamEnrollment[]> {
    return await this.examEnrollmentsService.findAll();
  }

  @Post('match-import')
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
  ): Promise<
    | ExamEnrollment[]
    | { data: ExamEnrollment[]; total: number; totalPaid: number }
  > {
    return await this.examEnrollmentsService.findByExamId(examId, query);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'ดึงข้อมูลการสมัครสอบตามรหัสผู้ใช้งาน' })
  @ApiOkResponse({ type: ExamEnrollment, isArray: true })
  async findByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ExamEnrollment[]> {
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
  ): Promise<ExamEnrollment> {
    return await this.examEnrollmentsService.update(
      id,
      updateExamEnrollmentDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบข้อมูลการสมัครสอบ' })
  @ApiOkResponse({ description: 'ลบข้อมูลสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.examEnrollmentsService.remove(id);
  }

  @Post('sessions/:sessionId/allocate')
  @ApiOperation({ summary: 'จัดที่นั่งสอบสำหรับรอบสอบ' })
  @ApiOkResponse({ type: ExamEnrollment, isArray: true })
  async allocateSeats(
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ): Promise<ExamEnrollment[]> {
    return await this.examEnrollmentsService.allocateSeats(sessionId);
  }

  @Post(':id/request-fix')
  @ApiOperation({ summary: 'ส่งคำขอแก้ไขข้อมูลไปยังผู้สมัคร' })
  @ApiOkResponse({ description: 'ส่งคำขอแก้ไขและส่งอีเมลสำเร็จ' })
  async requestFix(
    @Param('id', ParseIntPipe) id: number,
    @Body() requestFixDto: RequestFixDto,
  ): Promise<{ success: boolean }> {
    return await this.examEnrollmentsService.requestFix(id, requestFixDto);
  }
}
