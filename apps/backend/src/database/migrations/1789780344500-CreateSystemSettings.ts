import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * สร้างตาราง System Settings + seed ค่า default จาก constants ปัจจุบันของระบบ
 */
export class CreateSystemSettings1789780344500 implements MigrationInterface {
  name = 'CreateSystemSettings1789780344500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`SYS_T_SYSTEM_SETTINGS\` (
        \`SS_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสการตั้งค่า',
        \`SETTING_KEY\` varchar(100) NOT NULL COMMENT 'คีย์การตั้งค่า (เช่น exam.defaultFeeThb)',
        \`SETTING_GROUP\` varchar(50) NOT NULL COMMENT 'กลุ่ม (exam/payment/certificate/org/email)',
        \`SETTING_VALUE\` text NOT NULL COMMENT 'ค่าที่เก็บเป็นข้อความ (parse ตาม SETTING_TYPE)',
        \`SETTING_TYPE\` varchar(20) NOT NULL COMMENT 'ชนิดข้อมูล: number | string | integer | boolean',
        \`UPDATED_BY\` int NULL COMMENT 'USER_ID ผู้แก้ไขล่าสุด',
        \`CREATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันที่สร้าง',
        \`UPDATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันที่แก้ไขล่าสุด',
        PRIMARY KEY (\`SS_ID\`),
        UNIQUE INDEX \`IDX_SYS_SETTING_KEY\` (\`SETTING_KEY\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ค่าตั้งต้นของระบบ (System Settings)'
    `);

    await queryRunner.query(`
      CREATE TABLE \`SYS_T_SYSTEM_SETTING_AUDIT_LOGS\` (
        \`SSA_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัส audit log',
        \`SETTING_KEY\` varchar(100) NOT NULL COMMENT 'คีย์ที่ถูกแก้ไข',
        \`OLD_VALUE\` text NULL COMMENT 'ค่าเดิม',
        \`NEW_VALUE\` text NOT NULL COMMENT 'ค่าใหม่',
        \`ACTOR_USER_ID\` int NOT NULL COMMENT 'USER_ID ผู้แก้ไข',
        \`CREATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'เวลาที่แก้ไข',
        PRIMARY KEY (\`SSA_ID\`),
        INDEX \`IDX_SSA_SETTING_KEY\` (\`SETTING_KEY\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Audit log การแก้ System Settings'
    `);

    await queryRunner.query(`
      INSERT INTO \`SYS_T_SYSTEM_SETTINGS\`
        (\`SETTING_KEY\`, \`SETTING_GROUP\`, \`SETTING_VALUE\`, \`SETTING_TYPE\`)
      VALUES
        ('exam.defaultFeeThb', 'exam', '500', 'number'),
        ('exam.defaultName', 'exam', 'BUU-GET', 'string'),
        ('exam.defaultType', 'exam', 'รอบทั่วไป', 'string'),
        ('exam.defaultFormat', 'exam', 'คอมพิวเตอร์', 'string'),
        ('exam.defaultSessionStart', 'exam', '08:00', 'string'),
        ('exam.defaultSessionEnd', 'exam', '10:00', 'string'),
        ('exam.passcodeLength', 'exam', '6', 'integer'),
        ('payment.sessionTtlMinutes', 'payment', '30', 'integer'),
        ('payment.defaultPcId', 'payment', '1', 'integer'),
        ('certificate.validityYears', 'certificate', '2', 'integer'),
        ('org.nameTh', 'org', 'มหาวิทยาลัยบูรพา', 'string'),
        ('org.nameEn', 'org', 'BURAPHA UNIVERSITY', 'string'),
        ('org.taxId', 'org', '0994000033100', 'string'),
        ('org.addressTh', 'org', '169 ถนนลงหาดบางแสน ตำบลแสนสุข อำเภอเมือง จังหวัดชลบุรี 20131', 'string'),
        ('org.addressEn', 'org', '169 Longhad Bangsaen Road, Saensuk mueang, ChonBuri 20130', 'string'),
        ('org.supportEmail', 'org', 'li@go.buu.ac.th', 'string'),
        ('email.senderName', 'email', 'BUU-GET', 'string')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE \`SYS_T_SYSTEM_SETTING_AUDIT_LOGS\``,
    );
    await queryRunner.query(`DROP TABLE \`SYS_T_SYSTEM_SETTINGS\``);
  }
}
