import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoomStationToCheckInAssistSessions1789780344800 implements MigrationInterface {
  name = 'AddRoomStationToCheckInAssistSessions1789780344800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`CHECK_IN_ASSIST_SESSIONS\`
        ADD \`MODE\` varchar(16) NOT NULL COMMENT 'โหมด session (HOST_ASSIST/ROOM_STATION)' DEFAULT 'HOST_ASSIST',
        ADD \`SL_ID\` int NULL COMMENT 'รหัส Session-Location เมื่อเป็นสถานีประจำห้อง'
    `);
    await queryRunner.query(`
      CREATE INDEX \`IDX_CAS_ROOM_STATION\`
        ON \`CHECK_IN_ASSIST_SESSIONS\` (\`HOST_USER_ID\`, \`SL_ID\`, \`MODE\`, \`STATUS\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_CAS_ROOM_STATION\` ON \`CHECK_IN_ASSIST_SESSIONS\``,
    );
    await queryRunner.query(`
      ALTER TABLE \`CHECK_IN_ASSIST_SESSIONS\`
        DROP COLUMN \`SL_ID\`,
        DROP COLUMN \`MODE\`
    `);
  }
}
