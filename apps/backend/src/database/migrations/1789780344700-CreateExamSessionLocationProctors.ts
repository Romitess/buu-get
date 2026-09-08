import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExamSessionLocationProctors1789780344700 implements MigrationInterface {
  name = 'CreateExamSessionLocationProctors1789780344700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`EXAM_T_SESSION_LOCATION_PROCTORS\` (
        \`SLP_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสการมอบหมายผู้คุมสอบประจำห้อง',
        \`SL_ID\` int NOT NULL COMMENT 'รหัส Session-Location (FK)',
        \`USER_ID\` int NOT NULL COMMENT 'รหัสผู้ใช้ผู้คุมสอบ (FK)',
        \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`UQ_SLP_SL_USER\` (\`SL_ID\`, \`USER_ID\`),
        INDEX \`IDX_SLP_USER_ID\` (\`USER_ID\`),
        PRIMARY KEY (\`SLP_ID\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`EXAM_T_SESSION_LOCATION_PROCTORS\``);
  }
}
