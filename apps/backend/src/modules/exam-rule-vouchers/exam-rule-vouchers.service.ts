import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamRuleVoucher } from './entities/exam-rule-voucher.entity';
import { SaveRegulationsDto } from './dto/save-regulations.dto';

@Injectable()
export class ExamRuleVouchersService {
  constructor(
    @InjectRepository(ExamRuleVoucher)
    private readonly examRuleVoucherRepository: Repository<ExamRuleVoucher>,
  ) {}

  /** ดึง regulations ทั้ง EN และ TH จากตาราง BUU_GET_T_EXAM_RULE_VOUCHERS */
  async getRegulations(): Promise<{
    regulationsEn: string;
    regulationsTh: string;
  }> {
    const [activeRule] = await this.examRuleVoucherRepository.find({
      order: { EXRV_ID: 'DESC' },
      take: 1,
    });

    return {
      regulationsEn: activeRule?.CONTENT_EN ?? '',
      regulationsTh: activeRule?.CONTENT_TH ?? '',
    };
  }

  /** บันทึก regulations ทั้ง EN และ TH ลงตาราง BUU_GET_T_EXAM_RULE_VOUCHERS (แบบแถวเดียว) */
  async saveRegulations(
    dto: SaveRegulationsDto,
  ): Promise<{ regulationsEn: string; regulationsTh: string }> {
    const [rule] = await this.examRuleVoucherRepository.find({
      order: { EXRV_ID: 'DESC' },
      take: 1,
    });

    if (rule) {
      rule.CONTENT_EN = dto.regulationsEn;
      rule.CONTENT_TH = dto.regulationsTh;
      await this.examRuleVoucherRepository.save(rule);
    } else {
      const newRule = this.examRuleVoucherRepository.create({
        CONTENT_EN: dto.regulationsEn,
        CONTENT_TH: dto.regulationsTh,
      });
      await this.examRuleVoucherRepository.save(newRule);
    }

    return {
      regulationsEn: dto.regulationsEn,
      regulationsTh: dto.regulationsTh,
    };
  }
}
