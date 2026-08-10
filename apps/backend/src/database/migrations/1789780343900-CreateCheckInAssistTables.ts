import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCheckInAssistTables1789780343900 implements MigrationInterface {
  name = 'CreateCheckInAssistTables1789780343900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`CHECK_IN_ASSIST_SESSIONS\` (
        \`CAS_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัส session ช่วยแสกน',
        \`EXAM_ID\` int NOT NULL COMMENT 'รหัสการสอบ',
        \`HOST_USER_ID\` int NOT NULL COMMENT 'ผู้เปิด session (host)',
        \`JOIN_TOKEN\` varchar(64) NOT NULL COMMENT 'โทเค็นสำหรับเข้าร่วมช่วยแสกน',
        \`SESSION_IDS_JSON\` text NOT NULL COMMENT 'รายการ SS_ID ที่อยู่ในขอบเขต session (JSON array)',
        \`STATUS\` varchar(16) NOT NULL COMMENT 'สถานะ session (ACTIVE/CLOSED)' DEFAULT 'ACTIVE',
        \`EXPIRES_AT\` timestamp NOT NULL COMMENT 'วันหมดอายุ session',
        \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6),
        \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไข' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ',
        UNIQUE INDEX \`UQ_CAS_JOIN_TOKEN\` (\`JOIN_TOKEN\`),
        PRIMARY KEY (\`CAS_ID\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`CHECK_IN_ASSIST_EVENTS\` (
        \`CAE_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัส event',
        \`CAS_ID\` int NOT NULL COMMENT 'รหัส session ช่วยแสกน',
        \`SEQ\` int NOT NULL COMMENT 'ลำดับ event ต่อ session',
        \`EVENT_TYPE\` varchar(32) NOT NULL COMMENT 'ประเภท event',
        \`SCANNED_CODE\` varchar(64) NOT NULL COMMENT 'รหัสที่แสกน',
        \`ERM_ID\` int NULL COMMENT 'รหัสผู้สมัคร (ถ้ามี)',
        \`SCANNER_USER_ID\` int NOT NULL COMMENT 'ผู้แสกน',
        \`PAYLOAD_JSON\` text NULL COMMENT 'ข้อมูล candidate summary สำหรับ sync ไป host',
        \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6),
        INDEX \`IDX_CAE_CAS_SEQ\` (\`CAS_ID\`, \`SEQ\`),
        PRIMARY KEY (\`CAE_ID\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`CHECK_IN_ASSIST_EVENTS\``);
    await queryRunner.query(`DROP TABLE \`CHECK_IN_ASSIST_SESSIONS\``);
  }
}
