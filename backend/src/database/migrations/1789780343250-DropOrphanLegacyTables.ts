import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ลบตารางที่ไม่มี entity รองรับใน backend แล้ว (orphan tables) ทั้งหมดมี 0 แถว
 * - page builder เก่า: BUU_GET_T_BOXES_BANNER / _CARD / _EXAM_RULE / _STEP และ parent BUU_GET_T_PAGE_SECTIONS
 * - join table ที่ relation ถูกถอดออกจาก entity ไปแล้ว: EXAM_SESSION_SUPERVISORS
 * ลำดับการลบไล่จากตารางลูก (BOXES) -> parent (PAGE_SECTIONS) ตาม foreign key
 */
export class DropOrphanLegacyTables1789780343250
  implements MigrationInterface
{
  name = 'DropOrphanLegacyTables1789780343250';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS \`BUU_GET_T_BOXES_BANNER\``,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS \`BUU_GET_T_BOXES_CARD\``);
    await queryRunner.query(
      `DROP TABLE IF EXISTS \`BUU_GET_T_BOXES_EXAM_RULE\``,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS \`BUU_GET_T_BOXES_STEP\``);
    await queryRunner.query(
      `DROP TABLE IF EXISTS \`BUU_GET_T_PAGE_SECTIONS\``,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS \`EXAM_SESSION_SUPERVISORS\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // สร้างตาราง parent ก่อน แล้วค่อยตารางลูกที่อ้าง foreign key
    await queryRunner.query(
      `CREATE TABLE \`BUU_GET_T_PAGE_SECTIONS\` (
        \`PS_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัส section',
        \`PCF_ID\` int NOT NULL COMMENT 'รหัสชุดหน้า (Foreign Key)',
        \`PS_TYPE\` enum('banner','card','step','exam_rule') NOT NULL COMMENT 'ประเภท section (banner, card, step, exam_rule)',
        \`PS_ICON\` varchar(100) NULL COMMENT 'ไอคอนหัวข้อ section (Material icon name)',
        \`PS_SORT_ORDER\` int NOT NULL COMMENT 'ลำดับการแสดงผลของ section',
        \`PS_TITLE_TH\` varchar(255) NULL COMMENT 'หัวข้อ section (ไทย)',
        \`PS_TITLE_EN\` varchar(255) NULL COMMENT 'หัวข้อ section (อังกฤษ)',
        \`PS_ACTIVE\` tinyint NOT NULL DEFAULT 1 COMMENT 'แสดง/ซ่อน section',
        \`CREATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันที่สร้าง',
        \`UPDATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันที่แก้ไขล่าสุด',
        \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)',
        PRIMARY KEY (\`PS_ID\`),
        KEY \`FK_fde0ea319f1527f9dfd3993c5fe\` (\`PCF_ID\`),
        CONSTRAINT \`FK_fde0ea319f1527f9dfd3993c5fe\` FOREIGN KEY (\`PCF_ID\`) REFERENCES \`BUU_GET_T_PAGE_CONFIGS\` (\`PCF_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8`,
    );

    await queryRunner.query(
      `CREATE TABLE \`BUU_GET_T_BOXES_BANNER\` (
        \`BB_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัส banner box',
        \`PS_ID\` int NOT NULL COMMENT 'รหัส section (Foreign Key)',
        \`BB_SORT_ORDER\` int NOT NULL COMMENT 'ลำดับสไลด์',
        \`BB_IMAGE_PATH\` varchar(250) NOT NULL COMMENT 'path รูปภาพใน object storage',
        \`BB_ACTIVE\` tinyint NOT NULL DEFAULT 1 COMMENT 'แสดง/ซ่อน',
        \`CREATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันที่สร้าง',
        \`UPDATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันที่แก้ไขล่าสุด',
        \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)',
        PRIMARY KEY (\`BB_ID\`),
        KEY \`FK_8fc5115ad01a2fdc25c7c07469a\` (\`PS_ID\`),
        CONSTRAINT \`FK_8fc5115ad01a2fdc25c7c07469a\` FOREIGN KEY (\`PS_ID\`) REFERENCES \`BUU_GET_T_PAGE_SECTIONS\` (\`PS_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8`,
    );

    await queryRunner.query(
      `CREATE TABLE \`BUU_GET_T_BOXES_CARD\` (
        \`BC_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัส card box',
        \`PS_ID\` int NOT NULL COMMENT 'รหัส section (Foreign Key)',
        \`BC_SORT_ORDER\` int NOT NULL COMMENT 'ลำดับการ์ด',
        \`BC_TITLE_TH\` varchar(255) NULL COMMENT 'หัวข้อการ์ด (ไทย)',
        \`BC_TITLE_EN\` varchar(255) NULL COMMENT 'หัวข้อการ์ด (อังกฤษ)',
        \`BC_SUBTITLE_TH\` varchar(255) NULL COMMENT 'รายละเอียดการ์ด (ไทย)',
        \`BC_SUBTITLE_EN\` varchar(255) NULL COMMENT 'รายละเอียดการ์ด (อังกฤษ)',
        \`BC_ICON\` varchar(100) NULL COMMENT 'ไอคอนการ์ด (Material icon name)',
        \`BC_ACTIVE\` tinyint NOT NULL DEFAULT 1 COMMENT 'แสดง/ซ่อน',
        \`CREATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันที่สร้าง',
        \`UPDATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันที่แก้ไขล่าสุด',
        \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)',
        PRIMARY KEY (\`BC_ID\`),
        KEY \`FK_32bc8df776e2f1d52057735981e\` (\`PS_ID\`),
        CONSTRAINT \`FK_32bc8df776e2f1d52057735981e\` FOREIGN KEY (\`PS_ID\`) REFERENCES \`BUU_GET_T_PAGE_SECTIONS\` (\`PS_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8`,
    );

    await queryRunner.query(
      `CREATE TABLE \`BUU_GET_T_BOXES_EXAM_RULE\` (
        \`BER_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัส exam rule box',
        \`PS_ID\` int NOT NULL COMMENT 'รหัส section (Foreign Key)',
        \`BER_SORT_ORDER\` int NOT NULL COMMENT 'ลำดับข้อปฏิบัติ',
        \`BER_ICON\` varchar(100) NULL COMMENT 'ไอคอนข้อปฏิบัติ (Material icon name)',
        \`BER_TEXT_TH\` text NULL COMMENT 'ข้อความข้อปฏิบัติ (ไทย)',
        \`BER_TEXT_EN\` text NULL COMMENT 'ข้อความข้อปฏิบัติ (อังกฤษ)',
        \`BER_ACTIVE\` tinyint NOT NULL DEFAULT 1 COMMENT 'แสดง/ซ่อน',
        \`CREATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันที่สร้าง',
        \`UPDATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันที่แก้ไขล่าสุด',
        \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)',
        PRIMARY KEY (\`BER_ID\`),
        KEY \`FK_a2e4b0a69ce212aeeb2ab8af086\` (\`PS_ID\`),
        CONSTRAINT \`FK_a2e4b0a69ce212aeeb2ab8af086\` FOREIGN KEY (\`PS_ID\`) REFERENCES \`BUU_GET_T_PAGE_SECTIONS\` (\`PS_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8`,
    );

    await queryRunner.query(
      `CREATE TABLE \`BUU_GET_T_BOXES_STEP\` (
        \`BS_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัส step box',
        \`PS_ID\` int NOT NULL COMMENT 'รหัส section (Foreign Key)',
        \`BS_SORT_ORDER\` int NOT NULL COMMENT 'ลำดับขั้นตอน (ใช้เป็นหมายเลขขั้นตอนด้วย)',
        \`BS_TITLE_TH\` varchar(255) NULL COMMENT 'หัวข้อขั้นตอน (ไทย)',
        \`BS_TITLE_EN\` varchar(255) NULL COMMENT 'หัวข้อขั้นตอน (อังกฤษ)',
        \`BS_DESCRIPTION_TH\` text NULL COMMENT 'รายละเอียดขั้นตอน (ไทย)',
        \`BS_DESCRIPTION_EN\` text NULL COMMENT 'รายละเอียดขั้นตอน (อังกฤษ)',
        \`BS_ACTIVE\` tinyint NOT NULL DEFAULT 1 COMMENT 'แสดง/ซ่อน',
        \`CREATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันที่สร้าง',
        \`UPDATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันที่แก้ไขล่าสุด',
        \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)',
        PRIMARY KEY (\`BS_ID\`),
        KEY \`FK_65fc41ba9ee678ee427371cac68\` (\`PS_ID\`),
        CONSTRAINT \`FK_65fc41ba9ee678ee427371cac68\` FOREIGN KEY (\`PS_ID\`) REFERENCES \`BUU_GET_T_PAGE_SECTIONS\` (\`PS_ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8`,
    );

    await queryRunner.query(
      `CREATE TABLE \`EXAM_SESSION_SUPERVISORS\` (
        \`SS_ID\` int NOT NULL,
        \`USER_ID\` int NOT NULL,
        INDEX \`IDX_e81013c7bb0b87dda75bda035b\` (\`SS_ID\`),
        INDEX \`IDX_17efc6dfae924607b77defaeb1\` (\`USER_ID\`),
        PRIMARY KEY (\`SS_ID\`, \`USER_ID\`),
        CONSTRAINT \`FK_e81013c7bb0b87dda75bda035b6\` FOREIGN KEY (\`SS_ID\`) REFERENCES \`EXAM_T_SESSIONS\` (\`SS_ID\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_17efc6dfae924607b77defaeb12\` FOREIGN KEY (\`USER_ID\`) REFERENCES \`BUU_GET_T_USER\` (\`USER_ID\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8`,
    );
  }
}
