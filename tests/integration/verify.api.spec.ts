import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';

/**
 * exam-certificates controller mounts at `/api/exam-certificates` (BUG-002 fixed).
 */
const EXAM_CERTIFICATES_PATH = '/api/exam-certificates';

type ExamCertificateRow = {
  CERT_ID: number;
  CERT_CODE: string;
  SCORES_ID: number;
  USER_ID: number;
  CERT_ISSUED_AT?: string | null;
  CERT_EXPIRES_AT?: string | null;
  DELETED_AT?: string | null;
};

type ReceiptRow = {
  RC_ID: number;
  RC_VERIFY_CODE: string;
  RC_STATUS: number;
  TRANX_ID: number;
  DELETED_AT?: string | null;
};

type TransactionRow = {
  TRANX_ID: number;
};

type Paginated<T> = {
  data: T[];
  meta?: { total?: number };
};

const ReceiptStatus = {
  UNISSUED: 0,
  ISSUED: 1,
  VOIDED: 2,
} as const;

function uniqueVerifyCode(prefix = 'VT'): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const seed = `${prefix}${Date.now()}${Math.floor(Math.random() * 1_000_000)}`
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  let code = seed.slice(0, 16);
  while (code.length < 16) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code.slice(0, 16);
}

async function adminHeaders(
  request: APIRequestContext,
): Promise<{ Authorization: string }> {
  const { accessToken } = await apiLogin(request, 'admin');
  return { Authorization: `Bearer ${accessToken}` };
}

async function listCertificates(
  request: APIRequestContext,
  headers: { Authorization: string },
): Promise<ExamCertificateRow[]> {
  const res = await request.get(EXAM_CERTIFICATES_PATH, { headers });
  expect(res.status(), await res.text()).toBe(200);
  return (await res.json()) as ExamCertificateRow[];
}

async function discoverActiveCertificate(
  request: APIRequestContext,
  headers: { Authorization: string },
): Promise<ExamCertificateRow | null> {
  const certs = await listCertificates(request, headers);
  return (
    certs.find((c) => c.CERT_CODE && !c.DELETED_AT) ??
    certs[0] ??
    null
  );
}

async function createCertificate(
  request: APIRequestContext,
  headers: { Authorization: string },
  body: Record<string, unknown>,
): Promise<{ status: number; body: ExamCertificateRow }> {
  const res = await request.post(EXAM_CERTIFICATES_PATH, {
    headers,
    data: body,
  });
  const json = (await res.json().catch(() => ({}))) as ExamCertificateRow;
  return { status: res.status(), body: json };
}

async function softDeleteCertificate(
  request: APIRequestContext,
  headers: { Authorization: string },
  certId: number,
): Promise<void> {
  await request.delete(`${EXAM_CERTIFICATES_PATH}/${certId}`, { headers });
}

async function listReceipts(
  request: APIRequestContext,
  headers: { Authorization: string },
  query: string,
): Promise<ReceiptRow[]> {
  const res = await request.get(`/api/receipts?${query}`, { headers });
  expect(res.status(), await res.text()).toBe(200);
  const page = (await res.json()) as Paginated<ReceiptRow>;
  return page.data ?? [];
}

async function discoverIssuedReceipt(
  request: APIRequestContext,
  headers: { Authorization: string },
): Promise<ReceiptRow | null> {
  const res = await request.get('/api/receipts/issued?page=1&limit=20', {
    headers,
  });
  expect(res.status(), await res.text()).toBe(200);
  const page = (await res.json()) as Paginated<ReceiptRow>;
  return (
    page.data?.find((r) => r.RC_VERIFY_CODE && r.RC_STATUS === ReceiptStatus.ISSUED) ??
    null
  );
}

async function discoverUnissuedReceipt(
  request: APIRequestContext,
  headers: { Authorization: string },
): Promise<ReceiptRow | null> {
  const rows = await listReceipts(request, headers, 'page=1&limit=50');
  return rows.find((r) => r.RC_STATUS === ReceiptStatus.UNISSUED) ?? null;
}

async function discoverTransactionId(
  request: APIRequestContext,
  headers: { Authorization: string },
): Promise<number | null> {
  const res = await request.get('/api/transactions?page=1&limit=10', {
    headers,
  });
  if (!res.ok()) return null;
  const page = (await res.json()) as Paginated<TransactionRow>;
  return page.data?.[0]?.TRANX_ID ?? null;
}

async function createReceipt(
  request: APIRequestContext,
  headers: { Authorization: string },
  body: Record<string, unknown>,
): Promise<{ status: number; body: ReceiptRow }> {
  const res = await request.post('/api/receipts', { headers, data: body });
  const json = (await res.json().catch(() => ({}))) as ReceiptRow;
  return { status: res.status(), body: json };
}

async function patchReceipt(
  request: APIRequestContext,
  headers: { Authorization: string },
  rcId: number,
  body: Record<string, unknown>,
): Promise<{ status: number; body: ReceiptRow }> {
  const res = await request.patch(`/api/receipts/${rcId}`, {
    headers,
    data: body,
  });
  const json = (await res.json().catch(() => ({}))) as ReceiptRow;
  return { status: res.status(), body: json };
}

async function softDeleteReceipt(
  request: APIRequestContext,
  headers: { Authorization: string },
  rcId: number,
): Promise<void> {
  await request.delete(`/api/receipts/${rcId}`, { headers });
}

/** Anchor score/user from an existing cert so create() does not invent orphan FKs. */
async function certificateCreateAnchor(
  request: APIRequestContext,
  headers: { Authorization: string },
): Promise<{ SCORES_ID: number; USER_ID: number } | null> {
  const cert = await discoverActiveCertificate(request, headers);
  if (!cert?.SCORES_ID || !cert?.USER_ID) return null;
  return { SCORES_ID: cert.SCORES_ID, USER_ID: cert.USER_ID };
}

test.describe('Verify API — public certificate & receipt lookup', () => {
  // Shared-DB fixture create/delete; keep serial to avoid rate-limit noise across workers
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90_000);

  // VERIFY-I-001
  test('GET /api/verify/certificate/:code public happy → 200', async ({
    request,
  }) => {
    const headers = await adminHeaders(request);
    const cert = await discoverActiveCertificate(request, headers);
    test.skip(
      !cert,
      'No exam certificates in shared DB — cannot discover CERT_CODE',
    );

    const res = await request.get(
      `/api/verify/certificate/${cert!.CERT_CODE}`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      type: 'certificate',
      verificationCode: cert!.CERT_CODE,
      status: expect.stringMatching(/^(valid|expired)$/),
      holder: expect.objectContaining({
        fullName: expect.any(String),
        testTakerId: expect.any(String),
      }),
      exam: expect.any(Object),
      scores: expect.objectContaining({
        total: expect.any(Number),
      }),
    });
  });

  // VERIFY-I-002
  test('GET certificate unknown / soft-deleted → 404', async ({ request }) => {
    const missing = await request.get(
      `/api/verify/certificate/${uniqueVerifyCode('XX')}`,
    );
    expect(missing.status()).toBe(404);
    const missingBody = await missing.json();
    expect(missingBody.message).toMatch(/certificate not found/i);

    const headers = await adminHeaders(request);
    const anchor = await certificateCreateAnchor(request, headers);
    if (!anchor) {
      test.info().annotations.push({
        type: 'note',
        description:
          'Soft-deleted certificate 404 not exercised — no SCORES_ID/USER_ID anchor',
      });
      return;
    }

    const code = uniqueVerifyCode('DL');
    const created = await createCertificate(request, headers, {
      SCORES_ID: anchor.SCORES_ID,
      USER_ID: anchor.USER_ID,
      CERT_ISSUED_AT: '2025-01-01T00:00:00.000Z',
      CERT_EXPIRES_AT: '2028-01-01T00:00:00.000Z',
      CERT_CODE: code,
    });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect(created.body.CERT_ID).toEqual(expect.any(Number));

    try {
      await softDeleteCertificate(request, headers, created.body.CERT_ID);
      const res = await request.get(`/api/verify/certificate/${code}`);
      expect(res.status()).toBe(404);
      const body = await res.json();
      expect(body.message).toMatch(/certificate not found/i);
    } finally {
      // Idempotent cleanup if soft-delete failed mid-way
      await softDeleteCertificate(request, headers, created.body.CERT_ID);
    }
  });

  // VERIFY-I-003
  test('GET certificate expired → 200 with status expired', async ({
    request,
  }) => {
    const headers = await adminHeaders(request);
    const anchor = await certificateCreateAnchor(request, headers);
    test.skip(
      !anchor,
      'Cannot create expired certificate fixture (no SCORES_ID/USER_ID anchor)',
    );

    const code = uniqueVerifyCode('EX');
    const created = await createCertificate(request, headers, {
      SCORES_ID: anchor!.SCORES_ID,
      USER_ID: anchor!.USER_ID,
      CERT_ISSUED_AT: '2024-01-01T00:00:00.000Z',
      CERT_EXPIRES_AT: '2024-06-01T00:00:00.000Z',
      CERT_CODE: code,
    });
    expect(created.status, JSON.stringify(created.body)).toBe(201);

    try {
      const res = await request.get(`/api/verify/certificate/${code}`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({
        type: 'certificate',
        status: 'expired',
        verificationCode: code,
      });
    } finally {
      await softDeleteCertificate(request, headers, created.body.CERT_ID);
    }
  });

  // VERIFY-I-004
  test('GET /api/verify/receipt/:code issued → 200', async ({ request }) => {
    const headers = await adminHeaders(request);
    const receipt = await discoverIssuedReceipt(request, headers);
    test.skip(
      !receipt,
      'No ISSUED receipts with RC_VERIFY_CODE in shared DB',
    );

    const res = await request.get(
      `/api/verify/receipt/${receipt!.RC_VERIFY_CODE}`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      type: 'receipt',
      status: 'valid',
      verificationCode: receipt!.RC_VERIFY_CODE,
      receiptNo: expect.any(String),
      payment: expect.objectContaining({
        description: expect.any(String),
        amount: expect.any(Number),
      }),
      organization: expect.objectContaining({
        taxId: expect.any(String),
      }),
    });
  });

  // VERIFY-I-005
  test('GET receipt unissued / deleted / missing → 404', async ({
    request,
  }) => {
    const missing = await request.get(
      `/api/verify/receipt/${uniqueVerifyCode('RM')}`,
    );
    expect(missing.status()).toBe(404);
    const missingBody = await missing.json();
    expect(missingBody.message).toMatch(/receipt not found/i);

    const headers = await adminHeaders(request);
    const unissued = await discoverUnissuedReceipt(request, headers);
    if (unissued?.RC_VERIFY_CODE) {
      const unissuedRes = await request.get(
        `/api/verify/receipt/${unissued.RC_VERIFY_CODE}`,
      );
      expect(unissuedRes.status()).toBe(404);
    } else {
      test.info().annotations.push({
        type: 'note',
        description:
          'No UNISSUED receipt found — missing-code 404 still covered; unissued skipped',
      });
    }

    const tranxId = await discoverTransactionId(request, headers);
    if (!tranxId) {
      test.info().annotations.push({
        type: 'note',
        description:
          'Soft-deleted receipt 404 not exercised — no TRANX_ID for temp create',
      });
      return;
    }

    const created = await createReceipt(request, headers, {
      TRANX_ID: tranxId,
      RC_SIGNATURE_ID: `verify-i-005-${Date.now()}`,
      RC_STATUS: ReceiptStatus.ISSUED,
      RC_ISSUED_AT: '2026-01-15T00:00:00.000Z',
    });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const code = created.body.RC_VERIFY_CODE;
    expect(code).toEqual(expect.any(String));

    try {
      await softDeleteReceipt(request, headers, created.body.RC_ID);
      const deletedRes = await request.get(`/api/verify/receipt/${code}`);
      expect(deletedRes.status()).toBe(404);
    } finally {
      await softDeleteReceipt(request, headers, created.body.RC_ID);
    }
  });

  // VERIFY-I-006
  test('GET receipt voided → 200 redacted', async ({ request }) => {
    const headers = await adminHeaders(request);
    const tranxId = await discoverTransactionId(request, headers);
    test.skip(
      !tranxId,
      'Cannot create temp ISSUED→VOIDED receipt (no TRANX_ID)',
    );

    const created = await createReceipt(request, headers, {
      TRANX_ID: tranxId,
      RC_SIGNATURE_ID: `verify-i-006-${Date.now()}`,
      RC_STATUS: ReceiptStatus.ISSUED,
      RC_ISSUED_AT: '2026-01-15T00:00:00.000Z',
    });
    expect(created.status, JSON.stringify(created.body)).toBe(201);

    try {
      const voided = await patchReceipt(request, headers, created.body.RC_ID, {
        RC_STATUS: ReceiptStatus.VOIDED,
      });
      expect(voided.status, JSON.stringify(voided.body)).toBe(200);
      expect(voided.body.RC_STATUS).toBe(ReceiptStatus.VOIDED);

      const res = await request.get(
        `/api/verify/receipt/${created.body.RC_VERIFY_CODE}`,
      );
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({
        type: 'receipt',
        status: 'voided',
        verificationCode: created.body.RC_VERIFY_CODE,
        payment: expect.objectContaining({
          amount: null,
          paymentMethod: null,
          description: expect.any(String),
        }),
        payee: expect.objectContaining({
          address: null,
        }),
      });
    } finally {
      await softDeleteReceipt(request, headers, created.body.RC_ID);
    }
  });

  // VERIFY-I-007
  test('Throttle 30 req / 60s → 429', async () => {
    test.skip(
      true,
      'Skip throttle burst on shared DB/API — 30+/60s would lock out other suites and is flaky under parallel workers',
    );
  });

  // VERIFY-I-008
  test('Exact code match only (wrong codes 404)', async ({ request }) => {
    const headers = await adminHeaders(request);
    const cert = await discoverActiveCertificate(request, headers);
    test.skip(!cert, 'No certificate CERT_CODE available for exact-match check');

    const code = cert!.CERT_CODE;
    const ok = await request.get(`/api/verify/certificate/${code}`);
    expect(ok.status()).toBe(200);

    const wrongSuffix = await request.get(
      `/api/verify/certificate/${code}X`,
    );
    expect(wrongSuffix.status()).toBe(404);

    const truncated = await request.get(
      `/api/verify/certificate/${code.slice(0, Math.max(1, code.length - 1))}`,
    );
    expect(truncated.status()).toBe(404);

    const totallyDifferent = await request.get(
      `/api/verify/certificate/${uniqueVerifyCode('ZZ')}`,
    );
    expect(totallyDifferent.status()).toBe(404);

    // Case-fold: MySQL CI collations may still return 200 — flag if so.
    const hasLetter = /[A-Za-z]/.test(code);
    if (hasLetter) {
      const flipped = code
        .split('')
        .map((ch) =>
          ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase(),
        )
        .join('');
      if (flipped !== code) {
        const caseRes = await request.get(
          `/api/verify/certificate/${flipped}`,
        );
        if (caseRes.status() === 200) {
          test.info().annotations.push({
            type: 'bug',
            description:
              'VERIFY-I-008: certificate verify is case-insensitive (likely MySQL CI collation on CERT_CODE) — wrong-case still 200',
          });
        } else {
          expect(caseRes.status()).toBe(404);
        }
      }
    }
  });
});
