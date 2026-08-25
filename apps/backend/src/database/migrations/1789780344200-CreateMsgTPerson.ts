import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMsgTPerson1789780344200 implements MigrationInterface {
  name = 'CreateMsgTPerson1789780344200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`MSG_T_PERSON\` (
        \`PSN_ID\` varchar(10) NOT NULL COMMENT 'รหัสบุคลากร',
        \`PRF_NAMETH\` varchar(100) NULL COMMENT 'ชื่อคำนำหน้า (ไทย)',
        \`PRF_NAMEEN\` varchar(100) NULL COMMENT 'ชื่อคำนำหน้า (อังกฤษ)',
        \`PSN_FNAMETH\` varchar(60) NULL COMMENT 'ชื่อ (ไทย)',
        \`PSN_FNAMEEN\` varchar(60) NULL COMMENT 'ชื่อ (อังกฤษ)',
        \`PSN_LNAMETH\` varchar(60) NULL COMMENT 'นามสกุล (ไทย)',
        \`PSN_LNAMEEN\` varchar(60) NULL COMMENT 'นามสกุล (อังกฤษ)',
        \`PSN_EMAIL_BUU\` varchar(100) NULL COMMENT 'อีเมลของมหาวิทยาลัย',
        \`PSN_RETIRE\` varchar(1) NULL COMMENT 'สถานะการทำงาน; N=ทำงาน , Y=ลาออก',
        \`PSN_TECHNIQUE\` varchar(50) NULL COMMENT 'ตำแหน่งทางวิชาการ/สายงาน',
        PRIMARY KEY (\`PSN_ID\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ข้อมูลบุคลากร'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`MSG_T_PERSON\``);
  }
}
