import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Perf indexes for candidate history + schedule seat counts:
 * - (USER_ID, CREATED_AT) — findByUserId ORDER BY CREATED_AT DESC
 * - (SESSION_ID, ERM_STATUS, SL_ID) — attachEnrollmentCounts / capacity GROUP BY
 */
export class AddEnrollmentUserAndSessionIndexes1789780343310 implements MigrationInterface {
  name = 'AddEnrollmentUserAndSessionIndexes1789780343310';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.createIndexIfMissing(
      queryRunner,
      'EXAM_T_ENROLLMENTS',
      'IDX_ERM_USER_CREATED',
      'CREATE INDEX `IDX_ERM_USER_CREATED` ON `EXAM_T_ENROLLMENTS` (`USER_ID`, `CREATED_AT`)',
    );

    await this.createIndexIfMissing(
      queryRunner,
      'EXAM_T_ENROLLMENTS',
      'IDX_ERM_SESSION_STATUS_SL',
      'CREATE INDEX `IDX_ERM_SESSION_STATUS_SL` ON `EXAM_T_ENROLLMENTS` (`SESSION_ID`, `ERM_STATUS`, `SL_ID`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropIndexIfExists(
      queryRunner,
      'EXAM_T_ENROLLMENTS',
      'IDX_ERM_SESSION_STATUS_SL',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'EXAM_T_ENROLLMENTS',
      'IDX_ERM_USER_CREATED',
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
