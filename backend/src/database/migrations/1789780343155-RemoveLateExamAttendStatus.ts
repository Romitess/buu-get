import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLateExamAttendStatus1789780343155 implements MigrationInterface {
  name = 'RemoveLateExamAttendStatus1789780343155';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE \`EXAM_T_ATTENDANCES\` SET \`ATTEND_STATUS\` = 1 WHERE \`ATTEND_STATUS\` = 2`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ATTENDANCES\` CHANGE \`ATTEND_STATUS\` \`ATTEND_STATUS\` tinyint NOT NULL COMMENT 'สถานะการเข้าสอบ (0:MISSING, 1:INTIME)' DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ATTENDANCES\` CHANGE \`ATTEND_STATUS\` \`ATTEND_STATUS\` tinyint NOT NULL COMMENT 'สถานะการเข้าสอบ (0:MISSING, 1:INTIME)' DEFAULT '0'`,
    );
  }
}
