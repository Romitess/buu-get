import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ExamReportService } from './exam-report.service';
import { ExamReportQueryDto } from './dto/exam-report-query.dto';
import { ExamReportSummary } from './interfaces/exam-report.interface';
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
}
