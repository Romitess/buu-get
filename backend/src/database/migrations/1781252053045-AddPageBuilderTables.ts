import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPageBuilderTables1781252053045 implements MigrationInterface {
  name = 'AddPageBuilderTables1781252053045';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`BUU_GET_T_PAGE_CONFIGS\` (\`PCF_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสชุดหน้า', \`PCF_NAME\` varchar(255) NOT NULL COMMENT 'ชื่อชุดหน้า เช่น Set A, Set B', \`PCF_ACTIVE\` tinyint NOT NULL COMMENT 'ชุดที่เปิดใช้งาน (เปิดได้ครั้งละ 1 ชุด)' DEFAULT 0, \`PCF_CONTENT\` json NULL COMMENT 'โครงสร้าง sections + boxes ทั้งหมดของหน้า', \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไขล่าสุด' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)', PRIMARY KEY (\`PCF_ID\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`BUU_GET_T_PAGE_CONFIGS\``);
  }
}
