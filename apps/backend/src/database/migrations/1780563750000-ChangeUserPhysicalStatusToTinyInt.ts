import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeUserPhysicalStatusToTinyInt1780563750000 implements MigrationInterface {
  name = 'ChangeUserPhysicalStatusToTinyInt1780563750000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Temporarily modify column to varchar to prepare for conversion
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` MODIFY COLUMN \`USER_PHYSICAL_STATUS\` varchar(100) NOT NULL DEFAULT '5'`,
    );

    // 2. Map existing string values to their corresponding number strings
    await queryRunner.query(
      `UPDATE \`BUU_GET_T_USER_PROFILE\` SET \`USER_PHYSICAL_STATUS\` = '0' WHERE \`USER_PHYSICAL_STATUS\` = 'พระภิกษุ / สามเณร'`,
    );
    await queryRunner.query(
      `UPDATE \`BUU_GET_T_USER_PROFILE\` SET \`USER_PHYSICAL_STATUS\` = '1' WHERE \`USER_PHYSICAL_STATUS\` = 'นักบวช / ศาสนบุคคล'`,
    );
    await queryRunner.query(
      `UPDATE \`BUU_GET_T_USER_PROFILE\` SET \`USER_PHYSICAL_STATUS\` = '2' WHERE \`USER_PHYSICAL_STATUS\` = 'บุคคลทุพพลภาพ'`,
    );
    await queryRunner.query(
      `UPDATE \`BUU_GET_T_USER_PROFILE\` SET \`USER_PHYSICAL_STATUS\` = '3' WHERE \`USER_PHYSICAL_STATUS\` = 'ผู้ตั้งครรภ์'`,
    );
    await queryRunner.query(
      `UPDATE \`BUU_GET_T_USER_PROFILE\` SET \`USER_PHYSICAL_STATUS\` = '4' WHERE \`USER_PHYSICAL_STATUS\` = 'ผู้พิการรณ์'`,
    );
    await queryRunner.query(
      `UPDATE \`BUU_GET_T_USER_PROFILE\` SET \`USER_PHYSICAL_STATUS\` = '5' WHERE \`USER_PHYSICAL_STATUS\` NOT IN ('0', '1', '2', '3', '4')`,
    );

    // 3. Alter the column to tinyint
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` MODIFY COLUMN \`USER_PHYSICAL_STATUS\` tinyint NOT NULL DEFAULT 5 COMMENT '0: พระภิกษุ / สามเณร, 1: นักบวช / ศาสนบุคคล, 2: บุคคลทุพพลภาพ, 3: ผู้ตั้งครรภ์, 4: ผู้พิการรณ์, 5: ทั่วไป'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Temporarily modify column to varchar to prepare for conversion
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` MODIFY COLUMN \`USER_PHYSICAL_STATUS\` varchar(100) NOT NULL DEFAULT 'ทั่วไป'`,
    );

    // 2. Map numeric strings back to the original string values
    await queryRunner.query(
      `UPDATE \`BUU_GET_T_USER_PROFILE\` SET \`USER_PHYSICAL_STATUS\` = 'พระภิกษุ / สามเณร' WHERE \`USER_PHYSICAL_STATUS\` = '0'`,
    );
    await queryRunner.query(
      `UPDATE \`BUU_GET_T_USER_PROFILE\` SET \`USER_PHYSICAL_STATUS\` = 'นักบวช / ศาสนบุคคล' WHERE \`USER_PHYSICAL_STATUS\` = '1'`,
    );
    await queryRunner.query(
      `UPDATE \`BUU_GET_T_USER_PROFILE\` SET \`USER_PHYSICAL_STATUS\` = 'บุคคลทุพพลภาพ' WHERE \`USER_PHYSICAL_STATUS\` = '2'`,
    );
    await queryRunner.query(
      `UPDATE \`BUU_GET_T_USER_PROFILE\` SET \`USER_PHYSICAL_STATUS\` = 'ผู้ตั้งครรภ์' WHERE \`USER_PHYSICAL_STATUS\` = '3'`,
    );
    await queryRunner.query(
      `UPDATE \`BUU_GET_T_USER_PROFILE\` SET \`USER_PHYSICAL_STATUS\` = 'ผู้พิการรณ์' WHERE \`USER_PHYSICAL_STATUS\` = '4'`,
    );
    await queryRunner.query(
      `UPDATE \`BUU_GET_T_USER_PROFILE\` SET \`USER_PHYSICAL_STATUS\` = 'ทั่วไป' WHERE \`USER_PHYSICAL_STATUS\` NOT IN ('พระภิกษุ / สามเณร', 'นักบวช / ศาสนบุคคล', 'บุคคลทุพพลภาพ', 'ผู้ตั้งครกรรภ์', 'ผู้พิการรณ์')`,
    );

    // 3. Alter column back to enum
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` MODIFY COLUMN \`USER_PHYSICAL_STATUS\` enum ('พระภิกษุ / สามเณร', 'นักบวช / ศาสนบุคคล', 'บุคคลทุพพลภาพ', 'ผู้ตั้งครรภ์', 'ผู้พิการรณ์', 'ทั่วไป') NOT NULL DEFAULT 'ทั่วไป' COMMENT 'สถานะทางกายภาพ/ข้อมูลผู้สมัคร เช่น พระภิกษุ / สามเณร, นักบวช / ศาสนบุคคล, บุคคลทุพพลภาพ, ผู้ตั้งครรภ์, ทั่วไป'`,
    );
  }
}
