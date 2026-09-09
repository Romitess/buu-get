import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1789780344900 implements MigrationInterface {
  name = 'CreateAuditLogs1789780344900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`SYS_T_AUDIT_LOGS\` (
        \`AL_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัส audit log',
        \`AL_ACTOR_USER_ID\` int NULL COMMENT 'USER_ID ผู้กระทำ (null = ระบบ / ยังไม่ล็อกอิน)',
        \`AL_ACTOR_SNAPSHOT\` text NULL COMMENT 'snapshot ผู้กระทำตอนบันทึก (userId/email/roles)',
        \`AL_ACTION\` varchar(64) NOT NULL COMMENT 'รหัสเหตุการณ์ตาม taxonomy เช่น AUTH.LOGIN',
        \`AL_MODULE\` varchar(32) NOT NULL COMMENT 'โมดูลที่ emit (เช่น buu-get)',
        \`AL_RESOURCE_TYPE\` varchar(64) NULL COMMENT 'ชนิดทรัพยากรที่ถูกกระทำ',
        \`AL_RESOURCE_ID\` varchar(64) NULL COMMENT 'รหัสทรัพยากร (polymorphic)',
        \`AL_STATUS\` varchar(16) NOT NULL COMMENT 'SUCCESS / FAILURE / PARTIAL',
        \`AL_STATUS_DETAIL\` varchar(500) NULL COMMENT 'ข้อความสถานะ/เหตุผล failure (ไม่เก็บ stack trace)',
        \`AL_BEFORE_STATE\` text NULL COMMENT 'JSON snapshot ก่อนเปลี่ยน (allowlist)',
        \`AL_AFTER_STATE\` text NULL COMMENT 'JSON snapshot หลังเปลี่ยน (allowlist)',
        \`AL_IP_ADDRESS\` varchar(45) NULL COMMENT 'IP ผู้เรียก',
        \`AL_USER_AGENT\` varchar(512) NULL COMMENT 'User-Agent',
        \`AL_CORRELATION_ID\` varchar(36) NULL COMMENT 'ผูกหนึ่ง logical action ข้าม request',
        \`CREATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'เวลาที่เกิดเหตุการณ์',
        PRIMARY KEY (\`AL_ID\`),
        INDEX \`IDX_AL_ACTOR_CREATED\` (\`AL_ACTOR_USER_ID\`, \`CREATED_AT\`),
        INDEX \`IDX_AL_ACTION_CREATED\` (\`AL_ACTION\`, \`CREATED_AT\`),
        INDEX \`IDX_AL_RESOURCE\` (\`AL_RESOURCE_TYPE\`, \`AL_RESOURCE_ID\`),
        INDEX \`IDX_AL_CREATED\` (\`CREATED_AT\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Platform audit log (append-only)'
    `);

    await queryRunner.query(`
      CREATE TRIGGER \`SYS_T_AUDIT_LOGS_NO_UPDATE\`
      BEFORE UPDATE ON \`SYS_T_AUDIT_LOGS\`
      FOR EACH ROW
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SYS_T_AUDIT_LOGS is immutable'
    `);

    await queryRunner.query(`
      CREATE TRIGGER \`SYS_T_AUDIT_LOGS_NO_DELETE\`
      BEFORE DELETE ON \`SYS_T_AUDIT_LOGS\`
      FOR EACH ROW
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SYS_T_AUDIT_LOGS is immutable'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS \`SYS_T_AUDIT_LOGS_NO_DELETE\``,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS \`SYS_T_AUDIT_LOGS_NO_UPDATE\``,
    );
    await queryRunner.query(`DROP TABLE \`SYS_T_AUDIT_LOGS\``);
  }
}
