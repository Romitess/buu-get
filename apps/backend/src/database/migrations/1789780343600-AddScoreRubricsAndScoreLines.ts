import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScoreRubricsAndScoreLines1789780343600 implements MigrationInterface {
  name = 'AddScoreRubricsAndScoreLines1789780343600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`BUU_GET_T_SCORE_RUBRICS\` (
        \`SRB_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสชุดเกณฑ์คะแนน',
        \`SRB_NAME_TH\` varchar(255) NOT NULL COMMENT 'ชื่อชุดเกณฑ์คะแนน (ภาษาไทย)',
        \`SRB_NAME_EN\` varchar(255) NOT NULL COMMENT 'ชื่อชุดเกณฑ์คะแนน (ภาษาอังกฤษ)',
        \`SRB_IS_DEFAULT\` tinyint NOT NULL COMMENT 'ชุดเกณฑ์เริ่มต้นของระบบ' DEFAULT 0,
        \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6),
        \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไขล่าสุด' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)',
        PRIMARY KEY (\`SRB_ID\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`BUU_GET_T_SCORE_RUBRIC_ITEMS\` (
        \`SRBI_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสรายการในชุดเกณฑ์คะแนน',
        \`SRB_ID\` int NOT NULL COMMENT 'รหัสชุดเกณฑ์คะแนน',
        \`SRBI_NAME_TH\` varchar(255) NOT NULL COMMENT 'ชื่อหมวดคะแนน (ภาษาไทย)',
        \`SRBI_NAME_EN\` varchar(255) NOT NULL COMMENT 'ชื่อหมวดคะแนน (ภาษาอังกฤษ)',
        \`SRBI_CODE\` varchar(50) NULL COMMENT 'รหัสภายใน (เช่น LANG_USE, READING)',
        \`SRBI_MAX_SCORE\` decimal(5,2) NOT NULL COMMENT 'คะแนนเต็มต่อหมวด' DEFAULT 50.00,
        \`SRBI_SORT_ORDER\` int NOT NULL COMMENT 'ลำดับการแสดงผล' DEFAULT 0,
        \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6),
        \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไขล่าสุด' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ (Soft Delete)',
        PRIMARY KEY (\`SRBI_ID\`),
        INDEX \`IDX_SCORE_RUBRIC_ITEMS_SRB_ID\` (\`SRB_ID\`),
        CONSTRAINT \`FK_SCORE_RUBRIC_ITEMS_SRB_ID\` FOREIGN KEY (\`SRB_ID\`) REFERENCES \`BUU_GET_T_SCORE_RUBRICS\`(\`SRB_ID\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`EXAM_T_EXAM\`
      ADD COLUMN \`SRB_ID\` int NULL COMMENT 'รหัสชุดเกณฑ์คะแนน'
    `);

    await queryRunner.query(`
      ALTER TABLE \`EXAM_T_EXAM\`
      ADD CONSTRAINT \`FK_EXAM_T_EXAM_SRB_ID\`
      FOREIGN KEY (\`SRB_ID\`) REFERENCES \`BUU_GET_T_SCORE_RUBRICS\`(\`SRB_ID\`)
      ON DELETE RESTRICT ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE \`EXAM_T_SCORE_LINES\` (
        \`SCL_ID\` int NOT NULL AUTO_INCREMENT COMMENT 'รหัสคะแนนรายหมวด',
        \`SCORES_ID\` int NOT NULL COMMENT 'รหัสคะแนนสอบ',
        \`SRBI_ID\` int NULL COMMENT 'รหัสรายการในชุดเกณฑ์ (อ้างอิง)',
        \`SCL_NAME_TH\` varchar(255) NOT NULL COMMENT 'ชื่อหมวดคะแนน snapshot (ภาษาไทย)',
        \`SCL_NAME_EN\` varchar(255) NOT NULL COMMENT 'ชื่อหมวดคะแนน snapshot (ภาษาอังกฤษ)',
        \`SCL_MAX_SCORE\` decimal(5,2) NOT NULL COMMENT 'คะแนนเต็ม snapshot',
        \`SCL_SORT_ORDER\` int NOT NULL COMMENT 'ลำดับการแสดงผล snapshot' DEFAULT 0,
        \`SCL_SCORE\` decimal(5,2) NULL COMMENT 'คะแนนที่ได้',
        \`CREATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6),
        \`UPDATED_AT\` datetime(6) NOT NULL COMMENT 'วันที่แก้ไข' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`DELETED_AT\` datetime(6) NULL COMMENT 'วันที่ลบ',
        PRIMARY KEY (\`SCL_ID\`),
        UNIQUE INDEX \`UQ_SCORE_LINES_SCORES_SRBI\` (\`SCORES_ID\`, \`SRBI_ID\`),
        INDEX \`IDX_SCORE_LINES_SCORES_ID\` (\`SCORES_ID\`),
        CONSTRAINT \`FK_SCORE_LINES_SCORES_ID\` FOREIGN KEY (\`SCORES_ID\`) REFERENCES \`EXAM_T_SCORES\`(\`SCORES_ID\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_SCORE_LINES_SRBI_ID\` FOREIGN KEY (\`SRBI_ID\`) REFERENCES \`BUU_GET_T_SCORE_RUBRIC_ITEMS\`(\`SRBI_ID\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    // Seed default rubric
    await queryRunner.query(`
      INSERT INTO \`BUU_GET_T_SCORE_RUBRICS\` (\`SRB_NAME_TH\`, \`SRB_NAME_EN\`, \`SRB_IS_DEFAULT\`)
      VALUES ('BUU-GET Standard', 'BUU-GET Standard', 1)
    `);

    await queryRunner.query(`
      INSERT INTO \`BUU_GET_T_SCORE_RUBRIC_ITEMS\`
        (\`SRB_ID\`, \`SRBI_NAME_TH\`, \`SRBI_NAME_EN\`, \`SRBI_CODE\`, \`SRBI_MAX_SCORE\`, \`SRBI_SORT_ORDER\`)
      SELECT
        r.\`SRB_ID\`,
        'คำศัพท์และไวยากรณ์',
        'Vocabulary & Grammar',
        'LANG_USE',
        50.00,
        1
      FROM \`BUU_GET_T_SCORE_RUBRICS\` r
      WHERE r.\`SRB_IS_DEFAULT\` = 1
      LIMIT 1
    `);

    await queryRunner.query(`
      INSERT INTO \`BUU_GET_T_SCORE_RUBRIC_ITEMS\`
        (\`SRB_ID\`, \`SRBI_NAME_TH\`, \`SRBI_NAME_EN\`, \`SRBI_CODE\`, \`SRBI_MAX_SCORE\`, \`SRBI_SORT_ORDER\`)
      SELECT
        r.\`SRB_ID\`,
        'ทักษะการอ่าน',
        'Reading',
        'READING',
        50.00,
        2
      FROM \`BUU_GET_T_SCORE_RUBRICS\` r
      WHERE r.\`SRB_IS_DEFAULT\` = 1
      LIMIT 1
    `);

    // Backfill exam → default rubric
    await queryRunner.query(`
      UPDATE \`EXAM_T_EXAM\` e
      INNER JOIN \`BUU_GET_T_SCORE_RUBRICS\` r ON r.\`SRB_IS_DEFAULT\` = 1 AND r.\`DELETED_AT\` IS NULL
      SET e.\`SRB_ID\` = r.\`SRB_ID\`
      WHERE e.\`SRB_ID\` IS NULL
    `);

    // Backfill score lines from legacy columns
    await queryRunner.query(`
      INSERT INTO \`EXAM_T_SCORE_LINES\`
        (\`SCORES_ID\`, \`SRBI_ID\`, \`SCL_NAME_TH\`, \`SCL_NAME_EN\`, \`SCL_MAX_SCORE\`, \`SCL_SORT_ORDER\`, \`SCL_SCORE\`)
      SELECT
        sc.\`SCORES_ID\`,
        lang.\`SRBI_ID\`,
        lang.\`SRBI_NAME_TH\`,
        lang.\`SRBI_NAME_EN\`,
        lang.\`SRBI_MAX_SCORE\`,
        lang.\`SRBI_SORT_ORDER\`,
        sc.\`SC_LANG_USE_SCORE\`
      FROM \`EXAM_T_SCORES\` sc
      INNER JOIN \`EXAM_T_ENROLLMENTS\` e ON e.\`ERM_ID\` = sc.\`ERM_ID\`
      INNER JOIN \`EXAM_T_SESSIONS\` s ON s.\`SS_ID\` = e.\`SESSION_ID\`
      INNER JOIN \`EXAM_T_EXAM\` x ON x.\`EXAM_ID\` = s.\`EXAM_ID\`
      INNER JOIN \`BUU_GET_T_SCORE_RUBRIC_ITEMS\` lang
        ON lang.\`SRB_ID\` = x.\`SRB_ID\`
        AND lang.\`SRBI_CODE\` = 'LANG_USE'
        AND lang.\`DELETED_AT\` IS NULL
      WHERE sc.\`DELETED_AT\` IS NULL
        AND sc.\`SC_LANG_USE_SCORE\` IS NOT NULL
    `);

    await queryRunner.query(`
      INSERT INTO \`EXAM_T_SCORE_LINES\`
        (\`SCORES_ID\`, \`SRBI_ID\`, \`SCL_NAME_TH\`, \`SCL_NAME_EN\`, \`SCL_MAX_SCORE\`, \`SCL_SORT_ORDER\`, \`SCL_SCORE\`)
      SELECT
        sc.\`SCORES_ID\`,
        read_item.\`SRBI_ID\`,
        read_item.\`SRBI_NAME_TH\`,
        read_item.\`SRBI_NAME_EN\`,
        read_item.\`SRBI_MAX_SCORE\`,
        read_item.\`SRBI_SORT_ORDER\`,
        sc.\`SC_READING_SCORE\`
      FROM \`EXAM_T_SCORES\` sc
      INNER JOIN \`EXAM_T_ENROLLMENTS\` e ON e.\`ERM_ID\` = sc.\`ERM_ID\`
      INNER JOIN \`EXAM_T_SESSIONS\` s ON s.\`SS_ID\` = e.\`SESSION_ID\`
      INNER JOIN \`EXAM_T_EXAM\` x ON x.\`EXAM_ID\` = s.\`EXAM_ID\`
      INNER JOIN \`BUU_GET_T_SCORE_RUBRIC_ITEMS\` read_item
        ON read_item.\`SRB_ID\` = x.\`SRB_ID\`
        AND read_item.\`SRBI_CODE\` = 'READING'
        AND read_item.\`DELETED_AT\` IS NULL
      WHERE sc.\`DELETED_AT\` IS NULL
        AND sc.\`SC_READING_SCORE\` IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`EXAM_T_SCORE_LINES\``);
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` DROP FOREIGN KEY \`FK_EXAM_T_EXAM_SRB_ID\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_EXAM\` DROP COLUMN \`SRB_ID\``,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS \`BUU_GET_T_SCORE_RUBRIC_ITEMS\``,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS \`BUU_GET_T_SCORE_RUBRICS\``);
  }
}
