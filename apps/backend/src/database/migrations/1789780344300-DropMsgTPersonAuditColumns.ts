import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropMsgTPersonAuditColumns1789780344300 implements MigrationInterface {
  name = 'DropMsgTPersonAuditColumns1789780344300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'MSG_T_PERSON';

    if (await queryRunner.hasColumn(tableName, 'DELETED_AT')) {
      await queryRunner.query(
        `ALTER TABLE \`MSG_T_PERSON\` DROP COLUMN \`DELETED_AT\``,
      );
    }

    if (await queryRunner.hasColumn(tableName, 'UPDATED_AT')) {
      await queryRunner.query(
        `ALTER TABLE \`MSG_T_PERSON\` DROP COLUMN \`UPDATED_AT\``,
      );
    }

    if (await queryRunner.hasColumn(tableName, 'CREATED_AT')) {
      await queryRunner.query(
        `ALTER TABLE \`MSG_T_PERSON\` DROP COLUMN \`CREATED_AT\``,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'MSG_T_PERSON';

    if (!(await queryRunner.hasColumn(tableName, 'CREATED_AT'))) {
      await queryRunner.query(`
        ALTER TABLE \`MSG_T_PERSON\`
          ADD \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6)
      `);
    }

    if (!(await queryRunner.hasColumn(tableName, 'UPDATED_AT'))) {
      await queryRunner.query(`
        ALTER TABLE \`MSG_T_PERSON\`
          ADD \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไขล่าสุด' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
      `);
    }

    if (!(await queryRunner.hasColumn(tableName, 'DELETED_AT'))) {
      await queryRunner.query(`
        ALTER TABLE \`MSG_T_PERSON\`
          ADD \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)'
      `);
    }
  }
}
