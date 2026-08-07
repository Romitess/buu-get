#!/usr/bin/env node
/**
 * Shared-DB safe cleanup for automated test rollout leftovers.
 *
 * - Default: dry-run (log only)
 * - Execute: node tests/scripts/cleanup-test-data.mjs --execute
 * - NEVER deletes seeded RBAC users (test.*@buu-get.test)
 * - NEVER truncates schema / does not use ALLOW_DB_TRUNCATE
 * - Soft-deletes exams/locations/payment-configs/users matching allowlisted markers
 */

const API_BASE = (
  process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '');

const ADMIN_EMAIL = 'test.admin@buu-get.test';
const ADMIN_PASSWORD = process.env.TEST_PASSWORD ?? 'TestPass123!';

const PROTECTED_EMAILS = new Set([
  'test.admin@buu-get.test',
  'test.staff@buu-get.test',
  'test.finance@buu-get.test',
  'test.proctor@buu-get.test',
  'test.executive@buu-get.test',
  'test.registration@buu-get.test',
  'test.examops@buu-get.test',
  'test.candidate@buu-get.test',
]);

/** Name/code prefixes from Playwright/Jest suites */
const NAME_PREFIXES = [
  'B6-',
  'B7-RPT-',
  'B7-',
  'B4-',
  'B5-',
  'EXAM-I',
  'SES-I',
  'SL-I',
  'TXN-I',
  'TXN-E',
  'PCFG-',
  'VOID-I',
  'VOID-E',
  'FUND-',
  'FUND-REV',
  'ENR-E',
  'ENR-I',
  'VOUCH-E',
  'VOUCH-I',
  'CERT-E',
  'CERT-I',
  'SCR-E',
  'SCR-I',
  'RUB-',
  'CRI-',
  'RCPT',
  'BR probe',
  'BR-I',
  'BR-E',
  'probe loc',
  'B4-LOC',
  'B4-SL',
  'B4-SEAT',
  'B4-BLOCK',
  'B4-EXAM',
  'B4-SES',
];

/** Extra regexes for probe / obvious automated-test names */
const NAME_REGEXES = [
  /\bprobe\b/i,
  /^TXN-[EI]\b/i,
  /^RCPT\b/i,
  /^BR\b.*probe/i,
  /^VOID-[EI]\b/i,
  /^PCFG-/i,
  /^ENR-[EI]\b/i,
  /^VOUCH-[EI]\b/i,
  /^CERT-[EI]\b/i,
  /^SCR-[EI]\b/i,
  /^B[4-7]-/i,
  /^EXAM-I\b/i,
  /^TEST-\d+/i,
  /^BUU-GET-TEST\b/i,
  /^BUU-GET test\b/i,
  /^TEST LOCAL\b/i,
  /^Fah test$/i,
  /^TEST$/i,
  /^BUU-GET$/i,
  /^BUU-get$/i,
  /^กดเเห$/i,
];

const EXECUTE = process.argv.includes('--execute');

function matchesTestMarker(value) {
  if (!value || typeof value !== 'string') return false;
  const v = value.trim();
  if (
    NAME_PREFIXES.some((p) => {
      if (v.startsWith(p)) return true;
      if (p.length <= 3) return false;
      return v.includes(p);
    })
  ) {
    return true;
  }
  return NAME_REGEXES.some((re) => re.test(v));
}

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, ok: res.ok, json, text };
}

function log(action, detail) {
  console.log(`[${EXECUTE ? 'EXEC' : 'DRY'}] ${action} ${detail}`);
}

async function softDelete(path, token, label) {
  if (!EXECUTE) {
    log('would-delete', label);
    return { ok: true, dry: true };
  }
  const res = await request(path, { method: 'DELETE', token });
  log(res.ok ? 'deleted' : `FAIL(${res.status})`, `${label} ${res.ok ? '' : res.text.slice(0, 120)}`);
  return res;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Mode: ${EXECUTE ? 'EXECUTE (soft-delete)' : 'DRY-RUN'}`);
  console.log('');

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (!login.ok || !login.json?.accessToken) {
    console.error('Admin login failed:', login.status, login.text);
    process.exit(1);
  }
  const token = login.json.accessToken;

  const summary = {
    exams: 0,
    locations: 0,
    fundSources: 0,
    paymentConfigs: 0,
    users: 0,
    skippedProtectedUsers: 0,
    skippedKept: [],
  };

  // --- Exams ---
  const examsRes = await request('/api/exam', { token });
  const exams = Array.isArray(examsRes.json) ? examsRes.json : [];
  for (const exam of exams) {
    const name = exam.EXAM_NAME ?? exam.examName ?? '';
    if (!matchesTestMarker(name)) {
      summary.skippedKept.push(`exam#${exam.EXAM_ID} "${name}"`);
      continue;
    }
    summary.exams += 1;
    await softDelete(
      `/api/exam/${exam.EXAM_ID}`,
      token,
      `exam#${exam.EXAM_ID} "${name}"`,
    );
  }

  // --- Locations ---
  const locRes = await request('/api/exam-locations', { token });
  const locations = Array.isArray(locRes.json) ? locRes.json : [];
  for (const loc of locations) {
    const name = loc.LOCATION_NAME ?? '';
    if (!matchesTestMarker(name)) continue;
    summary.locations += 1;
    await softDelete(
      `/api/exam-locations/${loc.LOCATION_ID}`,
      token,
      `location#${loc.LOCATION_ID} "${name}"`,
    );
  }

  // --- Fund sources (only clear suite markers — keep real IF-BUU / LAW funds) ---
  const fsRes = await request('/api/fund-sources', { token });
  const funds = Array.isArray(fsRes.json) ? fsRes.json : [];
  for (const row of funds) {
    const code = row.FS_ACCOUNT_CODE ?? '';
    const name = row.FS_NAME ?? row.FS_ACCOUNT_NAME ?? '';
    // Do not treat short FS- alone; require suite-like codes
    const hit =
      matchesTestMarker(code) ||
      matchesTestMarker(name) ||
      /^(FS-|FUND-|PATCH-|REV-)/i.test(code);
    // Protect known seeded/demo-looking funds without numeric junk
    if (/^IF-BUU-|^LAW-ACC-/i.test(code)) continue;
    if (!hit) continue;
    // Extra guard: skip plain numeric-only codes unless name matches marker
    if (/^\d+$/.test(code) && !matchesTestMarker(name)) continue;
    summary.fundSources += 1;
    await softDelete(
      `/api/fund-sources/${row.FS_ID}`,
      token,
      `fund#${row.FS_ID} "${code || name}"`,
    );
  }

  // --- Payment configs ---
  const pcRes = await request('/api/payment-configs', { token });
  const pcs = Array.isArray(pcRes.json)
    ? pcRes.json
    : Array.isArray(pcRes.json?.data)
      ? pcRes.json.data
      : [];
  for (const row of pcs) {
    const name = row.PROVIDER_NAME ?? '';
    if (!matchesTestMarker(name)) continue;
    // never delete plain SCB production-like config
    if (/^SCB$/i.test(name.trim())) continue;
    summary.paymentConfigs += 1;
    const id = row.PC_ID ?? row.id;
    await softDelete(
      `/api/payment-configs/${id}`,
      token,
      `payment-config#${id} "${name}"`,
    );
  }

  // --- Disposable users ---
  let users = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const usersRes = await request(
      `/api/users?search=${encodeURIComponent('buu-get.test')}&page=${page}&limit=${limit}`,
      { token },
    );
    const chunk = Array.isArray(usersRes.json?.data)
      ? usersRes.json.data
      : Array.isArray(usersRes.json)
        ? usersRes.json
        : [];
    users = users.concat(chunk);
    const total = usersRes.json?.meta?.total;
    if (chunk.length < limit) break;
    if (typeof total === 'number' && users.length >= total) break;
    page += 1;
    if (page > 50) break;
  }

  for (const user of users) {
    const email = (user.USER_EMAIL ?? user.email ?? '').toLowerCase();
    if (!email.endsWith('@buu-get.test')) continue;
    if (PROTECTED_EMAILS.has(email) || /^test\./.test(email)) {
      summary.skippedProtectedUsers += 1;
      continue;
    }
    const local = email.split('@')[0];
    const looksDisposable =
      /^(fix|mixed|nid-|softdel|auth-i|b6-|b7-|enr-|cert-|scr-|vouch-|fund|txn-|rcpt-|br-|void-|reg\.|i00)/i.test(
        local,
      ) ||
      local.includes('.') ||
      /\d{10,}/.test(local);
    if (!looksDisposable) continue;
    summary.users += 1;
    await softDelete(
      `/api/users/${user.USER_ID ?? user.id}`,
      token,
      `user#${user.USER_ID ?? user.id} ${email}`,
    );
  }

  console.log('');
  console.log('Summary matched for delete:');
  console.log(`  exams: ${summary.exams}`);
  console.log(`  locations: ${summary.locations}`);
  console.log(`  fundSources: ${summary.fundSources}`);
  console.log(`  paymentConfigs: ${summary.paymentConfigs}`);
  console.log(`  disposableUsers: ${summary.users}`);
  console.log(`  skippedProtectedUsers: ${summary.skippedProtectedUsers}`);
  if (summary.skippedKept.length) {
    console.log('\nKept (did not match test markers):');
    for (const line of summary.skippedKept) console.log(`  ${line}`);
  }
  if (!EXECUTE) {
    console.log('\nRe-run with --execute to soft-delete the listed rows.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
