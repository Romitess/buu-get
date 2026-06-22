import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterAttendanceStatusToTinyint1789780343183 implements MigrationInterface {
  name = 'AlterAttendanceStatusToTinyint1789780343183';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Temporarily modify column to varchar to safely convert data
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ATTENDANCES\` MODIFY COLUMN \`ATTEND_STATUS\` varchar(20) NOT NULL DEFAULT '0'`,
    );

    // 2. Map enum strings to numeric equivalents
    await queryRunner.query(
      `UPDATE \`EXAM_T_ATTENDANCES\` SET \`ATTEND_STATUS\` = '0' WHERE \`ATTEND_STATUS\` NOT IN ('0', '1')`,
    );

    // 3. Alter the column to tinyint
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ATTENDANCES\` MODIFY COLUMN \`ATTEND_STATUS\` tinyint NOT NULL DEFAULT '0' COMMENT 'สถานะการเข้าสอบ (0:MISSING, 1:INTIME)'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Temporarily modify column to varchar
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ATTENDANCES\` MODIFY COLUMN \`ATTEND_STATUS\` varchar(20) NOT NULL DEFAULT '0'`,
    );

    // 2. Map numeric values back to enum strings
    await queryRunner.query(
      `UPDATE \`EXAM_T_ATTENDANCES\` SET \`ATTEND_STATUS\` = '0' WHERE \`ATTEND_STATUS\` = '0'`,
    );
    await queryRunner.query(
      `UPDATE \`EXAM_T_ATTENDANCES\` SET \`ATTEND_STATUS\` = '1' WHERE \`ATTEND_STATUS\` = '1'`,
    );

    // 3. Alter column back to enum
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ATTENDANCES\` MODIFY COLUMN \`ATTEND_STATUS\` enum('0', '1') NOT NULL DEFAULT '0' COMMENT 'สถานะการเข้าสอบ (0:MISSING, 1:INTIME)'`,
    );
  }
}
