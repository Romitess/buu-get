import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPsnIdcardToMsgTPerson1789780345600 implements MigrationInterface {
  name = 'AddPsnIdcardToMsgTPerson1789780345600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await this.columnExists(queryRunner);
    if (!exists) {
      await queryRunner.query(`
        ALTER TABLE \`MSG_T_PERSON\`
        ADD COLUMN \`PSN_IDCARD\` varchar(13) NULL COMMENT 'หมายเลขบัตรประชาชน 13 หลัก'
        AFTER \`PSN_EMAIL_BUU\`
      `);
    }

    const indexExists = await this.indexExists(queryRunner);
    if (!indexExists) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`UQ_MSG_T_PERSON_PSN_IDCARD\`
        ON \`MSG_T_PERSON\` (\`PSN_IDCARD\`)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const indexExists = await this.indexExists(queryRunner);
    if (indexExists) {
      await queryRunner.query(
        `DROP INDEX \`UQ_MSG_T_PERSON_PSN_IDCARD\` ON \`MSG_T_PERSON\``,
      );
    }

    const exists = await this.columnExists(queryRunner);
    if (exists) {
      await queryRunner.query(`
        ALTER TABLE \`MSG_T_PERSON\`
        DROP COLUMN \`PSN_IDCARD\`
      `);
    }
  }

  private async columnExists(queryRunner: QueryRunner): Promise<boolean> {
    const rows = (await queryRunner.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
      ['MSG_T_PERSON', 'PSN_IDCARD'],
    )) as unknown[];
    return rows.length > 0;
  }

  private async indexExists(queryRunner: QueryRunner): Promise<boolean> {
    const rows = (await queryRunner.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
      ['MSG_T_PERSON', 'UQ_MSG_T_PERSON_PSN_IDCARD'],
    )) as unknown[];
    return rows.length > 0;
  }
}
