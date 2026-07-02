import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePageConfigSets1789780343200 implements MigrationInterface {
  name = 'RemovePageConfigSets1789780343200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // เอาแนวคิด "ชุดหน้า" ออก เหลือหน้าเดียวทั้งระบบ
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_PAGE_CONFIGS\` DROP COLUMN \`PCF_NAME\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_PAGE_CONFIGS\` DROP COLUMN \`PCF_ACTIVE\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_PAGE_CONFIGS\` ADD \`PCF_ACTIVE\` tinyint NOT NULL COMMENT 'ชุดที่เปิดใช้งาน (เปิดได้ครั้งละ 1 ชุด)' DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_PAGE_CONFIGS\` ADD \`PCF_NAME\` varchar(255) NOT NULL COMMENT 'ชื่อชุดหน้า เช่น Set A, Set B' DEFAULT ''`,
    );
  }
}
