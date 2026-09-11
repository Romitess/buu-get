import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPsnUsernameToMsgTPerson1789780345400 implements MigrationInterface {
  name = 'AddPsnUsernameToMsgTPerson1789780345400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await this.columnExists(queryRunner);
    if (exists) {
      await queryRunner.query(`
        ALTER TABLE \`MSG_T_PERSON\`
        MODIFY COLUMN \`PSN_USERNAME\` varchar(50) NULL COMMENT 'ชื่อผู้ใช้' AFTER \`PSN_TECHNIQUE\`
      `);
      return;
    }

    await queryRunner.query(`
      ALTER TABLE \`MSG_T_PERSON\`
      ADD COLUMN \`PSN_USERNAME\` varchar(50) NULL COMMENT 'ชื่อผู้ใช้' AFTER \`PSN_TECHNIQUE\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await this.columnExists(queryRunner);
    if (!exists) {
      return;
    }
    await queryRunner.query(`
      ALTER TABLE \`MSG_T_PERSON\`
      DROP COLUMN \`PSN_USERNAME\`
    `);
  }

  private async columnExists(queryRunner: QueryRunner): Promise<boolean> {
    const rows = (await queryRunner.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
      ['MSG_T_PERSON', 'PSN_USERNAME'],
    )) as unknown[];
    return rows.length > 0;
  }
}
