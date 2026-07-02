import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestoreUserRemarkToUserProfile1789780343167 implements MigrationInterface {
  name = 'RestoreUserRemarkToUserProfile1789780343167';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` ADD \`USER_REMARK\` varchar(500) NULL COMMENT 'หมายเหตุถึงผู้สมัคร/แจ้งแก้ไขข้อมูล'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` DROP COLUMN \`USER_REMARK\``,
    );
  }
}
