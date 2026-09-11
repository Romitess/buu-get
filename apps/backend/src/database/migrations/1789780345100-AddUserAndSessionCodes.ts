import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - ขยาย USER_CODE เป็น varchar(10) ตามรูปแบบใหม่
 *   {ปีงบ พ.ศ. 4}{1 ไทย|2 ต่างชาติ}{รัน 5 หลัก} เช่น 2569200001
 * - เพิ่ม SESSION_CODE บน EXAM_T_SESSIONS
 *   {1 ทั่วไป|2 พิเศษ}{ปีงบ ค.ศ. 4}{รัน 3 หลัก} เช่น 22026001
 * - ตาราง sequence สำหรับ allocate ตอนสร้างใหม่
 * - fillback รหัสเดิมทั้งหมด
 */
export class AddUserAndSessionCodes1789780345100 implements MigrationInterface {
  name = 'AddUserAndSessionCodes1789780345100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`BUU_GET_T_USER\`
      MODIFY COLUMN \`USER_CODE\` varchar(10) NULL COMMENT 'รหัสสมาชิก {ปีงบ พ.ศ. 4}{1 ไทย/2 ต่างชาติ}{รัน 5 หลัก}'
    `);

    await queryRunner.query(`
      ALTER TABLE \`EXAM_T_SESSIONS\`
      ADD COLUMN \`SESSION_CODE\` varchar(8) NULL COMMENT 'รหัสรอบสอบ {1 ทั่วไป/2 พิเศษ}{ปีงบ ค.ศ. 4}{รัน 3 หลัก}' AFTER \`SS_ID\`
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX \`UQ_EXAM_T_SESSIONS_SESSION_CODE\`
      ON \`EXAM_T_SESSIONS\` (\`SESSION_CODE\`)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`BUU_GET_T_USER_CODE_SEQ\` (
        \`UCS_FISCAL_YEAR_BE\` varchar(4) NOT NULL COMMENT 'ปีงบ พ.ศ.',
        \`UCS_PERSON_TYPE\` char(1) NOT NULL COMMENT '1 ไทย / 2 ต่างชาติ',
        \`UCS_LAST_NO\` int NOT NULL DEFAULT 0 COMMENT 'เลขรันล่าสุด',
        PRIMARY KEY (\`UCS_FISCAL_YEAR_BE\`, \`UCS_PERSON_TYPE\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`EXAM_T_SESSION_CODE_SEQ\` (
        \`SCS_EXAM_TYPE\` char(1) NOT NULL COMMENT '1 ทั่วไป / 2 พิเศษ',
        \`SCS_FISCAL_YEAR_AD\` varchar(4) NOT NULL COMMENT 'ปีงบ ค.ศ.',
        \`SCS_LAST_NO\` int NOT NULL DEFAULT 0 COMMENT 'เลขรันล่าสุด',
        PRIMARY KEY (\`SCS_EXAM_TYPE\`, \`SCS_FISCAL_YEAR_AD\`)
      ) ENGINE=InnoDB
    `);

    // --- fillback USER_CODE ---
    // ปีงบ พ.ศ. จาก CREATED_AT (ต.ค.–ก.ย.), ประเภทคนจากบัตรประชาชน
    await queryRunner.query(`
      UPDATE \`BUU_GET_T_USER\` u
      INNER JOIN (
        SELECT
          \`USER_ID\`,
          CONCAT(
            \`fiscal_be\`,
            \`person_type\`,
            LPAD(\`rn\`, 5, '0')
          ) AS \`new_code\`
        FROM (
          SELECT
            \`USER_ID\`,
            CASE
              WHEN MONTH(\`CREATED_AT\`) >= 10 THEN YEAR(\`CREATED_AT\`) + 544
              ELSE YEAR(\`CREATED_AT\`) + 543
            END AS \`fiscal_be\`,
            CASE
              WHEN \`USER_NATIONAL_ID\` IS NOT NULL AND TRIM(\`USER_NATIONAL_ID\`) <> '' THEN '1'
              ELSE '2'
            END AS \`person_type\`,
            ROW_NUMBER() OVER (
              PARTITION BY
                CASE
                  WHEN MONTH(\`CREATED_AT\`) >= 10 THEN YEAR(\`CREATED_AT\`) + 544
                  ELSE YEAR(\`CREATED_AT\`) + 543
                END,
                CASE
                  WHEN \`USER_NATIONAL_ID\` IS NOT NULL AND TRIM(\`USER_NATIONAL_ID\`) <> '' THEN '1'
                  ELSE '2'
                END
              ORDER BY \`USER_ID\` ASC
            ) AS \`rn\`
          FROM \`BUU_GET_T_USER\`
        ) ranked
      ) src ON u.\`USER_ID\` = src.\`USER_ID\`
      SET u.\`USER_CODE\` = src.\`new_code\`
    `);

    await queryRunner.query(`
      INSERT INTO \`BUU_GET_T_USER_CODE_SEQ\` (\`UCS_FISCAL_YEAR_BE\`, \`UCS_PERSON_TYPE\`, \`UCS_LAST_NO\`)
      SELECT
        LEFT(\`USER_CODE\`, 4),
        SUBSTRING(\`USER_CODE\`, 5, 1),
        MAX(CAST(RIGHT(\`USER_CODE\`, 5) AS UNSIGNED))
      FROM \`BUU_GET_T_USER\`
      WHERE \`USER_CODE\` REGEXP '^[0-9]{10}$'
      GROUP BY LEFT(\`USER_CODE\`, 4), SUBSTRING(\`USER_CODE\`, 5, 1)
      ON DUPLICATE KEY UPDATE \`UCS_LAST_NO\` = VALUES(\`UCS_LAST_NO\`)
    `);

    // --- fillback SESSION_CODE ---
    // ประเภทจาก EXAM_TYPE, ปีงบ ค.ศ. จาก EXAM_FISCAL_YEAR (รองรับ พ.ศ./ค.ศ.)
    await queryRunner.query(`
      UPDATE \`EXAM_T_SESSIONS\` s
      INNER JOIN (
        SELECT
          \`SS_ID\`,
          CONCAT(
            \`exam_type_code\`,
            \`fiscal_ad\`,
            LPAD(\`rn\`, 3, '0')
          ) AS \`new_code\`
        FROM (
          SELECT
            s2.\`SS_ID\`,
            CASE
              WHEN e.\`EXAM_TYPE\` = 'รอบพิเศษ' OR e.\`EXAM_TYPE\` = '2' THEN '2'
              ELSE '1'
            END AS \`exam_type_code\`,
            CASE
              WHEN e.\`EXAM_FISCAL_YEAR\` REGEXP '^[0-9]{4}$' AND CAST(e.\`EXAM_FISCAL_YEAR\` AS UNSIGNED) >= 2400
                THEN CAST(CAST(e.\`EXAM_FISCAL_YEAR\` AS UNSIGNED) - 543 AS CHAR)
              WHEN e.\`EXAM_FISCAL_YEAR\` REGEXP '^[0-9]{4}$'
                THEN e.\`EXAM_FISCAL_YEAR\`
              WHEN MONTH(s2.\`CREATED_AT\`) >= 10
                THEN CAST(YEAR(s2.\`CREATED_AT\`) + 1 AS CHAR)
              ELSE CAST(YEAR(s2.\`CREATED_AT\`) AS CHAR)
            END AS \`fiscal_ad\`,
            ROW_NUMBER() OVER (
              PARTITION BY
                CASE
                  WHEN e.\`EXAM_TYPE\` = 'รอบพิเศษ' OR e.\`EXAM_TYPE\` = '2' THEN '2'
                  ELSE '1'
                END,
                CASE
                  WHEN e.\`EXAM_FISCAL_YEAR\` REGEXP '^[0-9]{4}$' AND CAST(e.\`EXAM_FISCAL_YEAR\` AS UNSIGNED) >= 2400
                    THEN CAST(CAST(e.\`EXAM_FISCAL_YEAR\` AS UNSIGNED) - 543 AS CHAR)
                  WHEN e.\`EXAM_FISCAL_YEAR\` REGEXP '^[0-9]{4}$'
                    THEN e.\`EXAM_FISCAL_YEAR\`
                  WHEN MONTH(s2.\`CREATED_AT\`) >= 10
                    THEN CAST(YEAR(s2.\`CREATED_AT\`) + 1 AS CHAR)
                  ELSE CAST(YEAR(s2.\`CREATED_AT\`) AS CHAR)
                END
              ORDER BY s2.\`SS_ID\` ASC
            ) AS \`rn\`
          FROM \`EXAM_T_SESSIONS\` s2
          INNER JOIN \`EXAM_T_EXAM\` e ON e.\`EXAM_ID\` = s2.\`EXAM_ID\`
        ) ranked
      ) src ON s.\`SS_ID\` = src.\`SS_ID\`
      SET s.\`SESSION_CODE\` = src.\`new_code\`
    `);

    await queryRunner.query(`
      INSERT INTO \`EXAM_T_SESSION_CODE_SEQ\` (\`SCS_EXAM_TYPE\`, \`SCS_FISCAL_YEAR_AD\`, \`SCS_LAST_NO\`)
      SELECT
        LEFT(\`SESSION_CODE\`, 1),
        SUBSTRING(\`SESSION_CODE\`, 2, 4),
        MAX(CAST(RIGHT(\`SESSION_CODE\`, 3) AS UNSIGNED))
      FROM \`EXAM_T_SESSIONS\`
      WHERE \`SESSION_CODE\` REGEXP '^[12][0-9]{7}$'
      GROUP BY LEFT(\`SESSION_CODE\`, 1), SUBSTRING(\`SESSION_CODE\`, 2, 4)
      ON DUPLICATE KEY UPDATE \`SCS_LAST_NO\` = VALUES(\`SCS_LAST_NO\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`EXAM_T_SESSION_CODE_SEQ\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`BUU_GET_T_USER_CODE_SEQ\``);

    await queryRunner.query(`
      DROP INDEX \`UQ_EXAM_T_SESSIONS_SESSION_CODE\` ON \`EXAM_T_SESSIONS\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`EXAM_T_SESSIONS\`
      DROP COLUMN \`SESSION_CODE\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`BUU_GET_T_USER\`
      MODIFY COLUMN \`USER_CODE\` varchar(8) NULL COMMENT 'รหัสประจำสมัคร '
    `);
  }
}
