import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserCode1781158276463 implements MigrationInterface {
  name = 'AddUserCode1781158276463';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER\` ADD \`USER_CODE\` varchar(8) NULL COMMENT 'รหัสประจำตัว '`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER\` ADD UNIQUE INDEX \`IDX_f552b3f7ea60f44f509624b2af\` (\`USER_CODE\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER\` DROP INDEX \`IDX_f552b3f7ea60f44f509624b2af\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER\` DROP COLUMN \`USER_CODE\``,
    );
  }
}
