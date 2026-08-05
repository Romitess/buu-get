import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';

/**
 * Receipts API integration — matrix RCPT-I-001 … RCPT-I-016
 *
 * Seed approach (shared-DB, disposable via API):
 * 1. Admin creates exam (open reg window + EXAM_FEE) + payment-config
 * 2. Candidate enrolls + creates PENDING transactions (one TRANX per receipt)
 * 3. Finance creates/patches receipts against those TRANX_IDs
 * 4. afterAll soft-deletes receipts, txns, enrollments, sessions, PC, exam
 */

const ReceiptStatus = {
  UNISSUED: 0,
  ISSUED: 1,
  VOIDED: 2,
} as const;

const EXAM_FEE = 500;

type AuthHeaders = { Authorization: string };

type ReceiptRow = {
  RC_ID: number;
  TRANX_ID: number;
  RC_STATUS: number;
  RC_VERIFY_CODE: string;
  RC_SIGNATURE_ID?: string;
  RC_ISSUED_AT?: string | null;
  RC_TAX_ID?: string | null;
  RC_NAME?: string | null;
  RC_PHONE?: string | null;
  RC_ADDRESS?: string | null;
  DELETED_AT?: string | null;
};

type EnrollmentRow = {
  ERM_ID: number;
  USER_ID: number;
  SESSION_ID: number;
};

type PaymentConfigRow = {
  PC_ID: number;
};

type Paginated<T> = {
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function hourMinute(slot: number): { start: string; end: string } {
  const startH = 8 + Math.floor(slot / 2);
  const startM = slot % 2 === 0 ? 0 : 30;
  const endH = startH + 1;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    start: `${pad(startH)}:${pad(startM)}:00`,
    end: `${pad(endH)}:${pad(startM)}:00`,
  };
}

async function headersFor(
  request: APIRequestContext,
  role: 'admin' | 'finance' | 'candidate' | 'proctor',
): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, role);
  return { Authorization: `Bearer ${accessToken}` };
}

async function jsonOrEmpty(res: {
  json: () => Promise<unknown>;
}): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

test.describe('Receipts API — create / authz / issue / download flows', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120_000);

  let adminHeaders: AuthHeaders;
  let financeHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;

  let candidateUserId: number;
  let examId: number | null = null;
  let activePcId: number | null = null;

  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const transactionIds: number[] = [];
  const receiptIds: number[] = [];

  let sessionSlot = 0;
  let seedReady = false;
  let seedSkipReason = '';

  async function createSession(
    request: APIRequestContext,
  ): Promise<number> {
    const { start, end } = hourMinute(sessionSlot++);
    const res = await request.post('/api/exam-sessions', {
      headers: adminHeaders,
      data: {
        EXAM_ID: examId,
        SS_START_TIME: start,
        SS_END_TIME: end,
        SS_CAPACITY: 30,
        SS_SESSION_STATUS: 1,
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { SS_ID: number };
    sessionIds.push(body.SS_ID);
    return body.SS_ID;
  }

  async function createEnrollment(
    request: APIRequestContext,
  ): Promise<EnrollmentRow> {
    const sessionId = await createSession(request);
    const res = await request.post('/api/exam-enrollments', {
      headers: candidateHeaders,
      data: {
        USER_ID: candidateUserId,
        SESSION_ID: sessionId,
      },
    });
    const text = await res.text();
    expect(res.status(), text).toBe(201);
    const body = JSON.parse(text) as EnrollmentRow;
    enrollmentIds.push(body.ERM_ID);
    return body;
  }

  async function createPendingTxn(
    request: APIRequestContext,
  ): Promise<number> {
    const enrollment = await createEnrollment(request);
    const res = await request.post('/api/transactions', {
      headers: candidateHeaders,
      data: {
        ermId: enrollment.ERM_ID,
        pcId: activePcId,
        amount: EXAM_FEE,
      },
    });
    const text = await res.text();
    expect(res.status(), text).toBe(201);
    const body = JSON.parse(text) as { TRANX_ID: number };
    transactionIds.push(body.TRANX_ID);
    return body.TRANX_ID;
  }

  async function createReceipt(
    request: APIRequestContext,
    data: Record<string, unknown>,
    headers: AuthHeaders = financeHeaders,
  ): Promise<{ status: number; body: ReceiptRow; text: string }> {
    const res = await request.post('/api/receipts', { headers, data });
    const text = await res.text();
    let body = {} as ReceiptRow;
    try {
      body = JSON.parse(text) as ReceiptRow;
    } catch {
      /* non-JSON error body */
    }
    if (res.status() === 201 && body.RC_ID) {
      receiptIds.push(body.RC_ID);
    }
    return { status: res.status(), body, text };
  }

  function trackReceipt(rcId: number | undefined): void {
    if (rcId && !receiptIds.includes(rcId)) {
      receiptIds.push(rcId);
    }
  }

  test.beforeAll(async ({ request }) => {
    adminHeaders = await headersFor(request, 'admin');
    financeHeaders = await headersFor(request, 'finance');
    candidateHeaders = await headersFor(request, 'candidate');

    const me = await request.get('/api/auth/me', {
      headers: candidateHeaders,
    });
    expect(me.status()).toBe(200);
    const meBody = (await me.json()) as { id: number };
    candidateUserId = meBody.id;

    const suffix = uniqueSuffix();
    const examRes = await request.post('/api/exam', {
      headers: adminHeaders,
      data: {
        EXAM_NAME: `RCPT-I ${suffix}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE,
        EXAM_DATE: '2026-12-28',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: 'RC',
        EXAM_FISCAL_YEAR: '2026',
        FUND_SOURCE_ID: 1,
        SRB_ID: 1,
      },
    });
    if (![200, 201].includes(examRes.status())) {
      seedSkipReason = `Cannot create disposable exam: ${examRes.status()} ${await examRes.text()}`;
      return;
    }
    const exam = (await examRes.json()) as { EXAM_ID: number };
    examId = exam.EXAM_ID;

    const pcRes = await request.post('/api/payment-configs', {
      headers: adminHeaders,
      data: {
        PROVIDER_NAME: `RCPT-I-pc-${suffix}`.slice(0, 100),
        PC_COMP_CODE: `RC${suffix}`.slice(0, 20),
        PC_PROD_CODE: `RP${suffix}`.slice(0, 20),
        PC_IS_ACTIVE: true,
        PC_EFFECTIVE_FROM: '2026-01-01T00:00:00.000Z',
      },
    });
    if (pcRes.status() !== 201) {
      seedSkipReason = `Cannot create payment-config: ${pcRes.status()} ${await pcRes.text()}`;
      return;
    }
    activePcId = ((await pcRes.json()) as PaymentConfigRow).PC_ID;
    seedReady = true;
  });

  test.afterAll(async ({ request }) => {
    for (const rcId of receiptIds) {
      await request
        .delete(`/api/receipts/${rcId}`, { headers: financeHeaders })
        .catch(() => undefined);
    }
    for (const tranxId of transactionIds) {
      await request
        .delete(`/api/transactions/${tranxId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    for (const ermId of enrollmentIds) {
      await request
        .delete(`/api/exam-enrollments/${ermId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    for (const ssId of sessionIds) {
      await request
        .delete(`/api/exam-sessions/${ssId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    if (activePcId) {
      await request
        .delete(`/api/payment-configs/${activePcId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    if (examId) {
      await request
        .delete(`/api/exam/${examId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
  });

  function requireSeed(): void {
    test.skip(!seedReady, seedSkipReason || 'Disposable exam/PC seed failed');
  }

  // RCPT-I-001
  test('POST /receipts FINANCE creates + 16-char verify code UNISSUED', async ({
    request,
  }) => {
    requireSeed();
    const tranxId = await createPendingTxn(request);
    const { status, body, text } = await createReceipt(request, {
      TRANX_ID: tranxId,
      RC_SIGNATURE_ID: `rcpt-i-001-${uniqueSuffix()}`,
    });
    expect(status, text).toBe(201);
    expect(body.RC_ID).toEqual(expect.any(Number));
    expect(body.TRANX_ID).toBe(tranxId);
    expect(body.RC_STATUS).toBe(ReceiptStatus.UNISSUED);
    expect(body.RC_VERIFY_CODE).toMatch(/^[A-Z0-9]{16}$/);
  });

  // RCPT-I-002
  test('POST can create already ISSUED', async ({ request }) => {
    requireSeed();
    const tranxId = await createPendingTxn(request);
    const issuedAt = '2026-08-05T00:00:00.000Z';
    const { status, body, text } = await createReceipt(request, {
      TRANX_ID: tranxId,
      RC_SIGNATURE_ID: `rcpt-i-002-${uniqueSuffix()}`,
      RC_STATUS: ReceiptStatus.ISSUED,
      RC_ISSUED_AT: issuedAt,
    });
    expect(status, text).toBe(201);
    expect(body.RC_STATUS).toBe(ReceiptStatus.ISSUED);

    const getRes = await request.get(`/api/receipts/${body.RC_ID}`, {
      headers: financeHeaders,
    });
    expect(getRes.status(), await getRes.text()).toBe(200);
    const got = (await getRes.json()) as ReceiptRow;
    expect(got.RC_STATUS).toBe(ReceiptStatus.ISSUED);
  });

  // RCPT-I-003
  test('POST rejects non-FINANCE (candidate USER)', async ({ request }) => {
    requireSeed();
    const tranxId = await createPendingTxn(request);
    const res = await request.post('/api/receipts', {
      headers: candidateHeaders,
      data: {
        TRANX_ID: tranxId,
        RC_SIGNATURE_ID: `rcpt-i-003-${uniqueSuffix()}`,
      },
    });
    expect(res.status(), await res.text()).toBe(403);
  });

  // RCPT-I-004
  test('CRUD without JWT → 401', async ({ request }) => {
    requireSeed();
    const routes: Array<{
      method: 'get' | 'post' | 'patch' | 'delete';
      path: string;
      data?: Record<string, unknown>;
    }> = [
      { method: 'post', path: '/api/receipts', data: { TRANX_ID: 1, RC_SIGNATURE_ID: 'x' } },
      { method: 'get', path: '/api/receipts' },
      { method: 'get', path: '/api/receipts/issued' },
      { method: 'get', path: '/api/receipts/1' },
      { method: 'patch', path: '/api/receipts/1', data: { RC_STATUS: 1 } },
      { method: 'delete', path: '/api/receipts/1' },
    ];

    for (const route of routes) {
      const res = await request[route.method](route.path, {
        data: route.data,
      });
      expect(res.status(), `${route.method.toUpperCase()} ${route.path}`).toBe(
        401,
      );
    }
  });

  // RCPT-I-005
  test('GET /receipts paginates', async ({ request }) => {
    requireSeed();
    for (let i = 0; i < 2; i++) {
      const tranxId = await createPendingTxn(request);
      const created = await createReceipt(request, {
        TRANX_ID: tranxId,
        RC_SIGNATURE_ID: `rcpt-i-005-${i}-${uniqueSuffix()}`,
      });
      expect(created.status, created.text).toBe(201);
    }

    const res = await request.get('/api/receipts?page=1&limit=1', {
      headers: financeHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    const page = (await res.json()) as Paginated<ReceiptRow>;
    expect(page.data).toEqual(expect.any(Array));
    expect(page.data.length).toBeLessThanOrEqual(1);
    expect(page.meta?.page ?? 1).toBe(1);
    expect(page.meta?.limit ?? 1).toBe(1);
    expect((page.meta?.total ?? 0) >= 2).toBe(true);
  });

  // RCPT-I-006
  test('GET /receipts/issued only ISSUED', async ({ request }) => {
    requireSeed();
    const unissuedTranx = await createPendingTxn(request);
    const issuedTranx = await createPendingTxn(request);

    const unissued = await createReceipt(request, {
      TRANX_ID: unissuedTranx,
      RC_SIGNATURE_ID: `rcpt-i-006-u-${uniqueSuffix()}`,
      RC_STATUS: ReceiptStatus.UNISSUED,
    });
    expect(unissued.status, unissued.text).toBe(201);

    const issued = await createReceipt(request, {
      TRANX_ID: issuedTranx,
      RC_SIGNATURE_ID: `rcpt-i-006-i-${uniqueSuffix()}`,
      RC_STATUS: ReceiptStatus.ISSUED,
      RC_ISSUED_AT: '2026-08-05T00:00:00.000Z',
    });
    expect(issued.status, issued.text).toBe(201);

    const res = await request.get('/api/receipts/issued?page=1&limit=50', {
      headers: financeHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    const page = (await res.json()) as Paginated<ReceiptRow>;
    expect(page.data.every((r) => r.RC_STATUS === ReceiptStatus.ISSUED)).toBe(
      true,
    );
    expect(page.data.some((r) => r.RC_ID === issued.body.RC_ID)).toBe(true);
    expect(page.data.some((r) => r.RC_ID === unissued.body.RC_ID)).toBe(false);
  });

  // RCPT-I-007
  test('GET /:id 200 / 404', async ({ request }) => {
    requireSeed();
    const tranxId = await createPendingTxn(request);
    const created = await createReceipt(request, {
      TRANX_ID: tranxId,
      RC_SIGNATURE_ID: `rcpt-i-007-${uniqueSuffix()}`,
    });
    expect(created.status, created.text).toBe(201);

    const ok = await request.get(`/api/receipts/${created.body.RC_ID}`, {
      headers: financeHeaders,
    });
    expect(ok.status(), await ok.text()).toBe(200);
    const body = (await ok.json()) as ReceiptRow;
    expect(body.RC_ID).toBe(created.body.RC_ID);

    const missing = await request.get('/api/receipts/2147483646', {
      headers: financeHeaders,
    });
    expect(missing.status(), await missing.text()).toBe(404);
  });

  // RCPT-I-008
  test('PATCH UNISSUED→ISSUED', async ({ request }) => {
    requireSeed();
    const tranxId = await createPendingTxn(request);
    const created = await createReceipt(request, {
      TRANX_ID: tranxId,
      RC_SIGNATURE_ID: `rcpt-i-008-${uniqueSuffix()}`,
    });
    expect(created.status, created.text).toBe(201);
    expect(created.body.RC_STATUS).toBe(ReceiptStatus.UNISSUED);

    const patch = await request.patch(
      `/api/receipts/${created.body.RC_ID}`,
      {
        headers: financeHeaders,
        data: {
          RC_STATUS: ReceiptStatus.ISSUED,
          RC_ISSUED_AT: '2026-08-05T12:00:00.000Z',
        },
      },
    );
    expect(patch.status(), await patch.text()).toBe(200);
    const patched = (await patch.json()) as ReceiptRow;
    expect(patched.RC_STATUS).toBe(ReceiptStatus.ISSUED);

    const getRes = await request.get(`/api/receipts/${created.body.RC_ID}`, {
      headers: financeHeaders,
    });
    expect(getRes.status()).toBe(200);
    expect(((await getRes.json()) as ReceiptRow).RC_STATUS).toBe(
      ReceiptStatus.ISSUED,
    );
  });

  // RCPT-I-009
  test('PATCH invalid status → 400', async ({ request }) => {
    requireSeed();
    const tranxId = await createPendingTxn(request);
    const created = await createReceipt(request, {
      TRANX_ID: tranxId,
      RC_SIGNATURE_ID: `rcpt-i-009-${uniqueSuffix()}`,
    });
    expect(created.status, created.text).toBe(201);

    const bad = await request.patch(`/api/receipts/${created.body.RC_ID}`, {
      headers: financeHeaders,
      data: { RC_STATUS: 99 },
    });
    expect(bad.status(), await bad.text()).toBe(400);
  });

  // RCPT-I-010
  test('DELETE soft-delete → GET 404', async ({ request }) => {
    requireSeed();
    const tranxId = await createPendingTxn(request);
    const created = await createReceipt(request, {
      TRANX_ID: tranxId,
      RC_SIGNATURE_ID: `rcpt-i-010-${uniqueSuffix()}`,
    });
    expect(created.status, created.text).toBe(201);
    const rcId = created.body.RC_ID;

    const del = await request.delete(`/api/receipts/${rcId}`, {
      headers: financeHeaders,
    });
    expect(del.status(), await del.text()).toBe(200);

    // Remove from cleanup list — already deleted
    const idx = receiptIds.indexOf(rcId);
    if (idx >= 0) receiptIds.splice(idx, 1);

    const getRes = await request.get(`/api/receipts/${rcId}`, {
      headers: financeHeaders,
    });
    expect(getRes.status(), await getRes.text()).toBe(404);
    // DELETED_AT not exposed via GET after soft-delete (entity filtered out);
    // 404 confirms softRemove path used by ReceiptsService.remove
  });

  // RCPT-I-011
  test('GET download ISSUED → PDF headers (any JWT)', async ({ request }) => {
    requireSeed();
    const tranxId = await createPendingTxn(request);
    const created = await createReceipt(request, {
      TRANX_ID: tranxId,
      RC_SIGNATURE_ID: `rcpt-i-011-${uniqueSuffix()}`,
      RC_STATUS: ReceiptStatus.ISSUED,
      RC_ISSUED_AT: '2026-08-05T00:00:00.000Z',
    });
    expect(created.status, created.text).toBe(201);

    // no @Roles on download — candidate JWT must work
    const res = await request.get(`/api/receipts/${tranxId}/download`, {
      headers: candidateHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    const contentType = res.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/application\/pdf/i);
    const disposition = res.headers()['content-disposition'] ?? '';
    expect(disposition).toMatch(/attachment/i);
    expect(disposition).toContain(`receipt-${tranxId}.pdf`);
    const buf = await res.body();
    expect(buf.length).toBeGreaterThan(0);
    expect(buf.subarray(0, 4).toString('utf8')).toBe('%PDF');
  });

  // RCPT-I-012
  test('Download UNISSUED/VOIDED 403; missing 404', async ({ request }) => {
    requireSeed();
    const unissuedTranx = await createPendingTxn(request);
    const voidedTranx = await createPendingTxn(request);

    const unissued = await createReceipt(request, {
      TRANX_ID: unissuedTranx,
      RC_SIGNATURE_ID: `rcpt-i-012-u-${uniqueSuffix()}`,
      RC_STATUS: ReceiptStatus.UNISSUED,
    });
    expect(unissued.status, unissued.text).toBe(201);

    const voided = await createReceipt(request, {
      TRANX_ID: voidedTranx,
      RC_SIGNATURE_ID: `rcpt-i-012-v-${uniqueSuffix()}`,
      RC_STATUS: ReceiptStatus.VOIDED,
    });
    expect(voided.status, voided.text).toBe(201);

    const unissuedDl = await request.get(
      `/api/receipts/${unissuedTranx}/download`,
      { headers: financeHeaders },
    );
    expect(unissuedDl.status(), await unissuedDl.text()).toBe(403);

    const voidedDl = await request.get(
      `/api/receipts/${voidedTranx}/download`,
      { headers: financeHeaders },
    );
    expect(voidedDl.status(), await voidedDl.text()).toBe(403);

    const missingDl = await request.get(
      '/api/receipts/2147483646/download',
      { headers: financeHeaders },
    );
    expect(missingDl.status(), await missingDl.text()).toBe(404);
  });

  // RCPT-I-013
  test('Download without JWT → 401', async ({ request }) => {
    const res = await request.get('/api/receipts/1/download');
    expect(res.status(), await res.text()).toBe(401);
  });

  // RCPT-I-014
  test('limit >100 rejected', async ({ request }) => {
    requireSeed();
    const res = await request.get('/api/receipts?page=1&limit=101', {
      headers: financeHeaders,
    });
    expect(res.status(), await res.text()).toBe(400);
  });

  // RCPT-I-015
  test('RC_VERIFY_CODE unique constraint', async ({ request }) => {
    requireSeed();
    /**
     * HTTP API cannot force a duplicate RC_VERIFY_CODE:
     * - CreateReceiptDto omits RC_VERIFY_CODE (forbidNonWhitelisted → 400)
     * - ReceiptsService.create always overwrites with generateReceiptVerifyCode()
     * DB unique index UQ_RC_VERIFY_CODE exists but is not exercisable via receipts API.
     * Closest integration proof: client inject rejected + two creates yield distinct codes.
     */
    const tranxA = await createPendingTxn(request);
    const a = await createReceipt(request, {
      TRANX_ID: tranxA,
      RC_SIGNATURE_ID: `rcpt-i-015-a-${uniqueSuffix()}`,
    });
    expect(a.status, a.text).toBe(201);
    expect(a.body.RC_VERIFY_CODE).toMatch(/^[A-Z0-9]{16}$/);

    const inject = await request.post('/api/receipts', {
      headers: financeHeaders,
      data: {
        TRANX_ID: tranxA,
        RC_SIGNATURE_ID: `rcpt-i-015-inj-${uniqueSuffix()}`,
        RC_VERIFY_CODE: a.body.RC_VERIFY_CODE,
      },
    });
    expect(inject.status(), await inject.text()).toBe(400);

    const tranxB = await createPendingTxn(request);
    const b = await createReceipt(request, {
      TRANX_ID: tranxB,
      RC_SIGNATURE_ID: `rcpt-i-015-b-${uniqueSuffix()}`,
    });
    expect(b.status, b.text).toBe(201);
    expect(b.body.RC_VERIFY_CODE).toMatch(/^[A-Z0-9]{16}$/);
    expect(b.body.RC_VERIFY_CODE).not.toBe(a.body.RC_VERIFY_CODE);

    // Matrix expected "Unique violation" on forced second insert — not reachable via API.
    test.info().annotations.push({
      type: 'note',
      description:
        'RCPT-I-015: DB unique violation path not HTTP-testable; verified client inject→400 and distinct auto codes instead',
    });
  });

  // RCPT-I-016
  test('API cannot mutate tax/profile fields', async ({ request }) => {
    requireSeed();
    const tranxId = await createPendingTxn(request);

    const post = await request.post('/api/receipts', {
      headers: financeHeaders,
      data: {
        TRANX_ID: tranxId,
        RC_SIGNATURE_ID: `rcpt-i-016-${uniqueSuffix()}`,
        RC_TAX_ID: '1234567890123',
        RC_NAME: 'Should Not Persist',
        RC_PHONE: '0812345678',
        RC_ADDRESS: 'Forbidden Address',
      },
    });
    expect(post.status(), await post.text()).toBe(400);
    const postBody = await jsonOrEmpty(post);
    const postMsg = JSON.stringify(postBody);
    expect(postMsg).toMatch(/RC_TAX_ID|RC_NAME|RC_PHONE|RC_ADDRESS|whitelist/i);

    // Create clean receipt then PATCH with tax fields
    const created = await createReceipt(request, {
      TRANX_ID: tranxId,
      RC_SIGNATURE_ID: `rcpt-i-016-ok-${uniqueSuffix()}`,
    });
    expect(created.status, created.text).toBe(201);
    trackReceipt(created.body.RC_ID);

    const patch = await request.patch(`/api/receipts/${created.body.RC_ID}`, {
      headers: financeHeaders,
      data: {
        RC_NAME: 'Hacked Name',
        RC_TAX_ID: '9999999999999',
        RC_PHONE: '0899999999',
        RC_ADDRESS: 'Hacked Addr',
      },
    });
    expect(patch.status(), await patch.text()).toBe(400);

    const getRes = await request.get(`/api/receipts/${created.body.RC_ID}`, {
      headers: financeHeaders,
    });
    expect(getRes.status()).toBe(200);
    const got = (await getRes.json()) as ReceiptRow;
    expect(got.RC_NAME ?? null).not.toBe('Hacked Name');
    expect(got.RC_TAX_ID ?? null).not.toBe('9999999999999');
  });
});
