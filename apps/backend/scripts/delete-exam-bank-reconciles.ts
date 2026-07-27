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
      `SELECT br.BR_ID, br.BR_REF1, br.BR_REF2, br.TRANX_ID, br.BR_IMPORT_KEY_HASH
       FROM FIN_T_BANK_RECONCILES br
       INNER JOIN FIN_T_TRANSACTIONS t ON t.TRANX_ID = br.TRANX_ID
       INNER JOIN EXAM_T_ENROLLMENTS e ON e.ERM_ID = t.ERM_ID
       INNER JOIN EXAM_T_SESSIONS s ON s.SS_ID = e.SESSION_ID
       WHERE s.EXAM_ID = ?
         AND br.DELETED_AT IS NULL`,
      [EXAM_ID],
    )) as {
      BR_ID: number;
      BR_REF1: string;
      BR_REF2: string | null;
      TRANX_ID: number | null;
      BR_IMPORT_KEY_HASH: string | null;
    }[];

    console.log(`Bank reconciles matched for EXAM_ID=${EXAM_ID}: ${rows.length}`);

    if (rows.length === 0) {
      await queryRunner.rollbackTransaction();
      return;
    }

    const brIds = rows.map((row) => row.BR_ID);
    const tranxIds = [
      ...new Set(
        rows
          .map((row) => row.TRANX_ID)
          .filter((id): id is number => id != null),
      ),
    ];
    const placeholders = brIds.map(() => '?').join(',');

    const editLogResult = await queryRunner.query(
      `DELETE FROM FIN_T_BANK_RECONCILE_EDIT_LOGS WHERE BR_ID IN (${placeholders})`,
      brIds,
    );

    const refResult = await queryRunner.query(
      `DELETE FROM FIN_T_TRANSACTIONS_REFS WHERE BR_ID IN (${placeholders})`,
      brIds,
    );

    const reconcileResult = await queryRunner.query(
      `DELETE FROM FIN_T_BANK_RECONCILES WHERE BR_ID IN (${placeholders})`,
      brIds,
    );

    if (tranxIds.length > 0) {
      const tranxPlaceholders = tranxIds.map(() => '?').join(',');
      await queryRunner.query(
        `UPDATE FIN_T_TRANSACTIONS
         SET TRANX_MATCH_STATUS = 0
         WHERE TRANX_ID IN (${tranxPlaceholders})`,
        tranxIds,
      );
    }

    await queryRunner.commitTransaction();

    console.log(
      `Deleted edit logs: ${editLogResult.affectedRows ?? editLogResult}`,
    );
    console.log(
      `Deleted transaction refs: ${refResult.affectedRows ?? refResult}`,
    );
    console.log(
      `Deleted bank reconciles: ${reconcileResult.affectedRows ?? reconcileResult}`,
    );
    console.log(`Reset TRANX_MATCH_STATUS for TRANX_IDs: ${tranxIds.join(', ') || '-'}`);
    console.log('Removed rows:');
    for (const row of rows) {
      console.log(
        `  BR_ID=${row.BR_ID} REF1=${row.BR_REF1} REF2=${row.BR_REF2 ?? '-'} HASH=${row.BR_IMPORT_KEY_HASH ?? '-'}`,
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
