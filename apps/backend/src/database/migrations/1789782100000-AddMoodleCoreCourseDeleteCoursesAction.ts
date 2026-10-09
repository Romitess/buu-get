import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMoodleCoreCourseDeleteCoursesAction1789782100000
  implements MigrationInterface
{
  name = 'AddMoodleCoreCourseDeleteCoursesAction1789782100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_MOODLE_SYNC_LOG\` MODIFY COLUMN \`ML_ACTION\` enum('core_course_create_courses', 'core_course_delete_courses', 'core_user_create_users', 'core_user_update_users', 'core_user_delete_users', 'enrol_manual_enrol_users', 'gradereport_user_get_grade_items') NOT NULL COMMENT 'การทำงานที่ซิงก์'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BUU_GET_T_MOODLE_SYNC_LOG\` MODIFY COLUMN \`ML_ACTION\` enum('core_course_create_courses', 'core_user_create_users', 'core_user_update_users', 'core_user_delete_users', 'enrol_manual_enrol_users', 'gradereport_user_get_grade_items') NOT NULL COMMENT 'การทำงานที่ซิงก์'`,
    );
  }
}
