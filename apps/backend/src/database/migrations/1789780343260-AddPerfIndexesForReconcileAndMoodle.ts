import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Indexes สำหรับ hot path:
 * - bank reconcile verify join (TSC_REF1/TSC_REF2 ↔ BR_REF1/BR_REF2)
 * - Moodle enrol worker pending queue (ERM_MOODLE_ENROLL_ID IS NULL + ERM_STATUS)
 */
export class AddPerfIndexesForReconcileAndMoodle1789780343260 implements MigrationInterface {
  name = 'AddPerfIndexesForReconcileAndMoodle1789780343260';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.createIndexIfMissing(
      queryRunner,
      'FIN_T_TRANSACTIONS_REFS',
      'IDX_TSR_REF12',
      'CREATE INDEX `IDX_TSR_REF12` ON `FIN_T_TRANSACTIONS_REFS` (`TSC_REF1`, `TSC_REF2`)',
    );

    await this.createIndexIfMissing(
      queryRunner,
      'FIN_T_BANK_RECONCILES',
      'IDX_BR_REF12',
      'CREATE INDEX `IDX_BR_REF12` ON `FIN_T_BANK_RECONCILES` (`BR_REF1`, `BR_REF2`)',
    );

    await this.createIndexIfMissing(
      queryRunner,
      'EXAM_T_ENROLLMENTS',
      'IDX_ERM_MOODLE_PENDING',
      'CREATE INDEX `IDX_ERM_MOODLE_PENDING` ON `EXAM_T_ENROLLMENTS` (`ERM_MOODLE_ENROLL_ID`, `ERM_STATUS`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropIndexIfExists(
      queryRunner,
      'EXAM_T_ENROLLMENTS',
      'IDX_ERM_MOODLE_PENDING',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'FIN_T_BANK_RECONCILES',
      'IDX_BR_REF12',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'FIN_T_TRANSACTIONS_REFS',
      'IDX_TSR_REF12',
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
