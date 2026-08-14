import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { EXAM_ADMIN_ROLES } from 'src/common/constants/role-groups';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import {
  AuthenticatedUser,
  userHasAnyRole,
} from 'src/common/utils/authz.util';
import { Public } from 'src/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreatePasscodesDto } from './dto/create-passcodes.dto';
import { NotifyExamChangesDto } from './dto/notify-exam-changes.dto';
import { Exam } from './entities/exam.entity';
import { ExamQueryDto } from './dto/exam-query.dto';
import { ExamPasscode } from './entities/exam-passcode.entity';
import { PasscodeLogResponseDto } from './dto/passcode-log-response.dto';
import { ExamPasscodeLog } from './entities/exam-passcode-log.entity';

@ApiTags('exam')
@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}
  @Public()
  @Get('time')
  @ApiOperation({ summary: 'ดึงเวลาปัจจุบันของเซิร์ฟเวอร์' })
  @ApiOkResponse({ description: 'เวลาปัจจุบันในรูปแบบ ISO' })
  getTime(): { serverTime: string } {
    return { serverTime: new Date().toISOString() };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({ summary: 'สร้างข้อมูลการสอบใหม่' })
  @ApiCreatedResponse({ type: Exam })
  async create(
    @Body() createExamDto: CreateExamDto,
    @Req() req: { user: { userId: number } },
  ): Promise<Exam> {
    return this.examService.create(createExamDto, req.user.userId);
  }

  @Public()
  @Get('schedule')
  @ApiOperation({
    summary: 'ดึงตารางสอบที่เผยแพร่แล้ว (สาธารณะ ไม่รวม passcodes)',
  })
  @ApiOkResponse({ type: Exam, isArray: true })
  async findPublishedSchedule(): Promise<Exam[]> {
    return this.examService.findPublishedSchedule();
  }

  @Get()
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({ summary: 'ดึงรายการสอบทั้งหมดแบบแบ่งหน้า (รวมฉบับร่าง)' })
  @ApiOkResponse({ description: 'รายการสอบแบบแบ่งหน้า' })
  async findAll(
    @Query() query: ExamQueryDto,
  ): Promise<PaginatedResponse<Exam>> {
    return this.examService.findAll(query);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลการสอบตาม ID (ไม่รวมแผนผังที่นั่ง)' })
  @ApiOkResponse({ type: Exam })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user?: AuthenticatedUser },
  ): Promise<Exam> {
    const allowUnpublished = req.user
      ? userHasAnyRole(req.user, EXAM_ADMIN_ROLES)
      : false;
    return this.examService.findOne(id, { allowUnpublished });
  }

  @UseGuards(JwtAuthGuard)
  @Roles(...EXAM_ADMIN_ROLES)
  @Get(':id/with-seats')
  @ApiOperation({
    summary:
      'ดึงข้อมูลการสอบพร้อมแผนผังที่นั่ง (สำหรับหน้าจัดที่นั่ง/สร้างรอบ)',
  })
  @ApiOkResponse({ type: Exam })
  async findOneWithSeats(@Param('id', ParseIntPipe) id: number): Promise<Exam> {
    return this.examService.findOneWithSeats(id);
  }

  @Post(':id/passcodes')
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({
    summary: 'สร้าง passcodes สำหรับการสอบ',
    description:
      'แทนที่รายชื่อผู้มีสิทธิ์สอบทั้งชุด ห้ามเรียกเมื่อมีผู้ลงทะเบียนในรอบสอบแล้ว',
  })
  @ApiCreatedResponse({ description: 'สร้าง passcodes สำเร็จ' })
  async createPasscodes(
    @Param('id', ParseIntPipe) id: number,
    @Body() createPasscodesDto: CreatePasscodesDto,
  ): Promise<ExamPasscode[]> {
    return this.examService.createPasscodes(id, createPasscodesDto);
  }

  @Patch(':id')
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({ summary: 'แก้ไขข้อมูลการสอบ' })
  @ApiOkResponse({ type: Exam })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExamDto: UpdateExamDto,
  ): Promise<Exam> {
    return this.examService.update(id, updateExamDto);
  }

  @Post(':id/notify-changes')
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({
    summary: 'แจ้งเตือนผู้เข้าสอบทุกคนในรอบสอบทางอีเมลเมื่อมีการแก้ไขรอบสอบ',
  })
  @ApiOkResponse({
    description: 'รับคำขอแจ้งเตือนสำเร็จ (ระบบส่งอีเมลแบบเบื้องหลัง)',
  })
  notifyChanges(
    @Param('id', ParseIntPipe) id: number,
    @Body() notifyExamChangesDto: NotifyExamChangesDto,
  ): { success: boolean } {
    return this.examService.notifyExamChanges(id, notifyExamChangesDto);
  }

  @Delete(':id')
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({ summary: 'ลบข้อมูลการสอบ' })
  @ApiOkResponse({ description: 'ลบข้อมูลสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.examService.remove(id);
  }

  @Get(':id/passcode-history')
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({ summary: 'ดึงประวัติการใช้งาน passcode ของการสอบ' })
  @ApiOkResponse({ type: PasscodeLogResponseDto, isArray: true })
  async getPasscodeHistory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PasscodeLogResponseDto[]> {
    return this.examService.getPasscodeHistory(id);
  }

  @Post(':id/passcode-log')
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({ summary: 'บันทึก log การใช้งาน passcode' })
  @ApiCreatedResponse({ type: ExamPasscodeLog })
  async logPasscodeUsage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { passcodeId: number; fullName: string; passcode: string },
  ): Promise<ExamPasscodeLog> {
    return this.examService.logPasscodeUsage(
      id,
      body.passcodeId,
      body.fullName,
      body.passcode,
    );
  }
}
