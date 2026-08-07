import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ยุบ ERM_PHYSICAL_STATUS เหลือ 5 ค่า:
 *   1: พระภิกษุ / นักบวช
 *   2: บุคคลทุพพลภาพ
 *   3: ผู้ตั้งครรภ์
 *   4: ชาวต่างชาติ
 *   5: ชาวไทย
 *
 * จากเดิม (หลัง MergeMonk):
 *   0/1 → พระภิกษุ/นักบวช, 2 ทุพพลภาพ, 3 ตั้งครรภ์, 4 ผู้พิการรณ์, 5 ทั่วไป
 */
export class RemapPhysicalStatusToFiveTypes1789780343800 implements MigrationInterface {
  name = 'RemapPhysicalStatusToFiveTypes1789780343800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0 (monk) → 1 — ค่า 1 เดิมก็เป็น monk อยู่แล้วหลัง merge
    await queryRunner.query(`
      UPDATE \`EXAM_T_ENROLLMENTS\`
      SET \`ERM_PHYSICAL_STATUS\` = 1
      WHERE \`ERM_PHYSICAL_STATUS\` = 0
    `);

    // 4 (ผู้พิการรณ์) → 2 (บุคคลทุพพลภาพ)
    await queryRunner.query(`
      UPDATE \`EXAM_T_ENROLLMENTS\`
      SET \`ERM_PHYSICAL_STATUS\` = 2
      WHERE \`ERM_PHYSICAL_STATUS\` = 4
    `);

    // 5 (ทั่วไป) + มี passport → 4 (ชาวต่างชาติ)
    await queryRunner.query(`
      UPDATE \`EXAM_T_ENROLLMENTS\` e
      INNER JOIN \`BUU_GET_T_USER\` u ON u.\`USER_ID\` = e.\`USER_ID\`
      SET e.\`ERM_PHYSICAL_STATUS\` = 4
      WHERE e.\`ERM_PHYSICAL_STATUS\` = 5
        AND u.\`USER_PASSPORT_NO\` IS NOT NULL
        AND TRIM(u.\`USER_PASSPORT_NO\`) <> ''
    `);

    // ค่า 5 ที่เหลือ = ชาวไทย (ไม่ต้อง UPDATE)

    await queryRunner.query(`
      ALTER TABLE \`EXAM_T_ENROLLMENTS\`
      MODIFY COLUMN \`ERM_PHYSICAL_STATUS\` tinyint NOT NULL DEFAULT 5
      COMMENT 'สถานะทางกายภาพ/ข้อมูลผู้สมัคร (1: พระภิกษุ / นักบวช, 2: บุคคลทุพพลภาพ, 3: ผู้ตั้งครรภ์, 4: ชาวต่างชาติ, 5: ชาวไทย)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ย้อนกลับแบบประมาณการ (สูญเสียความต่าง ผู้พิการรณ์ / ชาวต่างชาติที่ไม่มี passport ชัดเจน)
    await queryRunner.query(`
      UPDATE \`EXAM_T_ENROLLMENTS\`
      SET \`ERM_PHYSICAL_STATUS\` = 5
      WHERE \`ERM_PHYSICAL_STATUS\` IN (4, 5)
    `);

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
}
