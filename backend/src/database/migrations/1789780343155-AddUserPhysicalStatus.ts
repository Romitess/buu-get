import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPhysicalStatus1789780343155 implements MigrationInterface {
  name = 'AddUserPhysicalStatus1789780343155';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` ADD \`USER_PHYSICAL_STATUS\` varchar(100) NULL COMMENT 'สถานะทางกายภาพ/ข้อมูลผู้สมัคร เช่น พระสงฆ์, ตั้งครรภ์'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` DROP COLUMN \`USER_PHYSICAL_STATUS\``,
    );
  }
}
