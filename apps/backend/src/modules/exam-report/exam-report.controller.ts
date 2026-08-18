import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ExamReportService } from './exam-report.service';
import { ExamReportQueryDto } from './dto/exam-report-query.dto';
import { ExamReportYearQueryDto } from './dto/exam-report-year-query.dto';
import {
  ExamCandidateInfo,
  ExamInformationRound,
  ExamReportListResponse,
  ExamReportOptions,
  ExamReportSummary,
} from './interfaces/exam-report.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';

@ApiTags('Exam Report')
@ApiBearerAuth()
@Controller('exam-report')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.EXECUTIVE)
export class ExamReportController {
  constructor(private readonly examReportService: ExamReportService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'ดึงข้อมูลสรุปรายงานการสอบ (การ์ดสถิติ + กราฟ + ตารางรอบสอบ)',
  })
  @ApiResponse({ status: 200, description: 'ข้อมูลสรุปรายงานการสอบ' })
  getSummary(@Query() query: ExamReportQueryDto): Promise<ExamReportSummary> {
    return this.examReportService.getSummary(query);
  }

  @Get('options')
  @ApiOperation({
    summary: 'ดึงตัวเลือกฟิลเตอร์ (ปี/เดือน/รอบสอบ) จากข้อมูลจริง',
  })
  @ApiResponse({ status: 200, description: 'ตัวเลือกฟิลเตอร์รายงานการสอบ' })
  getOptions(): Promise<ExamReportOptions> {
    return this.examReportService.getOptions();
  }

  @Get('years/:year/rounds')
  @ApiOperation({
    summary: 'ดึงข้อมูลรอบสอบและผลคะแนนรายรอบของปีที่เลือก',
  })
  @ApiParam({ name: 'year', description: 'ปี ค.ศ. เช่น 2026', example: 2026 })
  @ApiResponse({ status: 200, description: 'ข้อมูลรอบสอบรายปี' })
  getYearRounds(
    @Param('year', ParseIntPipe) year: number,
    @Query() query: ExamReportYearQueryDto,
  ): Promise<ExamReportListResponse<ExamInformationRound>> {
    return this.examReportService.getYearRounds(year, query);
  }

  @Get('years/:year/candidates')
  @ApiOperation({
    summary: 'ดึงข้อมูลผู้เข้าสอบและผลคะแนนรายบุคคลของปี/รอบสอบที่เลือก',
  })
  @ApiParam({ name: 'year', description: 'ปี ค.ศ. เช่น 2026', example: 2026 })
  @ApiResponse({ status: 200, description: 'ข้อมูลผู้เข้าสอบรายบุคคล' })
  getYearRoundCandidates(
    @Param('year', ParseIntPipe) year: number,
    @Query() query: ExamReportYearQueryDto,
  ): Promise<ExamReportListResponse<ExamCandidateInfo>> {
    return this.examReportService.getYearRoundCandidates(year, query);
  }
}
