import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceProctorUserIdWithPsnId1789780345700 implements MigrationInterface {
  name = 'ReplaceProctorUserIdWithPsnId1789780345700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM \`EXAM_T_SESSION_LOCATION_PROCTORS\``);

    await this.dropForeignKeyIfExists(queryRunner, 'FK_SLP_PSN_ID');
    await this.dropIndexIfExists(queryRunner, 'UQ_SLP_SL_USER');
    await this.dropIndexIfExists(queryRunner, 'IDX_SLP_USER_ID');

    if (await this.columnExists(queryRunner, 'USER_ID')) {
      await queryRunner.query(
        `ALTER TABLE \`EXAM_T_SESSION_LOCATION_PROCTORS\` DROP COLUMN \`USER_ID\``,
      );
    }

    await queryRunner.query(`
      ALTER TABLE \`EXAM_T_SESSION_LOCATION_PROCTORS\`
      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
    `);

    if (await this.columnExists(queryRunner, 'PSN_ID')) {
      await queryRunner.query(`
        ALTER TABLE \`EXAM_T_SESSION_LOCATION_PROCTORS\`
        MODIFY \`PSN_ID\` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
          NOT NULL COMMENT 'รหัสบุคลากรผู้คุมสอบ (FK)'
      `);
    } else {
      await queryRunner.query(`
        ALTER TABLE \`EXAM_T_SESSION_LOCATION_PROCTORS\`
        ADD \`PSN_ID\` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
          NOT NULL COMMENT 'รหัสบุคลากรผู้คุมสอบ (FK)'
      `);
    }

    if (!(await this.indexExists(queryRunner, 'UQ_SLP_SL_PSN'))) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`UQ_SLP_SL_PSN\`
          ON \`EXAM_T_SESSION_LOCATION_PROCTORS\` (\`SL_ID\`, \`PSN_ID\`)
      `);
    }
    if (!(await this.indexExists(queryRunner, 'IDX_SLP_PSN_ID'))) {
      await queryRunner.query(`
        CREATE INDEX \`IDX_SLP_PSN_ID\`
          ON \`EXAM_T_SESSION_LOCATION_PROCTORS\` (\`PSN_ID\`)
      `);
    }
    if (!(await this.foreignKeyExists(queryRunner, 'FK_SLP_PSN_ID'))) {
      await queryRunner.query(`
        ALTER TABLE \`EXAM_T_SESSION_LOCATION_PROCTORS\`
        ADD CONSTRAINT \`FK_SLP_PSN_ID\`
        FOREIGN KEY (\`PSN_ID\`) REFERENCES \`MSG_T_PERSON\`(\`PSN_ID\`)
        ON DELETE RESTRICT ON UPDATE CASCADE
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM \`EXAM_T_SESSION_LOCATION_PROCTORS\``);
    await this.dropForeignKeyIfExists(queryRunner, 'FK_SLP_PSN_ID');
    await this.dropIndexIfExists(queryRunner, 'IDX_SLP_PSN_ID');
    await this.dropIndexIfExists(queryRunner, 'UQ_SLP_SL_PSN');

    if (await this.columnExists(queryRunner, 'PSN_ID')) {
      await queryRunner.query(
        `ALTER TABLE \`EXAM_T_SESSION_LOCATION_PROCTORS\` DROP COLUMN \`PSN_ID\``,
      );
    }

    if (!(await this.columnExists(queryRunner, 'USER_ID'))) {
      await queryRunner.query(`
        ALTER TABLE \`EXAM_T_SESSION_LOCATION_PROCTORS\`
          ADD \`USER_ID\` int NOT NULL COMMENT 'รหัสผู้ใช้ผู้คุมสอบ (FK)'
      `);
    }
    if (!(await this.indexExists(queryRunner, 'UQ_SLP_SL_USER'))) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`UQ_SLP_SL_USER\`
          ON \`EXAM_T_SESSION_LOCATION_PROCTORS\` (\`SL_ID\`, \`USER_ID\`)
      `);
    }
    if (!(await this.indexExists(queryRunner, 'IDX_SLP_USER_ID'))) {
      await queryRunner.query(`
        CREATE INDEX \`IDX_SLP_USER_ID\`
          ON \`EXAM_T_SESSION_LOCATION_PROCTORS\` (\`USER_ID\`)
      `);
    }
  }

  private async columnExists(
    queryRunner: QueryRunner,
    columnName: string,
  ): Promise<boolean> {
    const rows = (await queryRunner.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
      ['EXAM_T_SESSION_LOCATION_PROCTORS', columnName],
    )) as unknown[];
    return rows.length > 0;
  }

  private async indexExists(
    queryRunner: QueryRunner,
    indexName: string,
  ): Promise<boolean> {
    const rows = (await queryRunner.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
      ['EXAM_T_SESSION_LOCATION_PROCTORS', indexName],
    )) as unknown[];
    return rows.length > 0;
  }

  private async foreignKeyExists(
    queryRunner: QueryRunner,
    constraintName: string,
  ): Promise<boolean> {
    const rows = (await queryRunner.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
         AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY' LIMIT 1`,
      ['EXAM_T_SESSION_LOCATION_PROCTORS', constraintName],
    )) as unknown[];
    return rows.length > 0;
  }

  private async dropIndexIfExists(
    queryRunner: QueryRunner,
    indexName: string,
  ): Promise<void> {
    if (await this.indexExists(queryRunner, indexName)) {
      await queryRunner.query(
        `DROP INDEX \`${indexName}\` ON \`EXAM_T_SESSION_LOCATION_PROCTORS\``,
      );
    }
  }

  private async dropForeignKeyIfExists(
    queryRunner: QueryRunner,
    constraintName: string,
  ): Promise<void> {
    if (await this.foreignKeyExists(queryRunner, constraintName)) {
      await queryRunner.query(
        `ALTER TABLE \`EXAM_T_SESSION_LOCATION_PROCTORS\` DROP FOREIGN KEY \`${constraintName}\``,
      );
    }
  }
}
