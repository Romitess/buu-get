import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLayoutColumnsToSessionLocationsOnly1789780343240 implements MigrationInterface {
  name = 'AddLayoutColumnsToSessionLocationsOnly1789780343240';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSION_LOCATIONS\` ADD \`TOTAL_ROWS\` int NULL COMMENT 'จำนวนแถวทั้งหมด'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSION_LOCATIONS\` ADD \`TOTAL_COLS\` int NULL COMMENT 'จำนวนคอลัมน์ทั้งหมด'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSION_LOCATIONS\` ADD \`AISLE_AFTER\` json NULL COMMENT 'ข้อมูลทางเดินหลังจากคอลัมน์/แถว'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSION_LOCATIONS\` ADD \`LOCATION_SEAT_DIRECTION\` enum ('HORIZONTAL', 'VERTICAL') NOT NULL COMMENT 'ทิศทางการจัดเรียงที่นั่ง' DEFAULT 'HORIZONTAL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSION_LOCATIONS\` ADD \`LOCATION_SEAT_CAPACITY\` int NULL COMMENT 'ความจุที่นั่งทั้งหมด'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSION_LOCATIONS\` ADD \`SEATS_SNAPSHOT\` json NULL COMMENT 'ผังที่นั่ง snapshot'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSION_LOCATIONS\` DROP COLUMN \`SEATS_SNAPSHOT\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSION_LOCATIONS\` DROP COLUMN \`LOCATION_SEAT_CAPACITY\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSION_LOCATIONS\` DROP COLUMN \`LOCATION_SEAT_DIRECTION\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSION_LOCATIONS\` DROP COLUMN \`AISLE_AFTER\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSION_LOCATIONS\` DROP COLUMN \`TOTAL_COLS\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_SESSION_LOCATIONS\` DROP COLUMN \`TOTAL_ROWS\``,
    );
  }
}
