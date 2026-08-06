#!/usr/bin/env node
/**
 * Deep shared-DB purge for automated test leftovers.
 *
 * Why API cleanup was not enough:
 * - DELETE /api/exam only sets DELETED_AT on exams
 * - Child rows (sessions/enrollments/txns/receipts/seats/…) often stay ACTIVE
 * - Soft-deleted rows still occupy the database
 *
 * Modes:
 *   node tests/scripts/purge-test-data-sql.mjs           # dry-run counts
 *   node tests/scripts/purge-test-data-sql.mjs --execute # soft-delete orphans + hard-purge soft trash
 *
 * Preserves:
 * - Seeded RBAC users test.*@buu-get.test
 * - Roles, migrations, page configs
 * - Active campus locations LOCATION_ID 1–5
 * - Active payment config SCB (PC_ID=1 if PROVIDER_NAME=SCB)
 * - Fund sources IF-BUU-* / LAW-ACC-*
 * - Score rubric SRB_ID=1 (BUU-GET Standard) if present
 * - Real @go.buu.ac.th accounts (demo candidates / staff) unless soft-deleted disposable
 *
 * Loads DB creds from repo-root .env (never prints password).
 */

const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const ROOT = path.resolve(__dirname, '../..');
require('dotenv').config({ path: path.join(ROOT, '.env') });

const EXECUTE = process.argv.includes('--execute');
const SINCE = process.env.TEST_PURGE_SINCE || '2026-08-05';

const PROTECTED_EMAILS = [
  'test.admin@buu-get.test',
  'test.staff@buu-get.test',
  'test.finance@buu-get.test',
  'test.proctor@buu-get.test',
  'test.executive@buu-get.test',
  'test.registration@buu-get.test',
  'test.examops@buu-get.test',
  'test.candidate@buu-get.test',
];

const EXAM_NAME_SQL = `
  EXAM_NAME REGEXP '^(B[4-7]-|EXAM-I|TXN-|RCPT|BR |ENR-|VOUCH-|CERT-|SCR-|SES-I|SL-I|VOID-|PCFG-|TEST|Fah |BUU-GET-TEST|BUU-GET test|RUB-|CRI-|probe)'
  OR EXAM_NAME REGEXP 'probe'
  OR EXAM_NAME IN ('TEST','BUU-GET','BUU-get','กดเเห')
`;

function log(msg) {
  console.log(`[${EXECUTE ? 'EXEC' : 'DRY'}] ${msg}`);
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  const q = async (sql, params = []) => {
    const [rows] = await conn.query(sql, params);
    return rows;
  };
  const scalar = async (sql, params = []) => {
    const rows = await q(sql, params);
    const first = rows[0];
    return first ? Number(Object.values(first)[0] || 0) : 0;
  };

  console.log(`DB=${process.env.DB_NAME} since>=${SINCE}`);
  console.log(`Mode=${EXECUTE ? 'EXECUTE' : 'DRY-RUN'}\n`);

  // Target exams: created in rollout window OR name markers
  await q(`DROP TEMPORARY TABLE IF EXISTS tmp_purge_exams`);
  await q(`CREATE TEMPORARY TABLE tmp_purge_exams (EXAM_ID INT PRIMARY KEY)`);
  await q(`
    INSERT IGNORE INTO tmp_purge_exams (EXAM_ID)
    SELECT EXAM_ID FROM EXAM_T_EXAM
    WHERE CREATED_AT >= ?
       OR (${EXAM_NAME_SQL})
  `, [SINCE]);
  const examN = await scalar(`SELECT COUNT(*) FROM tmp_purge_exams`);
  log(`target exams: ${examN}`);

  await q(`DROP TEMPORARY TABLE IF EXISTS tmp_purge_sessions`);
  await q(`CREATE TEMPORARY TABLE tmp_purge_sessions (SS_ID INT PRIMARY KEY)`);
  await q(`
    INSERT IGNORE INTO tmp_purge_sessions (SS_ID)
    SELECT SS_ID FROM EXAM_T_SESSIONS
    WHERE EXAM_ID IN (SELECT EXAM_ID FROM tmp_purge_exams)
       OR DELETED_AT IS NOT NULL
       OR CREATED_AT >= ?
  `, [SINCE]);
  await q(`
    INSERT IGNORE INTO tmp_purge_sessions (SS_ID)
    SELECT s.SS_ID FROM EXAM_T_SESSIONS s
    JOIN EXAM_T_EXAM x ON x.EXAM_ID = s.EXAM_ID
    WHERE x.DELETED_AT IS NOT NULL OR s.DELETED_AT IS NOT NULL
  `);
  const sessionN = await scalar(`SELECT COUNT(*) FROM tmp_purge_sessions`);
  log(`target sessions: ${sessionN}`);

  await q(`DROP TEMPORARY TABLE IF EXISTS tmp_purge_enrollments`);
  await q(`CREATE TEMPORARY TABLE tmp_purge_enrollments (ERM_ID INT PRIMARY KEY)`);
  await q(`
    INSERT IGNORE INTO tmp_purge_enrollments (ERM_ID)
    SELECT ERM_ID FROM EXAM_T_ENROLLMENTS
    WHERE SESSION_ID IN (SELECT SS_ID FROM tmp_purge_sessions)
       OR CREATED_AT >= ?
       OR DELETED_AT IS NOT NULL
  `, [SINCE]);
  const ermN = await scalar(`SELECT COUNT(*) FROM tmp_purge_enrollments`);
  log(`target enrollments: ${ermN}`);

  await q(`DROP TEMPORARY TABLE IF EXISTS tmp_purge_txns`);
  await q(`CREATE TEMPORARY TABLE tmp_purge_txns (TRANX_ID INT PRIMARY KEY)`);
  await q(`
    INSERT IGNORE INTO tmp_purge_txns (TRANX_ID)
    SELECT TRANX_ID FROM FIN_T_TRANSACTIONS
    WHERE ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)
       OR TRANX_CREATED_AT >= ?
       OR TRANX_DELETED_AT IS NOT NULL
  `, [SINCE]);
  const txnN = await scalar(`SELECT COUNT(*) FROM tmp_purge_txns`);
  log(`target transactions: ${txnN}`);

  // ---- counts for soft-delete of still-ACTIVE orphans ----
  const softTargets = {
    enrollments_active: await scalar(`
      SELECT COUNT(*) FROM EXAM_T_ENROLLMENTS
      WHERE DELETED_AT IS NULL AND ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)`),
    scores_active: await scalar(`
      SELECT COUNT(*) FROM EXAM_T_SCORES
      WHERE DELETED_AT IS NULL AND ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)`),
    score_lines_active: await scalar(`
      SELECT COUNT(*) FROM EXAM_T_SCORE_LINES
      WHERE DELETED_AT IS NULL AND SCORES_ID IN (
        SELECT SCORES_ID FROM EXAM_T_SCORES WHERE ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)
      )`),
    certs_active: await scalar(`
      SELECT COUNT(*) FROM EXAM_T_CERTIFICATES
      WHERE DELETED_AT IS NULL AND SCORES_ID IN (
        SELECT SCORES_ID FROM EXAM_T_SCORES WHERE ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)
      )`),
    vouchers_active: await scalar(`
      SELECT COUNT(*) FROM EXAM_T_VOUCHERS
      WHERE DELETED_AT IS NULL AND ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)`),
    session_locations_active: await scalar(`
      SELECT COUNT(*) FROM EXAM_T_SESSION_LOCATIONS
      WHERE DELETED_AT IS NULL AND SS_ID IN (SELECT SS_ID FROM tmp_purge_sessions)`),
    seats_on_soft_locs: await scalar(`
      SELECT COUNT(*) FROM EXAM_T_LOCATION_SEATS seat
      JOIN EXAM_T_LOCATIONS loc ON loc.LOCATION_ID = seat.LOCATION_ID
      WHERE seat.DELETED_AT IS NULL AND loc.DELETED_AT IS NOT NULL AND loc.LOCATION_ID > 5`),
    txns_active: await scalar(`
      SELECT COUNT(*) FROM FIN_T_TRANSACTIONS
      WHERE TRANX_DELETED_AT IS NULL AND TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns)`),
    receipts_active: await scalar(`
      SELECT COUNT(*) FROM FIN_T_RECEIPTS
      WHERE DELETED_AT IS NULL AND TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns)`),
  };

  console.log('\nStill-ACTIVE rows that will be soft-deleted first:');
  for (const [k, v] of Object.entries(softTargets)) console.log(`  ${k}: ${v}`);

  // Hard-purge candidates (already soft OR will be soft then hard)
  const hardTargets = {
    voided_receipts: await scalar(`
      SELECT COUNT(*) FROM FIN_T_VOIDED_RECEIPTS
      WHERE RC_ID IN (SELECT RC_ID FROM FIN_T_RECEIPTS WHERE TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns))`),
    bank_reconcile_edit_logs: await scalar(`
      SELECT COUNT(*) FROM FIN_T_BANK_RECONCILE_EDIT_LOGS
      WHERE BR_ID IN (
        SELECT BR_ID FROM FIN_T_BANK_RECONCILES
        WHERE TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns) OR CREATED_AT >= ?
      )`, [SINCE]),
    bank_reconciles: await scalar(`
      SELECT COUNT(*) FROM FIN_T_BANK_RECONCILES
      WHERE TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns) OR CREATED_AT >= ? OR DELETED_AT IS NOT NULL`, [SINCE]),
    txn_refs: await scalar(`
      SELECT COUNT(*) FROM FIN_T_TRANSACTIONS_REFS
      WHERE TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns)`),
    txn_profiles: await scalar(`
      SELECT COUNT(*) FROM FIN_T_TRANSACTION_PROFILE
      WHERE TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns)`),
    txn_status_history: await scalar(`
      SELECT COUNT(*) FROM FIN_T_TRANSACTION_STATUS_HISTORY
      WHERE TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns)`),
    receipts: await scalar(`
      SELECT COUNT(*) FROM FIN_T_RECEIPTS
      WHERE TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns)`),
    transactions: txnN,
    score_lines: await scalar(`
      SELECT COUNT(*) FROM EXAM_T_SCORE_LINES
      WHERE SCORES_ID IN (SELECT SCORES_ID FROM EXAM_T_SCORES WHERE ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments))`),
    certificates: await scalar(`
      SELECT COUNT(*) FROM EXAM_T_CERTIFICATES
      WHERE SCORES_ID IN (SELECT SCORES_ID FROM EXAM_T_SCORES WHERE ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments))
         OR CREATED_AT >= ?`, [SINCE]),
    scores: await scalar(`
      SELECT COUNT(*) FROM EXAM_T_SCORES
      WHERE ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)`),
    vouchers: await scalar(`
      SELECT COUNT(*) FROM EXAM_T_VOUCHERS
      WHERE ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)`),
    enrollments: ermN,
    blocked_seats: await scalar(`
      SELECT COUNT(*) FROM EXAM_T_BLOCKED_SEATS
      WHERE SS_ID IN (SELECT SS_ID FROM tmp_purge_sessions) OR DELETED_AT IS NOT NULL OR CREATED_AT >= ?`, [SINCE]),
    session_locations: await scalar(`
      SELECT COUNT(*) FROM EXAM_T_SESSION_LOCATIONS
      WHERE SS_ID IN (SELECT SS_ID FROM tmp_purge_sessions) OR DELETED_AT IS NOT NULL`),
    location_seats_soft_locs: await scalar(`
      SELECT COUNT(*) FROM EXAM_T_LOCATION_SEATS
      WHERE LOCATION_ID IN (SELECT LOCATION_ID FROM EXAM_T_LOCATIONS WHERE DELETED_AT IS NOT NULL AND LOCATION_ID > 5)
         OR (CREATED_AT >= ? AND LOCATION_ID > 5)`, [SINCE]),
    sessions: sessionN,
    exams: examN,
    locations_soft: await scalar(`
      SELECT COUNT(*) FROM EXAM_T_LOCATIONS WHERE DELETED_AT IS NOT NULL AND LOCATION_ID > 5`),
    payment_configs_soft: await scalar(`
      SELECT COUNT(*) FROM FIN_T_PAYMENT_CONFIG WHERE DELETED_AT IS NOT NULL AND (PC_ID <> 1 OR PROVIDER_NAME <> 'SCB')`),
    fund_sources_soft: await scalar(`
      SELECT COUNT(*) FROM FIN_T_FUND_SOURCES
      WHERE DELETED_AT IS NOT NULL
        AND FS_ACCOUNT_CODE NOT LIKE 'IF-BUU-%'
        AND FS_ACCOUNT_CODE NOT LIKE 'LAW-ACC-%'`),
    profile_edit_history: await scalar(`
      SELECT COUNT(*) FROM BUU_GET_T_PROFILE_EDIT_HISTORY
      WHERE CREATED_AT >= ? OR USER_PROFILE_ID IN (
        SELECT p.USER_PROFILE_ID FROM BUU_GET_T_USER_PROFILE p
        JOIN BUU_GET_T_USER u ON u.USER_ID = p.USER_ID
        WHERE u.USER_EMAIL LIKE '%@buu-get.test' AND u.USER_EMAIL NOT LIKE 'test.%@buu-get.test'
      )`, [SINCE]),
    disposable_users_soft: await scalar(`
      SELECT COUNT(*) FROM BUU_GET_T_USER
      WHERE DELETED_AT IS NOT NULL
        AND USER_EMAIL NOT IN (${PROTECTED_EMAILS.map(() => '?').join(',')})
        AND (
          USER_EMAIL LIKE '%@buu-get.test'
          OR CREATED_AT >= ?
        )
    `, [...PROTECTED_EMAILS, SINCE]),
  };

  console.log('\nRows targeted for HARD DELETE (after soft-delete step):');
  for (const [k, v] of Object.entries(hardTargets)) console.log(`  ${k}: ${v}`);

  if (!EXECUTE) {
    console.log('\nRe-run with --execute to apply soft-delete + hard purge.');
    await conn.end();
    return;
  }

  await conn.beginTransaction();
  try {
    const nowSql = 'UTC_TIMESTAMP()';

    // 1) Soft-delete still-active orphans
    log('soft-deleting active orphans…');
    await q(`UPDATE EXAM_T_CERTIFICATES SET DELETED_AT=${nowSql}, UPDATED_AT=${nowSql}
      WHERE DELETED_AT IS NULL AND SCORES_ID IN (
        SELECT SCORES_ID FROM EXAM_T_SCORES WHERE ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)
      )`);
    await q(`UPDATE EXAM_T_SCORE_LINES SET DELETED_AT=${nowSql}, UPDATED_AT=${nowSql}
      WHERE DELETED_AT IS NULL AND SCORES_ID IN (
        SELECT SCORES_ID FROM EXAM_T_SCORES WHERE ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)
      )`);
    await q(`UPDATE EXAM_T_SCORES SET DELETED_AT=${nowSql}, UPDATED_AT=${nowSql}
      WHERE DELETED_AT IS NULL AND ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)`);
    await q(`UPDATE EXAM_T_VOUCHERS SET DELETED_AT=${nowSql}, UPDATED_AT=${nowSql}
      WHERE DELETED_AT IS NULL AND ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)`);
    await q(`UPDATE EXAM_T_ENROLLMENTS SET DELETED_AT=${nowSql}, UPDATED_AT=${nowSql}
      WHERE DELETED_AT IS NULL AND ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)`);
    await q(`UPDATE EXAM_T_SESSION_LOCATIONS SET DELETED_AT=${nowSql}, UPDATED_AT=${nowSql}
      WHERE DELETED_AT IS NULL AND SS_ID IN (SELECT SS_ID FROM tmp_purge_sessions)`);
    await q(`UPDATE EXAM_T_BLOCKED_SEATS SET DELETED_AT=${nowSql}, UPDATED_AT=${nowSql}
      WHERE DELETED_AT IS NULL AND SS_ID IN (SELECT SS_ID FROM tmp_purge_sessions)`);
    await q(`UPDATE EXAM_T_LOCATION_SEATS seat
      JOIN EXAM_T_LOCATIONS loc ON loc.LOCATION_ID = seat.LOCATION_ID
      SET seat.DELETED_AT=${nowSql}, seat.UPDATED_AT=${nowSql}
      WHERE seat.DELETED_AT IS NULL AND loc.DELETED_AT IS NOT NULL AND loc.LOCATION_ID > 5`);
    await q(`UPDATE FIN_T_RECEIPTS SET DELETED_AT=${nowSql}, UPDATED_AT=${nowSql}
      WHERE DELETED_AT IS NULL AND TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns)`);
    await q(`UPDATE FIN_T_TRANSACTIONS SET TRANX_DELETED_AT=${nowSql}, TRANX_UPDATED_AT=${nowSql}
      WHERE TRANX_DELETED_AT IS NULL AND TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns)`);
    await q(`UPDATE FIN_T_BANK_RECONCILES SET DELETED_AT=${nowSql}, UPDATED_AT=${nowSql}
      WHERE DELETED_AT IS NULL AND (
        TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns) OR CREATED_AT >= ?
      )`, [SINCE]);

    // 2) Hard purge with FK checks off
    log('hard-purging soft/test rows…');
    await q(`SET FOREIGN_KEY_CHECKS=0`);

    // Finance children → parents
    await q(`DELETE FROM FIN_T_BANK_RECONCILE_EDIT_LOGS WHERE BR_ID IN (
      SELECT BR_ID FROM FIN_T_BANK_RECONCILES
      WHERE TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns) OR CREATED_AT >= ? OR DELETED_AT IS NOT NULL
    )`, [SINCE]);
    await q(`DELETE FROM FIN_T_TRANSACTIONS_REFS WHERE TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns)`);
    await q(`DELETE FROM FIN_T_TRANSACTION_PROFILE WHERE TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns)`);
    await q(`DELETE FROM FIN_T_TRANSACTION_STATUS_HISTORY WHERE TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns)`);
    await q(`DELETE FROM FIN_T_VOIDED_RECEIPTS WHERE RC_ID IN (
      SELECT RC_ID FROM FIN_T_RECEIPTS WHERE TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns)
    )`);
    await q(`DELETE FROM FIN_T_RECEIPTS WHERE TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns)`);
    await q(`DELETE FROM FIN_T_BANK_RECONCILES WHERE TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns) OR CREATED_AT >= ? OR DELETED_AT IS NOT NULL`, [SINCE]);
    await q(`DELETE FROM FIN_T_TRANSACTIONS WHERE TRANX_ID IN (SELECT TRANX_ID FROM tmp_purge_txns)`);

    // Exam graph children → parents
    await q(`DELETE FROM EXAM_T_CERTIFICATES WHERE SCORES_ID IN (
      SELECT SCORES_ID FROM EXAM_T_SCORES WHERE ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)
    ) OR CREATED_AT >= ?`, [SINCE]);
    await q(`DELETE FROM EXAM_T_SCORE_LINES WHERE SCORES_ID IN (
      SELECT SCORES_ID FROM EXAM_T_SCORES WHERE ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)
    )`);
    await q(`DELETE FROM EXAM_T_SCORES WHERE ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)`);
    await q(`DELETE FROM EXAM_T_VOUCHERS WHERE ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)`);
    await q(`DELETE FROM EXAM_T_ENROLLMENTS WHERE ERM_ID IN (SELECT ERM_ID FROM tmp_purge_enrollments)`);
    await q(`DELETE FROM EXAM_T_BLOCKED_SEATS WHERE SS_ID IN (SELECT SS_ID FROM tmp_purge_sessions) OR DELETED_AT IS NOT NULL OR CREATED_AT >= ?`, [SINCE]);
    await q(`DELETE FROM EXAM_T_SESSION_LOCATIONS WHERE SS_ID IN (SELECT SS_ID FROM tmp_purge_sessions) OR DELETED_AT IS NOT NULL`);
    // passcodes if exist
    try {
      await q(`DELETE FROM EXAM_T_PASSCODE_LOGS WHERE EXAM_ID IN (SELECT EXAM_ID FROM tmp_purge_exams)`);
      await q(`DELETE FROM EXAM_T_PASSCODES WHERE EXAM_ID IN (SELECT EXAM_ID FROM tmp_purge_exams)`);
    } catch (_) { /* optional tables */ }

    await q(`DELETE FROM EXAM_T_SESSIONS WHERE SS_ID IN (SELECT SS_ID FROM tmp_purge_sessions)`);
    await q(`DELETE FROM EXAM_T_EXAM WHERE EXAM_ID IN (SELECT EXAM_ID FROM tmp_purge_exams)`);

    await q(`DELETE FROM EXAM_T_LOCATION_SEATS WHERE LOCATION_ID IN (
      SELECT LOCATION_ID FROM EXAM_T_LOCATIONS WHERE DELETED_AT IS NOT NULL AND LOCATION_ID > 5
    ) OR (CREATED_AT >= ? AND LOCATION_ID > 5)`, [SINCE]);
    await q(`DELETE FROM EXAM_T_LOCATIONS WHERE DELETED_AT IS NOT NULL AND LOCATION_ID > 5`);

    await q(`DELETE FROM FIN_T_PAYMENT_CONFIG WHERE DELETED_AT IS NOT NULL AND PROVIDER_NAME <> 'SCB'`);
    await q(`DELETE FROM FIN_T_FUND_SOURCES WHERE DELETED_AT IS NOT NULL
      AND FS_ACCOUNT_CODE NOT LIKE 'IF-BUU-%' AND FS_ACCOUNT_CODE NOT LIKE 'LAW-ACC-%'`);

    // Soft-deleted score rubrics except id 1
    await q(`DELETE FROM BUU_GET_T_SCORE_RUBRIC_ITEMS WHERE SRB_ID IN (
      SELECT SRB_ID FROM BUU_GET_T_SCORE_RUBRICS WHERE DELETED_AT IS NOT NULL AND SRB_ID <> 1
    )`);
    await q(`DELETE FROM BUU_GET_T_SCORE_RUBRICS WHERE DELETED_AT IS NOT NULL AND SRB_ID <> 1`);

    // Profile history for disposable / since
    await q(`DELETE FROM BUU_GET_T_PROFILE_EDIT_HISTORY WHERE CREATED_AT >= ?`, [SINCE]);

    // Disposable soft-deleted users (+ images/profiles/roles)
    await q(`DROP TEMPORARY TABLE IF EXISTS tmp_purge_users`);
    await q(`
      CREATE TEMPORARY TABLE tmp_purge_users AS
      SELECT USER_ID FROM BUU_GET_T_USER
      WHERE DELETED_AT IS NOT NULL
        AND USER_EMAIL NOT IN (${PROTECTED_EMAILS.map(() => '?').join(',')})
        AND (USER_EMAIL LIKE '%@buu-get.test' OR CREATED_AT >= ?)
    `, [...PROTECTED_EMAILS, SINCE]);
    const purgeUsers = await scalar(`SELECT COUNT(*) FROM tmp_purge_users`);
    log(`hard-deleting disposable soft users: ${purgeUsers}`);
    await q(`DELETE FROM USER_ROLES WHERE bUUGETTUSERUSERID IN (SELECT USER_ID FROM tmp_purge_users)`);
    await q(`DELETE FROM BUU_GET_T_USER_IMAGE WHERE USER_ID IN (SELECT USER_ID FROM tmp_purge_users)`);
    await q(`DELETE FROM BUU_GET_T_USER_PROFILE WHERE USER_ID IN (SELECT USER_ID FROM tmp_purge_users)`);
    await q(`DELETE FROM BUU_GET_T_MOODLE_SYNC_LOG WHERE USER_ID IN (SELECT USER_ID FROM tmp_purge_users)`);
    await q(`DELETE FROM BUU_GET_T_USER WHERE USER_ID IN (SELECT USER_ID FROM tmp_purge_users)`);

    await q(`SET FOREIGN_KEY_CHECKS=1`);
    await conn.commit();
    log('commit ok');
  } catch (err) {
    await conn.rollback();
    console.error('ROLLBACK', err);
    process.exitCode = 1;
  }

  // Post counts
  console.log('\nPost-purge active counts:');
  for (const [table, sql] of [
    ['EXAM_T_EXAM', `SELECT COUNT(*) FROM EXAM_T_EXAM WHERE DELETED_AT IS NULL`],
    ['EXAM_T_SESSIONS', `SELECT COUNT(*) FROM EXAM_T_SESSIONS WHERE DELETED_AT IS NULL`],
    ['EXAM_T_ENROLLMENTS', `SELECT COUNT(*) FROM EXAM_T_ENROLLMENTS WHERE DELETED_AT IS NULL`],
    ['FIN_T_TRANSACTIONS', `SELECT COUNT(*) FROM FIN_T_TRANSACTIONS WHERE TRANX_DELETED_AT IS NULL`],
    ['FIN_T_RECEIPTS', `SELECT COUNT(*) FROM FIN_T_RECEIPTS WHERE DELETED_AT IS NULL`],
    ['EXAM_T_LOCATIONS', `SELECT COUNT(*) FROM EXAM_T_LOCATIONS WHERE DELETED_AT IS NULL`],
    ['BUU_GET_T_USER', `SELECT COUNT(*) FROM BUU_GET_T_USER WHERE DELETED_AT IS NULL`],
    ['seeded RBAC', `SELECT COUNT(*) FROM BUU_GET_T_USER WHERE DELETED_AT IS NULL AND USER_EMAIL LIKE 'test.%@buu-get.test'`],
  ]) {
    console.log(`  ${table}: ${await scalar(sql)}`);
  }

  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
