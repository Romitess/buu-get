import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Perf indexes (Sprint 1 audit):
 * - EXAM_T_PASSCODES (EXAM_ID, NATIONAL_ID) unique — special-exam enroll lookup
 * - EXAM_T_ENROLLMENTS (ERM_STATUS, CREATED_AT) — unpaid cancel cron every minute
 *
 * ก่อนสร้าง unique จะลบ duplicate passcode ค้างไว้แถว PASSCODE_ID สูงสุด
 */
export class AddPerfIndexesPasscodeAndUnpaidCron1789780343290 implements MigrationInterface {
  name = 'AddPerfIndexesPasscodeAndUnpaidCron1789780343290';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE t1 FROM \`EXAM_T_PASSCODES\` t1
      INNER JOIN \`EXAM_T_PASSCODES\` t2
        ON t1.\`EXAM_ID\` = t2.\`EXAM_ID\`
        AND t1.\`NATIONAL_ID\` = t2.\`NATIONAL_ID\`
        AND t1.\`PASSCODE_ID\` < t2.\`PASSCODE_ID\`
    `);

    await this.createIndexIfMissing(
      queryRunner,
      'EXAM_T_PASSCODES',
      'UQ_EXAM_PASSCODE_EXAM_NATIONAL',
      'CREATE UNIQUE INDEX `UQ_EXAM_PASSCODE_EXAM_NATIONAL` ON `EXAM_T_PASSCODES` (`EXAM_ID`, `NATIONAL_ID`)',
    );

    await this.createIndexIfMissing(
      queryRunner,
      'EXAM_T_PASSCODES',
      'IDX_EXAM_PASSCODE_LOOKUP',
      'CREATE INDEX `IDX_EXAM_PASSCODE_LOOKUP` ON `EXAM_T_PASSCODES` (`EXAM_ID`, `NATIONAL_ID`, `PASSCODE`)',
    );

    await this.createIndexIfMissing(
      queryRunner,
      'EXAM_T_ENROLLMENTS',
      'IDX_ERM_STATUS_CREATED_AT',
      'CREATE INDEX `IDX_ERM_STATUS_CREATED_AT` ON `EXAM_T_ENROLLMENTS` (`ERM_STATUS`, `CREATED_AT`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropIndexIfExists(
      queryRunner,
      'EXAM_T_ENROLLMENTS',
      'IDX_ERM_STATUS_CREATED_AT',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'EXAM_T_PASSCODES',
      'IDX_EXAM_PASSCODE_LOOKUP',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'EXAM_T_PASSCODES',
      'UQ_EXAM_PASSCODE_EXAM_NATIONAL',
    );
  }

  private async createIndexIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
    createSql: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (table?.indices.some((index) => index.name === indexName)) {
      return;
    }

    await queryRunner.query(createSql);
  }

  private async dropIndexIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table?.indices.some((index) => index.name === indexName)) {
      return;
    }

    await queryRunner.query(`DROP INDEX \`${indexName}\` ON \`${tableName}\``);
  }
}
