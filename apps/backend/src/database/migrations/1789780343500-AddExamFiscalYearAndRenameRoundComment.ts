import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - เปลี่ยน comment ของ EXAM_ROUND เป็น «ครั้งที่จัดสอบ»
 * - เพิ่ม EXAM_FISCAL_YEAR (ปีงบประมาณ)
 * - แยกค่าเดิมรูปแบบ N/YYYY จาก EXAM_ROUND → EXAM_ROUND + EXAM_FISCAL_YEAR
 */
export class AddExamFiscalYearAndRenameRoundComment1789780343500 implements MigrationInterface {
  name = 'AddExamFiscalYearAndRenameRoundComment1789780343500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`EXAM_T_EXAM\`
      ADD \`EXAM_FISCAL_YEAR\` varchar(10) NULL COMMENT 'ปีงบประมาณ' AFTER \`EXAM_ROUND\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`EXAM_T_EXAM\`
      MODIFY COLUMN \`EXAM_ROUND\` varchar(20) NULL COMMENT 'ครั้งที่จัดสอบ'
    `);

    // แยกค่าเดิมเช่น "1/2026" หรือ "1/2569" → ครั้งที่ + ปีงบประมาณ
    await queryRunner.query(`
      UPDATE \`EXAM_T_EXAM\`
      SET
        \`EXAM_FISCAL_YEAR\` = SUBSTRING_INDEX(\`EXAM_ROUND\`, '/', -1),
        \`EXAM_ROUND\` = SUBSTRING_INDEX(\`EXAM_ROUND\`, '/', 1)
      WHERE \`EXAM_ROUND\` IS NOT NULL
        AND \`EXAM_ROUND\` LIKE '%/%'
        AND \`EXAM_FISCAL_YEAR\` IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // รวมกลับเป็นรูปแบบ ครั้งที่/ปีงบประมาณ ถ้ามีปีงบประมาณ
    await queryRunner.query(`
      UPDATE \`EXAM_T_EXAM\`
      SET \`EXAM_ROUND\` = CONCAT(\`EXAM_ROUND\`, '/', \`EXAM_FISCAL_YEAR\`)
      WHERE \`EXAM_ROUND\` IS NOT NULL
        AND \`EXAM_FISCAL_YEAR\` IS NOT NULL
        AND \`EXAM_FISCAL_YEAR\` <> ''
        AND \`EXAM_ROUND\` NOT LIKE '%/%'
    `);

    await queryRunner.query(`
      ALTER TABLE \`EXAM_T_EXAM\`
      DROP COLUMN \`EXAM_FISCAL_YEAR\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`EXAM_T_EXAM\`
      MODIFY COLUMN \`EXAM_ROUND\` varchar(20) NULL COMMENT 'รอบการสอบ'
    `);
  }
}
