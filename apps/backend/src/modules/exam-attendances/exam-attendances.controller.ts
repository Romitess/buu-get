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
import { ExamAttendancesService } from './exam-attendances.service';
import { CreateExamAttendanceDto } from './dto/create-exam-attendance.dto';
import { UpdateExamAttendanceDto } from './dto/update-exam-attendance.dto';
import { ExamAttendance } from './entities/exam-attendance.entity';

@ApiTags('exam-attendances')
@Controller('exam-attendances')
export class ExamAttendancesController {
  constructor(
    private readonly examAttendancesService: ExamAttendancesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'บันทึกการเข้าสอบใหม่' })
  @ApiCreatedResponse({ type: ExamAttendance })
  async create(
    @Body() createExamAttendanceDto: CreateExamAttendanceDto,
  ): Promise<ExamAttendance> {
    return await this.examAttendancesService.create(createExamAttendanceDto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลการเข้าสอบทั้งหมด' })
  @ApiOkResponse({ type: ExamAttendance, isArray: true })
  async findAll(): Promise<ExamAttendance[]> {
    return await this.examAttendancesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลการเข้าสอบตาม ID' })
  @ApiOkResponse({ type: ExamAttendance })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ExamAttendance> {
    return await this.examAttendancesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลการเข้าสอบ' })
  @ApiOkResponse({ type: ExamAttendance })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExamAttendanceDto: UpdateExamAttendanceDto,
  ): Promise<ExamAttendance> {
    return await this.examAttendancesService.update(
      id,
      updateExamAttendanceDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบข้อมูลการเข้าสอบ' })
  @ApiOkResponse({ description: 'ลบข้อมูลสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.examAttendancesService.remove(id);
  }
}
