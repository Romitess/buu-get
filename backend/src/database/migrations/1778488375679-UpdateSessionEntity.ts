import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSessionEntity1778488375679 implements MigrationInterface {
  name = 'UpdateSessionEntity1778488375679';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` CHANGE \`LOCATION_NAME\` \`LOCATION_ID\` varchar(100) NULL COMMENT 'ชื่อสถานที่จัดสอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` ADD \`FUND_SOURCE_ID\` int NULL COMMENT 'รหัสแหล่งทุน'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_ROLE\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_FUND_SOURCES\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_TYPE\` \`EXAM_TYPE\` varchar(50) NULL COMMENT 'ประเภทข้อสอบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_FORMAT\` \`EXAM_FORMAT\` varchar(50) NULL COMMENT 'รูปแบบข้อสอบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_FEE\` \`EXAM_FEE\` decimal(10,2) NULL COMMENT 'ค่าสมัครสอบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_DATE\` \`EXAM_DATE\` date NULL COMMENT 'วันที่สอบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_REG_START_DATE\` \`EXAM_REG_START_DATE\` timestamp NULL COMMENT 'วันที่เปิดรับสมัคร'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_REG_END_DATE\` \`EXAM_REG_END_DATE\` timestamp NULL COMMENT 'วันที่ปิดรับสมัคร'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_PAY_START_DATE\` \`EXAM_PAY_START_DATE\` timestamp NULL COMMENT 'วันที่เปิดให้ชำระเงิน'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_PAY_END_DATE\` \`EXAM_PAY_END_DATE\` timestamp NULL COMMENT 'วันที่ปิดให้ชำระเงิน'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_MOODLE_COURSE_ID\` \`EXAM_MOODLE_COURSE_ID\` varchar(100) NULL COMMENT 'รหัสวิชาใน moodle'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`LOCATION_ROOM_NO\` \`LOCATION_ROOM_NO\` varchar(50) NULL COMMENT 'เลขที่ห้องสอบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบสถานที่จัดสอบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` DROP COLUMN \`LOCATION_ID\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` ADD \`LOCATION_ID\` int NULL COMMENT 'รหัสสถานที่จัดสอบ (FK)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` CHANGE \`SS_START_TIME\` \`SS_START_TIME\` time NULL COMMENT 'เวลาเริ่มสอบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` CHANGE \`SS_END_TIME\` \`SS_END_TIME\` time NULL COMMENT 'เวลาสิ้นสุดการสอบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` CHANGE \`SS_CAPACITY\` \`SS_CAPACITY\` int NULL COMMENT 'จำนวนที่นั่ง'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบรอบสอบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_VOUCHERS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบบัตรสอบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ATTENDANCES\` CHANGE \`ATTEND_CHECK_IN_TIME\` \`ATTEND_CHECK_IN_TIME\` timestamp NULL COMMENT 'วันที่เข้าสอบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ATTENDANCES\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_CERTIFICATES\` CHANGE \`CERT_ISSUED_AT\` \`CERT_ISSUED_AT\` timestamp NULL COMMENT 'วันที่ออกใบรับรอง'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_CERTIFICATES\` CHANGE \`CERT_EXPIRES_AT\` \`CERT_EXPIRES_AT\` timestamp NULL COMMENT 'วันที่ใบรับรองหมดอายุ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_CERTIFICATES\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SCORES\` CHANGE \`SC_LANG_USE_SCORE\` \`SC_LANG_USE_SCORE\` decimal(5,2) NULL COMMENT 'คะแนน Language Use'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SCORES\` CHANGE \`SC_READING_SCORE\` \`SC_READING_SCORE\` decimal(5,2) NULL COMMENT 'คะแนน Reading'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SCORES\` CHANGE \`SC_TOTAL_SCORE\` \`SC_TOTAL_SCORE\` decimal(5,2) NULL COMMENT 'คะแนนรวม'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SCORES\` CHANGE \`SC_BAND_LEVEL\` \`SC_BAND_LEVEL\` int NULL COMMENT 'ระดับ Band'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SCORES\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` CHANGE \`ERM_SEAT_NUMBER\` \`ERM_SEAT_NUMBER\` varchar(9) NULL COMMENT 'เลขที่นั่งสอบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` CHANGE \`ERM_AT\` \`ERM_AT\` timestamp NULL COMMENT 'วันที่ตรวจสอบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_RECEIPTS\` CHANGE \`RC_ISSUED_AT\` \`RC_ISSUED_AT\` timestamp NULL COMMENT 'วันที่ออกใบเสร็จ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_RECEIPTS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_REF2\` \`TRANX_REF2\` varchar(20) NULL COMMENT 'Ref 2'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_REF3\` \`TRANX_REF3\` varchar(20) NULL COMMENT 'Ref 3'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_REF4\` \`TRANX_REF4\` varchar(20) NULL COMMENT 'Ref 4'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_BANK_REF\` \`TRANX_BANK_REF\` varchar(20) NULL COMMENT 'Bank Ref'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_BANK_DATETIME\` \`TRANX_BANK_DATETIME\` timestamp NULL COMMENT 'วันเวลาธนาคาร'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_EFFECTIVE_DATE\` \`TRANX_EFFECTIVE_DATE\` timestamp NULL COMMENT 'วันที่มีผล'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_EXPIRES_AT\` \`TRANX_EXPIRES_AT\` timestamp NULL COMMENT 'วันหมดอายุ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_PAID_AT\` \`TRANX_PAID_AT\` timestamp NULL COMMENT 'วันที่ชำระเงิน'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_REJECTED_AT\` \`TRANX_REJECTED_AT\` timestamp NULL COMMENT 'วันที่ปฏิเสธ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_DELETED_AT\` \`TRANX_DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_BANK_RECONCILES\` DROP FOREIGN KEY \`FK_1aec8abb0158ecffaac5b506121\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_BANK_RECONCILES\` CHANGE \`TRANX_ID\` \`TRANX_ID\` int NULL COMMENT 'รหัสธุรกรรม (Foreign Key)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_BANK_RECONCILES\` CHANGE \`BR_REF2\` \`BR_REF2\` varchar(20) NULL COMMENT 'Ref 2'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_BANK_RECONCILES\` CHANGE \`BR_REF3\` \`BR_REF3\` varchar(20) NULL COMMENT 'Ref 3'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_BANK_RECONCILES\` CHANGE \`BR_REF4\` \`BR_REF4\` varchar(20) NULL COMMENT 'Ref 4'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_BANK_RECONCILES\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER\` CHANGE \`USER_NATIONAL_ID\` \`USER_NATIONAL_ID\` varchar(13) NULL COMMENT 'หมายเลขบัตรประชาชน 13 หลัก'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER\` CHANGE \`USER_PASSPORT_NO\` \`USER_PASSPORT_NO\` varchar(50) NULL COMMENT 'หมายเลขหนังสือเดินทาง'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_TITLE_TH\` \`USER_TITLE_TH\` varchar(50) NULL COMMENT 'คำนำหน้าชื่อภาษาไทย'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_FULLNAME_TH\` \`USER_FULLNAME_TH\` varchar(200) NULL COMMENT 'ชื่อ-นามสกุล ภาษาไทย'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_TITLE_EN\` \`USER_TITLE_EN\` varchar(50) NULL COMMENT 'คำนำหน้าชื่อภาษาอังกฤษ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_FULLNAME_EN\` \`USER_FULLNAME_EN\` varchar(200) NULL COMMENT 'ชื่อ-นามสกุล ภาษาอังกฤษ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_DATE_OF_BIRTH\` \`USER_DATE_OF_BIRTH\` date NULL COMMENT 'วันเกิด'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_PHONE\` \`USER_PHONE\` varchar(20) NULL COMMENT 'เบอร์โทรศัพท์'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_EDUCATION\` \`USER_EDUCATION\` varchar(100) NULL COMMENT 'ระดับการศึกษา'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_FACULTY\` \`USER_FACULTY\` varchar(100) NULL COMMENT 'คณะ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_COUNTRY\` \`USER_COUNTRY\` varchar(100) NULL COMMENT 'ประเทศ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_ADDRESS\` \`USER_ADDRESS\` varchar(200) NULL COMMENT 'ที่อยู่'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` ADD CONSTRAINT \`FK_25a9d2f8adb489feae2f7e01b25\` FOREIGN KEY (\`FUND_SOURCE_ID\`) REFERENCES \`FIN_T_FUND_SOURCES\`(\`FS_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` ADD CONSTRAINT \`FK_1750516f463098dc80c570028dd\` FOREIGN KEY (\`LOCATION_ID\`) REFERENCES \`EXAM_T_LOCATIONS\`(\`LOCATION_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_BANK_RECONCILES\` ADD CONSTRAINT \`FK_1aec8abb0158ecffaac5b506121\` FOREIGN KEY (\`TRANX_ID\`) REFERENCES \`FIN_T_TRANSACTIONS\`(\`TRANX_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_BANK_RECONCILES\` DROP FOREIGN KEY \`FK_1aec8abb0158ecffaac5b506121\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` DROP FOREIGN KEY \`FK_1750516f463098dc80c570028dd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` DROP FOREIGN KEY \`FK_25a9d2f8adb489feae2f7e01b25\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_ADDRESS\` \`USER_ADDRESS\` varchar(200) NULL COMMENT 'ที่อยู่' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_COUNTRY\` \`USER_COUNTRY\` varchar(100) NULL COMMENT 'ประเทศ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_FACULTY\` \`USER_FACULTY\` varchar(100) NULL COMMENT 'คณะ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_EDUCATION\` \`USER_EDUCATION\` varchar(100) NULL COMMENT 'ระดับการศึกษา' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_PHONE\` \`USER_PHONE\` varchar(20) NULL COMMENT 'เบอร์โทรศัพท์' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_DATE_OF_BIRTH\` \`USER_DATE_OF_BIRTH\` date NULL COMMENT 'วันเกิด' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_FULLNAME_EN\` \`USER_FULLNAME_EN\` varchar(200) NULL COMMENT 'ชื่อ-นามสกุล ภาษาอังกฤษ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_TITLE_EN\` \`USER_TITLE_EN\` varchar(50) NULL COMMENT 'คำนำหน้าชื่อภาษาอังกฤษ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_FULLNAME_TH\` \`USER_FULLNAME_TH\` varchar(200) NULL COMMENT 'ชื่อ-นามสกุล ภาษาไทย' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_TITLE_TH\` \`USER_TITLE_TH\` varchar(50) NULL COMMENT 'คำนำหน้าชื่อภาษาไทย' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER\` CHANGE \`USER_PASSPORT_NO\` \`USER_PASSPORT_NO\` varchar(50) NULL COMMENT 'หมายเลขหนังสือเดินทาง' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER\` CHANGE \`USER_NATIONAL_ID\` \`USER_NATIONAL_ID\` varchar(13) NULL COMMENT 'หมายเลขบัตรประชาชน 13 หลัก' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_BANK_RECONCILES\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_BANK_RECONCILES\` CHANGE \`BR_REF4\` \`BR_REF4\` varchar(20) NULL COMMENT 'Ref 4' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_BANK_RECONCILES\` CHANGE \`BR_REF3\` \`BR_REF3\` varchar(20) NULL COMMENT 'Ref 3' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_BANK_RECONCILES\` CHANGE \`BR_REF2\` \`BR_REF2\` varchar(20) NULL COMMENT 'Ref 2' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_BANK_RECONCILES\` CHANGE \`TRANX_ID\` \`TRANX_ID\` int NULL COMMENT 'รหัสธุรกรรม (Foreign Key)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_BANK_RECONCILES\` ADD CONSTRAINT \`FK_1aec8abb0158ecffaac5b506121\` FOREIGN KEY (\`TRANX_ID\`) REFERENCES \`FIN_T_TRANSACTIONS\`(\`TRANX_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_DELETED_AT\` \`TRANX_DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_REJECTED_AT\` \`TRANX_REJECTED_AT\` timestamp NULL COMMENT 'วันที่ปฏิเสธ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_PAID_AT\` \`TRANX_PAID_AT\` timestamp NULL COMMENT 'วันที่ชำระเงิน' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_EXPIRES_AT\` \`TRANX_EXPIRES_AT\` timestamp NULL COMMENT 'วันหมดอายุ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_EFFECTIVE_DATE\` \`TRANX_EFFECTIVE_DATE\` timestamp NULL COMMENT 'วันที่มีผล' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_BANK_DATETIME\` \`TRANX_BANK_DATETIME\` timestamp NULL COMMENT 'วันเวลาธนาคาร' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_BANK_REF\` \`TRANX_BANK_REF\` varchar(20) NULL COMMENT 'Bank Ref' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_REF4\` \`TRANX_REF4\` varchar(20) NULL COMMENT 'Ref 4' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_REF3\` \`TRANX_REF3\` varchar(20) NULL COMMENT 'Ref 3' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_REF2\` \`TRANX_REF2\` varchar(20) NULL COMMENT 'Ref 2' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_RECEIPTS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_RECEIPTS\` CHANGE \`RC_ISSUED_AT\` \`RC_ISSUED_AT\` timestamp NULL COMMENT 'วันที่ออกใบเสร็จ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` CHANGE \`ERM_AT\` \`ERM_AT\` timestamp NULL COMMENT 'วันที่ตรวจสอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` CHANGE \`ERM_SEAT_NUMBER\` \`ERM_SEAT_NUMBER\` varchar(9) NULL COMMENT 'เลขที่นั่งสอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SCORES\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SCORES\` CHANGE \`SC_BAND_LEVEL\` \`SC_BAND_LEVEL\` int NULL COMMENT 'ระดับ Band' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SCORES\` CHANGE \`SC_TOTAL_SCORE\` \`SC_TOTAL_SCORE\` decimal(5,2) NULL COMMENT 'คะแนนรวม' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SCORES\` CHANGE \`SC_READING_SCORE\` \`SC_READING_SCORE\` decimal(5,2) NULL COMMENT 'คะแนน Reading' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SCORES\` CHANGE \`SC_LANG_USE_SCORE\` \`SC_LANG_USE_SCORE\` decimal(5,2) NULL COMMENT 'คะแนน Language Use' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_CERTIFICATES\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_CERTIFICATES\` CHANGE \`CERT_EXPIRES_AT\` \`CERT_EXPIRES_AT\` timestamp NULL COMMENT 'วันที่ใบรับรองหมดอายุ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_CERTIFICATES\` CHANGE \`CERT_ISSUED_AT\` \`CERT_ISSUED_AT\` timestamp NULL COMMENT 'วันที่ออกใบรับรอง' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ATTENDANCES\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ATTENDANCES\` CHANGE \`ATTEND_CHECK_IN_TIME\` \`ATTEND_CHECK_IN_TIME\` timestamp NULL COMMENT 'วันที่เข้าสอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_VOUCHERS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบบัตรสอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบรอบสอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` CHANGE \`SS_CAPACITY\` \`SS_CAPACITY\` int NULL COMMENT 'จำนวนที่นั่ง' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` CHANGE \`SS_END_TIME\` \`SS_END_TIME\` time NULL COMMENT 'เวลาสิ้นสุดการสอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` CHANGE \`SS_START_TIME\` \`SS_START_TIME\` time NULL COMMENT 'เวลาเริ่มสอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` DROP COLUMN \`LOCATION_ID\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` ADD \`LOCATION_ID\` varchar(100) NULL COMMENT 'ชื่อสถานที่จัดสอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบสถานที่จัดสอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`LOCATION_ROOM_NO\` \`LOCATION_ROOM_NO\` varchar(50) NULL COMMENT 'เลขที่ห้องสอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_MOODLE_COURSE_ID\` \`EXAM_MOODLE_COURSE_ID\` varchar(100) NULL COMMENT 'รหัสวิชาใน moodle' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_PAY_END_DATE\` \`EXAM_PAY_END_DATE\` timestamp NULL COMMENT 'วันที่ปิดให้ชำระเงิน' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_PAY_START_DATE\` \`EXAM_PAY_START_DATE\` timestamp NULL COMMENT 'วันที่เปิดให้ชำระเงิน' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_REG_END_DATE\` \`EXAM_REG_END_DATE\` timestamp NULL COMMENT 'วันที่ปิดรับสมัคร' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_REG_START_DATE\` \`EXAM_REG_START_DATE\` timestamp NULL COMMENT 'วันที่เปิดรับสมัคร' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_DATE\` \`EXAM_DATE\` date NULL COMMENT 'วันที่สอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_FEE\` \`EXAM_FEE\` decimal(10,2) NULL COMMENT 'ค่าสมัครสอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_FORMAT\` \`EXAM_FORMAT\` varchar(50) NULL COMMENT 'รูปแบบข้อสอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`EXAM_TYPE\` \`EXAM_TYPE\` varchar(50) NULL COMMENT 'ประเภทข้อสอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_FUND_SOURCES\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_ROLE\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` DROP COLUMN \`FUND_SOURCE_ID\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` CHANGE \`LOCATION_ID\` \`LOCATION_NAME\` varchar(100) NULL COMMENT 'ชื่อสถานที่จัดสอบ' DEFAULT 'NULL'`,
    );
  }
}
