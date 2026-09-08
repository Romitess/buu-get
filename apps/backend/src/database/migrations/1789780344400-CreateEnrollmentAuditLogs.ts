import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEnrollmentAuditLogs1789780344400 implements MigrationInterface {
  name = 'CreateEnrollmentAuditLogs1789780344400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`EXAM_T_ENROLLMENT_AUDIT_LOGS\` (
        \`EAL_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัส audit log',
        \`ERM_ID\` int NOT NULL COMMENT 'รหัสผู้สมัคร (FK)',
        \`USER_ID\` int NOT NULL COMMENT 'รหัสผู้ใช้ (denormalized)',
        \`EXAM_ID\` int NULL COMMENT 'รหัสการสอบ (denormalized)',
        \`SESSION_ID\` int NULL COMMENT 'รหัสรอบสอบ (denormalized)',
        \`EAL_EVENT_TYPE\` varchar(64) NOT NULL COMMENT 'ประเภทเหตุการณ์',
        \`EAL_CATEGORY\` varchar(32) NOT NULL COMMENT 'หมวดเหตุการณ์ (enrollment/payment/system)',
        \`EAL_FROM_STATUS\` varchar(32) NULL COMMENT 'สถานะก่อนเปลี่ยน',
        \`EAL_TO_STATUS\` varchar(32) NULL COMMENT 'สถานะหลังเปลี่ยน',
        \`EAL_ACTOR_TYPE\` varchar(32) NOT NULL COMMENT 'ประเภทผู้กระทำ (candidate/system/cron)',
        \`EAL_ACTOR_USER_ID\` int NULL COMMENT 'รหัสผู้ใช้ที่กระทำ',
        \`EAL_ACTOR_NAME\` varchar(200) NULL COMMENT 'ชื่อผู้กระทำ (snapshot)',
        \`EAL_MESSAGE\` varchar(500) NULL COMMENT 'ข้อความสรุปเหตุการณ์',
        \`EAL_PAYLOAD\` text NULL COMMENT 'รายละเอียดเพิ่มเติม (JSON)',
        \`EAL_REF_TYPE\` varchar(32) NULL COMMENT 'ประเภทอ้างอิง (เช่น TRANX)',
        \`EAL_REF_ID\` int NULL COMMENT 'รหัสอ้างอิง',
        \`CREATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'เวลาที่เกิดเหตุการณ์',
        PRIMARY KEY (\`EAL_ID\`),
        INDEX \`IDX_EAL_ERM_CREATED\` (\`ERM_ID\`, \`CREATED_AT\`),
        INDEX \`IDX_EAL_USER_CREATED\` (\`USER_ID\`, \`CREATED_AT\`),
        INDEX \`IDX_EAL_EXAM_CREATED\` (\`EXAM_ID\`, \`CREATED_AT\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Audit log การสมัครสอบ'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`EXAM_T_ENROLLMENT_AUDIT_LOGS\``);
  }
}
