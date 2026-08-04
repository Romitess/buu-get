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

  private async findActiveCriteria(): Promise<ScoreCriteria | null> {
    return await this.scoreCriteriaRepository.findOne({
      where: { SCR_ACTIVE: true },
      order: { UPDATED_AT: 'DESC' },
    });
  }

  private parseBandRules(content: string | null): BandRuleDto[] {
    if (!content) {
      return [];
    }

    try {
      const parsed = JSON.parse(content) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter((rule): rule is BandRuleDto => {
        if (!rule || typeof rule !== 'object') {
          return false;
        }

        const candidate = rule as Partial<BandRuleDto>;
        return (
          typeof candidate.id === 'string' &&
          typeof candidate.band === 'string' &&
          typeof candidate.minScore === 'number' &&
          typeof candidate.maxScore === 'number' &&
          typeof candidate.cefr === 'string' &&
          typeof candidate.descriptor === 'string'
        );
      });
    } catch {
      return [];
    }
  }

  /** ดึง Band Rules ของ active record (ถ้ามี) */
  async getBandRules(): Promise<{ bandRules: BandRuleDto[] }> {
    const active = await this.findActiveCriteria();
    return { bandRules: this.parseBandRules(active?.SCR_CONTENT ?? null) };
  }

  /** คำนวณระดับ CEFR จากคะแนนรวมตาม active score criteria */
  async resolveBandLevel(totalScore: number): Promise<string | null> {
    if (!Number.isFinite(totalScore)) {
      return null;
    }

    const active = await this.findActiveCriteria();
    const bandRules = this.parseBandRules(active?.SCR_CONTENT ?? null).sort(
      (a, b) => a.minScore - b.minScore || a.maxScore - b.maxScore,
    );
    const matchedRule = bandRules.find(
      (rule) => totalScore >= rule.minScore && totalScore <= rule.maxScore,
    );

    if (!matchedRule) {
      return null;
    }

    return matchedRule.cefr?.trim() || null;
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
