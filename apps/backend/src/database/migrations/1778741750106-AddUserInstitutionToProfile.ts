import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserInstitutionToProfile1778741750106 implements MigrationInterface {
  name = 'AddUserInstitutionToProfile1778741750106';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` ADD \`USER_INSTITUTION\` varchar(200) NULL COMMENT 'ชื่อสถานศึกษา' AFTER \`USER_FACULTY\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` DROP COLUMN \`USER_INSTITUTION\``,
    );
  }
}
