import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSeatDirectionAndAislesToLocations1789780343181 implements MigrationInterface {
  name = 'AddSeatDirectionAndAislesToLocations1789780343181';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` ADD \`SEAT_DIRECTION\` enum ('HORIZONTAL', 'VERTICAL') NOT NULL COMMENT 'Seat numbering direction (HORIZONTAL, VERTICAL)' DEFAULT 'HORIZONTAL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` ADD \`AISLE_AFTER_COLS\` json NULL COMMENT 'Column indexes that have an aisle after them'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` ADD \`AISLE_AFTER_ROWS\` json NULL COMMENT 'Row indexes that have an aisle after them'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` DROP COLUMN \`LOCATION_IS_SPLIT\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` ADD \`LOCATION_IS_SPLIT\` tinyint NOT NULL COMMENT 'สถานะการแบ่งที่นั่ง (0: NORMAL, 1: SPLIT)' DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` DROP COLUMN \`AISLE_AFTER_ROWS\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` DROP COLUMN \`AISLE_AFTER_COLS\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` DROP COLUMN \`SEAT_DIRECTION\``,
    );
  }
}
