import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';

/**
 * Transactions API integration — matrix TXN-I-001 … TXN-I-014
 *
 * Seed approach (shared-DB, disposable via API):
 * 1. Admin creates exam (open reg window + EXAM_FEE) + sessions
 * 2. Candidate enrolls (USER_ID = candidate)
 * 3. Admin creates payment-configs (active / inactive / expired)
 * 4. afterAll soft-deletes created txns, enrollments, sessions, PCs, exam
 */

const TransactionPaymentStatus = {
  PENDING: 0,
  PAID: 3,
  EXPIRED: 5,
  REFUND: 7,
} as const;

const ExamEnrollmentStatus = {
  UNPAID: 0,
  PAID: 1,
  CANCELLED: 5,
} as const;

const ReceiptStatus = {
  UNISSUED: 0,
  ISSUED: 1,
} as const;

const EXAM_FEE = 500;

type AuthHeaders = { Authorization: string };

type TransactionRow = {
  TRANX_ID: number;
  ERM_ID: number;
  PC_ID: number;
  TRANX_AMOUNT: string | number;
  TRANX_PAYMENT_STATUS: number;
  TRANX_PAID_AT?: string | null;
  TRANX_QR_CODE?: string | null;
};

type EnrollmentRow = {
  ERM_ID: number;
  USER_ID: number;
  SESSION_ID: number;
  ERM_STATUS: number;
};

type PaymentConfigRow = {
  PC_ID: number;
  PC_IS_ACTIVE: boolean;
  PC_COMP_CODE?: string;
  PC_PROD_CODE?: string;
};

type TransactionRefRow = {
  TRANX_ID: number;
  TSC_REF1: string;
  TSC_REF2?: string;
  TSC_BANK_REF?: string;
};

type ReceiptRow = {
  RC_ID: number;
  TRANX_ID: number;
  RC_STATUS: number;
};

type Paginated<T> = { data: T[]; meta?: { total?: number } };

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function hourMinute(slot: number): { start: string; end: string } {
  // Distinct session windows on same exam (avoids sister-slot enrollment conflict)
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

test.describe('Transactions API — create / confirm / expire / refund flows', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120_000);

  let adminHeaders: AuthHeaders;
  let financeHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;
  let proctorHeaders: AuthHeaders;
  let candidateUserId: number;

  let examId: number | null = null;
  let activePcId: number | null = null;
  let inactivePcId: number | null = null;
  let expiredPcId: number | null = null;

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
    opts?: { ermId?: number; pcId?: number; amount?: number },
  ): Promise<{ ermId: number; tranxId: number }> {
    const ermId =
      opts?.ermId ?? (await createEnrollment(request)).ERM_ID;
    const pcId = opts?.pcId ?? activePcId!;
    const res = await request.post('/api/transactions', {
      headers: candidateHeaders,
      data: {
        ermId,
        pcId,
        amount: opts?.amount ?? EXAM_FEE,
      },
    });
    const text = await res.text();
    expect(res.status(), text).toBe(201);
    const body = JSON.parse(text) as { TRANX_ID: number };
    transactionIds.push(body.TRANX_ID);
    return { ermId, tranxId: body.TRANX_ID };
  }

  async function getTransaction(
    request: APIRequestContext,
    headers: AuthHeaders,
    tranxId: number,
  ): Promise<TransactionRow> {
    const res = await request.get(`/api/transactions/${tranxId}`, {
      headers,
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

  async function findRefForTranx(
    request: APIRequestContext,
    tranxId: number,
  ): Promise<TransactionRefRow | null> {
    const res = await request.get('/api/transaction-refs', {
      headers: adminHeaders,
    });
    if (!res.ok()) return null;
    const rows = (await res.json()) as TransactionRefRow[];
    return rows.find((r) => r.TRANX_ID === tranxId) ?? null;
  }

  test.beforeAll(async ({ request }) => {
    adminHeaders = await headersFor(request, 'admin');
    financeHeaders = await headersFor(request, 'finance');
    candidateHeaders = await headersFor(request, 'candidate');
    proctorHeaders = await headersFor(request, 'proctor');

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
        EXAM_NAME: `TXN-I ${suffix}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE,
        EXAM_DATE: '2026-12-28',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: 'TX',
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

    const activeRes = await request.post('/api/payment-configs', {
      headers: adminHeaders,
      data: {
        PROVIDER_NAME: `TXN-I-active-${suffix}`.slice(0, 100),
        PC_COMP_CODE: `CA${suffix}`.slice(0, 20),
        PC_PROD_CODE: `PA${suffix}`.slice(0, 20),
        PC_IS_ACTIVE: true,
        PC_EFFECTIVE_FROM: '2026-01-01T00:00:00.000Z',
      },
    });
    expect(activeRes.status(), await activeRes.text()).toBe(201);
    activePcId = ((await activeRes.json()) as PaymentConfigRow).PC_ID;

    const inactiveRes = await request.post('/api/payment-configs', {
      headers: adminHeaders,
      data: {
        PROVIDER_NAME: `TXN-I-inact-${suffix}`.slice(0, 100),
        PC_COMP_CODE: `CI${suffix}`.slice(0, 20),
        PC_PROD_CODE: `PI${suffix}`.slice(0, 20),
        PC_IS_ACTIVE: false,
        PC_EFFECTIVE_FROM: '2026-01-01T00:00:00.000Z',
      },
    });
    expect(inactiveRes.status(), await inactiveRes.text()).toBe(201);
    inactivePcId = ((await inactiveRes.json()) as PaymentConfigRow).PC_ID;

    const expiredRes = await request.post('/api/payment-configs', {
      headers: adminHeaders,
      data: {
        PROVIDER_NAME: `TXN-I-exp-${suffix}`.slice(0, 100),
        PC_COMP_CODE: `CE${suffix}`.slice(0, 20),
        PC_PROD_CODE: `PE${suffix}`.slice(0, 20),
        PC_IS_ACTIVE: true,
        PC_EFFECTIVE_FROM: '2020-01-01T00:00:00.000Z',
        PC_EFFECTIVE_TO: '2020-12-31T23:59:59.000Z',
      },
    });
    expect(expiredRes.status(), await expiredRes.text()).toBe(201);
    expiredPcId = ((await expiredRes.json()) as PaymentConfigRow).PC_ID;

    // Ensure PC_ID=1 exists for pending-payment (hardcoded in service)
    const pc1 = await request.get('/api/payment-configs/1', {
      headers: adminHeaders,
    });
    if (!pc1.ok()) {
      seedSkipReason =
        'Payment config ID 1 missing — required by createPendingPayment';
      return;
    }

    seedReady = true;
  });

  test.afterAll(async ({ request }) => {
    // Best-effort soft-delete (shared DB); ignore failures
    for (const rcId of receiptIds) {
      await request
        .delete(`/api/receipts/${rcId}`, { headers: adminHeaders })
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
    for (const pcId of [activePcId, inactivePcId, expiredPcId]) {
      if (pcId) {
        await request
          .delete(`/api/payment-configs/${pcId}`, { headers: adminHeaders })
          .catch(() => undefined);
      }
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

  // TXN-I-001
  test('POST /transactions creates PENDING', async ({ request }) => {
    requireSeed();
    const enrollment = await createEnrollment(request);
    const res = await request.post('/api/transactions', {
      headers: candidateHeaders,
      data: {
        ermId: enrollment.ERM_ID,
        pcId: activePcId,
        amount: EXAM_FEE,
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { TRANX_ID: number };
    expect(body.TRANX_ID).toEqual(expect.any(Number));
    transactionIds.push(body.TRANX_ID);

    const txn = await getTransaction(request, candidateHeaders, body.TRANX_ID);
    expect(txn.TRANX_PAYMENT_STATUS).toBe(TransactionPaymentStatus.PENDING);
    expect(txn.ERM_ID).toBe(enrollment.ERM_ID);
    expect(txn.PC_ID).toBe(activePcId);
    expect(Number(txn.TRANX_AMOUNT)).toBe(EXAM_FEE);
    expect(txn.TRANX_QR_CODE).toBeTruthy();
  });

  // TXN-I-002
  test('POST /transactions 409 when PAID', async ({ request }) => {
    requireSeed();
    const { ermId, tranxId } = await createPendingTxn(request);
    const confirm = await request.patch(
      `/api/transactions/${tranxId}/confirm`,
      {
        headers: candidateHeaders,
        data: { userCode: `u${uniqueSuffix()}`.slice(0, 20) },
      },
    );
    expect(confirm.status(), await confirm.text()).toBe(200);

    const again = await request.post('/api/transactions', {
      headers: candidateHeaders,
      data: { ermId, pcId: activePcId, amount: EXAM_FEE },
    });
    expect(again.status()).toBe(409);
    const err = await jsonOrEmpty(again);
    expect(String(err.message)).toMatch(/paid transaction already exists/i);
  });

  // TXN-I-003
  test('PATCH confirm persists PAID+ref+ERM', async ({ request }) => {
    requireSeed();
    const { ermId, tranxId } = await createPendingTxn(request);
    const userCode = `uc${uniqueSuffix()}`.slice(0, 20);
    const res = await request.patch(`/api/transactions/${tranxId}/confirm`, {
      headers: candidateHeaders,
      data: {
        userCode,
        receiptName: 'TXN-I Confirm',
        receiptTaxId: '1234567890123',
        receiptPhone: '0812345678',
        receiptAddress: 'BUU Test Addr',
      },
    });
    expect(res.status(), await res.text()).toBe(200);

    const txn = await getTransaction(request, candidateHeaders, tranxId);
    expect(txn.TRANX_PAYMENT_STATUS).toBe(TransactionPaymentStatus.PAID);
    expect(txn.TRANX_PAID_AT).toBeTruthy();

    const erm = await getEnrollment(request, ermId);
    expect(erm.ERM_STATUS).toBe(ExamEnrollmentStatus.PAID);

    const ref = await findRefForTranx(request, tranxId);
    expect(ref, 'TransactionRef should exist after confirm').toBeTruthy();
    expect(ref!.TSC_REF1).toBe(userCode);
  });

  // TXN-I-004
  test('PATCH confirm 400 bad state/PC', async ({ request }) => {
    requireSeed();

    // Non-PENDING (EXPIRED) → 400
    const expiredFlow = await createPendingTxn(request);
    const expireRes = await request.patch(
      `/api/transactions/${expiredFlow.tranxId}/expire`,
      { headers: candidateHeaders },
    );
    expect(expireRes.status(), await expireRes.text()).toBe(200);
    const confirmExpired = await request.patch(
      `/api/transactions/${expiredFlow.tranxId}/confirm`,
      {
        headers: candidateHeaders,
        data: { userCode: 'badstate' },
      },
    );
    expect(confirmExpired.status()).toBe(400);
    expect(String((await jsonOrEmpty(confirmExpired)).message)).toMatch(
      /not in PENDING/i,
    );

    // Inactive PC → 400
    const inactiveFlow = await createPendingTxn(request, {
      pcId: inactivePcId!,
    });
    const confirmInactive = await request.patch(
      `/api/transactions/${inactiveFlow.tranxId}/confirm`,
      {
        headers: candidateHeaders,
        data: { userCode: 'badpc' },
      },
    );
    expect(confirmInactive.status()).toBe(400);
    expect(String((await jsonOrEmpty(confirmInactive)).message)).toMatch(
      /inactive/i,
    );

    // Expired PC effective window → 400
    const expiredPcFlow = await createPendingTxn(request, {
      pcId: expiredPcId!,
    });
    const confirmPcExpired = await request.patch(
      `/api/transactions/${expiredPcFlow.tranxId}/confirm`,
      {
        headers: candidateHeaders,
        data: { userCode: 'badpcexp' },
      },
    );
    expect(confirmPcExpired.status()).toBe(400);
    expect(String((await jsonOrEmpty(confirmPcExpired)).message)).toMatch(
      /expired/i,
    );
  });

  // TXN-I-005
  test('PATCH confirm 403 other user', async ({ request }) => {
    requireSeed();
    const { tranxId } = await createPendingTxn(request);
    const res = await request.patch(`/api/transactions/${tranxId}/confirm`, {
      headers: proctorHeaders,
      data: { userCode: 'otheruser' },
    });
    expect(res.status()).toBe(403);
    expect(String((await jsonOrEmpty(res)).message)).toMatch(
      /does not belong/i,
    );
  });

  // TXN-I-006
  test('PATCH expire persists EXPIRED', async ({ request }) => {
    requireSeed();
    const { tranxId } = await createPendingTxn(request);
    const res = await request.patch(`/api/transactions/${tranxId}/expire`, {
      headers: candidateHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);

    const txn = await getTransaction(request, candidateHeaders, tranxId);
    expect(txn.TRANX_PAYMENT_STATUS).toBe(TransactionPaymentStatus.EXPIRED);
  });

  // TXN-I-007
  test('POST pending-payment amount/phone validation', async ({
    request,
  }) => {
    requireSeed();
    const enrollment = await createEnrollment(request);

    const badPhone = await request.post('/api/transactions/pending-payment', {
      headers: candidateHeaders,
      data: {
        ERM_ID: enrollment.ERM_ID,
        TRANX_AMOUNT: EXAM_FEE,
        RC_TAX_ID: '1234567890123',
        RC_NAME: 'Pending Pay',
        RC_PHONE: '12345',
        RC_ADDRESS: 'Addr',
      },
    });
    expect(badPhone.status()).toBe(400);

    const badAmount = await request.post('/api/transactions/pending-payment', {
      headers: candidateHeaders,
      data: {
        ERM_ID: enrollment.ERM_ID,
        TRANX_AMOUNT: EXAM_FEE + 1,
        RC_TAX_ID: '1234567890123',
        RC_NAME: 'Pending Pay',
        RC_PHONE: '0812345678',
        RC_ADDRESS: 'Addr',
      },
    });
    expect(badAmount.status()).toBe(400);
    expect(String((await jsonOrEmpty(badAmount)).message)).toMatch(
      /does not match exam fee/i,
    );
  });

  // TXN-I-008
  test('POST pending-payment commits PAID', async ({ request }) => {
    requireSeed();
    const enrollment = await createEnrollment(request);
    const res = await request.post('/api/transactions/pending-payment', {
      headers: candidateHeaders,
      data: {
        ERM_ID: enrollment.ERM_ID,
        TRANX_AMOUNT: EXAM_FEE,
        RC_TAX_ID: '1234567890123',
        RC_NAME: 'Pending OK',
        RC_PHONE: '0899999999',
        RC_ADDRESS: 'Pending Addr',
      },
    });
    const text = await res.text();
    expect([200, 201]).toContain(res.status());
    const body = JSON.parse(text) as {
      transaction: TransactionRow;
      receipt: ReceiptRow;
    };
    expect(body.transaction.TRANX_ID).toEqual(expect.any(Number));
    transactionIds.push(body.transaction.TRANX_ID);
    if (body.receipt?.RC_ID) receiptIds.push(body.receipt.RC_ID);

    expect(body.transaction.TRANX_PAYMENT_STATUS).toBe(
      TransactionPaymentStatus.PAID,
    );
    expect(body.receipt.RC_STATUS).toBe(ReceiptStatus.UNISSUED);
    expect(body.receipt.TRANX_ID).toBe(body.transaction.TRANX_ID);

    const erm = await getEnrollment(request, enrollment.ERM_ID);
    expect(erm.ERM_STATUS).toBe(ExamEnrollmentStatus.PAID);
  });

  // TXN-I-009
  test('POST refund FINANCE only + ISSUED block', async ({ request }) => {
    requireSeed();

    // Candidate cannot refund → 403
    const paidFlow = await createPendingTxn(request);
    const confirm = await request.patch(
      `/api/transactions/${paidFlow.tranxId}/confirm`,
      {
        headers: candidateHeaders,
        data: { userCode: `rf${uniqueSuffix()}`.slice(0, 20) },
      },
    );
    expect(confirm.status(), await confirm.text()).toBe(200);

    const candRefund = await request.post(
      `/api/transactions/${paidFlow.tranxId}/refund`,
      { headers: candidateHeaders },
    );
    expect(candRefund.status()).toBe(403);

    // Finance refund without ISSUED → REFUND + ERM CANCELLED
    const financeRefund = await request.post(
      `/api/transactions/${paidFlow.tranxId}/refund`,
      { headers: financeHeaders },
    );
    // Nest @Post defaults to 201 Created (no @HttpCode on refund)
    expect([200, 201]).toContain(financeRefund.status());
    const refunded = (await financeRefund.json()) as TransactionRow;
    expect(refunded.TRANX_PAYMENT_STATUS).toBe(
      TransactionPaymentStatus.REFUND,
    );
    const ermAfter = await getEnrollment(request, paidFlow.ermId);
    expect(ermAfter.ERM_STATUS).toBe(ExamEnrollmentStatus.CANCELLED);

    // ISSUED receipt blocks refund → 400
    const issuedFlow = await createPendingTxn(request);
    const confirm2 = await request.patch(
      `/api/transactions/${issuedFlow.tranxId}/confirm`,
      {
        headers: candidateHeaders,
        data: { userCode: `is${uniqueSuffix()}`.slice(0, 20) },
      },
    );
    expect(confirm2.status(), await confirm2.text()).toBe(200);

    const rcRes = await request.post('/api/receipts', {
      headers: adminHeaders,
      data: {
        TRANX_ID: issuedFlow.tranxId,
        RC_SIGNATURE_ID: `txn-i-009-${uniqueSuffix()}`,
        RC_STATUS: ReceiptStatus.ISSUED,
        RC_ISSUED_AT: '2026-08-05T00:00:00.000Z',
      },
    });
    // If receipt already exists from confirm with receiptName — patch instead
    if (rcRes.status() === 201) {
      const rc = (await rcRes.json()) as ReceiptRow;
      receiptIds.push(rc.RC_ID);
      expect(rc.RC_STATUS).toBe(ReceiptStatus.ISSUED);
    } else {
      // Confirm without receiptName → create may succeed; otherwise list+patch
      const list = await request.get(
        `/api/receipts?page=1&limit=50`,
        { headers: adminHeaders },
      );
      expect(list.status()).toBe(200);
      const page = (await list.json()) as Paginated<ReceiptRow>;
      const existing =
        page.data?.find((r) => r.TRANX_ID === issuedFlow.tranxId) ?? null;
      test.skip(
        !existing,
        `Cannot seed ISSUED receipt for refund block (create=${rcRes.status()} ${await rcRes.text()})`,
      );
      const patched = await request.patch(`/api/receipts/${existing!.RC_ID}`, {
        headers: adminHeaders,
        data: { RC_STATUS: ReceiptStatus.ISSUED },
      });
      expect(patched.status(), await patched.text()).toBe(200);
      receiptIds.push(existing!.RC_ID);
    }

    const blocked = await request.post(
      `/api/transactions/${issuedFlow.tranxId}/refund`,
      { headers: financeHeaders },
    );
    expect(blocked.status()).toBe(400);
    expect(String((await jsonOrEmpty(blocked)).message)).toMatch(
      /ISSUED receipt/i,
    );
  });

  // TXN-I-010
  test('GET /transactions requires FINANCE', async ({ request }) => {
    requireSeed();
    const cand = await request.get('/api/transactions?page=1&limit=5', {
      headers: candidateHeaders,
    });
    expect(cand.status()).toBe(403);

    const fin = await request.get('/api/transactions?page=1&limit=5', {
      headers: financeHeaders,
    });
    expect(fin.status()).toBe(200);
    const page = (await fin.json()) as Paginated<TransactionRow>;
    expect(page.data).toEqual(expect.any(Array));
  });

  // TXN-I-011
  test('PATCH/DELETE finance mutations require FINANCE', async ({
    request,
  }) => {
    requireSeed();
    const { tranxId, ermId } = await createPendingTxn(request);

    const patchCand = await request.patch(`/api/transactions/${tranxId}`, {
      headers: candidateHeaders,
      data: { TRANX_AMOUNT: 1 },
    });
    expect(patchCand.status()).toBe(403);

    const delCand = await request.delete(`/api/transactions/${tranxId}`, {
      headers: candidateHeaders,
    });
    expect(delCand.status()).toBe(403);

    const patchByErmCand = await request.patch(
      `/api/transactions/by-erm/${ermId}`,
      {
        headers: candidateHeaders,
        data: { TRANX_AMOUNT: 1 },
      },
    );
    expect(patchByErmCand.status()).toBe(403);

    const patchFin = await request.patch(`/api/transactions/${tranxId}`, {
      headers: financeHeaders,
      data: { TRANX_AMOUNT: 499 },
    });
    expect(patchFin.status(), await patchFin.text()).toBe(200);
  });

  // TXN-I-012
  test('Unauthenticated rejected', async ({ request }) => {
    const routes: Array<{
      method: 'get' | 'post' | 'patch' | 'delete';
      path: string;
      data?: Record<string, unknown>;
    }> = [
      { method: 'get', path: '/api/transactions' },
      {
        method: 'post',
        path: '/api/transactions',
        data: { ermId: 1, pcId: 1, amount: 1 },
      },
      {
        method: 'post',
        path: '/api/transactions/pending-payment',
        data: {
          ERM_ID: 1,
          TRANX_AMOUNT: 1,
          RC_TAX_ID: '1',
          RC_NAME: 'x',
          RC_PHONE: '0812345678',
          RC_ADDRESS: 'a',
        },
      },
      {
        method: 'patch',
        path: '/api/transactions/1/confirm',
        data: { userCode: 'x' },
      },
      { method: 'patch', path: '/api/transactions/1/expire' },
      { method: 'post', path: '/api/transactions/1/refund' },
      { method: 'delete', path: '/api/transactions/1' },
    ];

    for (const route of routes) {
      const res = await request[route.method](route.path, {
        data: route.data,
      });
      expect(
        res.status(),
        `${route.method.toUpperCase()} ${route.path} should be 401`,
      ).toBe(401);
    }
  });

  // TXN-I-013
  test('DTO validation create/confirm', async ({ request }) => {
    requireSeed();
    const createCases: Record<string, unknown>[] = [
      {},
      { ermId: 'x', pcId: activePcId, amount: EXAM_FEE },
      { ermId: 1, pcId: activePcId },
      { ermId: 1, pcId: activePcId, amount: -1 },
    ];
    for (const data of createCases) {
      const res = await request.post('/api/transactions', {
        headers: candidateHeaders,
        data,
      });
      expect(
        res.status(),
        `create expected 400 for ${JSON.stringify(data)}`,
      ).toBe(400);
    }

    const { tranxId } = await createPendingTxn(request);
    const confirmCases: Record<string, unknown>[] = [
      {},
      { userCode: '' },
      { userCode: 'x'.repeat(21) },
    ];
    for (const data of confirmCases) {
      const res = await request.patch(`/api/transactions/${tranxId}/confirm`, {
        headers: candidateHeaders,
        data,
      });
      expect(
        res.status(),
        `confirm expected 400 for ${JSON.stringify(data)}`,
      ).toBe(400);
    }
  });

  // TXN-I-014
  test('confirm/expire transactional integrity', async ({ request }) => {
    requireSeed();
    const { tranxId, ermId } = await createPendingTxn(request);

    const first = await request.patch(`/api/transactions/${tranxId}/confirm`, {
      headers: candidateHeaders,
      data: { userCode: `ti${uniqueSuffix()}`.slice(0, 20) },
    });
    expect(first.status(), await first.text()).toBe(200);

    const second = await request.patch(`/api/transactions/${tranxId}/confirm`, {
      headers: candidateHeaders,
      data: { userCode: `ti2${uniqueSuffix()}`.slice(0, 20) },
    });
    expect(second.status()).toBe(400);
    expect(String((await jsonOrEmpty(second)).message)).toMatch(
      /not in PENDING/i,
    );

    const txn = await getTransaction(request, candidateHeaders, tranxId);
    expect(txn.TRANX_PAYMENT_STATUS).toBe(TransactionPaymentStatus.PAID);

    const erm = await getEnrollment(request, ermId);
    expect(erm.ERM_STATUS).toBe(ExamEnrollmentStatus.PAID);

    // Expire after PAID must also fail (integrity of state machine)
    const expirePaid = await request.patch(
      `/api/transactions/${tranxId}/expire`,
      { headers: candidateHeaders },
    );
    expect(expirePaid.status()).toBe(400);
  });
});
