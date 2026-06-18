import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeRcTaxIdToBigint1789780343172 implements MigrationInterface {
  name = 'ChangeRcTaxIdToBigint1789780343172';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_RECEIPTS\`
        CHANGE \`RC_TAX_ID\` \`RC_TAX_ID\` bigint NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_RECEIPTS\`
        CHANGE \`RC_TAX_ID\` \`RC_TAX_ID\` varchar(15) NULL`,
    );
  }
}
