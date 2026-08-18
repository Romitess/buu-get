import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationTables1789780344000 implements MigrationInterface {
  name = 'CreateNotificationTables1789780344000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`NTF_T_NOTIFICATIONS\` (
        \`NTF_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสการแจ้งเตือน',
        \`NTF_TYPE\` varchar(64) NOT NULL COMMENT 'ประเภทการแจ้งเตือน',
        \`NTF_TITLE\` varchar(255) NOT NULL COMMENT 'หัวข้อการแจ้งเตือน',
        \`NTF_BODY\` text NOT NULL COMMENT 'ข้อความสรุปการแจ้งเตือน',
        \`NTF_PAYLOAD\` text NOT NULL COMMENT 'ข้อมูลสรุปแบบ JSON',
        \`NTF_LINK\` varchar(512) NULL COMMENT 'ลิงก์ไปหน้ารายงานที่เกี่ยวข้อง',
        \`NTF_DEDUPE_KEY\` varchar(128) NOT NULL COMMENT 'คีย์กันสร้างซ้ำ (เช่น daily_payment_summary:YYYY-MM-DD)',
        \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6),
        \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไขล่าสุด' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)',
        UNIQUE INDEX \`UQ_NTF_DEDUPE_KEY\` (\`NTF_DEDUPE_KEY\`),
        PRIMARY KEY (\`NTF_ID\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`NTF_T_NOTIFICATION_RECIPIENTS\` (
        \`NTR_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสผู้รับการแจ้งเตือน',
        \`NTF_ID\` int NOT NULL COMMENT 'รหัสการแจ้งเตือน',
        \`USER_ID\` int NOT NULL COMMENT 'รหัสผู้ใช้ผู้รับ',
        \`NTR_READ_AT\` datetime(6) NULL COMMENT 'วันเวลาที่อ่าน',
        \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6),
        \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไขล่าสุด' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)',
        UNIQUE INDEX \`UQ_NTR_NTF_USER\` (\`NTF_ID\`, \`USER_ID\`),
        INDEX \`IDX_NTR_USER_READ_CREATED\` (\`USER_ID\`, \`NTR_READ_AT\`, \`CREATED_AT\`),
        PRIMARY KEY (\`NTR_ID\`),
        CONSTRAINT \`FK_NTR_NOTIFICATION\` FOREIGN KEY (\`NTF_ID\`) REFERENCES \`NTF_T_NOTIFICATIONS\`(\`NTF_ID\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_NTR_USER\` FOREIGN KEY (\`USER_ID\`) REFERENCES \`BUU_GET_T_USER\`(\`USER_ID\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`NTF_T_NOTIFICATION_RECIPIENTS\``);
    await queryRunner.query(`DROP TABLE \`NTF_T_NOTIFICATIONS\``);
  }
}
