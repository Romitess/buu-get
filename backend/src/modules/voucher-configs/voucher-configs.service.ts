import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamRule } from './entities/voucher-config.entity';
import { SaveRegulationsDto } from './dto/save-regulations.dto';

@Injectable()
export class VoucherConfigsService {
  constructor(
    @InjectRepository(ExamRule)
    private readonly examRuleRepository: Repository<ExamRule>,
  ) {}

  /** ดึง regulations ทั้ง EN และ TH จากตาราง BUU_GET_T_EXAM_RULE */
  async getRegulations(): Promise<{
    regulationsEn: string;
    regulationsTh: string;
  }> {
    const activeRule = await this.examRuleRepository.findOne({
      where: { PCF_ACTIVE: true },
      order: { ID: 'DESC' },
    });

    return {
      regulationsEn: activeRule?.CONTENT_EN ?? '',
      regulationsTh: activeRule?.CONTENT_TH ?? '',
    };
  }

  /** บันทึก regulations ทั้ง EN และ TH ลงตาราง BUU_GET_T_EXAM_RULE (แบบแถวเดียว) */
  async saveRegulations(
    dto: SaveRegulationsDto,
  ): Promise<{ regulationsEn: string; regulationsTh: string }> {
    let rule = await this.examRuleRepository.findOne({
      where: { PCF_ACTIVE: true },
    });

    if (rule) {
      rule.CONTENT_EN = dto.regulationsEn;
      rule.CONTENT_TH = dto.regulationsTh;
    } else {
      rule = this.examRuleRepository.create({
        CONTENT_EN: dto.regulationsEn,
        CONTENT_TH: dto.regulationsTh,
        PCF_ACTIVE: true,
      });
    }

    await this.examRuleRepository.save(rule);

    return {
      regulationsEn: dto.regulationsEn,
      regulationsTh: dto.regulationsTh,
    };
  }
}
