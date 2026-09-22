/**
 * Wipe exam operational / transactional data after EXAM_T_EXAM was cleared.
 * Does NOT touch master/seed tables (locations, seats catalog, fund sources,
 * rubrics, users, roles, payment config, etc.).
 *
 * Usage: npx ts-node -r tsconfig-paths/register scripts/wipe-exam-operational-data.ts
 */
import dataSource from '../src/database/data-source';

const TABLES_IN_ORDER = [
  'FIN_T_REQUEST_PAYMENT',
  'FIN_T_REQUEST_APPROVAL',
  'BUU_GET_T_MOODLE_SYNC_LOG',
  'FIN_T_VOIDED_RECEIPTS',
  'FIN_T_RECEIPTS',
  'FIN_T_BANK_RECONCILE_EDIT_LOGS',
  'FIN_T_BANK_RECONCILES',
  'FIN_T_TRANSACTION_STATUS_HISTORY',
  'FIN_T_TRANSACTION_PROFILE',
  'FIN_T_TRANSACTIONS_REFS',
  'FIN_T_TRANSACTIONS',
  'EXAM_T_CERTIFICATES',
  'EXAM_T_SCORE_LINES',
  'EXAM_T_SCORES',
  'EXAM_T_VOUCHERS',
  'EXAM_T_ENROLLMENT_AUDIT_LOGS',
  'CHECK_IN_ASSIST_EVENTS',
  'CHECK_IN_ASSIST_SESSIONS',
  'EXAM_T_ENROLLMENTS',
  'EXAM_T_SESSION_LOCATION_PROCTORS',
  'EXAM_T_BLOCKED_SEATS',
  'EXAM_T_SESSION_LOCATIONS',
  'EXAM_T_PASSCODE_LOGS',
  'EXAM_T_PASSCODES',
  'EXAM_T_SESSIONS',
  'EXAM_T_SESSION_CODE_SEQ',
] as const;

async function countRows(
  queryRunner: ReturnType<typeof dataSource.createQueryRunner>,
  table: string,
): Promise<number> {
  const rows = (await queryRunner.query(
    `SELECT COUNT(*) AS cnt FROM \`${table}\``,
  )) as { cnt: number }[];
  return Number(rows[0]?.cnt ?? 0);
}

async function main(): Promise<void> {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('Counts before:');
    const before: Record<string, number> = {};
    for (const table of TABLES_IN_ORDER) {
      before[table] = await countRows(queryRunner, table);
      console.log(`  ${table}: ${before[table]}`);
    }

    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of TABLES_IN_ORDER) {
      const result = await queryRunner.query(`DELETE FROM \`${table}\``);
      const deleted = Number(result.affectedRows ?? 0);
      console.log(`Deleted ${table}: ${deleted}`);
    }

    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
    await queryRunner.commitTransaction();

    console.log('\nCounts after:');
    for (const table of TABLES_IN_ORDER) {
      const after = await countRows(queryRunner, table);
      console.log(`  ${table}: ${after}`);
    }

    const examLeft = await countRows(queryRunner, 'EXAM_T_EXAM');
    const locLeft = await countRows(queryRunner, 'EXAM_T_LOCATIONS');
    const seatLeft = await countRows(queryRunner, 'EXAM_T_LOCATION_SEATS');
    const userSeqLeft = await countRows(queryRunner, 'BUU_GET_T_USER_CODE_SEQ');
    console.log(
      `\nUntouched masters — EXAM_T_EXAM: ${examLeft}, LOCATIONS: ${locLeft}, LOCATION_SEATS: ${seatLeft}, USER_CODE_SEQ: ${userSeqLeft}`,
    );
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error('Wipe failed:', err);
  process.exit(1);
});
