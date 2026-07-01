import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMoodleSyncLog1789780343180 implements MigrationInterface {
  name = 'CreateMoodleSyncLog1789780343180';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`BUU_GET_T_MOODLE_SYNC_LOG\` (
        \`ML_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสล็อกซิงก์ Moodle',
        \`USER_ID\` int NOT NULL COMMENT 'รหัสผู้สมัคร (Foreign Key)',
        \`ML_ACTION\` enum('core_course_create_courses', 'core_user_create_users', 'enrol_manual_enrol_users', 'gradereport_user_get_grade_items') NOT NULL COMMENT 'การทำงานที่ซิงก์',
        \`ML_WS_FUNCTION\` varchar(100) NOT NULL COMMENT 'ฟังก์ชันเว็บบอร์ด / เว็บเซอร์วิส Moodle',
        \`ML_REQUEST_URL\` varchar(255) NOT NULL COMMENT 'URL ที่ส่งคำขอ',
        \`ML_REQUEST_PAYLOAD\` json NULL COMMENT 'Payload คำขอ',
        \`ML_RESPONSE_BODY\` json NULL COMMENT 'Body คำตอบกลับ',
        \`ML_HTTP_METHOD\` varchar(20) NOT NULL COMMENT 'HTTP Method (GET, POST, etc.)',
        \`ML_HTTP_STATUS\` int NULL COMMENT 'HTTP Response Status Code',
        \`ML_ERROR_MASSAGE\` text NULL COMMENT 'รายละเอียดข้อผิดพลาด (ถ้ามี)',
        \`ML_REF_TYPE\` varchar(50) NOT NULL COMMENT 'ประเภทอ้างอิง',
        \`ML_REF_ID\` int NOT NULL COMMENT 'ID อ้างอิงระบบภายใน',
        \`ML_MOODLE_REF_ID\` int NOT NULL COMMENT 'ID อ้างอิงระบบ Moodle',
        \`CREATED_AT\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่สร้างล็อก',
        PRIMARY KEY (\`ML_ID\`),
        CONSTRAINT \`FK_moodle_sync_log_user\` FOREIGN KEY (\`USER_ID\`) REFERENCES \`BUU_GET_T_USER\`(\`USER_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ประวัติการซิงก์ข้อมูลกับ Moodle'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`BUU_GET_T_MOODLE_SYNC_LOG\``);
  }
}
