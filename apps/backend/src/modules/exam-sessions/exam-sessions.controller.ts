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
import { ExamSessionsService } from './exam-sessions.service';
import { CreateExamSessionDto } from './dto/create-exam-session.dto';
import { UpdateExamSessionDto } from './dto/update-exam-session.dto';
import { ExamSession } from './entities/exam-session.entity';

@ApiTags('exam-sessions')
@Controller('exam-sessions')
export class ExamSessionsController {
  constructor(private readonly examSessionsService: ExamSessionsService) {}

  @Post()
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({ summary: 'สร้างข้อมูลรอบสอบใหม่' })
  @ApiCreatedResponse({ type: ExamSession })
  async create(
    @Body() createExamSessionDto: CreateExamSessionDto,
  ): Promise<ExamSession> {
    return this.examSessionsService.create(createExamSessionDto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลรอบสอบทั้งหมด' })
  @ApiOkResponse({ type: ExamSession, isArray: true })
  async findAll(): Promise<ExamSession[]> {
    return this.examSessionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลรอบสอบตาม ID' })
  @ApiOkResponse({ type: ExamSession })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ExamSession> {
    return this.examSessionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({ summary: 'แก้ไขข้อมูลรอบสอบ' })
  @ApiOkResponse({ type: ExamSession })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExamSessionDto: UpdateExamSessionDto,
  ): Promise<ExamSession> {
    return this.examSessionsService.update(id, updateExamSessionDto);
  }

  @Delete(':id')
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({ summary: 'ลบข้อมูลรอบสอบ' })
  @ApiOkResponse({ description: 'ลบข้อมูลสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.examSessionsService.remove(id);
  }
}
