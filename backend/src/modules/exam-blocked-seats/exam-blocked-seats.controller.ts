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
  ApiQuery,
} from '@nestjs/swagger';
import { ExamBlockedSeatsService } from './exam-blocked-seats.service';
import { CreateExamBlockedSeatDto } from './dto/create-exam-blocked-seat.dto';
import { UpdateExamBlockedSeatDto } from './dto/update-exam-blocked-seat.dto';
import { ReplaceExamBlockedSeatsDto } from './dto/replace-exam-blocked-seats.dto';
import { ExamBlockedSeat } from './entities/exam-blocked-seat.entity';

@ApiTags('exam-blocked-seats')
@Controller('exam-blocked-seats')
export class ExamBlockedSeatsController {
  constructor(
    private readonly examBlockedSeatsService: ExamBlockedSeatsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'สร้างรายการ block ที่นั่งใหม่' })
  @ApiCreatedResponse({ type: ExamBlockedSeat })
  async create(
    @Body() dto: CreateExamBlockedSeatDto,
  ): Promise<ExamBlockedSeat> {
    return this.examBlockedSeatsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลรายการ block ที่นั่งทั้งหมด' })
  @ApiQuery({ name: 'sessionId', required: false, type: Number })
  @ApiOkResponse({ type: ExamBlockedSeat, isArray: true })
  async findAll(
    @Query('sessionId') sessionId?: number,
  ): Promise<ExamBlockedSeat[]> {
    return this.examBlockedSeatsService.findAll(sessionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลการ block ที่นั่งตาม ID' })
  @ApiOkResponse({ type: ExamBlockedSeat })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ExamBlockedSeat> {
    return this.examBlockedSeatsService.findOne(id);
  }

  @Post('session/:sessionId/replace')
  @ApiOperation({
    summary: 'Replace all seat overrides for a session',
  })
  @ApiOkResponse({ type: ExamBlockedSeat, isArray: true })
  async replaceForSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: ReplaceExamBlockedSeatsDto,
  ): Promise<ExamBlockedSeat[]> {
    return this.examBlockedSeatsService.replaceForSession(sessionId, dto.seats);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลการ block ที่นั่ง' })
  @ApiOkResponse({ type: ExamBlockedSeat })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExamBlockedSeatDto,
  ): Promise<ExamBlockedSeat> {
    return this.examBlockedSeatsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบข้อมูลการ block ที่นั่ง (Soft Delete)' })
  @ApiOkResponse({ description: 'ลบข้อมูลสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.examBlockedSeatsService.remove(id);
  }
}
