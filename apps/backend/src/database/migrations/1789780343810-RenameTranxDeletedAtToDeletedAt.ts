import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTranxDeletedAtToDeletedAt1789780343810 implements MigrationInterface {
  name = 'RenameTranxDeletedAtToDeletedAt1789780343810';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasOld = await queryRunner.hasColumn(
      'FIN_T_TRANSACTIONS',
      'TRANX_DELETED_AT',
    );
    const hasNew = await queryRunner.hasColumn(
      'FIN_T_TRANSACTIONS',
      'DELETED_AT',
    );

    if (hasOld && !hasNew) {
      await queryRunner.query(
        `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`TRANX_DELETED_AT\` \`DELETED_AT\` timestamp NULL COMMENT 'วันที่ลบ (Soft Delete)'`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasOld = await queryRunner.hasColumn(
      'FIN_T_TRANSACTIONS',
      'TRANX_DELETED_AT',
    );
    const hasNew = await queryRunner.hasColumn(
      'FIN_T_TRANSACTIONS',
      'DELETED_AT',
    );

    if (hasNew && !hasOld) {
      await queryRunner.query(
        `ALTER TABLE \`FIN_T_TRANSACTIONS\` CHANGE \`DELETED_AT\` \`TRANX_DELETED_AT\` timestamp NULL COMMENT 'วันที่ลบ (Soft Delete)'`,
      );
    }
  }
}
