import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropFsFacultyFromFundSources1789780343270 implements MigrationInterface {
  name = 'DropFsFacultyFromFundSources1789780343270';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_FUND_SOURCES\` DROP COLUMN \`FS_FACULTY\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_FUND_SOURCES\` ADD \`FS_FACULTY\` varchar(50) NOT NULL DEFAULT '' COMMENT 'คณะ'`,
    );
  }
}
