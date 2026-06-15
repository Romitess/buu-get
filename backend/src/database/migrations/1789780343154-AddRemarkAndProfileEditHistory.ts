import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRemarkAndProfileEditHistory1789780343154 implements MigrationInterface {
  name = 'AddRemarkAndProfileEditHistory1789780343154';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` ADD \`USER_REMARK\` varchar(500) NULL COMMENT 'หมายเหตุถึงผู้สมัคร'`,
    );

    await queryRunner.query(
      `CREATE TABLE \`BUU_GET_T_PROFILE_EDIT_HISTORY\` (
        \`PROFILE_EDIT_HISTORY_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสประวัติการแก้ไข',
        \`USER_PROFILE_ID\` int NOT NULL COMMENT 'รหัสโปรไฟล์ (FK)',
        \`MODIFIER_ID\` int NOT NULL COMMENT 'ผู้ดำเนินการแก้ไข (FK)',
        \`MODIFIER_NAME\` varchar(200) NOT NULL COMMENT 'ชื่อผู้ดำเนินการแก้ไข',
        \`MODIFIER_ROLE\` varchar(100) NOT NULL COMMENT 'สถานะ/บทบาทผู้แก้ไข (เช่น เจ้าหน้าที่, ผู้สมัครสอบ)',
        \`MODIFIED_FIELDS\` varchar(500) NOT NULL COMMENT 'ส่วนที่แก้ไข (เช่น ที่อยู่สำหรับจัดส่งเอกสาร)',
        \`OLD_VALUES\` text NULL COMMENT 'ค่าเดิม (JSON)',
        \`NEW_VALUES\` text NULL COMMENT 'ค่าใหม่ (JSON)',
        \`CREATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันที่สร้าง',
        \`UPDATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันที่อัปเดต',
        \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ',
        PRIMARY KEY (\`PROFILE_EDIT_HISTORY_ID\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ประวัติการแก้ไขข้อมูลโปรไฟล์ผู้ใช้งาน'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`BUU_GET_T_PROFILE_EDIT_HISTORY\``);
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` DROP COLUMN \`USER_REMARK\``,
    );
  }
}
