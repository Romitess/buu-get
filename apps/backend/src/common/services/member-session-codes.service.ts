import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  ExamTypeCode,
  PersonTypeCode,
  formatSessionCode,
  formatUserCode,
  getThaiFiscalYearBe,
  normalizeFiscalYearAd,
  resolveExamTypeCode,
  resolvePersonTypeCode,
} from '../utils/member-session-codes.util';

@Injectable()
export class MemberSessionCodesService {
  async allocateUserCode(
    manager: EntityManager,
    params: {
      nationalId?: string | null;
      passportNo?: string | null;
      at?: Date;
    },
  ): Promise<string> {
    const at = params.at ?? new Date();
    const fiscalBe = String(getThaiFiscalYearBe(at));
    const personType: PersonTypeCode = resolvePersonTypeCode(
      params.nationalId,
      params.passportNo,
    );

    await manager.query(
      `INSERT INTO \`BUU_GET_T_USER_CODE_SEQ\`
        (\`UCS_FISCAL_YEAR_BE\`, \`UCS_PERSON_TYPE\`, \`UCS_LAST_NO\`)
       VALUES (?, ?, 0)
       ON DUPLICATE KEY UPDATE \`UCS_LAST_NO\` = \`UCS_LAST_NO\``,
      [fiscalBe, personType],
    );

    const rows = (await manager.query(
      `SELECT \`UCS_LAST_NO\` AS lastNo
       FROM \`BUU_GET_T_USER_CODE_SEQ\`
       WHERE \`UCS_FISCAL_YEAR_BE\` = ? AND \`UCS_PERSON_TYPE\` = ?
       FOR UPDATE`,
      [fiscalBe, personType],
    )) as Array<{ lastNo: number }>;

    const next = Number(rows[0]?.lastNo ?? 0) + 1;
    if (next > 99999) {
      throw new BadRequestException(
        `USER_CODE sequence overflow for ${fiscalBe}${personType} (max 99999)`,
      );
    }

    await manager.query(
      `UPDATE \`BUU_GET_T_USER_CODE_SEQ\`
       SET \`UCS_LAST_NO\` = ?
       WHERE \`UCS_FISCAL_YEAR_BE\` = ? AND \`UCS_PERSON_TYPE\` = ?`,
      [next, fiscalBe, personType],
    );

    return formatUserCode(fiscalBe, personType, next);
  }

  async allocateSessionCode(
    manager: EntityManager,
    params: {
      examType?: string | null;
      examFiscalYear?: string | null;
      at?: Date;
    },
  ): Promise<string> {
    const at = params.at ?? new Date();
    const examType: ExamTypeCode = resolveExamTypeCode(params.examType);
    const fiscalAd = normalizeFiscalYearAd(params.examFiscalYear, at);

    await manager.query(
      `INSERT INTO \`EXAM_T_SESSION_CODE_SEQ\`
        (\`SCS_EXAM_TYPE\`, \`SCS_FISCAL_YEAR_AD\`, \`SCS_LAST_NO\`)
       VALUES (?, ?, 0)
       ON DUPLICATE KEY UPDATE \`SCS_LAST_NO\` = \`SCS_LAST_NO\``,
      [examType, fiscalAd],
    );

    const rows = (await manager.query(
      `SELECT \`SCS_LAST_NO\` AS lastNo
       FROM \`EXAM_T_SESSION_CODE_SEQ\`
       WHERE \`SCS_EXAM_TYPE\` = ? AND \`SCS_FISCAL_YEAR_AD\` = ?
       FOR UPDATE`,
      [examType, fiscalAd],
    )) as Array<{ lastNo: number }>;

    const next = Number(rows[0]?.lastNo ?? 0) + 1;
    if (next > 999) {
      throw new BadRequestException(
        `SESSION_CODE sequence overflow for ${examType}${fiscalAd} (max 999)`,
      );
    }

    await manager.query(
      `UPDATE \`EXAM_T_SESSION_CODE_SEQ\`
       SET \`SCS_LAST_NO\` = ?
       WHERE \`SCS_EXAM_TYPE\` = ? AND \`SCS_FISCAL_YEAR_AD\` = ?`,
      [next, examType, fiscalAd],
    );

    return formatSessionCode(examType, fiscalAd, next);
  }
}
