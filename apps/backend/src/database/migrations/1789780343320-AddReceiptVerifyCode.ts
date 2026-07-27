import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';
import { randomUUID } from 'crypto';

export class AddReceiptVerifyCode1789780343320 implements MigrationInterface {
  name = 'AddReceiptVerifyCode1789780343320';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'FIN_T_RECEIPTS';
    const columnName = 'RC_VERIFY_CODE';
    const indexName = 'UQ_RC_VERIFY_CODE';

    const hasColumn = await queryRunner.hasColumn(tableName, columnName);
    if (!hasColumn) {
      await queryRunner.addColumn(
        tableName,
        new TableColumn({
          name: columnName,
          type: 'varchar',
          length: '100',
          isNullable: true,
          comment: 'รหัสตรวจสอบใบเสร็จ',
        }),
      );
    }

    const rows = (await queryRunner.query(
      `SELECT RC_ID FROM \`${tableName}\` WHERE RC_VERIFY_CODE IS NULL OR RC_VERIFY_CODE = ''`,
    )) as { RC_ID: number }[];

    for (const row of rows) {
      const code = `RCP-${randomUUID().toUpperCase()}`;
      await queryRunner.query(
        `UPDATE \`${tableName}\` SET RC_VERIFY_CODE = ? WHERE RC_ID = ?`,
        [code, row.RC_ID],
      );
    }

    const column = (await queryRunner.getTable(tableName))?.findColumnByName(
      columnName,
    );
    if (column?.isNullable) {
      await queryRunner.changeColumn(
        tableName,
        columnName,
        new TableColumn({
          name: columnName,
          type: 'varchar',
          length: '100',
          isNullable: false,
          comment: 'รหัสตรวจสอบใบเสร็จ',
        }),
      );
    }

    const table = await queryRunner.getTable(tableName);
    const hasIndex = table?.indices.some(
      (index) =>
        index.name === indexName ||
        (index.isUnique && index.columnNames.includes(columnName)),
    );
    if (!hasIndex) {
      await queryRunner.createIndex(
        tableName,
        new TableIndex({
          name: indexName,
          columnNames: [columnName],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableName = 'FIN_T_RECEIPTS';
    const columnName = 'RC_VERIFY_CODE';
    const indexName = 'UQ_RC_VERIFY_CODE';

    const table = await queryRunner.getTable(tableName);
    if (table?.indices.some((index) => index.name === indexName)) {
      await queryRunner.dropIndex(tableName, indexName);
    }

    if (await queryRunner.hasColumn(tableName, columnName)) {
      await queryRunner.dropColumn(tableName, columnName);
    }
  }
}
