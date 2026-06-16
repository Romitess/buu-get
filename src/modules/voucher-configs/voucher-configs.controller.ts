import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { VoucherConfigsService } from './voucher-configs.service';
import { SaveRegulationsDto } from './dto/save-regulations.dto';

@ApiTags('voucher-configs')
@Controller('voucher-configs')
export class VoucherConfigsController {
  constructor(private readonly voucherConfigsService: VoucherConfigsService) {}

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
    return await this.voucherConfigsService.getRegulations();
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
    return await this.voucherConfigsService.saveRegulations(dto);
  }
}
