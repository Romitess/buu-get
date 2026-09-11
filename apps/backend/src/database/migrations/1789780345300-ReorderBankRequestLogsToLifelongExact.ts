import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * บังคับลำดับ + ชนิดคอลัมน์ FIN_T_REQUEST_* ให้ตรง lifelong_dev.sql อีกครั้ง
 * (กรณี DB รัน Align เวอร์ชันเก่าที่ ADD COLUMN AFTER แล้วไม่ reorder)
 */
export class ReorderBankRequestLogsToLifelongExact1789780345300
  implements MigrationInterface
{
  name = 'ReorderBankRequestLogsToLifelongExact1789780345300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.rebuildApproval(queryRunner);
    await this.rebuildPayment(queryRunner);
  }

  public async down(): Promise<void> {
    // no-op
  }

  private async rebuildApproval(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('FIN_T_REQUEST_APPROVAL'))) {
      return;
    }

    await queryRunner.query(`DROP TABLE IF EXISTS \`FIN_T_REQUEST_APPROVAL__NEW\``);
    await queryRunner.query(`
      CREATE TABLE \`FIN_T_REQUEST_APPROVAL__NEW\` (
        \`ID\` int NOT NULL AUTO_INCREMENT COMMENT 'Auto ID',
        \`REF1\` varchar(20) NULL COMMENT 'Reference1',
        \`REF2\` varchar(20) NULL COMMENT 'Reference2',
        \`TRANXID\` varchar(20) NULL COMMENT 'Transaction number from Partner',
        \`USER\` varchar(20) NULL COMMENT 'User for webservice',
        \`PASSWORD\` varchar(20) NULL COMMENT 'Password for webservice',
        \`COMCODE\` varchar(10) NULL COMMENT 'Company Code ( KTB ตกลงร่วมกับ Direct Link Partner (1010))',
        \`PRODCODE\` varchar(10) NULL COMMENT 'Product Code (KTB ตกลงร่วมกับ Direct Link Partner (1010))',
        \`COMMAND\` varchar(20) NULL COMMENT 'Process Function (Fix=Approval)',
        \`BANKCODE\` int NULL COMMENT 'Bank Code(6)',
        \`BANKREF\` varchar(20) NULL COMMENT 'Reference transaction from bank  (K00002 00004392)',
        \`DATETIME\` varchar(14) NULL COMMENT 'Transaction DateTime  (yyyyMMddHHmmss(ปี ค.ศ. ) 20180601180029)',
        \`EFFDATE\` varchar(8) NULL COMMENT 'Settlement Date for Reconciliation ( yyyyMMdd (ปี ค.ศ.)  20180601)',
        \`AMOUNT\` decimal(18,2) NULL COMMENT 'Amount (500.00)',
        \`CHANNEL\` varchar(20) NULL COMMENT 'Channel of transaction (2)',
        \`CUSNAME\` varchar(60) NULL COMMENT 'Customer Name',
        \`INFO\` varchar(50) NULL COMMENT 'information',
        \`REF3\` varchar(20) NULL COMMENT 'Reference3',
        \`REF4\` varchar(20) NULL COMMENT 'Reference4',
        \`RESPCODE\` int NULL COMMENT 'Response code',
        \`RESPMSG\` varchar(100) NULL COMMENT 'Response message',
        \`BALANCE\` decimal(18,2) NULL COMMENT 'Cash balance from Partner',
        \`PRINT1\` varchar(40) NULL COMMENT 'เป็นฟิลด์ที่ใช้สำหรับส่ง data อื่นๆ ที่ต้องการแสดงบน slip',
        \`PRINT2\` varchar(40) NULL COMMENT 'เป็นฟิลด์ที่ใช้สำหรับส่ง data อื่นๆ ที่ต้องการแสดงบน slip',
        \`PRINT3\` varchar(40) NULL COMMENT 'เป็นฟิลด์ที่ใช้สำหรับส่ง data อื่นๆ ที่ต้องการแสดงบน slip',
        \`PRINT4\` varchar(40) NULL COMMENT 'เป็นฟิลด์ที่ใช้สำหรับส่ง data อื่นๆ ที่ต้องการแสดงบน slip',
        \`PRINT5\` varchar(40) NULL COMMENT 'เป็นฟิลด์ที่ใช้สำหรับส่ง data อื่นๆ ที่ต้องการแสดงบน slip',
        \`PRINT6\` varchar(40) NULL COMMENT 'เป็นฟิลด์ที่ใช้สำหรับส่ง data อื่นๆ ที่ต้องการแสดงบน slip',
        \`PRINT7\` varchar(40) NULL COMMENT 'เป็นฟิลด์ที่ใช้สำหรับส่ง data อื่นๆ ที่ต้องการแสดงบน slip',
        \`REQUEST_DATA\` varchar(4000) NULL COMMENT 'ข้อมูลที่รับหรือตอบกลับ',
        \`CREATEDATE\` datetime NULL COMMENT 'วันที่สร้างข้อมูล',
        \`SHOW_MSG\` varchar(1) NULL COMMENT 'สถานะการแสดงผล',
        PRIMARY KEY (\`ID\`),
        INDEX \`IDX_REQ_APPROVAL_REF12\` (\`REF1\`, \`REF2\`),
        INDEX \`IDX_REQ_APPROVAL_BANKREF\` (\`BANKREF\`),
        INDEX \`IDX_REQ_APPROVAL_TRANXID\` (\`TRANXID\`)
      ) ENGINE=InnoDB COMMENT='Request Approval'
    `);

    await this.copyByName(queryRunner, 'FIN_T_REQUEST_APPROVAL', [
      'ID',
      'REF1',
      'REF2',
      'TRANXID',
      'USER',
      'PASSWORD',
      'COMCODE',
      'PRODCODE',
      'COMMAND',
      'BANKCODE',
      'BANKREF',
      'DATETIME',
      'EFFDATE',
      'AMOUNT',
      'CHANNEL',
      'CUSNAME',
      'INFO',
      'REF3',
      'REF4',
      'RESPCODE',
      'RESPMSG',
      'BALANCE',
      'PRINT1',
      'PRINT2',
      'PRINT3',
      'PRINT4',
      'PRINT5',
      'PRINT6',
      'PRINT7',
      'REQUEST_DATA',
      'CREATEDATE',
      'SHOW_MSG',
    ]);

    await queryRunner.query(`DROP TABLE \`FIN_T_REQUEST_APPROVAL\``);
    await queryRunner.query(
      `RENAME TABLE \`FIN_T_REQUEST_APPROVAL__NEW\` TO \`FIN_T_REQUEST_APPROVAL\``,
    );
  }

  private async rebuildPayment(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('FIN_T_REQUEST_PAYMENT'))) {
      return;
    }

    await queryRunner.query(`DROP TABLE IF EXISTS \`FIN_T_REQUEST_PAYMENT__NEW\``);
    await queryRunner.query(`
      CREATE TABLE \`FIN_T_REQUEST_PAYMENT__NEW\` (
        \`ID\` int NOT NULL AUTO_INCREMENT COMMENT 'Auto ID',
        \`TRANXID\` varchar(20) NULL COMMENT 'Transaction number from Partner',
        \`REF1\` varchar(20) NULL COMMENT 'Reference1',
        \`REF2\` varchar(20) NULL COMMENT 'Reference2',
        \`USER\` varchar(20) NULL COMMENT 'User for webservice',
        \`PASSWORD\` varchar(20) NULL COMMENT 'Password for webservice',
        \`COMCODE\` varchar(10) NULL COMMENT 'Company Code ( KTB ตกลงร่วมกับ Direct Link Partner (1010))',
        \`PRODCODE\` varchar(10) NULL COMMENT 'Product Code (KTB ตกลงร่วมกับ Direct Link Partner (1010))',
        \`COMMAND\` varchar(20) NULL COMMENT 'Process Function (Fix=Approval)',
        \`BANKCODE\` int NULL COMMENT 'Bank Code(6)',
        \`BANKREF\` varchar(20) NULL COMMENT 'Reference transaction from bank  (K00002 00004392)',
        \`DATETIME\` varchar(14) NULL COMMENT 'Transaction DateTime  (yyyyMMddHHmmss(ปี ค.ศ. ) 20180601180029)',
        \`EFFDATE\` varchar(8) NULL COMMENT 'Settlement Date for Reconciliation ( yyyyMMdd (ปี ค.ศ.)  20180601)',
        \`AMOUNT\` decimal(18,2) NULL COMMENT 'Amount (500.00)',
        \`CHANNEL\` varchar(20) NULL COMMENT 'Channel of transaction (2)',
        \`CUSNAME\` varchar(60) NULL COMMENT 'Customer Name',
        \`INFO\` varchar(255) NULL COMMENT 'information',
        \`REF3\` varchar(20) NULL COMMENT 'Reference3',
        \`REF4\` varchar(20) NULL COMMENT 'Reference4',
        \`RESPCODE\` int NULL COMMENT 'Response code',
        \`RESPMSG\` varchar(100) NULL COMMENT 'Response message',
        \`BALANCE\` decimal(18,2) NULL COMMENT 'Cash balance from Partner',
        \`PRINT1\` varchar(40) NULL COMMENT 'Print 1',
        \`REQUEST_DATA\` varchar(4000) NULL COMMENT 'ข้อมูลที่รับหรือตอบกลับ',
        \`CREATEDATE\` datetime NULL COMMENT 'วันที่สร้างข้อมูล',
        \`SHOW_MSG\` varchar(1) NULL COMMENT 'สถานะการแสดงผล',
        PRIMARY KEY (\`ID\`),
        INDEX \`IDX_REQ_PAYMENT_REF12\` (\`REF1\`, \`REF2\`),
        INDEX \`IDX_REQ_PAYMENT_BANKREF\` (\`BANKREF\`),
        INDEX \`IDX_REQ_PAYMENT_TRANXID\` (\`TRANXID\`)
      ) ENGINE=InnoDB COMMENT='Request Payment'
    `);

    await this.copyByName(queryRunner, 'FIN_T_REQUEST_PAYMENT', [
      'ID',
      'TRANXID',
      'REF1',
      'REF2',
      'USER',
      'PASSWORD',
      'COMCODE',
      'PRODCODE',
      'COMMAND',
      'BANKCODE',
      'BANKREF',
      'DATETIME',
      'EFFDATE',
      'AMOUNT',
      'CHANNEL',
      'CUSNAME',
      'INFO',
      'REF3',
      'REF4',
      'RESPCODE',
      'RESPMSG',
      'BALANCE',
      'PRINT1',
      'REQUEST_DATA',
      'CREATEDATE',
      'SHOW_MSG',
    ]);

    await queryRunner.query(`DROP TABLE \`FIN_T_REQUEST_PAYMENT\``);
    await queryRunner.query(
      `RENAME TABLE \`FIN_T_REQUEST_PAYMENT__NEW\` TO \`FIN_T_REQUEST_PAYMENT\``,
    );
  }

  private async copyByName(
    queryRunner: QueryRunner,
    sourceTable: string,
    columns: string[],
  ): Promise<void> {
    const rows: Array<{ COLUMN_NAME: string }> = await queryRunner.query(
      `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      `,
      [sourceTable],
    );
    const existing = new Set(rows.map((r) => r.COLUMN_NAME));
    const present = columns.filter((c) => existing.has(c));
    if (present.length === 0) {
      return;
    }

    const list = present.map((c) => `\`${c}\``).join(', ');
    await queryRunner.query(`
      INSERT INTO \`${sourceTable}__NEW\` (${list})
      SELECT ${list} FROM \`${sourceTable}\`
    `);
  }
}
