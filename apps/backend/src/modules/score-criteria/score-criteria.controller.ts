import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { EXAM_ADMIN_ROLES } from 'src/common/constants/role-groups';
import { ScoreCriteriaService } from './score-criteria.service';
import { BandRuleDto, SaveBandRulesDto } from './dto/save-band-rules.dto';

@ApiTags('score-criteria')
@Controller('score-criteria')
export class ScoreCriteriaController {
  constructor(private readonly scoreCriteriaService: ScoreCriteriaService) {}

  /** JWT-gated read (public verify embeds bands in WP3 / BUG-004) */
  @Get('band-rules')
  @ApiOperation({ summary: 'ดึงข้อมูล Band Rules ทั้งหมด' })
  @ApiOkResponse({
    description: 'รายการ Band Rules',
    schema: {
      type: 'object',
      properties: {
        bandRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              band: { type: 'string' },
              minScore: { type: 'number' },
              maxScore: { type: 'number' },
              cefr: { type: 'string' },
              descriptor: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getBandRules(): Promise<{ bandRules: BandRuleDto[] }> {
    return await this.scoreCriteriaService.getBandRules();
  }

  @Put('band-rules')
  @Roles(...EXAM_ADMIN_ROLES)
  @ApiOperation({ summary: 'บันทึก Band Rules ทั้งหมด' })
  @ApiOkResponse({
    description: 'บันทึกสำเร็จ',
    schema: {
      type: 'object',
      properties: {
        bandRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              band: { type: 'string' },
              minScore: { type: 'number' },
              maxScore: { type: 'number' },
              cefr: { type: 'string' },
              descriptor: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async saveBandRules(
    @Body() dto: SaveBandRulesDto,
  ): Promise<{ bandRules: BandRuleDto[] }> {
    return await this.scoreCriteriaService.saveBandRules(dto);
  }
}
