import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuperAdminRole1789780344100 implements MigrationInterface {
  name = 'AddSuperAdminRole1789780344100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO \`BUU_GET_T_ROLE\` (\`ROLE_NAME\`, \`ROLE_DESCRIPTION\`)
      SELECT 'super_admin', 'ผู้ดูแลระบบสูงสุด'
      WHERE NOT EXISTS (
        SELECT 1 FROM \`BUU_GET_T_ROLE\` WHERE \`ROLE_NAME\` = 'super_admin'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM \`BUU_GET_T_ROLE\` WHERE \`ROLE_NAME\` = 'super_admin'`,
    );
  }
}
