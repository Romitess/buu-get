import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveSsNameFromSessions1781166643041 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` DROP COLUMN \`SS_NAME\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` ADD \`SS_NAME\` varchar(100) NULL COMMENT 'ชื่อกรรมการคุมสอบ / ชื่อรอบสอบ'`,
    );
  }
}
