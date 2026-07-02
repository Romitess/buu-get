import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoreCriteria } from './entities/score-criteria.entity';
import { BandRuleDto, SaveBandRulesDto } from './dto/save-band-rules.dto';

@Injectable()
export class ScoreCriteriaService {
  constructor(
    @InjectRepository(ScoreCriteria)
    private readonly scoreCriteriaRepository: Repository<ScoreCriteria>,
  ) {}

  /** ดึง Band Rules ของ active record (ถ้ามี) */
  async getBandRules(): Promise<{ bandRules: BandRuleDto[] }> {
    const active = await this.scoreCriteriaRepository.findOne({
      where: { SCR_ACTIVE: true },
      order: { UPDATED_AT: 'DESC' },
    });

    if (!active || !active.SCR_CONTENT) {
      return { bandRules: [] };
    }

    try {
      const parsed = JSON.parse(active.SCR_CONTENT) as BandRuleDto[];
      return { bandRules: parsed };
    } catch {
      return { bandRules: [] };
    }
  }

  /** บันทึก Band Rules — upsert active record */
  async saveBandRules(
    dto: SaveBandRulesDto,
  ): Promise<{ bandRules: BandRuleDto[] }> {
    const contentJson = JSON.stringify(dto.bandRules);

    // หา active record ที่มีอยู่ หรือสร้างใหม่
    let active = await this.scoreCriteriaRepository.findOne({
      where: { SCR_ACTIVE: true },
    });

    if (active) {
      active.SCR_CONTENT = contentJson;
      await this.scoreCriteriaRepository.save(active);
    } else {
      active = this.scoreCriteriaRepository.create({
        SCR_CONTENT: contentJson,
        SCR_ACTIVE: true,
      });
      await this.scoreCriteriaRepository.save(active);
    }

    return { bandRules: dto.bandRules };
  }
}
