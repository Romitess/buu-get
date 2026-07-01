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
import { ExamCertificatesService } from './exam-certificates.service';
import { CreateExamCertificateDto } from './dto/create-exam-certificate.dto';
import { UpdateExamCertificateDto } from './dto/update-exam-certificate.dto';
import { ExamCertificate } from './entities/exam-certificate.entity';

@ApiTags('exam-certificates')
@Controller('api/exam-certificates')
export class ExamCertificatesController {
  constructor(
    private readonly examCertificatesService: ExamCertificatesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'สร้างใบรับรองใหม่ (Create new Exam Certificate)' })
  @ApiResponse({
    status: 201,
    description: 'สร้างสำเร็จ',
    type: ExamCertificate,
  })
  create(
    @Body() createExamCertificateDto: CreateExamCertificateDto,
  ): Promise<ExamCertificate> {
    return this.examCertificatesService.create(createExamCertificateDto);
  }

  @Get()
  @ApiOperation({
    summary: 'ดึงข้อมูลใบรับรองทั้งหมด (Get all Exam Certificates)',
  })
  @ApiResponse({
    status: 200,
    description: 'ดึงข้อมูลสำเร็จ',
    type: [ExamCertificate],
  })
  findAll(): Promise<ExamCertificate[]> {
    return this.examCertificatesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'ดึงข้อมูลใบรับรองตาม ID (Get Exam Certificate by ID)',
  })
  @ApiResponse({
    status: 200,
    description: 'ดึงข้อมูลสำเร็จ',
    type: ExamCertificate,
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ExamCertificate> {
    return this.examCertificatesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'อัปเดตข้อมูลใบรับรอง (Update Exam Certificate)' })
  @ApiResponse({
    status: 200,
    description: 'อัปเดตสำเร็จ',
    type: ExamCertificate,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExamCertificateDto: UpdateExamCertificateDto,
  ): Promise<ExamCertificate> {
    return this.examCertificatesService.update(id, updateExamCertificateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'ลบข้อมูลใบรับรองแบบ Soft Delete (Delete Exam Certificate)',
  })
  @ApiResponse({ status: 200, description: 'ลบสำเร็จ' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.examCertificatesService.remove(id);
  }
}
