import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUserRemarkFromUserProfile1789780343156 implements MigrationInterface {
  name = 'DropUserRemarkFromUserProfile1789780343156';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` DROP COLUMN \`USER_REMARK\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` ADD \`USER_REMARK\` varchar(500) NULL COMMENT 'หมายเหตุถึงผู้สมัคร'`,
    );
  }
}
