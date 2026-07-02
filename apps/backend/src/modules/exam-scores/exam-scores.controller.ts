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
import { ExamScoresService } from './exam-scores.service';
import { CreateExamScoreDto } from './dto/create-exam-score.dto';
import { UpdateExamScoreDto } from './dto/update-exam-score.dto';
import { ExamScore } from './entities/exam-score.entity';

@ApiTags('exam-scores')
@Controller('api/exam-scores')
export class ExamScoresController {
  constructor(private readonly examScoresService: ExamScoresService) {}

  @Post()
  @ApiOperation({ summary: 'สร้างคะแนนสอบใหม่ (Create new Exam Score)' })
  @ApiResponse({ status: 201, description: 'สร้างสำเร็จ', type: ExamScore })
  create(@Body() createExamScoreDto: CreateExamScoreDto): Promise<ExamScore> {
    return this.examScoresService.create(createExamScoreDto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลคะแนนสอบทั้งหมด (Get all Exam Scores)' })
  @ApiResponse({
    status: 200,
    description: 'ดึงข้อมูลสำเร็จ',
    type: [ExamScore],
  })
  findAll(): Promise<ExamScore[]> {
    return this.examScoresService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลคะแนนสอบตาม ID (Get Exam Score by ID)' })
  @ApiResponse({ status: 200, description: 'ดึงข้อมูลสำเร็จ', type: ExamScore })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ExamScore> {
    return this.examScoresService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'อัปเดตข้อมูลคะแนนสอบ (Update Exam Score)' })
  @ApiResponse({ status: 200, description: 'อัปเดตสำเร็จ', type: ExamScore })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExamScoreDto: UpdateExamScoreDto,
  ): Promise<ExamScore> {
    return this.examScoresService.update(id, updateExamScoreDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'ลบข้อมูลคะแนนสอบแบบ Soft Delete (Delete Exam Score)',
  })
  @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.examScoresService.remove(id);
  }
}
