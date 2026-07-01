import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignExamEnrollmentsWithErd1789780343220 implements MigrationInterface {
  name = 'AlignExamEnrollmentsWithErd1789780343220';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\`
        ADD \`ERM_SEAT_LABEL\` varchar(50) NULL COMMENT 'เลขที่นั่งสอบ/รหัสที่นั่งสอบ'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\`
        ADD \`ERM_SORT_ORDER\` int NULL COMMENT 'ลำดับการเรียงที่นั่ง'`,
    );
    await queryRunner.query(
      `UPDATE \`EXAM_T_ENROLLMENTS\` enrollment
        LEFT JOIN \`EXAM_T_LOCATION_SEATS\` seat ON seat.\`LS_ID\` = enrollment.\`LS_ID\`
        SET enrollment.\`ERM_SEAT_LABEL\` = seat.\`LS_SEAT_LABEL\`,
            enrollment.\`ERM_SORT_ORDER\` = seat.\`LS_SORT_ORDER\`
        WHERE enrollment.\`LS_ID\` IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\`
        DROP FOREIGN KEY \`FK_cf729cd2f7dbec21e1b580268f4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` DROP COLUMN \`LS_ID\``,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`UQ_ENROLLMENT_SEAT_LABEL\`
        ON \`EXAM_T_ENROLLMENTS\` (\`SL_ID\`, \`ERM_SEAT_LABEL\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`UQ_ENROLLMENT_SEAT_LABEL\` ON \`EXAM_T_ENROLLMENTS\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\`
        ADD \`LS_ID\` int NULL COMMENT 'รหัสที่นั่งในห้องสอบ (FK)'`,
    );
    await queryRunner.query(
      `UPDATE \`EXAM_T_ENROLLMENTS\` enrollment
        LEFT JOIN \`EXAM_T_SESSION_LOCATIONS\` sessionLocation
          ON sessionLocation.\`SL_ID\` = enrollment.\`SL_ID\`
        LEFT JOIN \`EXAM_T_LOCATION_SEATS\` seat
          ON seat.\`LOCATION_ID\` = sessionLocation.\`LOCATION_ID\`
          AND seat.\`LS_SEAT_LABEL\` = enrollment.\`ERM_SEAT_LABEL\`
        SET enrollment.\`LS_ID\` = seat.\`LS_ID\`
        WHERE enrollment.\`ERM_SEAT_LABEL\` IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\`
        ADD CONSTRAINT \`FK_cf729cd2f7dbec21e1b580268f4\`
        FOREIGN KEY (\`LS_ID\`) REFERENCES \`EXAM_T_LOCATION_SEATS\`(\`LS_ID\`)
        ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` DROP COLUMN \`ERM_SORT_ORDER\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` DROP COLUMN \`ERM_SEAT_LABEL\``,
    );
  }
}
