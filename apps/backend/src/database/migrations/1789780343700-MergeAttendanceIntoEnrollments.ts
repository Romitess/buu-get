import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * รวม attendance เข้า enrollment เป็นแหล่งข้อมูลเดียว
 * - เพิ่ม ERM_ATTEND_CHECK_IN_TIME
 * - backfill จากแถวล่าสุดของ EXAM_T_ATTENDANCES ต่อ ERM_ID
 * - map สถานะเป็น ERM_STATUS: 4=ATTENDED, 6=MISSING
 * - ลบตาราง EXAM_T_ATTENDANCES
 */
export class MergeAttendanceIntoEnrollments1789780343700 implements MigrationInterface {
  name = 'MergeAttendanceIntoEnrollments1789780343700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\`
        ADD \`ERM_ATTEND_CHECK_IN_TIME\` timestamp NULL
          COMMENT 'เวลาที่เข้าสอบ/เช็กอิน'`,
    );

    // เลือกแถว attendance ล่าสุดต่อ ERM_ID ตาม ATTEND_CHECK_IN_TIME แล้ว tie-break ด้วย ATTEND_ID
    await queryRunner.query(`
      UPDATE \`EXAM_T_ENROLLMENTS\` e
      INNER JOIN (
        SELECT ranked.\`ERM_ID\`, ranked.\`ATTEND_STATUS\`, ranked.\`ATTEND_CHECK_IN_TIME\`
        FROM (
          SELECT
            a.\`ERM_ID\`,
            a.\`ATTEND_STATUS\`,
            a.\`ATTEND_CHECK_IN_TIME\`,
            ROW_NUMBER() OVER (
              PARTITION BY a.\`ERM_ID\`
              ORDER BY COALESCE(a.\`ATTEND_CHECK_IN_TIME\`, a.\`CREATED_AT\`) DESC,
                       a.\`ATTEND_ID\` DESC
            ) AS rn
          FROM \`EXAM_T_ATTENDANCES\` a
          WHERE a.\`DELETED_AT\` IS NULL
        ) ranked
        WHERE ranked.rn = 1
      ) src ON src.\`ERM_ID\` = e.\`ERM_ID\`
      SET
        e.\`ERM_STATUS\` = CASE
          WHEN src.\`ATTEND_STATUS\` = 1 THEN 4
          ELSE e.\`ERM_STATUS\`
        END,
        e.\`ERM_ATTEND_CHECK_IN_TIME\` = src.\`ATTEND_CHECK_IN_TIME\`
    `);

    // ผู้ที่อยู่ในกลุ่มชำระเงินแล้ว แต่ไม่มี attended record ให้เป็น MISSING
    await queryRunner.query(`
      UPDATE \`EXAM_T_ENROLLMENTS\`
      SET \`ERM_STATUS\` = 6
      WHERE \`ERM_STATUS\` IN (1, 2, 3)
        AND (\`ERM_ATTEND_CHECK_IN_TIME\` IS NULL)
    `);

    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` CHANGE \`ERM_STATUS\` \`ERM_STATUS\` tinyint NOT NULL COMMENT 'สถานะการสมัคร/เข้าสอบ (0:UNPAID, 1:PAID, 2:SEAT_ASSIGNED, 3:SEAT_PUBLISHED, 4:ATTENDED, 5:CANCELLED, 6:MISSING)' DEFAULT '0'`,
    );

    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ATTENDANCES\` DROP FOREIGN KEY \`FK_a772aba213d0f345cfb087cabb1\``,
    );
    await queryRunner.query(`DROP TABLE \`EXAM_T_ATTENDANCES\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`EXAM_T_ATTENDANCES\` (
        \`ATTEND_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสผู้เข้าสอบ',
        \`ERM_ID\` int NOT NULL COMMENT 'รหัสผู้สมัคร',
        \`ATTEND_CHECK_IN_TIME\` timestamp NULL COMMENT 'วันที่เข้าสอบ',
        \`ATTEND_STATUS\` tinyint NOT NULL COMMENT 'สถานะการเข้าสอบ (0:MISSING, 1:INTIME)' DEFAULT '0',
        \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6),
        \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไข' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ',
        PRIMARY KEY (\`ATTEND_ID\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ATTENDANCES\`
        ADD CONSTRAINT \`FK_a772aba213d0f345cfb087cabb1\`
        FOREIGN KEY (\`ERM_ID\`) REFERENCES \`EXAM_T_ENROLLMENTS\`(\`ERM_ID\`)
        ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`
      INSERT INTO \`EXAM_T_ATTENDANCES\`
        (\`ERM_ID\`, \`ATTEND_CHECK_IN_TIME\`, \`ATTEND_STATUS\`)
      SELECT
        e.\`ERM_ID\`,
        e.\`ERM_ATTEND_CHECK_IN_TIME\`,
        CASE WHEN e.\`ERM_STATUS\` = 4 THEN 1 ELSE 0 END
      FROM \`EXAM_T_ENROLLMENTS\` e
      WHERE e.\`ERM_STATUS\` IN (4, 6)
         OR e.\`ERM_ATTEND_CHECK_IN_TIME\` IS NOT NULL
    `);

    // rollback ค่าที่เป็น MISSING กลับไปสถานะ seat published เพื่อคง enum เดิม (0-5)
    await queryRunner.query(`
      UPDATE \`EXAM_T_ENROLLMENTS\`
      SET \`ERM_STATUS\` = 3
      WHERE \`ERM_STATUS\` = 6
    `);
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` CHANGE \`ERM_STATUS\` \`ERM_STATUS\` tinyint NOT NULL COMMENT 'สถานะการชำระเงิน (0:UNPAID, 1:PAID, 2:SEAT_ASSIGNED, 3:SEAT_PUBLISHED, 4:ATTENDED, 5:CANCELLED)' DEFAULT '0'`,
    );

    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` DROP COLUMN \`ERM_ATTEND_CHECK_IN_TIME\``,
    );
  }
}
