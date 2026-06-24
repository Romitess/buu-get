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
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreatePasscodesDto } from './dto/create-passcodes.dto';
import { NotifyExamChangesDto } from './dto/notify-exam-changes.dto';
import { Exam } from './entities/exam.entity';
import { ExamPasscode } from './entities/exam-passcode.entity';
import { PasscodeLogResponseDto } from './dto/passcode-log-response.dto';
import { ExamPasscodeLog } from './entities/exam-passcode-log.entity';

@ApiTags('exam')
@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}
  @Get('time')
  @ApiOperation({ summary: 'ดึงเวลาปัจจุบันของเซิร์ฟเวอร์' })
  @ApiOkResponse({ description: 'เวลาปัจจุบันในรูปแบบ ISO' })
  getTime(): { serverTime: string } {
    return { serverTime: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: 'สร้างข้อมูลการสอบใหม่' })
  @ApiCreatedResponse({ type: Exam })
  async create(@Body() createExamDto: CreateExamDto): Promise<Exam> {
    return this.examService.create(createExamDto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลการสอบทั้งหมด' })
  @ApiOkResponse({ type: Exam, isArray: true })
  async findAll(): Promise<Exam[]> {
    return this.examService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลการสอบตาม ID' })
  @ApiOkResponse({ type: Exam })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Exam> {
    return this.examService.findOne(id);
  }

  @Post(':id/passcodes')
  @ApiOperation({ summary: 'สร้าง passcodes สำหรับการสอบ' })
  @ApiCreatedResponse({ description: 'สร้าง passcodes สำเร็จ' })
  async createPasscodes(
    @Param('id', ParseIntPipe) id: number,
    @Body() createPasscodesDto: CreatePasscodesDto,
  ): Promise<ExamPasscode[]> {
    return this.examService.createPasscodes(id, createPasscodesDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลการสอบ' })
  @ApiOkResponse({ type: Exam })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExamDto: UpdateExamDto,
  ): Promise<Exam> {
    return this.examService.update(id, updateExamDto);
  }

  @Post(':id/notify-changes')
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
  @ApiOperation({ summary: 'ลบข้อมูลการสอบ' })
  @ApiOkResponse({ description: 'ลบข้อมูลสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.examService.remove(id);
  }

  @Get(':id/passcode-history')
  @ApiOperation({ summary: 'ดึงประวัติการใช้งาน passcode ของการสอบ' })
  @ApiOkResponse({ type: PasscodeLogResponseDto, isArray: true })
  async getPasscodeHistory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PasscodeLogResponseDto[]> {
    return this.examService.getPasscodeHistory(id);
  }

  @Post(':id/passcode-log')
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
