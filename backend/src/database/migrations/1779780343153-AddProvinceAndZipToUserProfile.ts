import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProvinceAndZipToUserProfile1779780343153 implements MigrationInterface {
  name = 'AddProvinceAndZipToUserProfile1779780343153';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` ADD \`USER_PROVINCE\` varchar(200) NULL COMMENT 'จังหวัด'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` ADD \`USER_ZIP_CODE\` varchar(10) NULL COMMENT 'รหัสไปรษณีย์'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_ROLE\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_FUND_SOURCES\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` DROP FOREIGN KEY \`FK_25a9d2f8adb489feae2f7e01b25\``,
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
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`FUND_SOURCE_ID\` \`FUND_SOURCE_ID\` int NULL COMMENT 'รหัสแหล่งทุน'`,
    );
    await queryRunner.query(
      `DROP INDEX \`UQ_LOCATION_SEAT_LABEL\` ON \`EXAM_T_LOCATION_SEATS\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATION_SEATS\` CHANGE \`LS_SEAT_LABEL\` \`LS_SEAT_LABEL\` varchar(50) NULL COMMENT 'Label ที่นั่ง'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATION_SEATS\` CHANGE \`LS_SORT_ORDER\` \`LS_SORT_ORDER\` int NULL COMMENT 'ลำดับการเรียง'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATION_SEATS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSION_LOCATIONS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`LOCATION_ROOM_NO\` \`LOCATION_ROOM_NO\` varchar(50) NULL COMMENT 'เลขที่ห้องสอบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`LOCATION_FLOOR_NO\` \`LOCATION_FLOOR_NO\` int NULL COMMENT 'ชั้น'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`LOCATION_TOTAL_ROWS\` \`LOCATION_TOTAL_ROWS\` int NULL COMMENT 'จำนวนแถวทั้งหมด'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`LOCATION_TOTAL_COLS\` \`LOCATION_TOTAL_COLS\` int NULL COMMENT 'จำนวนคอลัมน์ทั้งหมด'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`LOCATION_SEAT_CAPACITY\` \`LOCATION_SEAT_CAPACITY\` int NULL COMMENT 'ความจุที่นั่งทั้งหมด'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`SEAT_LABEL_FORMAT\` \`SEAT_LABEL_FORMAT\` enum ('ROW_COL', 'RUNNING_NUMBER', 'CUSTOM') NULL COMMENT 'รูปแบบ Label ที่นั่ง (ROW_COL, RUNNING_NUMBER, CUSTOM)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบสถานที่จัดสอบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` DROP FOREIGN KEY \`FK_1750516f463098dc80c570028dd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` CHANGE \`LOCATION_ID\` \`LOCATION_ID\` int NULL COMMENT 'รหัสสถานที่จัดสอบ (FK)'`,
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
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` DROP FOREIGN KEY \`FK_d84f9ac2be485362f3a6b9d2d60\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` DROP FOREIGN KEY \`FK_cf729cd2f7dbec21e1b580268f4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` CHANGE \`SL_ID\` \`SL_ID\` int NULL COMMENT 'รหัส Session-Location (FK)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` CHANGE \`LS_ID\` \`LS_ID\` int NULL COMMENT 'รหัสที่นั่งในห้องสอบ (FK)'`,
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
      `ALTER TABLE \`FIN_T_VOIDED_RECEIPTS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_RECEIPTS\` CHANGE \`RC_ISSUED_AT\` \`RC_ISSUED_AT\` timestamp NULL COMMENT 'วันที่ออกใบเสร็จ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_RECEIPTS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS_REFS\` DROP FOREIGN KEY \`FK_7fb8fc27da858f35d3291eec0b7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS_REFS\` CHANGE \`BR_ID\` \`BR_ID\` int NULL COMMENT 'รหัส Bank Reconcile (Foreign Key)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS_REFS\` CHANGE \`TSC_REF2\` \`TSC_REF2\` varchar(20) NULL COMMENT 'เลขอ้างอิง 2'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS_REFS\` CHANGE \`TSC_REF3\` \`TSC_REF3\` varchar(20) NULL COMMENT 'เลขอ้างอิง 3'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS_REFS\` CHANGE \`TSC_REF4\` \`TSC_REF4\` varchar(20) NULL COMMENT 'เลขอ้างอิง 4'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS_REFS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTION_PROFILE\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_PAYMENT_CONFIG\` CHANGE \`PC_EFFECTIVE_FROM\` \`PC_EFFECTIVE_FROM\` timestamp NOT NULL COMMENT 'วันที่เริ่มใช้ config นี้'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_PAYMENT_CONFIG\` CHANGE \`PC_EFFECTIVE_TO\` \`PC_EFFECTIVE_TO\` timestamp NULL COMMENT 'วันที่หมดอายุ '`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_PAYMENT_CONFIG\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTION_STATUS_HISTORY\` CHANGE \`TSH_FROM\` \`TSH_FROM\` varchar(20) NULL COMMENT 'สถานะก่อนเปลี่ยน (NULL = เพิ่งสร้างใหม่)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` DROP FOREIGN KEY \`FK_4a3ed356e599726101dfb291af6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`PC_ID\` \`PC_ID\` int NULL COMMENT 'รหัสการตั้งค่าการชำระเงิน (Foreign Key)'`,
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
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_INSTITUTION\` \`USER_INSTITUTION\` varchar(200) NULL COMMENT 'ชื่อสถานศึกษา'`,
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
      `ALTER TABLE \`BUU_GET_T_USER\` CHANGE \`USER_NATIONAL_ID\` \`USER_NATIONAL_ID\` varchar(13) NULL COMMENT 'หมายเลขบัตรประชาชน 13 หลัก'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER\` CHANGE \`USER_PASSPORT_NO\` \`USER_PASSPORT_NO\` varchar(50) NULL COMMENT 'หมายเลขหนังสือเดินทาง'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_IMAGE\` CHANGE \`USER_IMAGE_URL\` \`USER_IMAGE_URL\` text NULL COMMENT 'URL หรือ Base64 ของรูปภาพผู้ใช้งาน'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`UQ_LOCATION_SEAT_LABEL\` ON \`EXAM_T_LOCATION_SEATS\` (\`LOCATION_ID\`, \`LS_SEAT_LABEL\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` ADD CONSTRAINT \`FK_25a9d2f8adb489feae2f7e01b25\` FOREIGN KEY (\`FUND_SOURCE_ID\`) REFERENCES \`FIN_T_FUND_SOURCES\`(\`FS_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` ADD CONSTRAINT \`FK_1750516f463098dc80c570028dd\` FOREIGN KEY (\`LOCATION_ID\`) REFERENCES \`EXAM_T_LOCATIONS\`(\`LOCATION_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` ADD CONSTRAINT \`FK_d84f9ac2be485362f3a6b9d2d60\` FOREIGN KEY (\`SL_ID\`) REFERENCES \`EXAM_T_SESSION_LOCATIONS\`(\`SL_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` ADD CONSTRAINT \`FK_cf729cd2f7dbec21e1b580268f4\` FOREIGN KEY (\`LS_ID\`) REFERENCES \`EXAM_T_LOCATION_SEATS\`(\`LS_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS_REFS\` ADD CONSTRAINT \`FK_7fb8fc27da858f35d3291eec0b7\` FOREIGN KEY (\`BR_ID\`) REFERENCES \`FIN_T_BANK_RECONCILES\`(\`BR_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` ADD CONSTRAINT \`FK_4a3ed356e599726101dfb291af6\` FOREIGN KEY (\`PC_ID\`) REFERENCES \`FIN_T_PAYMENT_CONFIG\`(\`PC_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` DROP FOREIGN KEY \`FK_4a3ed356e599726101dfb291af6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS_REFS\` DROP FOREIGN KEY \`FK_7fb8fc27da858f35d3291eec0b7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` DROP FOREIGN KEY \`FK_cf729cd2f7dbec21e1b580268f4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` DROP FOREIGN KEY \`FK_d84f9ac2be485362f3a6b9d2d60\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` DROP FOREIGN KEY \`FK_1750516f463098dc80c570028dd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` DROP FOREIGN KEY \`FK_25a9d2f8adb489feae2f7e01b25\``,
    );
    await queryRunner.query(
      `DROP INDEX \`UQ_LOCATION_SEAT_LABEL\` ON \`EXAM_T_LOCATION_SEATS\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_IMAGE\` CHANGE \`USER_IMAGE_URL\` \`USER_IMAGE_URL\` text NULL COMMENT 'URL หรือ Base64 ของรูปภาพผู้ใช้งาน' DEFAULT 'NULL'`,
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
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_ADDRESS\` \`USER_ADDRESS\` varchar(200) NULL COMMENT 'ที่อยู่' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_COUNTRY\` \`USER_COUNTRY\` varchar(100) NULL COMMENT 'ประเทศ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` CHANGE \`USER_INSTITUTION\` \`USER_INSTITUTION\` varchar(200) NULL COMMENT 'ชื่อสถานศึกษา' DEFAULT 'NULL'`,
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
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`PC_ID\` \`PC_ID\` int NULL COMMENT 'รหัสการตั้งค่าการชำระเงิน (Foreign Key)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` ADD CONSTRAINT \`FK_4a3ed356e599726101dfb291af6\` FOREIGN KEY (\`PC_ID\`) REFERENCES \`FIN_T_PAYMENT_CONFIG\`(\`PC_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTION_STATUS_HISTORY\` CHANGE \`TSH_FROM\` \`TSH_FROM\` varchar(20) NULL COMMENT 'สถานะก่อนเปลี่ยน (NULL = เพิ่งสร้างใหม่)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_PAYMENT_CONFIG\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_PAYMENT_CONFIG\` CHANGE \`PC_EFFECTIVE_TO\` \`PC_EFFECTIVE_TO\` timestamp NULL COMMENT 'วันที่หมดอายุ ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_PAYMENT_CONFIG\` CHANGE \`PC_EFFECTIVE_FROM\` \`PC_EFFECTIVE_FROM\` timestamp NOT NULL COMMENT 'วันที่เริ่มใช้ config นี้' DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTION_PROFILE\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS_REFS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS_REFS\` CHANGE \`TSC_REF4\` \`TSC_REF4\` varchar(20) NULL COMMENT 'เลขอ้างอิง 4' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS_REFS\` CHANGE \`TSC_REF3\` \`TSC_REF3\` varchar(20) NULL COMMENT 'เลขอ้างอิง 3' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS_REFS\` CHANGE \`TSC_REF2\` \`TSC_REF2\` varchar(20) NULL COMMENT 'เลขอ้างอิง 2' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS_REFS\` CHANGE \`BR_ID\` \`BR_ID\` int NULL COMMENT 'รหัส Bank Reconcile (Foreign Key)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS_REFS\` ADD CONSTRAINT \`FK_7fb8fc27da858f35d3291eec0b7\` FOREIGN KEY (\`BR_ID\`) REFERENCES \`FIN_T_BANK_RECONCILES\`(\`BR_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_RECEIPTS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_RECEIPTS\` CHANGE \`RC_ISSUED_AT\` \`RC_ISSUED_AT\` timestamp NULL COMMENT 'วันที่ออกใบเสร็จ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_VOIDED_RECEIPTS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)' DEFAULT 'NULL'`,
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
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` CHANGE \`LS_ID\` \`LS_ID\` int NULL COMMENT 'รหัสที่นั่งในห้องสอบ (FK)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` CHANGE \`SL_ID\` \`SL_ID\` int NULL COMMENT 'รหัส Session-Location (FK)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` ADD CONSTRAINT \`FK_cf729cd2f7dbec21e1b580268f4\` FOREIGN KEY (\`LS_ID\`) REFERENCES \`EXAM_T_LOCATION_SEATS\`(\`LS_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` ADD CONSTRAINT \`FK_d84f9ac2be485362f3a6b9d2d60\` FOREIGN KEY (\`SL_ID\`) REFERENCES \`EXAM_T_SESSION_LOCATIONS\`(\`SL_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE \`EXAM_T_SESSIONS\` CHANGE \`LOCATION_ID\` \`LOCATION_ID\` int NULL COMMENT 'รหัสสถานที่จัดสอบ (FK)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSIONS\` ADD CONSTRAINT \`FK_1750516f463098dc80c570028dd\` FOREIGN KEY (\`LOCATION_ID\`) REFERENCES \`EXAM_T_LOCATIONS\`(\`LOCATION_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบสถานที่จัดสอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`SEAT_LABEL_FORMAT\` \`SEAT_LABEL_FORMAT\` enum ('ROW_COL', 'RUNNING_NUMBER', 'CUSTOM') NULL COMMENT 'รูปแบบ Label ที่นั่ง (ROW_COL, RUNNING_NUMBER, CUSTOM)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`LOCATION_SEAT_CAPACITY\` \`LOCATION_SEAT_CAPACITY\` int NULL COMMENT 'ความจุที่นั่งทั้งหมด' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`LOCATION_TOTAL_COLS\` \`LOCATION_TOTAL_COLS\` int NULL COMMENT 'จำนวนคอลัมน์ทั้งหมด' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`LOCATION_TOTAL_ROWS\` \`LOCATION_TOTAL_ROWS\` int NULL COMMENT 'จำนวนแถวทั้งหมด' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`LOCATION_FLOOR_NO\` \`LOCATION_FLOOR_NO\` int NULL COMMENT 'ชั้น' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` CHANGE \`LOCATION_ROOM_NO\` \`LOCATION_ROOM_NO\` varchar(50) NULL COMMENT 'เลขที่ห้องสอบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSION_LOCATIONS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATION_SEATS\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATION_SEATS\` CHANGE \`LS_SORT_ORDER\` \`LS_SORT_ORDER\` int NULL COMMENT 'ลำดับการเรียง' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATION_SEATS\` CHANGE \`LS_SEAT_LABEL\` \`LS_SEAT_LABEL\` varchar(50) NULL COMMENT 'Label ที่นั่ง' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`UQ_LOCATION_SEAT_LABEL\` ON \`EXAM_T_LOCATION_SEATS\` (\`LOCATION_ID\`, \`LS_SEAT_LABEL\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` CHANGE \`FUND_SOURCE_ID\` \`FUND_SOURCE_ID\` int NULL COMMENT 'รหัสแหล่งทุน' DEFAULT 'NULL'`,
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
      `ALTER TABLE \`EXAM_T_EXAM\` ADD CONSTRAINT \`FK_25a9d2f8adb489feae2f7e01b25\` FOREIGN KEY (\`FUND_SOURCE_ID\`) REFERENCES \`FIN_T_FUND_SOURCES\`(\`FS_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_FUND_SOURCES\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_ROLE\` CHANGE \`DELETED_AT\` \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ' DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` DROP COLUMN \`USER_ZIP_CODE\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER_PROFILE\` DROP COLUMN \`USER_PROVINCE\``,
    );
  }
}
