import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModifyUserPhysicalStatusToEnum1780563679447 implements MigrationInterface {
  name = 'ModifyUserPhysicalStatusToEnum1780563679447';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE \`BUU_GET_T_USER_PROFILE\` SET \`USER_PHYSICAL_STATUS\` = 'ทั่วไป' WHERE \`USER_PHYSICAL_STATUS\` IS NULL OR \`USER_PHYSICAL_STATUS\` NOT IN ('พระภิกษุ / สามเณร', 'นักบวช / ศาสนบุคคล', 'บุคคลทุพพลภาพ', 'ผู้ตั้งครรภ์', 'ผู้พิการรณ์', 'ทั่วไป')`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` MODIFY COLUMN \`USER_PHYSICAL_STATUS\` enum ('พระภิกษุ / สามเณร', 'นักบวช / ศาสนบุคคล', 'บุคคลทุพพลภาพ', 'ผู้ตั้งครรภ์', 'ผู้พิการรณ์', 'ทั่วไป') NOT NULL DEFAULT 'ทั่วไป' COMMENT 'สถานะทางกายภาพ/ข้อมูลผู้สมัคร เช่น พระภิกษุ / สามเณร, นักบวช / ศาสนบุคคล, บุคคลทุพพลภาพ, ผู้ตั้งครรภ์, ทั่วไป'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` MODIFY COLUMN \`USER_PHYSICAL_STATUS\` varchar(100) NULL COMMENT 'สถานะทางกายภาพ/ข้อมูลผู้สมัคร เช่น พระสงฆ์, ตั้งครรภ์'`,
    );
  }
}
