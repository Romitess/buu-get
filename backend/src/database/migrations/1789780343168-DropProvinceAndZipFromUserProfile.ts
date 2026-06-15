import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropProvinceAndZipFromUserProfile1789780343168 implements MigrationInterface {
  name = 'DropProvinceAndZipFromUserProfile1789780343168';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` DROP COLUMN \`USER_ZIP_CODE\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` DROP COLUMN \`USER_PROVINCE\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` ADD \`USER_PROVINCE\` varchar(200) NULL COMMENT 'จังหวัด'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` ADD \`USER_ZIP_CODE\` varchar(10) NULL COMMENT 'รหัสไปรษณีย์'`,
    );
  }
}
