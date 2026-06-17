import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ExamRuleVouchersService } from './exam-rule-vouchers.service';
import { SaveRegulationsDto } from './dto/save-regulations.dto';

@ApiTags('exam-rule-vouchers')
@Controller('exam-rule-vouchers')
export class ExamRuleVouchersController {
  constructor(
    private readonly examRuleVouchersService: ExamRuleVouchersService,
  ) {}

  @Get('regulations')
  @ApiOperation({ summary: 'ดึงข้อมูล Test Regulations (EN & TH)' })
  @ApiOkResponse({
    description: 'ข้อมูล Regulations',
    schema: {
      type: 'object',
      properties: {
        regulationsEn: { type: 'string' },
        regulationsTh: { type: 'string' },
      },
    },
  })
  async getRegulations(): Promise<{
    regulationsEn: string;
    regulationsTh: string;
  }> {
    return await this.examRuleVouchersService.getRegulations();
  }

  @Put('regulations')
  @ApiOperation({ summary: 'บันทึกข้อมูล Test Regulations (EN & TH)' })
  @ApiOkResponse({
    description: 'บันทึกสำเร็จ',
    schema: {
      type: 'object',
      properties: {
        regulationsEn: { type: 'string' },
        regulationsTh: { type: 'string' },
      },
    },
  })
  async saveRegulations(
    @Body() dto: SaveRegulationsDto,
  ): Promise<{ regulationsEn: string; regulationsTh: string }> {
    return await this.examRuleVouchersService.saveRegulations(dto);
  }
}
