import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTestTakerToExamEnrollments1789780343173 implements MigrationInterface {
  name = 'AddTestTakerToExamEnrollments1789780343173';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\`
        ADD \`ERM_TEST_TAKER\` varchar(9) NULL COMMENT 'Exam test taker code'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\`
        DROP COLUMN \`ERM_TEST_TAKER\``,
    );
  }
}
