import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ลบ exam.defaultRoomSeats — ที่นั่งต่อห้องถูกกำหนดจาก layout สถานที่ตอนเลือกห้อง
 * ไม่ได้ใช้เป็นค่าเริ่มต้นที่มีความหมายบนฟอร์มสร้างรอบสอบ
 */
export class DropExamDefaultRoomSeatsSetting1789780344600
  implements MigrationInterface
{
  name = 'DropExamDefaultRoomSeatsSetting1789780344600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM \`SYS_T_SYSTEM_SETTING_AUDIT_LOGS\`
      WHERE \`SETTING_KEY\` = 'exam.defaultRoomSeats'
    `);
    await queryRunner.query(`
      DELETE FROM \`SYS_T_SYSTEM_SETTINGS\`
      WHERE \`SETTING_KEY\` = 'exam.defaultRoomSeats'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO \`SYS_T_SYSTEM_SETTINGS\`
        (\`SETTING_KEY\`, \`SETTING_GROUP\`, \`SETTING_VALUE\`, \`SETTING_TYPE\`)
      VALUES
        ('exam.defaultRoomSeats', 'exam', '40', 'integer')
    `);
  }
}
