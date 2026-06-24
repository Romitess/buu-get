import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMoodleMappingColumns1789780343210 implements MigrationInterface {
  name = 'AddMoodleMappingColumns1789780343210';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // map user → Moodle user id
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER\` ADD \`USER_MOODLE_ID\` int NULL COMMENT 'รหัสผู้ใช้ฝั่ง Moodle'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER\` ADD UNIQUE INDEX \`UQ_USER_MOODLE_ID\` (\`USER_MOODLE_ID\`)`,
    );

    // map enrollment → Moodle enrol instance id (เติมโดย worker ผ่าน core_enrol_get_enrolled_users)
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` ADD \`ERM_MOODLE_ENROLL_ID\` int NULL COMMENT 'รหัส enrol ฝั่ง Moodle'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`EXAM_T_ENROLLMENTS\` DROP COLUMN \`ERM_MOODLE_ENROLL_ID\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER\` DROP INDEX \`UQ_USER_MOODLE_ID\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_USER\` DROP COLUMN \`USER_MOODLE_ID\``,
    );
  }
}
