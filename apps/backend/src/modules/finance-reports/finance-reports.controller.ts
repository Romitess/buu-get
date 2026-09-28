import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import { FinanceReportsService } from './finance-reports.service';
import { DailyRevenueReportQueryDto } from './dto/daily-revenue-report-query.dto';
import { ApplicationFeeReportQueryDto } from './dto/application-fee-report-query.dto';
import { ReceiptUsageReportQueryDto } from './dto/receipt-usage-report-query.dto';
import {
  ApplicationFeeReport,
  DailyRevenueReport,
  ReceiptUsageReport,
} from './interfaces/finance-reports.interface';

@ApiTags('Finance Reports')
@ApiBearerAuth()
@Controller('finance-reports')
@Roles(RoleEnum.ADMIN, RoleEnum.FINANCE)
export class FinanceReportsController {
  constructor(private readonly financeReportsService: FinanceReportsService) {}

  @Get('daily-revenue')
  @ApiOperation({
    summary: 'รายงานสรุปการรับเงินประจำวันจากใบเสร็จที่ใช้งาน',
  })
  getDailyRevenue(
    @Query() query: DailyRevenueReportQueryDto,
  ): Promise<DailyRevenueReport> {
    return this.financeReportsService.getDailyRevenue(query);
  }

  @Get('application-fees')
  @ApiOperation({
    summary: 'รายงานสรุปการรับเงินค่าสมัครรายใบเสร็จ',
  })
  getApplicationFees(
    @Query() query: ApplicationFeeReportQueryDto,
  ): Promise<ApplicationFeeReport> {
    return this.financeReportsService.getApplicationFees(query);
  }

  @Get('receipt-usage')
  @ApiOperation({
    summary: 'รายงานการใช้ใบเสร็จรับเงิน จัดกลุ่มตามแหล่งเงิน',
  })
  getReceiptUsage(
    @Query() query: ReceiptUsageReportQueryDto,
  ): Promise<ReceiptUsageReport> {
    return this.financeReportsService.getReceiptUsage(query);
  }
}
