import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * เปลี่ยน host/scanner ของ check-in assist จาก USER_ID (int) เป็น PSN_ID (varchar)
 * — แถวเก่า map ไม่ได้ จึงล้าง session/event ก่อน
 */
export class ReplaceCheckInAssistHostUserIdWithPsnId1789780345800 implements MigrationInterface {
  name = 'ReplaceCheckInAssistHostUserIdWithPsnId1789780345800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM \`CHECK_IN_ASSIST_EVENTS\``);
    await queryRunner.query(`DELETE FROM \`CHECK_IN_ASSIST_SESSIONS\``);

    await queryRunner.query(
      `DROP INDEX \`IDX_CAS_ROOM_STATION\` ON \`CHECK_IN_ASSIST_SESSIONS\``,
    );

    await queryRunner.query(`
      ALTER TABLE \`CHECK_IN_ASSIST_SESSIONS\`
        DROP COLUMN \`HOST_USER_ID\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`CHECK_IN_ASSIST_SESSIONS\`
        ADD \`HOST_PSN_ID\` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
          NOT NULL COMMENT 'รหัสบุคลากรผู้เปิด session (host)'
    `);
    await queryRunner.query(`
      CREATE INDEX \`IDX_CAS_ROOM_STATION\`
        ON \`CHECK_IN_ASSIST_SESSIONS\` (\`HOST_PSN_ID\`, \`SL_ID\`, \`MODE\`, \`STATUS\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`CHECK_IN_ASSIST_EVENTS\`
        DROP COLUMN \`SCANNER_USER_ID\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`CHECK_IN_ASSIST_EVENTS\`
        ADD \`SCANNER_PSN_ID\` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
          NOT NULL COMMENT 'รหัสบุคลากรผู้แสกน'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM \`CHECK_IN_ASSIST_EVENTS\``);
    await queryRunner.query(`DELETE FROM \`CHECK_IN_ASSIST_SESSIONS\``);

    await queryRunner.query(
      `DROP INDEX \`IDX_CAS_ROOM_STATION\` ON \`CHECK_IN_ASSIST_SESSIONS\``,
    );
    await queryRunner.query(`
      ALTER TABLE \`CHECK_IN_ASSIST_SESSIONS\`
        DROP COLUMN \`HOST_PSN_ID\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`CHECK_IN_ASSIST_SESSIONS\`
        ADD \`HOST_USER_ID\` int NOT NULL COMMENT 'ผู้เปิด session (host)'
    `);
    await queryRunner.query(`
      CREATE INDEX \`IDX_CAS_ROOM_STATION\`
        ON \`CHECK_IN_ASSIST_SESSIONS\` (\`HOST_USER_ID\`, \`SL_ID\`, \`MODE\`, \`STATUS\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`CHECK_IN_ASSIST_EVENTS\`
        DROP COLUMN \`SCANNER_PSN_ID\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`CHECK_IN_ASSIST_EVENTS\`
        ADD \`SCANNER_USER_ID\` int NOT NULL COMMENT 'ผู้แสกน'
    `);
  }
}
