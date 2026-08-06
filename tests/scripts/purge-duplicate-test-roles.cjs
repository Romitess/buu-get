#!/usr/bin/env node
/**
 * Remap + delete duplicate roles created by test-rbac-seed (Aug 5)
 * when ROLE_NAME used underscores but legacy roles used spaces.
 *
 *   node tests/scripts/purge-duplicate-test-roles.cjs           # dry-run
 *   node tests/scripts/purge-duplicate-test-roles.cjs --execute
 */

const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.resolve(__dirname, '../..', '.env') });

const EXECUTE = process.argv.includes('--execute');

const LEGACY_REGISTRATION_ROLE_ID = 8; // "registration officer"
const LEGACY_EXAM_OPS_ROLE_ID = 6; // "exam operations officer"
const DUP_REGISTRATION_ROLE_ID = 11; // "registration_officer"
const DUP_EXAM_OPS_ROLE_ID = 12; // "exam_operations_officer"

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
  });

  const q = async (sql, params = []) => (await conn.query(sql, params))[0];
  const scalar = async (sql, params = []) => {
    const rows = await q(sql, params);
    return Number(Object.values(rows[0] || { n: 0 })[0] || 0);
  };

  console.log(`DB=${process.env.DB_NAME} mode=${EXECUTE ? 'EXECUTE' : 'DRY-RUN'}\n`);

  const roles = await q(
    `SELECT ROLE_ID, ROLE_NAME, ROLE_DESCRIPTION, CREATED_AT
     FROM BUU_GET_T_ROLE
     WHERE ROLE_ID IN (?, ?, ?, ?)
     ORDER BY ROLE_ID`,
    [
      LEGACY_EXAM_OPS_ROLE_ID,
      LEGACY_REGISTRATION_ROLE_ID,
      DUP_REGISTRATION_ROLE_ID,
      DUP_EXAM_OPS_ROLE_ID,
    ],
  );
  console.log('Roles involved:');
  for (const r of roles) {
    console.log(
      `  #${r.ROLE_ID} "${r.ROLE_NAME}" — ${r.ROLE_DESCRIPTION} @ ${r.CREATED_AT?.toISOString?.() ?? r.CREATED_AT}`,
    );
  }

  const urBefore = await q(
    `SELECT ur.bUUGETTUSERUSERID AS user_id, u.USER_EMAIL, ur.bUUGETTROLEROLEID AS role_id, r.ROLE_NAME
     FROM USER_ROLES ur
     JOIN BUU_GET_T_USER u ON u.USER_ID = ur.bUUGETTUSERUSERID
     JOIN BUU_GET_T_ROLE r ON r.ROLE_ID = ur.bUUGETTROLEROLEID
     WHERE ur.bUUGETTROLEROLEID IN (?, ?)`,
    [DUP_REGISTRATION_ROLE_ID, DUP_EXAM_OPS_ROLE_ID],
  );
  console.log('\nUSER_ROLES on duplicate roles:');
  console.log(urBefore);

  const moodleN = await scalar(
    `SELECT COUNT(*) n FROM BUU_GET_T_MOODLE_SYNC_LOG
     WHERE DATE(CREATED_AT) IN ('2026-08-05','2026-08-06')`,
  );
  const ervN = await scalar(
    `SELECT COUNT(*) n FROM BUU_GET_T_EXAM_RULE_VOUCHERS
     WHERE EXRV_ID = 2 OR (CONTENT_TH LIKE 'ERV-I-%' AND DELETED_AT IS NOT NULL)`,
  );
  log(`moodle sync logs Aug 5–6: ${moodleN}`);
  log(`exam rule vouchers to delete (EXRV_ID=2 / ERV-I soft): ${ervN}`);

  if (!EXECUTE) {
    console.log('\nRe-run with --execute to apply.');
    await conn.end();
    return;
  }

  await conn.beginTransaction();
  try {
    // Remap registration: 11 → 8
    const [regUsers] = await conn.query(
      `SELECT bUUGETTUSERUSERID AS user_id FROM USER_ROLES WHERE bUUGETTROLEROLEID = ?`,
      [DUP_REGISTRATION_ROLE_ID],
    );
    for (const row of regUsers) {
      // Avoid duplicate PK if already on legacy role
      await conn.query(
        `DELETE FROM USER_ROLES
         WHERE bUUGETTUSERUSERID = ? AND bUUGETTROLEROLEID = ?`,
        [row.user_id, LEGACY_REGISTRATION_ROLE_ID],
      );
      await conn.query(
        `UPDATE USER_ROLES SET bUUGETTROLEROLEID = ?
         WHERE bUUGETTUSERUSERID = ? AND bUUGETTROLEROLEID = ?`,
        [LEGACY_REGISTRATION_ROLE_ID, row.user_id, DUP_REGISTRATION_ROLE_ID],
      );
      log(`remapped user#${row.user_id}: role ${DUP_REGISTRATION_ROLE_ID} → ${LEGACY_REGISTRATION_ROLE_ID}`);
    }

    // Remap exam ops: 12 → 6
    const [opsUsers] = await conn.query(
      `SELECT bUUGETTUSERUSERID AS user_id FROM USER_ROLES WHERE bUUGETTROLEROLEID = ?`,
      [DUP_EXAM_OPS_ROLE_ID],
    );
    for (const row of opsUsers) {
      await conn.query(
        `DELETE FROM USER_ROLES
         WHERE bUUGETTUSERUSERID = ? AND bUUGETTROLEROLEID = ?`,
        [row.user_id, LEGACY_EXAM_OPS_ROLE_ID],
      );
      await conn.query(
        `UPDATE USER_ROLES SET bUUGETTROLEROLEID = ?
         WHERE bUUGETTUSERUSERID = ? AND bUUGETTROLEROLEID = ?`,
        [LEGACY_EXAM_OPS_ROLE_ID, row.user_id, DUP_EXAM_OPS_ROLE_ID],
      );
      log(`remapped user#${row.user_id}: role ${DUP_EXAM_OPS_ROLE_ID} → ${LEGACY_EXAM_OPS_ROLE_ID}`);
    }

    // Any remaining refs on 11/12
    await conn.query(
      `DELETE FROM USER_ROLES WHERE bUUGETTROLEROLEID IN (?, ?)`,
      [DUP_REGISTRATION_ROLE_ID, DUP_EXAM_OPS_ROLE_ID],
    );

    const [delRoles] = await conn.query(
      `DELETE FROM BUU_GET_T_ROLE WHERE ROLE_ID IN (?, ?)`,
      [DUP_REGISTRATION_ROLE_ID, DUP_EXAM_OPS_ROLE_ID],
    );
    log(`deleted duplicate roles: affected=${delRoles.affectedRows}`);

    const [delMoodle] = await conn.query(
      `DELETE FROM BUU_GET_T_MOODLE_SYNC_LOG
       WHERE DATE(CREATED_AT) IN ('2026-08-05','2026-08-06')`,
    );
    log(`deleted moodle sync logs: affected=${delMoodle.affectedRows}`);

    const [delErv] = await conn.query(
      `DELETE FROM BUU_GET_T_EXAM_RULE_VOUCHERS
       WHERE EXRV_ID = 2 OR (CONTENT_TH LIKE 'ERV-I-%' AND DELETED_AT IS NOT NULL)`,
    );
    log(`deleted exam rule vouchers: affected=${delErv.affectedRows}`);

    await conn.commit();
    log('commit ok');
  } catch (err) {
    await conn.rollback();
    console.error('ROLLBACK', err);
    process.exitCode = 1;
  }

  console.log('\nPost-check roles:');
  console.log(
    await q(
      `SELECT ROLE_ID, ROLE_NAME, ROLE_DESCRIPTION FROM BUU_GET_T_ROLE ORDER BY ROLE_ID`,
    ),
  );
  console.log(
    'underscore duplicates left:',
    await scalar(
      `SELECT COUNT(*) n FROM BUU_GET_T_ROLE
       WHERE ROLE_NAME IN ('registration_officer','exam_operations_officer')`,
    ),
  );
  console.log(
    'moodle Aug5-6 left:',
    await scalar(
      `SELECT COUNT(*) n FROM BUU_GET_T_MOODLE_SYNC_LOG
       WHERE DATE(CREATED_AT) IN ('2026-08-05','2026-08-06')`,
    ),
  );

  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
