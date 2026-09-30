import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateThaidHandoffTables1789781600000 implements MigrationInterface {
  name = 'CreateThaidHandoffTables1789781600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`BUU_GET_T_THAID_AUTH_STATE\` (
        \`THAID_STATE_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัส state ของ ThaID',
        \`STATE_HASH\` varchar(64) NOT NULL COMMENT 'SHA-256 ของ state ที่ส่งให้กรมการปกครอง',
        \`INTENT\` varchar(16) NOT NULL COMMENT 'เจตนาตอนกดปุ่ม login หรือ register',
        \`EXPIRES_AT\` datetime NOT NULL COMMENT 'เวลาหมดอายุของ state',
        \`CONSUMED_AT\` datetime NULL COMMENT 'เวลาที่ใช้ state แล้ว ใช้ได้ครั้งเดียว',
        \`CREATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันที่สร้าง',
        PRIMARY KEY (\`THAID_STATE_ID\`),
        UNIQUE INDEX \`UQ_THAID_STATE_HASH\` (\`STATE_HASH\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='state ใช้ครั้งเดียวของ ThaID'
    `);

    await queryRunner.query(`
      CREATE TABLE \`BUU_GET_T_THAID_HANDOFF\` (
        \`THAID_HANDOFF_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสตั๋วส่งต่อผล ThaID',
        \`TICKET_HASH\` varchar(64) NOT NULL COMMENT 'SHA-256 ของตั๋วที่ส่งให้เบราว์เซอร์',
        \`KIND\` varchar(32) NOT NULL COMMENT 'session สำหรับแลกผล หรือ register_proof สำหรับตอนสมัคร',
        \`PAYLOAD_JSON\` text NOT NULL COMMENT 'ผลลัพธ์ที่ต้องส่งต่อ ไม่เก็บ token ของ ThaID',
        \`EXPIRES_AT\` datetime NOT NULL COMMENT 'เวลาหมดอายุของตั๋ว',
        \`CONSUMED_AT\` datetime NULL COMMENT 'เวลาที่ใช้ตั๋วแล้ว ใช้ได้ครั้งเดียว',
        \`CREATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันที่สร้าง',
        PRIMARY KEY (\`THAID_HANDOFF_ID\`),
        UNIQUE INDEX \`UQ_THAID_HANDOFF_HASH\` (\`TICKET_HASH\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ตั๋วส่งต่อผลยืนยัน ThaID'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`BUU_GET_T_THAID_HANDOFF\``);
    await queryRunner.query(`DROP TABLE \`BUU_GET_T_THAID_AUTH_STATE\``);
  }
}
