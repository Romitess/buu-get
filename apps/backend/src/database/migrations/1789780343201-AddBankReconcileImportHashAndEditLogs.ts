import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class AddBankReconcileImportHashAndEditLogs1789780343201 implements MigrationInterface {
  name = 'AddBankReconcileImportHashAndEditLogs1789780343201';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasImportKeyHash = await queryRunner.hasColumn(
      'FIN_T_BANK_RECONCILES',
      'BR_IMPORT_KEY_HASH',
    );

    if (!hasImportKeyHash) {
      await queryRunner.addColumn(
        'FIN_T_BANK_RECONCILES',
        new TableColumn({
          name: 'BR_IMPORT_KEY_HASH',
          type: 'varchar',
          length: '64',
          isNullable: true,
          comment: 'Hash สำหรับตรวจสอบรายการนำเข้าซ้ำจากไฟล์ธนาคาร',
        }),
      );
    }

    await queryRunner.query(`
      UPDATE \`FIN_T_BANK_RECONCILES\`
      SET \`BR_IMPORT_KEY_HASH\` = SHA2(
        CONCAT_WS(
          '|',
          LOWER(TRIM(COALESCE(\`BR_REF1\`, ''))),
          LOWER(TRIM(COALESCE(\`BR_REF2\`, ''))),
          LOWER(TRIM(COALESCE(\`BR_REF3\`, ''))),
          LOWER(TRIM(COALESCE(\`BR_REF4\`, ''))),
          CAST(CAST(ROUND(COALESCE(\`BR_AMOUNT\`, 0) * 100) AS SIGNED) AS CHAR),
          LOWER(TRIM(COALESCE(\`BR_PAID_BY\`, '')))
        ),
        256
      )
      WHERE \`BR_IMPORT_KEY_HASH\` IS NULL
    `);

    await this.createIndexIfMissing(
      queryRunner,
      'FIN_T_BANK_RECONCILES',
      'IDX_BANK_RECONCILES_IMPORT_KEY_HASH',
      'CREATE INDEX `IDX_BANK_RECONCILES_IMPORT_KEY_HASH` ON `FIN_T_BANK_RECONCILES` (`BR_IMPORT_KEY_HASH`)',
    );

    const hasEditLogTable = await queryRunner.hasTable(
      'FIN_T_BANK_RECONCILE_EDIT_LOGS',
    );

    if (!hasEditLogTable) {
      await queryRunner.createTable(
        new Table({
          name: 'FIN_T_BANK_RECONCILE_EDIT_LOGS',
          columns: [
            {
              name: 'BREL_ID',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
              comment: 'รหัสประวัติการแก้ไขรายการกระทบยอดธนาคาร',
            },
            {
              name: 'BR_ID',
              type: 'int',
              isNullable: false,
              comment: 'รหัส Bank Reconcile (Foreign Key)',
            },
            {
              name: 'CHANGED_BY',
              type: 'int',
              isNullable: false,
              comment: 'รหัสผู้แก้ไข (Foreign Key)',
            },
            {
              name: 'OLD_SNAPSHOT',
              type: 'json',
              isNullable: false,
              comment: 'ข้อมูลก่อนแก้ไข',
            },
            {
              name: 'NEW_SNAPSHOT',
              type: 'json',
              isNullable: false,
              comment: 'ข้อมูลหลังแก้ไข',
            },
            {
              name: 'CHANGED_FIELDS',
              type: 'json',
              isNullable: false,
              comment: 'รายชื่อ field ที่เปลี่ยนแปลง',
            },
            {
              name: 'CHANGE_REASON',
              type: 'text',
              isNullable: true,
              comment: 'เหตุผลการแก้ไข',
            },
            {
              name: 'CREATED_AT',
              type: 'datetime',
              precision: 6,
              default: 'CURRENT_TIMESTAMP(6)',
              isNullable: false,
              comment: 'วันที่สร้าง',
            },
            {
              name: 'UPDATED_AT',
              type: 'datetime',
              precision: 6,
              default: 'CURRENT_TIMESTAMP(6)',
              onUpdate: 'CURRENT_TIMESTAMP(6)',
              isNullable: false,
              comment: 'วันที่แก้ไขล่าสุด',
            },
            {
              name: 'DELETED_AT',
              type: 'datetime',
              precision: 6,
              isNullable: true,
              comment: 'วันที่ลบ (Soft Delete)',
            },
          ],
        }),
      );
    }

    await this.createIndexIfMissing(
      queryRunner,
      'FIN_T_BANK_RECONCILE_EDIT_LOGS',
      'IDX_BANK_RECONCILE_EDIT_LOGS_BR_ID',
      'CREATE INDEX `IDX_BANK_RECONCILE_EDIT_LOGS_BR_ID` ON `FIN_T_BANK_RECONCILE_EDIT_LOGS` (`BR_ID`)',
    );
    await this.createIndexIfMissing(
      queryRunner,
      'FIN_T_BANK_RECONCILE_EDIT_LOGS',
      'IDX_BANK_RECONCILE_EDIT_LOGS_CHANGED_BY',
      'CREATE INDEX `IDX_BANK_RECONCILE_EDIT_LOGS_CHANGED_BY` ON `FIN_T_BANK_RECONCILE_EDIT_LOGS` (`CHANGED_BY`)',
    );
    await this.createForeignKeyIfMissing(
      queryRunner,
      'FIN_T_BANK_RECONCILE_EDIT_LOGS',
      'FK_BANK_RECONCILE_EDIT_LOGS_BR_ID',
      `ALTER TABLE \`FIN_T_BANK_RECONCILE_EDIT_LOGS\`
       ADD CONSTRAINT \`FK_BANK_RECONCILE_EDIT_LOGS_BR_ID\`
       FOREIGN KEY (\`BR_ID\`) REFERENCES \`FIN_T_BANK_RECONCILES\`(\`BR_ID\`)
       ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await this.createForeignKeyIfMissing(
      queryRunner,
      'FIN_T_BANK_RECONCILE_EDIT_LOGS',
      'FK_BANK_RECONCILE_EDIT_LOGS_CHANGED_BY',
      `ALTER TABLE \`FIN_T_BANK_RECONCILE_EDIT_LOGS\`
       ADD CONSTRAINT \`FK_BANK_RECONCILE_EDIT_LOGS_CHANGED_BY\`
       FOREIGN KEY (\`CHANGED_BY\`) REFERENCES \`BUU_GET_T_USER\`(\`USER_ID\`)
       ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropForeignKeyIfExists(
      queryRunner,
      'FIN_T_BANK_RECONCILE_EDIT_LOGS',
      'FK_BANK_RECONCILE_EDIT_LOGS_CHANGED_BY',
    );
    await this.dropForeignKeyIfExists(
      queryRunner,
      'FIN_T_BANK_RECONCILE_EDIT_LOGS',
      'FK_BANK_RECONCILE_EDIT_LOGS_BR_ID',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'FIN_T_BANK_RECONCILE_EDIT_LOGS',
      'IDX_BANK_RECONCILE_EDIT_LOGS_CHANGED_BY',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'FIN_T_BANK_RECONCILE_EDIT_LOGS',
      'IDX_BANK_RECONCILE_EDIT_LOGS_BR_ID',
    );

    if (await queryRunner.hasTable('FIN_T_BANK_RECONCILE_EDIT_LOGS')) {
      await queryRunner.dropTable('FIN_T_BANK_RECONCILE_EDIT_LOGS');
    }

    await this.dropIndexIfExists(
      queryRunner,
      'FIN_T_BANK_RECONCILES',
      'IDX_BANK_RECONCILES_IMPORT_KEY_HASH',
    );

    if (
      await queryRunner.hasColumn('FIN_T_BANK_RECONCILES', 'BR_IMPORT_KEY_HASH')
    ) {
      await queryRunner.dropColumn(
        'FIN_T_BANK_RECONCILES',
        'BR_IMPORT_KEY_HASH',
      );
    }
  }

  private async createIndexIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
    createSql: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (table?.indices.some((index) => index.name === indexName)) {
      return;
    }

    await queryRunner.query(createSql);
  }

  private async createForeignKeyIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    foreignKeyName: string,
    createSql: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (
      table?.foreignKeys.some(
        (foreignKey) => foreignKey.name === foreignKeyName,
      )
    ) {
      return;
    }

    await queryRunner.query(createSql);
  }

  private async dropIndexIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table?.indices.some((index) => index.name === indexName)) {
      return;
    }

    await queryRunner.query(`DROP INDEX \`${indexName}\` ON \`${tableName}\``);
  }

  private async dropForeignKeyIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    foreignKeyName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (
      !table?.foreignKeys.some(
        (foreignKey) => foreignKey.name === foreignKeyName,
      )
    ) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${foreignKeyName}\``,
    );
  }
}
