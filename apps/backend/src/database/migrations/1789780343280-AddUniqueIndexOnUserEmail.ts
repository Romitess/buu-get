import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Unique index บน USER_EMAIL เพื่อให้ login findByEmail เป็น index lookup
 * แทน table scan (O(n)) — สอดคล้องกับ business rule ที่อีเมลต้องไม่ซ้ำ
 */
export class AddUniqueIndexOnUserEmail1789780343280 implements MigrationInterface {
  name = 'AddUniqueIndexOnUserEmail1789780343280';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('BUU_GET_T_USER');
    const hasIndex = table?.indices.some(
      (index) =>
        index.name === 'IDX_USER_EMAIL_UNIQUE' ||
        (index.isUnique &&
          index.columnNames.length === 1 &&
          index.columnNames[0] === 'USER_EMAIL'),
    );
    if (hasIndex) {
      return;
    }

    await queryRunner.query(
      'CREATE UNIQUE INDEX `IDX_USER_EMAIL_UNIQUE` ON `BUU_GET_T_USER` (`USER_EMAIL`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('BUU_GET_T_USER');
    if (
      !table?.indices.some((index) => index.name === 'IDX_USER_EMAIL_UNIQUE')
    ) {
      return;
    }

    await queryRunner.query(
      'DROP INDEX `IDX_USER_EMAIL_UNIQUE` ON `BUU_GET_T_USER`',
    );
  }
}
