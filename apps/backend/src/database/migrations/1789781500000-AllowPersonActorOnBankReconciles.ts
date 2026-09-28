import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowPersonActorOnBankReconciles1789781500000 implements MigrationInterface {
  name = 'AllowPersonActorOnBankReconciles1789781500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`FIN_T_BANK_RECONCILES\`
      MODIFY \`CREATED_BY\` int(11) NULL COMMENT 'รหัสผู้สร้างฝั่งผู้สมัคร (Foreign Key)'
    `);

    if (
      !(await queryRunner.hasColumn(
        'FIN_T_BANK_RECONCILES',
        'CREATED_BY_PSN_ID',
      ))
    ) {
      await queryRunner.query(`
        ALTER TABLE \`FIN_T_BANK_RECONCILES\`
        ADD \`CREATED_BY_PSN_ID\` varchar(10)
          CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
          NULL COMMENT 'รหัสบุคลากรผู้สร้าง (Foreign Key)'
      `);
    }

    await queryRunner.query(`
      ALTER TABLE \`FIN_T_BANK_RECONCILES\`
      MODIFY \`CREATED_BY_PSN_ID\` varchar(10)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        NULL COMMENT 'รหัสบุคลากรผู้สร้าง (Foreign Key)'
    `);

    await this.createForeignKeyIfMissing(
      queryRunner,
      'FIN_T_BANK_RECONCILES',
      'FK_BANK_RECONCILES_CREATED_BY_PSN',
      `ALTER TABLE \`FIN_T_BANK_RECONCILES\`
       ADD CONSTRAINT \`FK_BANK_RECONCILES_CREATED_BY_PSN\`
       FOREIGN KEY (\`CREATED_BY_PSN_ID\`) REFERENCES \`MSG_T_PERSON\`(\`PSN_ID\`)
       ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`
      ALTER TABLE \`FIN_T_BANK_RECONCILE_EDIT_LOGS\`
      MODIFY \`CHANGED_BY\` int(11) NULL COMMENT 'รหัสผู้แก้ไขฝั่งผู้สมัคร (Foreign Key)'
    `);

    if (
      !(await queryRunner.hasColumn(
        'FIN_T_BANK_RECONCILE_EDIT_LOGS',
        'CHANGED_BY_PSN_ID',
      ))
    ) {
      await queryRunner.query(`
        ALTER TABLE \`FIN_T_BANK_RECONCILE_EDIT_LOGS\`
        ADD \`CHANGED_BY_PSN_ID\` varchar(10)
          CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
          NULL COMMENT 'รหัสบุคลากรผู้แก้ไข (Foreign Key)'
      `);
    }

    await queryRunner.query(`
      ALTER TABLE \`FIN_T_BANK_RECONCILE_EDIT_LOGS\`
      MODIFY \`CHANGED_BY_PSN_ID\` varchar(10)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        NULL COMMENT 'รหัสบุคลากรผู้แก้ไข (Foreign Key)'
    `);

    await this.createForeignKeyIfMissing(
      queryRunner,
      'FIN_T_BANK_RECONCILE_EDIT_LOGS',
      'FK_BANK_RECONCILE_EDIT_LOGS_CHANGED_BY_PSN',
      `ALTER TABLE \`FIN_T_BANK_RECONCILE_EDIT_LOGS\`
       ADD CONSTRAINT \`FK_BANK_RECONCILE_EDIT_LOGS_CHANGED_BY_PSN\`
       FOREIGN KEY (\`CHANGED_BY_PSN_ID\`) REFERENCES \`MSG_T_PERSON\`(\`PSN_ID\`)
       ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropForeignKeyIfExists(
      queryRunner,
      'FIN_T_BANK_RECONCILE_EDIT_LOGS',
      'FK_BANK_RECONCILE_EDIT_LOGS_CHANGED_BY_PSN',
    );
    if (
      await queryRunner.hasColumn(
        'FIN_T_BANK_RECONCILE_EDIT_LOGS',
        'CHANGED_BY_PSN_ID',
      )
    ) {
      await queryRunner.dropColumn(
        'FIN_T_BANK_RECONCILE_EDIT_LOGS',
        'CHANGED_BY_PSN_ID',
      );
    }

    await this.dropForeignKeyIfExists(
      queryRunner,
      'FIN_T_BANK_RECONCILES',
      'FK_BANK_RECONCILES_CREATED_BY_PSN',
    );
    if (
      await queryRunner.hasColumn('FIN_T_BANK_RECONCILES', 'CREATED_BY_PSN_ID')
    ) {
      await queryRunner.dropColumn(
        'FIN_T_BANK_RECONCILES',
        'CREATED_BY_PSN_ID',
      );
    }

    await queryRunner.query(`
      ALTER TABLE \`FIN_T_BANK_RECONCILE_EDIT_LOGS\`
      MODIFY \`CHANGED_BY\` int(11) NOT NULL COMMENT 'รหัสผู้แก้ไข (Foreign Key)'
    `);
    await queryRunner.query(`
      ALTER TABLE \`FIN_T_BANK_RECONCILES\`
      MODIFY \`CREATED_BY\` int(11) NOT NULL COMMENT 'รหัสผู้สร้าง (Foreign Key)'
    `);
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
