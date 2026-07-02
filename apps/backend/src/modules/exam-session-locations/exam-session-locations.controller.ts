import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ExamSessionLocationsService } from './exam-session-locations.service';
import { CreateExamSessionLocationDto } from './dto/create-exam-session-location.dto';
import { UpdateExamSessionLocationDto } from './dto/update-exam-session-location.dto';
import { ExamSessionLocation } from './entities/exam-session-location.entity';

@ApiTags('exam-session-locations')
@Controller('exam-session-locations')
export class ExamSessionLocationsController {
  constructor(
    private readonly sessionLocationsService: ExamSessionLocationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'เชื่อม Session กับ Location' })
  @ApiCreatedResponse({ type: ExamSessionLocation })
  async create(
    @Body() dto: CreateExamSessionLocationDto,
  ): Promise<ExamSessionLocation> {
    return this.sessionLocationsService.create(dto);
  }

  @Get('location/:locationId')
  @ApiOperation({ summary: 'ดึงข้อมูล Session ทั้งหมดที่ใช้สถานที่นี้' })
  @ApiOkResponse({ type: ExamSessionLocation, isArray: true })
  async findAllByLocation(
    @Param('locationId', ParseIntPipe) locationId: number,
  ): Promise<ExamSessionLocation[]> {
    return this.sessionLocationsService.findAllByLocation(locationId);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'ดึงข้อมูลสถานที่ทั้งหมดสำหรับรอบสอบนี้' })
  @ApiOkResponse({ type: ExamSessionLocation, isArray: true })
  async findAllBySession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ): Promise<ExamSessionLocation[]> {
    return this.sessionLocationsService.findAllBySession(sessionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูล Session-Location ตาม ID' })
  @ApiOkResponse({ type: ExamSessionLocation })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ExamSessionLocation> {
    return this.sessionLocationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'อัปเดตข้อมูล Session-Location' })
  @ApiOkResponse({ type: ExamSessionLocation })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExamSessionLocationDto,
  ): Promise<ExamSessionLocation> {
    return this.sessionLocationsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ยกเลิกการเชื่อม Session-Location (Soft Delete)' })
  @ApiOkResponse({ description: 'ลบข้อมูลสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.sessionLocationsService.remove(id);
  }
}
