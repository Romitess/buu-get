import dataSource from '../src/database/data-source';

const EXAM_ID = Number(process.argv[2] ?? '31');

async function deleteByIds(
  queryRunner: ReturnType<typeof dataSource.createQueryRunner>,
  table: string,
  column: string,
  ids: number[],
): Promise<number> {
  if (ids.length === 0) {
    return 0;
  }

  const placeholders = ids.map(() => '?').join(',');
  const result = await queryRunner.query(
    `DELETE FROM ${table} WHERE ${column} IN (${placeholders})`,
    ids,
  );

  return Number(result.affectedRows ?? result ?? 0);
}

async function main(): Promise<void> {
  if (!Number.isInteger(EXAM_ID) || EXAM_ID <= 0) {
    throw new Error(`Invalid EXAM_ID: ${process.argv[2]}`);
  }

  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const enrollments = (await queryRunner.query(
      `SELECT e.ERM_ID, e.USER_ID, e.ERM_STATUS, e.SESSION_ID
       FROM EXAM_T_ENROLLMENTS e
       INNER JOIN EXAM_T_SESSIONS s ON s.SS_ID = e.SESSION_ID
       WHERE s.EXAM_ID = ?`,
      [EXAM_ID],
    )) as {
      ERM_ID: number;
      USER_ID: number;
      ERM_STATUS: number;
      SESSION_ID: number;
    }[];

    console.log(`Enrollments matched for EXAM_ID=${EXAM_ID}: ${enrollments.length}`);

    if (enrollments.length === 0) {
      await queryRunner.rollbackTransaction();
      return;
    }

    const ermIds = enrollments.map((row) => row.ERM_ID);
    const ermPlaceholders = ermIds.map(() => '?').join(',');

    const transactions = (await queryRunner.query(
      `SELECT TRANX_ID FROM FIN_T_TRANSACTIONS WHERE ERM_ID IN (${ermPlaceholders})`,
      ermIds,
    )) as { TRANX_ID: number }[];
    const tranxIds = transactions.map((row) => row.TRANX_ID);

    const receipts =
      tranxIds.length > 0
        ? ((await queryRunner.query(
            `SELECT RC_ID FROM FIN_T_RECEIPTS WHERE TRANX_ID IN (${tranxIds.map(() => '?').join(',')})`,
            tranxIds,
          )) as { RC_ID: number }[])
        : [];
    const rcIds = receipts.map((row) => row.RC_ID);

    const bankReconciles =
      tranxIds.length > 0
        ? ((await queryRunner.query(
            `SELECT BR_ID FROM FIN_T_BANK_RECONCILES WHERE TRANX_ID IN (${tranxIds.map(() => '?').join(',')})`,
            tranxIds,
          )) as { BR_ID: number }[])
        : [];
    const brIds = bankReconciles.map((row) => row.BR_ID);

    const scores = (await queryRunner.query(
      `SELECT SCORES_ID FROM EXAM_T_SCORES WHERE ERM_ID IN (${ermPlaceholders})`,
      ermIds,
    )) as { SCORES_ID: number }[];
    const scoreIds = scores.map((row) => row.SCORES_ID);

    const summary: Record<string, number> = {};

    summary.voidedReceipts = await deleteByIds(
      queryRunner,
      'FIN_T_VOIDED_RECEIPTS',
      'RC_ID',
      rcIds,
    );
    summary.receipts = await deleteByIds(
      queryRunner,
      'FIN_T_RECEIPTS',
      'RC_ID',
      rcIds,
    );
    summary.bankReconcileEditLogs = await deleteByIds(
      queryRunner,
      'FIN_T_BANK_RECONCILE_EDIT_LOGS',
      'BR_ID',
      brIds,
    );

    if (tranxIds.length > 0) {
      const tranxPlaceholders = tranxIds.map(() => '?').join(',');
      const refByTranx = await queryRunner.query(
        `DELETE FROM FIN_T_TRANSACTIONS_REFS WHERE TRANX_ID IN (${tranxPlaceholders})`,
        tranxIds,
      );
      summary.transactionRefsByTranx = Number(
        refByTranx.affectedRows ?? refByTranx ?? 0,
      );
    }

    if (brIds.length > 0) {
      const brPlaceholders = brIds.map(() => '?').join(',');
      const refByBr = await queryRunner.query(
        `DELETE FROM FIN_T_TRANSACTIONS_REFS WHERE BR_ID IN (${brPlaceholders})`,
        brIds,
      );
      summary.transactionRefsByBr = Number(refByBr.affectedRows ?? refByBr ?? 0);
    }

    summary.bankReconciles = await deleteByIds(
      queryRunner,
      'FIN_T_BANK_RECONCILES',
      'BR_ID',
      brIds,
    );
    summary.transactionStatusHistory = await deleteByIds(
      queryRunner,
      'FIN_T_TRANSACTION_STATUS_HISTORY',
      'TRANX_ID',
      tranxIds,
    );
    summary.transactionProfiles = await deleteByIds(
      queryRunner,
      'FIN_T_TRANSACTION_PROFILE',
      'TRANX_ID',
      tranxIds,
    );
    summary.transactions = await deleteByIds(
      queryRunner,
      'FIN_T_TRANSACTIONS',
      'TRANX_ID',
      tranxIds,
    );
    summary.certificates = await deleteByIds(
      queryRunner,
      'EXAM_T_CERTIFICATES',
      'SCORES_ID',
      scoreIds,
    );
    summary.scores = await deleteByIds(
      queryRunner,
      'EXAM_T_SCORES',
      'SCORES_ID',
      scoreIds,
    );
    summary.attendances = await deleteByIds(
      queryRunner,
      'EXAM_T_ATTENDANCES',
      'ERM_ID',
      ermIds,
    );
    summary.vouchers = await deleteByIds(
      queryRunner,
      'EXAM_T_VOUCHERS',
      'ERM_ID',
      ermIds,
    );
    summary.enrollments = await deleteByIds(
      queryRunner,
      'EXAM_T_ENROLLMENTS',
      'ERM_ID',
      ermIds,
    );

    await queryRunner.commitTransaction();

    console.log('Deleted related records:');
    for (const [key, count] of Object.entries(summary)) {
      if (count > 0) {
        console.log(`  ${key}: ${count}`);
      }
    }

    console.log('Removed enrollments:');
    for (const row of enrollments) {
      console.log(
        `  ERM_ID=${row.ERM_ID} USER_ID=${row.USER_ID} STATUS=${row.ERM_STATUS} SESSION_ID=${row.SESSION_ID}`,
      );
    }
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
