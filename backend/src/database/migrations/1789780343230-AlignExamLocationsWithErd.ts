import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignExamLocationsWithErd1789780343230 implements MigrationInterface {
  name = 'AlignExamLocationsWithErd1789780343230';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\`
        CHANGE \`SEAT_DIRECTION\` \`LOCATION_SEAT_DIRECTION\`
        enum ('HORIZONTAL', 'VERTICAL') NOT NULL
        COMMENT 'ทิศทางการจัดเรียงที่นั่ง' DEFAULT 'HORIZONTAL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\`
        CHANGE \`AISLE_AFTER_COLS\` \`LOCATION_AISLE_AFTER_COL\`
        json NULL COMMENT 'Column indexes that have an aisle after them'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` DROP COLUMN \`AISLE_AFTER_ROWS\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\` DROP COLUMN \`SEAT_LABEL_FORMAT\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\`
        ADD \`SEAT_LABEL_FORMAT\` enum ('ROW_COL', 'RUNNING_NUMBER', 'CUSTOM') NULL
        COMMENT 'รูปแบบ Label ที่นั่ง (ROW_COL, RUNNING_NUMBER, CUSTOM)'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\`
        ADD \`AISLE_AFTER_ROWS\` json NULL COMMENT 'Row indexes that have an aisle after them'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\`
        CHANGE \`LOCATION_AISLE_AFTER_COL\` \`AISLE_AFTER_COLS\`
        json NULL COMMENT 'Column indexes that have an aisle after them'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_LOCATIONS\`
        CHANGE \`LOCATION_SEAT_DIRECTION\` \`SEAT_DIRECTION\`
        enum ('HORIZONTAL', 'VERTICAL') NOT NULL
        COMMENT 'Seat numbering direction (HORIZONTAL, VERTICAL)' DEFAULT 'HORIZONTAL'`,
    );
  }
}
