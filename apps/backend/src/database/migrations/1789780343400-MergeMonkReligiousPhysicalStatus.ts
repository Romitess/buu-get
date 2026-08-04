import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * รวมสถานะทางกายภาพ code 0 (พระภิกษุ / สามเณร) กับ code 1 (นักบวช / ศาสนบุคคล)
 * เป็น code 0 = พระภิกษุ / นักบวช — คง code 2–5 ไว้ตามเดิม
 */
export class MergeMonkReligiousPhysicalStatus1789780343400 implements MigrationInterface {
  name = 'MergeMonkReligiousPhysicalStatus1789780343400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE \`EXAM_T_ENROLLMENTS\`
      SET \`ERM_PHYSICAL_STATUS\` = 0
      WHERE \`ERM_PHYSICAL_STATUS\` = 1
    `);

    await queryRunner.query(`
      ALTER TABLE \`EXAM_T_ENROLLMENTS\`
      MODIFY COLUMN \`ERM_PHYSICAL_STATUS\` tinyint NOT NULL DEFAULT 5
      COMMENT 'สถานะทางกายภาพ/ข้อมูลผู้สมัคร (0: พระภิกษุ / นักบวช, 2: บุคคลทุพพลภาพ, 3: ผู้ตั้งครรภ์, 4: ผู้พิการรณ์, 5: ทั่วไป)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ไม่สามารถแยก code 0 กลับเป็นพระภิกษุ vs นักบวชได้ — คืนเฉพาะ comment
    await queryRunner.query(`
      ALTER TABLE \`EXAM_T_ENROLLMENTS\`
      MODIFY COLUMN \`ERM_PHYSICAL_STATUS\` tinyint NOT NULL DEFAULT 5
      COMMENT 'สถานะทางกายภาพ/ข้อมูลผู้สมัคร (0: พระภิกษุ / สามเณร, 1: นักบวช / ศาสนบุคคล, 2: บุคคลทุพพลภาพ, 3: ผู้ตั้งครรภ์, 4: ผู้พิการรณ์, 5: ทั่วไป)'
    `);
  }
}
