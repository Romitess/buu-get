import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeMoodleSyncLogUserIdNullable1789782000000
  implements MigrationInterface
{
  name = 'MakeMoodleSyncLogUserIdNullable1789782000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_MOODLE_SYNC_LOG\` MODIFY \`USER_ID\` int NULL COMMENT 'รหัสผู้ใช้ (Foreign Key) ว่างได้เมื่อผู้กระทำเป็นบุคลากร'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_MOODLE_SYNC_LOG\` MODIFY \`USER_ID\` int NOT NULL COMMENT 'รหัสผู้สมัคร (Foreign Key)'`,
    );
  }
}
