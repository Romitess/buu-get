import dataSource from '../src/database/data-source';

const EXAM_ID = Number(process.argv[2] ?? '31');

async function main(): Promise<void> {
  if (!Number.isInteger(EXAM_ID) || EXAM_ID <= 0) {
    throw new Error(`Invalid EXAM_ID: ${process.argv[2]}`);
  }

  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const rows = (await queryRunner.query(
      `SELECT r.RC_ID, r.RC_STATUS, r.TRANX_ID
       FROM FIN_T_RECEIPTS r
       INNER JOIN FIN_T_TRANSACTIONS t ON t.TRANX_ID = r.TRANX_ID
       INNER JOIN EXAM_T_ENROLLMENTS e ON e.ERM_ID = t.ERM_ID
       INNER JOIN EXAM_T_SESSIONS s ON s.SS_ID = e.SESSION_ID
       WHERE s.EXAM_ID = ?`,
      [EXAM_ID],
    )) as { RC_ID: number; RC_STATUS: number; TRANX_ID: number }[];

    console.log(`Receipts matched for EXAM_ID=${EXAM_ID}: ${rows.length}`);

    if (rows.length === 0) {
      await queryRunner.rollbackTransaction();
      return;
    }

    const rcIds = rows.map((row) => row.RC_ID);
    const placeholders = rcIds.map(() => '?').join(',');

    const voidedResult = await queryRunner.query(
      `DELETE FROM FIN_T_VOIDED_RECEIPTS WHERE RC_ID IN (${placeholders})`,
      rcIds,
    );
    const receiptResult = await queryRunner.query(
      `DELETE FROM FIN_T_RECEIPTS WHERE RC_ID IN (${placeholders})`,
      rcIds,
    );

    await queryRunner.commitTransaction();

    console.log(
      `Deleted voided receipts: ${voidedResult.affectedRows ?? voidedResult}`,
    );
    console.log(
      `Deleted receipts: ${receiptResult.affectedRows ?? receiptResult}`,
    );
    console.log(`RC_IDs: ${rcIds.join(', ')}`);
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
