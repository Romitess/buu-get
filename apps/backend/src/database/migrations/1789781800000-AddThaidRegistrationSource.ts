import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddThaidRegistrationSource1789781800000 implements MigrationInterface {
  name = 'AddThaidRegistrationSource1789781800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`BUU_GET_T_USER_PROFILE\`
      ADD \`USER_REGISTERED_VIA_THAID\` tinyint NOT NULL
      COMMENT 'สมัครสมาชิกผ่าน ThaiD' DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE \`BUU_GET_T_THAID_AUTH_STATE\`
      ADD \`USER_ID\` int NULL
      COMMENT 'ผู้ใช้ที่กดอัปเดตข้อมูล ใช้เฉพาะ intent update'
    `);
    await queryRunner.query(`
      ALTER TABLE \`BUU_GET_T_THAID_AUTH_STATE\`
      MODIFY \`INTENT\` varchar(16) NOT NULL
      COMMENT 'เจตนา login, register หรือ update'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`BUU_GET_T_THAID_AUTH_STATE\`
      MODIFY \`INTENT\` varchar(16) NOT NULL
      COMMENT 'เจตนาตอนกดปุ่ม login หรือ register'
    `);
    await queryRunner.query(`
      ALTER TABLE \`BUU_GET_T_THAID_AUTH_STATE\` DROP COLUMN \`USER_ID\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`BUU_GET_T_USER_PROFILE\` DROP COLUMN \`USER_REGISTERED_VIA_THAID\`
    `);
  }
}
