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
import { Roles } from 'src/common/decorators/roles.decorator';
import { EXAM_ADMIN_ROLES } from 'src/common/constants/role-groups';
import { ScoreRubricsService } from './score-rubrics.service';
import {
  CreateScoreRubricDto,
  ScoreRubricResponseDto,
  UpdateScoreRubricDto,
} from './dto/score-rubric.dto';

@ApiTags('score-rubrics')
@Controller('score-rubrics')
@Roles(...EXAM_ADMIN_ROLES)
export class ScoreRubricsController {
  constructor(private readonly scoreRubricsService: ScoreRubricsService) {}

  @Get()
  @ApiOperation({ summary: 'ดึงชุดเกณฑ์คะแนนทั้งหมด' })
  @ApiResponse({ status: 200, type: [ScoreRubricResponseDto] })
  findAll(): Promise<ScoreRubricResponseDto[]> {
    return this.scoreRubricsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'สร้างชุดเกณฑ์คะแนนใหม่' })
  @ApiResponse({ status: 201, type: ScoreRubricResponseDto })
  create(@Body() dto: CreateScoreRubricDto): Promise<ScoreRubricResponseDto> {
    return this.scoreRubricsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงชุดเกณฑ์คะแนนตาม ID' })
  @ApiResponse({ status: 200, type: ScoreRubricResponseDto })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ScoreRubricResponseDto> {
    return this.scoreRubricsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขชุดเกณฑ์คะแนน' })
  @ApiResponse({ status: 200, type: ScoreRubricResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScoreRubricDto,
  ): Promise<ScoreRubricResponseDto> {
    return this.scoreRubricsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบชุดเกณฑ์คะแนน (Soft delete)' })
  @ApiResponse({ status: 200 })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.scoreRubricsService.remove(id);
  }
}
