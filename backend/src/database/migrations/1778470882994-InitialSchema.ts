import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1778470882994 implements MigrationInterface {
  name = 'InitialSchema1778470882994';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`BUU_GET_T_ROLE\` (\`ROLE_ID\` int NOT NULL AUTO_INCREMENT, \`ROLE_NAME\` varchar(255) NOT NULL COMMENT 'ชื่อบทบาท', \`ROLE_DESCRIPTION\` varchar(255) NOT NULL COMMENT 'คำอธิบายบทบาท', \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไข' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ', PRIMARY KEY (\`ROLE_ID\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`BUU_GET_T_USER\` (\`USER_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสผู้สมัคร', \`USER_NATIONAL_ID\` varchar(13) NULL COMMENT 'หมายเลขบัตรประชาชน 13 หลัก', \`USER_PASSPORT_NO\` varchar(50) NULL COMMENT 'หมายเลขหนังสือเดินทาง', \`USER_EMAIL\` varchar(255) NOT NULL COMMENT 'อีเมลของผู้ใช้', \`USER_PASSWORD\` varchar(255) NOT NULL COMMENT 'รหัสผ่านเข้ารหัส', \`USER_STATUS\` varchar(20) NOT NULL COMMENT 'สถานะผู้ใช้ (ACTIVE, INACTIVE, BLOCKED)', \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้างบัญชี' DEFAULT CURRENT_TIMESTAMP(6), \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไขล่าสุด' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ', UNIQUE INDEX \`IDX_1ae990e72b3b7fa80b9c66b075\` (\`USER_NATIONAL_ID\`), UNIQUE INDEX \`IDX_994dedd8331b0be9892969304d\` (\`USER_PASSPORT_NO\`), PRIMARY KEY (\`USER_ID\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`EXAM_T_VOUCHERS\` (\`VC_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'เลขที่บัตรสอบ', \`ERM_ID\` int NOT NULL COMMENT 'รหัสผู้สมัคร', \`VC_CODE\` varchar(255) NOT NULL COMMENT 'รหัสบัตรสอบ', \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้างบัตรสอบ' DEFAULT CURRENT_TIMESTAMP(6), \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไขบัตรสอบ' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบบัตรสอบ', PRIMARY KEY (\`VC_ID\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`EXAM_T_ATTENDANCES\` (\`ATTEND_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสผู้เข้าสอบ', \`ERM_ID\` int NOT NULL COMMENT 'รหัสผู้สมัคร', \`ATTEND_CHECK_IN_TIME\` timestamp NULL COMMENT 'วันที่เข้าสอบ', \`ATTEND_STATUS\` varchar(20) NOT NULL COMMENT 'สถานะการเข้าสอบ', \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไข' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ', PRIMARY KEY (\`ATTEND_ID\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`EXAM_T_ENROLLMENTS\` (\`ERM_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสผู้สมัคร', \`USER_ID\` int NOT NULL COMMENT 'รหัสผู้ใช้', \`SESSION_ID\` int NOT NULL COMMENT 'รหัสรอบสอบ', \`ERM_SEAT_NUMBER\` varchar(9) NULL COMMENT 'เลขที่นั่งสอบ', \`ERM_STATUS\` tinyint NOT NULL COMMENT 'สถานะการชำระเงิน (0:UNPAID, 1:PAID, 2:SEAT_ASSIGNED, 3:ATTENDED, 4:CANCELLED)' DEFAULT '0', \`ERM_VERIFY_STATUS\` tinyint NOT NULL COMMENT 'สถานะการตรวจสอบ (0:UNCHECKED, 1:PASS, 2:WAIT_FIXED, 3:CANCELLED)' DEFAULT '0', \`ERM_AT\` timestamp NULL COMMENT 'วันที่ตรวจสอบ', \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไข' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ', PRIMARY KEY (\`ERM_ID\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`EX_T_SESSIONS\` (\`SS_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสรอบสอบ', \`EXAM_ID\` int NOT NULL COMMENT 'รหัสการสอบ', \`LOCATION_NAME\` varchar(100) NULL COMMENT 'ชื่อสถานที่จัดสอบ', \`SS_START_TIME\` time NULL COMMENT 'เวลาเริ่มสอบ', \`SS_END_TIME\` time NULL COMMENT 'เวลาสิ้นสุดการสอบ', \`SS_CAPACITY\` int NULL COMMENT 'จำนวนที่นั่ง', \`SS_SESSION_STATUS\` enum ('DRAFT', 'OPEN', 'SEAT_ALLOCATED', 'VOUCHER_SENT', 'COMPLETED', 'CANCELLED') NOT NULL COMMENT 'สถานะรอบสอบ' DEFAULT 'DRAFT', \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้างรอบสอบ' DEFAULT CURRENT_TIMESTAMP(6), \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไขรอบสอบ' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบรอบสอบ', PRIMARY KEY (\`SS_ID\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`EX_T_EXAM\` (\`EXAM_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสข้อสอบ', \`EXAM_NAME\` varchar(255) NOT NULL COMMENT 'ชื่อข้อสอบ', \`EXAM_TYPE\` varchar(50) NULL COMMENT 'ประเภทข้อสอบ', \`EXAM_FORMAT\` varchar(50) NULL COMMENT 'รูปแบบข้อสอบ', \`EXAM_FEE\` decimal(10,2) NULL COMMENT 'ค่าสมัครสอบ', \`EXAM_DATE\` date NULL COMMENT 'วันที่สอบ', \`EXAM_REG_START_DATE\` timestamp NULL COMMENT 'วันที่เปิดรับสมัคร', \`EXAM_REG_END_DATE\` timestamp NULL COMMENT 'วันที่ปิดรับสมัคร', \`EXAM_PAY_START_DATE\` timestamp NULL COMMENT 'วันที่เปิดให้ชำระเงิน', \`EXAM_PAY_END_DATE\` timestamp NULL COMMENT 'วันที่ปิดให้ชำระเงิน', \`EXAM_PUBLISHED\` tinyint NOT NULL COMMENT 'สถานะการเผยแพร่' DEFAULT 0, \`EXAM_MOODLE_COURSE_ID\` varchar(100) NULL COMMENT 'รหัสวิชาใน moodle', \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไข' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ', PRIMARY KEY (\`EXAM_ID\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`EXAM_T_LOCATIONS\` (\`LOCATION_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสสถานที่จัดสอบ', \`LOCATION_NAME\` varchar(255) NOT NULL COMMENT 'ชื่อสถานที่จัดสอบ', \`LOCATION_ROOM_NO\` varchar(50) NULL COMMENT 'เลขที่ห้องสอบ', \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้างสถานที่จัดสอบ' DEFAULT CURRENT_TIMESTAMP(6), \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไขสถานที่จัดสอบ' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบสถานที่จัดสอบ', PRIMARY KEY (\`LOCATION_ID\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`BUU_GET_T_USER_PROFILE\` (\`USER_PROFILE_ID\` int NOT NULL AUTO_INCREMENT, \`USER_ID\` int NOT NULL COMMENT 'รหัสผู้ใช้', \`USER_TITLE_TH\` varchar(50) NULL COMMENT 'คำนำหน้าชื่อภาษาไทย', \`USER_FULLNAME_TH\` varchar(200) NULL COMMENT 'ชื่อ-นามสกุล ภาษาไทย', \`USER_TITLE_EN\` varchar(50) NULL COMMENT 'คำนำหน้าชื่อภาษาอังกฤษ', \`USER_FULLNAME_EN\` varchar(200) NULL COMMENT 'ชื่อ-นามสกุล ภาษาอังกฤษ', \`USER_DATE_OF_BIRTH\` date NULL COMMENT 'วันเกิด', \`USER_PHONE\` varchar(20) NULL COMMENT 'เบอร์โทรศัพท์', \`USER_EDUCATION\` varchar(100) NULL COMMENT 'ระดับการศึกษา', \`USER_FACULTY\` varchar(100) NULL COMMENT 'คณะ', \`USER_COUNTRY\` varchar(100) NULL COMMENT 'ประเทศ', \`USER_ADDRESS\` varchar(200) NULL COMMENT 'ที่อยู่', \`USER_THAID_SYNCED\` tinyint NOT NULL COMMENT 'วันที่ซิงค์กับTHAID' DEFAULT 0, \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไข' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ', UNIQUE INDEX \`REL_02c7d7e87c7586148a1b492b82\` (\`USER_ID\`), PRIMARY KEY (\`USER_PROFILE_ID\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`USER_ROLES\` (\`bUUGETTUSERUSERID\` int NOT NULL, \`bUUGETTROLEROLEID\` int NOT NULL, INDEX \`IDX_6851b839aae55f965adf5e9dc6\` (\`bUUGETTUSERUSERID\`), INDEX \`IDX_22b4622638d9c40e8a36f05309\` (\`bUUGETTROLEROLEID\`), PRIMARY KEY (\`bUUGETTUSERUSERID\`, \`bUUGETTROLEROLEID\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_VOUCHERS\` ADD CONSTRAINT \`FK_ed7b5747b464d7dd9f0a5fd9c74\` FOREIGN KEY (\`ERM_ID\`) REFERENCES \`EXAM_T_ENROLLMENTS\`(\`ERM_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ATTENDANCES\` ADD CONSTRAINT \`FK_a772aba213d0f345cfb087cabb1\` FOREIGN KEY (\`ERM_ID\`) REFERENCES \`EXAM_T_ENROLLMENTS\`(\`ERM_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` ADD CONSTRAINT \`FK_eca0c773435b56e95daa9ecf9c5\` FOREIGN KEY (\`SESSION_ID\`) REFERENCES \`EX_T_SESSIONS\`(\`SS_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` ADD CONSTRAINT \`FK_a1cd9219664f6b894dc607f4971\` FOREIGN KEY (\`USER_ID\`) REFERENCES \`BUU_GET_T_USER\`(\`USER_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EX_T_SESSIONS\` ADD CONSTRAINT \`FK_f6ca2b07c2a1d5f66d2dec75ac5\` FOREIGN KEY (\`EXAM_ID\`) REFERENCES \`EX_T_EXAM\`(\`EXAM_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` ADD CONSTRAINT \`FK_02c7d7e87c7586148a1b492b827\` FOREIGN KEY (\`USER_ID\`) REFERENCES \`BUU_GET_T_USER\`(\`USER_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`USER_ROLES\` ADD CONSTRAINT \`FK_6851b839aae55f965adf5e9dc6e\` FOREIGN KEY (\`bUUGETTUSERUSERID\`) REFERENCES \`BUU_GET_T_USER\`(\`USER_ID\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`USER_ROLES\` ADD CONSTRAINT \`FK_22b4622638d9c40e8a36f053096\` FOREIGN KEY (\`bUUGETTROLEROLEID\`) REFERENCES \`BUU_GET_T_ROLE\`(\`ROLE_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`USER_ROLES\` DROP FOREIGN KEY \`FK_22b4622638d9c40e8a36f053096\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`USER_ROLES\` DROP FOREIGN KEY \`FK_6851b839aae55f965adf5e9dc6e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` DROP FOREIGN KEY \`FK_02c7d7e87c7586148a1b492b827\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EX_T_SESSIONS\` DROP FOREIGN KEY \`FK_f6ca2b07c2a1d5f66d2dec75ac5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` DROP FOREIGN KEY \`FK_a1cd9219664f6b894dc607f4971\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` DROP FOREIGN KEY \`FK_eca0c773435b56e95daa9ecf9c5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ATTENDANCES\` DROP FOREIGN KEY \`FK_a772aba213d0f345cfb087cabb1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_VOUCHERS\` DROP FOREIGN KEY \`FK_ed7b5747b464d7dd9f0a5fd9c74\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_22b4622638d9c40e8a36f05309\` ON \`USER_ROLES\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_6851b839aae55f965adf5e9dc6\` ON \`USER_ROLES\``,
    );
    await queryRunner.query(`DROP TABLE \`USER_ROLES\``);
    await queryRunner.query(
      `DROP INDEX \`REL_02c7d7e87c7586148a1b492b82\` ON \`BUU_GET_T_USER_PROFILE\``,
    );
    await queryRunner.query(`DROP TABLE \`BUU_GET_T_USER_PROFILE\``);
    await queryRunner.query(`DROP TABLE \`EXAM_T_LOCATIONS\``);
    await queryRunner.query(`DROP TABLE \`EX_T_EXAM\``);
    await queryRunner.query(`DROP TABLE \`EX_T_SESSIONS\``);
    await queryRunner.query(`DROP TABLE \`EXAM_T_ENROLLMENTS\``);
    await queryRunner.query(`DROP TABLE \`EXAM_T_ATTENDANCES\``);
    await queryRunner.query(`DROP TABLE \`EXAM_T_VOUCHERS\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_994dedd8331b0be9892969304d\` ON \`BUU_GET_T_USER\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_1ae990e72b3b7fa80b9c66b075\` ON \`BUU_GET_T_USER\``,
    );
    await queryRunner.query(`DROP TABLE \`BUU_GET_T_USER\``);
    await queryRunner.query(`DROP TABLE \`BUU_GET_T_ROLE\``);
  }
}
