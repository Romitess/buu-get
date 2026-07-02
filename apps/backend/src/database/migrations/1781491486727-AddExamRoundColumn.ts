import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExamRoundColumn1781491486727 implements MigrationInterface {
  name = 'AddExamRoundColumn1781491486727';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` ADD \`EXAM_ROUND\` varchar(20) NULL COMMENT 'รอบการสอบ' AFTER \`EXAM_NAME\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` DROP COLUMN \`EXAM_ROUND\``,
    );
  }
}
