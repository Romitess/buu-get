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
import { ExamLocationSeatsService } from './exam-location-seats.service';
import { CreateExamLocationSeatDto } from './dto/create-exam-location-seat.dto';
import { UpdateExamLocationSeatDto } from './dto/update-exam-location-seat.dto';
import { GenerateExamLocationSeatsDto } from './dto/generate-exam-location-seats.dto';
import { ExamLocationSeat } from './entities/exam-location-seat.entity';

@ApiTags('exam-location-seats')
@Controller('exam-location-seats')
export class ExamLocationSeatsController {
  constructor(
    private readonly examLocationSeatsService: ExamLocationSeatsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'สร้างที่นั่งในห้องสอบใหม่' })
  @ApiCreatedResponse({ type: ExamLocationSeat })
  async create(
    @Body() dto: CreateExamLocationSeatDto,
  ): Promise<ExamLocationSeat> {
    return this.examLocationSeatsService.create(dto);
  }

  @Get('location/:locationId')
  @ApiOperation({ summary: 'ดึงข้อมูลที่นั่งทั้งหมดตาม LOCATION_ID' })
  @ApiOkResponse({ type: ExamLocationSeat, isArray: true })
  async findAll(
    @Param('locationId', ParseIntPipe) locationId: number,
  ): Promise<ExamLocationSeat[]> {
    return this.examLocationSeatsService.findAll(locationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลที่นั่งตาม ID' })
  @ApiOkResponse({ type: ExamLocationSeat })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ExamLocationSeat> {
    return this.examLocationSeatsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลที่นั่ง' })
  @ApiOkResponse({ type: ExamLocationSeat })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExamLocationSeatDto,
  ): Promise<ExamLocationSeat> {
    return this.examLocationSeatsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบข้อมูลที่นั่ง' })
  @ApiOkResponse({ description: 'ลบข้อมูลสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.examLocationSeatsService.remove(id);
  }

  @Post('generate/:locationId')
  @ApiOperation({
    summary:
      'Auto-generate ที่นั่งจาก LOCATION_TOTAL_ROWS x LOCATION_TOTAL_COLS',
  })
  @ApiOkResponse({ type: ExamLocationSeat, isArray: true })
  async generateSeats(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() body?: GenerateExamLocationSeatsDto,
  ): Promise<ExamLocationSeat[]> {
    const brokenSeats = body?.brokenSeats || [];
    return this.examLocationSeatsService.generateSeats(
      locationId,
      brokenSeats,
      body?.seatStatuses,
    );
  }
}
