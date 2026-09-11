import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Log tables สำหรับ bank callback (approval / payment)
 * คอลัมน์ + ลำดับตรง dump Lifelong LLTREQUESTAPPROVAL / LLTREQUESTPAYMENT
 * (lifelong_dev.sql) — ชื่อตารางใช้ FIN_T_* ตาม convention buu-get
 */
export class CreateBankRequestLogTables1789780345000 implements MigrationInterface {
  name = 'CreateBankRequestLogTables1789780345000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`FIN_T_REQUEST_APPROVAL\` (
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

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`FIN_T_REQUEST_PAYMENT\` (
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`FIN_T_REQUEST_PAYMENT\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`FIN_T_REQUEST_APPROVAL\``);
  }
}
