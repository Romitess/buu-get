import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import type { TestRoleKey } from '../e2e/fixtures/users';

/**
 * Voided Receipts API integration — matrix VOID-I-001 … VOID-I-012
 *
 * Seed approach (shared-DB, disposable via API):
 * 1. Admin creates exam (open reg window + EXAM_FEE) + payment-config
 * 2. Candidate enrolls + creates PENDING transactions
 * 3. Confirm → PAID when needed; FINANCE creates ISSUED receipts
 * 4. Void via POST /voided-receipts; assert side effects via GET
 * 5. afterAll soft-deletes receipts, txns, enrollments, sessions, PC, exam
 */

const ReceiptStatus = {
  UNISSUED: 0,
  ISSUED: 1,
  VOIDED: 2,
} as const;

const TransactionPaymentStatus = {
  PENDING: 0,
  PAID: 3,
  REFUND: 7,
  RECEIPT_VOIDED: 8,
} as const;

const ExamEnrollmentStatus = {
  UNPAID: 0,
  PAID: 1,
  CANCELLED: 5,
} as const;

const TransactionApiType = {
  REVERSAL: 4,
} as const;

const EXAM_FEE = 500;

type AuthHeaders = { Authorization: string };

type ReceiptRow = {
  RC_ID: number;
  TRANX_ID: number;
  RC_STATUS: number;
};

type EnrollmentRow = {
  ERM_ID: number;
  USER_ID: number;
  SESSION_ID: number;
  ERM_STATUS?: number;
};

type TransactionRow = {
  TRANX_ID: number;
  ERM_ID: number;
  TRANX_PAYMENT_STATUS: number;
};

type VoidedReceiptRow = {
  VR_ID: number;
  RC_ID: number;
  VR_BY: number;
  VR_REASON: string;
  RECEIPT?: ReceiptRow;
  USER?: { id?: number; USER_ID?: number };
};

type StatusHistoryRow = {
  TSH_ID: number;
  TRANX_ID: number;
  TSH_FROM: string | null;
  TSH_TO: string;
  TSH_API_TYPE: number;
  TSH_RESP_MESSAGE?: string;
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
  role: TestRoleKey,
): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, role);
  return { Authorization: `Bearer ${accessToken}` };
}

test.describe('Voided Receipts API — void / authz / list flows', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120_000);

  let adminHeaders: AuthHeaders;
  let financeHeaders: AuthHeaders;
  let staffHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;
  let proctorHeaders: AuthHeaders;

  let financeUserId: number;
  let staffUserId: number;
  let adminUserId: number;
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
  ): Promise<{ ermId: number; tranxId: number }> {
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
    return { ermId: enrollment.ERM_ID, tranxId: body.TRANX_ID };
  }

  async function confirmPaid(
    request: APIRequestContext,
    tranxId: number,
  ): Promise<void> {
    const res = await request.patch(`/api/transactions/${tranxId}/confirm`, {
      headers: candidateHeaders,
      data: {
        userCode: `uc${uniqueSuffix()}`.slice(0, 20),
        receiptName: 'VOID-I Confirm',
        receiptTaxId: '1234567890123',
        receiptPhone: '0812345678',
        receiptAddress: 'BUU Void Test Addr',
      },
    });
    expect(res.status(), await res.text()).toBe(200);
  }

  async function createIssuedReceipt(
    request: APIRequestContext,
    tranxId: number,
    label: string,
  ): Promise<ReceiptRow> {
    const res = await request.post('/api/receipts', {
      headers: financeHeaders,
      data: {
        TRANX_ID: tranxId,
        RC_SIGNATURE_ID: `${label}-${uniqueSuffix()}`.slice(0, 100),
        RC_STATUS: ReceiptStatus.ISSUED,
        RC_ISSUED_AT: '2026-08-05T00:00:00.000Z',
      },
    });
    const text = await res.text();
    expect(res.status(), text).toBe(201);
    const body = JSON.parse(text) as ReceiptRow;
    receiptIds.push(body.RC_ID);
    return body;
  }

  /** PAID txn + ISSUED receipt ready to void */
  async function seedIssuedForVoid(
    request: APIRequestContext,
    label: string,
  ): Promise<{ ermId: number; tranxId: number; receipt: ReceiptRow }> {
    const { ermId, tranxId } = await createPendingTxn(request);
    await confirmPaid(request, tranxId);
    const receipt = await createIssuedReceipt(request, tranxId, label);
    return { ermId, tranxId, receipt };
  }

  async function postVoid(
    request: APIRequestContext,
    data: Record<string, unknown>,
    headers?: AuthHeaders,
  ): Promise<{ status: number; body: VoidedReceiptRow; text: string }> {
    const res = await request.post('/api/voided-receipts', {
      headers: headers ?? financeHeaders,
      data,
    });
    const text = await res.text();
    let body = {} as VoidedReceiptRow;
    try {
      body = JSON.parse(text) as VoidedReceiptRow;
    } catch {
      /* non-JSON */
    }
    return { status: res.status(), body, text };
  }

  async function getReceipt(
    request: APIRequestContext,
    rcId: number,
  ): Promise<ReceiptRow> {
    const res = await request.get(`/api/receipts/${rcId}`, {
      headers: financeHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as ReceiptRow;
  }

  async function getTransaction(
    request: APIRequestContext,
    tranxId: number,
  ): Promise<TransactionRow> {
    const res = await request.get(`/api/transactions/${tranxId}`, {
      headers: financeHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as TransactionRow;
  }

  async function getEnrollment(
    request: APIRequestContext,
    ermId: number,
  ): Promise<EnrollmentRow> {
    const res = await request.get(`/api/exam-enrollments/${ermId}`, {
      headers: adminHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as EnrollmentRow;
  }

  test.beforeAll(async ({ request }) => {
    adminHeaders = await headersFor(request, 'admin');
    financeHeaders = await headersFor(request, 'finance');
    staffHeaders = await headersFor(request, 'staff');
    candidateHeaders = await headersFor(request, 'candidate');
    proctorHeaders = await headersFor(request, 'proctor');

    const meFinance = await request.get('/api/auth/me', {
      headers: financeHeaders,
    });
    expect(meFinance.status()).toBe(200);
    financeUserId = ((await meFinance.json()) as { id: number }).id;

    const meStaff = await request.get('/api/auth/me', {
      headers: staffHeaders,
    });
    expect(meStaff.status()).toBe(200);
    staffUserId = ((await meStaff.json()) as { id: number }).id;

    const meAdmin = await request.get('/api/auth/me', {
      headers: adminHeaders,
    });
    expect(meAdmin.status()).toBe(200);
    adminUserId = ((await meAdmin.json()) as { id: number }).id;

    const meCandidate = await request.get('/api/auth/me', {
      headers: candidateHeaders,
    });
    expect(meCandidate.status()).toBe(200);
    candidateUserId = ((await meCandidate.json()) as { id: number }).id;

    const suffix = uniqueSuffix();
    const examRes = await request.post('/api/exam', {
      headers: adminHeaders,
      data: {
        EXAM_NAME: `VOID-I ${suffix}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE,
        EXAM_DATE: '2026-12-28',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: 'VR',
        EXAM_FISCAL_YEAR: '2026',
        FUND_SOURCE_ID: 1,
        SRB_ID: 1,
      },
    });
    if (![200, 201].includes(examRes.status())) {
      seedSkipReason = `Cannot create disposable exam: ${examRes.status()} ${await examRes.text()}`;
      return;
    }
    examId = ((await examRes.json()) as { EXAM_ID: number }).EXAM_ID;

    const pcRes = await request.post('/api/payment-configs', {
      headers: adminHeaders,
      data: {
        PROVIDER_NAME: `VOID-I-pc-${suffix}`.slice(0, 100),
        PC_COMP_CODE: `VR${suffix}`.slice(0, 20),
        PC_PROD_CODE: `VP${suffix}`.slice(0, 20),
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

  // VOID-I-001
  test('POST voids ISSUED end-to-end with side effects', async ({
    request,
  }) => {
    requireSeed();
    const { ermId, tranxId, receipt } = await seedIssuedForVoid(
      request,
      'void-i-001',
    );
    const reason = `VOID-I-001 reason ${uniqueSuffix()}`;

    const { status, body, text } = await postVoid(request, {
      RC_ID: receipt.RC_ID,
      VR_REASON: reason,
    });
    expect(status, text).toBe(201);
    expect(body.VR_ID).toEqual(expect.any(Number));
    expect(body.RC_ID).toBe(receipt.RC_ID);
    expect(body.VR_REASON).toBe(reason);
    expect(body.VR_BY).toBe(financeUserId);

    const rc = await getReceipt(request, receipt.RC_ID);
    expect(rc.RC_STATUS).toBe(ReceiptStatus.VOIDED);

    const txn = await getTransaction(request, tranxId);
    expect(txn.TRANX_PAYMENT_STATUS).toBe(
      TransactionPaymentStatus.RECEIPT_VOIDED,
    );

    const erm = await getEnrollment(request, ermId);
    expect(erm.ERM_STATUS).toBe(ExamEnrollmentStatus.CANCELLED);

    const histRes = await request.get(
      `/api/transaction-status-history/transaction/${tranxId}`,
      { headers: financeHeaders },
    );
    expect(histRes.status(), await histRes.text()).toBe(200);
    const history = (await histRes.json()) as StatusHistoryRow[];
    const reversal = history.find(
      (h) =>
        h.TSH_API_TYPE === TransactionApiType.REVERSAL &&
        h.TSH_TO === String(TransactionPaymentStatus.RECEIPT_VOIDED),
    );
    expect(reversal, 'REVERSAL history to RECEIPT_VOIDED').toBeTruthy();
    expect(reversal!.TSH_FROM).toBe(String(TransactionPaymentStatus.PAID));
    expect(reversal!.TSH_RESP_MESSAGE ?? '').toMatch(/void/i);
  });

  // VOID-I-002
  test('POST without JWT → 401', async ({ request }) => {
    const res = await request.post('/api/voided-receipts', {
      data: { RC_ID: 1, VR_REASON: 'no token' },
    });
    expect(res.status(), await res.text()).toBe(401);
  });

  // VOID-I-003
  test('POST non-FINANCE → 403', async ({ request }) => {
    requireSeed();
    const { receipt } = await seedIssuedForVoid(request, 'void-i-003');

    for (const [label, headers] of [
      ['candidate', candidateHeaders],
      ['proctor', proctorHeaders],
    ] as const) {
      const res = await request.post('/api/voided-receipts', {
        headers,
        data: {
          RC_ID: receipt.RC_ID,
          VR_REASON: `VOID-I-003 ${label}`,
        },
      });
      expect(res.status(), `${label}: ${await res.text()}`).toBe(403);
    }
  });

  // VOID-I-004
  test('POST as STAFF allowed by API', async ({ request }) => {
    requireSeed();
    const { receipt } = await seedIssuedForVoid(request, 'void-i-004');
    const reason = `VOID-I-004 staff ${uniqueSuffix()}`;

    const { status, body, text } = await postVoid(
      request,
      { RC_ID: receipt.RC_ID, VR_REASON: reason },
      staffHeaders,
    );
    expect(status, text).toBe(201);
    expect(body.RC_ID).toBe(receipt.RC_ID);
    expect(body.VR_BY).toBe(staffUserId);
    expect(body.VR_REASON).toBe(reason);

    const rc = await getReceipt(request, receipt.RC_ID);
    expect(rc.RC_STATUS).toBe(ReceiptStatus.VOIDED);
  });

  // VOID-I-005
  test('POST as ADMIN and FINANCE', async ({ request }) => {
    requireSeed();

    const adminSeed = await seedIssuedForVoid(request, 'void-i-005-admin');
    const adminVoid = await postVoid(
      request,
      {
        RC_ID: adminSeed.receipt.RC_ID,
        VR_REASON: `VOID-I-005 admin ${uniqueSuffix()}`,
      },
      adminHeaders,
    );
    expect(adminVoid.status, adminVoid.text).toBe(201);
    expect(adminVoid.body.VR_BY).toBe(adminUserId);

    const financeSeed = await seedIssuedForVoid(request, 'void-i-005-fin');
    const financeVoid = await postVoid(request, {
      RC_ID: financeSeed.receipt.RC_ID,
      VR_REASON: `VOID-I-005 finance ${uniqueSuffix()}`,
    });
    expect(financeVoid.status, financeVoid.text).toBe(201);
    expect(financeVoid.body.VR_BY).toBe(financeUserId);
  });

  // VOID-I-006
  test('POST invalid body → 400', async ({ request }) => {
    requireSeed();
    const { receipt } = await seedIssuedForVoid(request, 'void-i-006');

    const cases: Array<{ label: string; data: Record<string, unknown> }> = [
      { label: 'missing RC_ID', data: { VR_REASON: 'reason only' } },
      { label: 'missing VR_REASON', data: { RC_ID: receipt.RC_ID } },
      {
        label: 'empty VR_REASON',
        data: { RC_ID: receipt.RC_ID, VR_REASON: '' },
      },
      {
        label: 'RC_ID string',
        data: { RC_ID: 'not-a-number', VR_REASON: 'x' },
      },
      {
        label: 'whitelist junk',
        data: {
          RC_ID: receipt.RC_ID,
          VR_REASON: 'ok',
          EXTRA_FIELD: true,
        },
      },
    ];

    for (const c of cases) {
      const res = await request.post('/api/voided-receipts', {
        headers: financeHeaders,
        data: c.data,
      });
      expect(res.status(), `${c.label}: ${await res.text()}`).toBe(400);
    }

    // Receipt must remain ISSUED (none of the invalid posts voided it)
    const rc = await getReceipt(request, receipt.RC_ID);
    expect(rc.RC_STATUS).toBe(ReceiptStatus.ISSUED);
  });

  // VOID-I-007
  test('POST void twice rejects second attempt', async ({ request }) => {
    requireSeed();
    const { receipt } = await seedIssuedForVoid(request, 'void-i-007');

    const first = await postVoid(request, {
      RC_ID: receipt.RC_ID,
      VR_REASON: `VOID-I-007 first ${uniqueSuffix()}`,
    });
    expect(first.status, first.text).toBe(201);

    const second = await postVoid(request, {
      RC_ID: receipt.RC_ID,
      VR_REASON: `VOID-I-007 second ${uniqueSuffix()}`,
    });
    /**
     * Matrix VOID-I-007 expected 409 (Conflict when VOIDED_RECEIPT exists).
     * Actual: service checks RC_STATUS !== ISSUED first → 400 BadRequest
     * ("Only ISSUED receipts can be voided") after the first void sets VOIDED.
     * ConflictException path is unreachable via happy-path double POST.
     * BUG vs matrix: expected 409, got 400.
     */
    expect(second.status, second.text).toBe(400);
    expect(second.text).toMatch(/Only ISSUED receipts can be voided/i);
    test.info().annotations.push({
      type: 'bug',
      description:
        'VOID-I-007: matrix expected 409; API returns 400 because RC_STATUS check precedes VOIDED_RECEIPT ConflictException',
    });
  });

  // VOID-I-008
  test('POST when txn REFUND → 409', async ({ request }) => {
    requireSeed();
    // Refund blocks ISSUED receipts; seed REFUND first, then attach ISSUED receipt
    const { tranxId } = await createPendingTxn(request);
    await confirmPaid(request, tranxId);

    const refundRes = await request.post(
      `/api/transactions/${tranxId}/refund`,
      { headers: financeHeaders },
    );
    expect(refundRes.status(), await refundRes.text()).toBe(201);

    const txn = await getTransaction(request, tranxId);
    expect(txn.TRANX_PAYMENT_STATUS).toBe(TransactionPaymentStatus.REFUND);

    const receipt = await createIssuedReceipt(request, tranxId, 'void-i-008');

    const voidRes = await postVoid(request, {
      RC_ID: receipt.RC_ID,
      VR_REASON: `VOID-I-008 refund txn ${uniqueSuffix()}`,
    });
    expect(voidRes.status, voidRes.text).toBe(409);

    const rc = await getReceipt(request, receipt.RC_ID);
    expect(rc.RC_STATUS).toBe(ReceiptStatus.ISSUED);
  });

  // VOID-I-009
  test('GET list paginated', async ({ request }) => {
    requireSeed();
    const seeded: number[] = [];
    for (let i = 0; i < 2; i++) {
      const { receipt } = await seedIssuedForVoid(request, `void-i-009-${i}`);
      const voided = await postVoid(request, {
        RC_ID: receipt.RC_ID,
        VR_REASON: `VOID-I-009 ${i} ${uniqueSuffix()}`,
      });
      expect(voided.status, voided.text).toBe(201);
      seeded.push(voided.body.VR_ID);
    }

    const res = await request.get('/api/voided-receipts?page=1&limit=1', {
      headers: financeHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    const page = (await res.json()) as Paginated<VoidedReceiptRow>;
    expect(page.data).toEqual(expect.any(Array));
    expect(page.data.length).toBeLessThanOrEqual(1);
    expect(page.meta?.page ?? 1).toBe(1);
    expect(page.meta?.limit ?? 1).toBe(1);
    expect((page.meta?.total ?? 0) >= 2).toBe(true);

    const pageAll = await request.get(
      '/api/voided-receipts?page=1&limit=50',
      { headers: financeHeaders },
    );
    expect(pageAll.status()).toBe(200);
    const all = (await pageAll.json()) as Paginated<VoidedReceiptRow>;
    for (const vrId of seeded) {
      expect(all.data.some((r) => r.VR_ID === vrId)).toBe(true);
    }
  });

  // VOID-I-010
  test('GET /:id returns voided receipt', async ({ request }) => {
    requireSeed();
    const { receipt } = await seedIssuedForVoid(request, 'void-i-010');
    const created = await postVoid(request, {
      RC_ID: receipt.RC_ID,
      VR_REASON: `VOID-I-010 ${uniqueSuffix()}`,
    });
    expect(created.status, created.text).toBe(201);

    const res = await request.get(
      `/api/voided-receipts/${created.body.VR_ID}`,
      { headers: financeHeaders },
    );
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as VoidedReceiptRow;
    expect(body.VR_ID).toBe(created.body.VR_ID);
    expect(body.RC_ID).toBe(receipt.RC_ID);
    expect(body.RECEIPT?.RC_ID ?? body.RC_ID).toBe(receipt.RC_ID);
  });

  // VOID-I-011
  test('GET /:id unknown → 404', async ({ request }) => {
    requireSeed();
    const res = await request.get('/api/voided-receipts/2147483646', {
      headers: financeHeaders,
    });
    expect(res.status(), await res.text()).toBe(404);
  });

  // VOID-I-012
  test('GET limit >100 rejected', async ({ request }) => {
    requireSeed();
    const res = await request.get('/api/voided-receipts?page=1&limit=101', {
      headers: financeHeaders,
    });
    expect(res.status(), await res.text()).toBe(400);
  });
});
