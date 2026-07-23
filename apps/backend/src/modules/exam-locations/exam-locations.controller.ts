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
import { ExamLocationsService } from './exam-locations.service';
import { CreateExamLocationDto } from './dto/create-exam-location.dto';
import { CreateExamLocationWithSeatsDto } from './dto/create-exam-location-with-seats.dto';
import { UpdateExamLocationDto } from './dto/update-exam-location.dto';
import { ExamLocation } from './entities/exam-location.entity';

@ApiTags('exam-locations')
@Controller('exam-locations')
export class ExamLocationsController {
  constructor(private readonly examLocationsService: ExamLocationsService) {}

  @Post()
  @ApiOperation({ summary: 'สร้างข้อมูลสถานที่จัดสอบใหม่' })
  @ApiCreatedResponse({ type: ExamLocation })
  async create(
    @Body() createExamLocationDto: CreateExamLocationDto,
  ): Promise<ExamLocation> {
    return this.examLocationsService.create(createExamLocationDto);
  }

  @Post('with-seats')
  @ApiOperation({
    summary: 'Create an exam location and all seats in one transaction',
  })
  @ApiCreatedResponse({
    description: 'Location and seats created successfully',
  })
  async createWithSeats(
    @Body() createExamLocationWithSeatsDto: CreateExamLocationWithSeatsDto,
  ): Promise<{ locationId: number; seatCount: number }> {
    return this.examLocationsService.createWithSeats(
      createExamLocationWithSeatsDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลสถานที่จัดสอบทั้งหมด' })
  @ApiQuery({
    name: 'includeSeats',
    required: false,
    type: Boolean,
    description: 'เมื่อ true จะรวมที่นั่งของทุกห้องใน response เดียว',
  })
  @ApiOkResponse({ type: ExamLocation, isArray: true })
  async findAll(
    @Query('includeSeats') includeSeats?: string,
  ): Promise<ExamLocation[]> {
    return this.examLocationsService.findAll({
      includeSeats: includeSeats === 'true' || includeSeats === '1',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลสถานที่จัดสอบตาม ID' })
  @ApiOkResponse({ type: ExamLocation })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ExamLocation> {
    return this.examLocationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลสถานที่จัดสอบ' })
  @ApiOkResponse({ type: ExamLocation })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExamLocationDto: UpdateExamLocationDto,
  ): Promise<ExamLocation> {
    return this.examLocationsService.update(id, updateExamLocationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบข้อมูลสถานที่จัดสอบ' })
  @ApiOkResponse({ description: 'ลบข้อมูลสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.examLocationsService.remove(id);
  }
}
