import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import type { TestRoleKey } from '../e2e/fixtures/users';

/**
 * Fund Sources API integration — matrix FUND-I-001 … FUND-I-012
 *
 * Seed approach (shared-DB, disposable via API):
 * 1. Login FINANCE + read roles (REG / EXAM_OPS) + candidate for RBAC
 * 2. Finance creates fund-sources for CRUD cases
 * 3. For daily-revenue (I-011/I-012): disposable exam + PC + enroll → confirm (PAID)
 *    → bank-reconcile import/verify/confirm-payment → APPROVED
 * 4. afterAll soft-deletes receipts, txns, enrollments, sessions, PC, exams, fund-sources
 */

const TransactionPaymentStatus = {
  PENDING: 0,
  APPROVED: 1,
  PAID: 3,
} as const;

const ReceiptStatus = {
  UNISSUED: 0,
  ISSUED: 1,
} as const;

const EXAM_FEE = 500;
const EXAM_FEE_B = 300;

type AuthHeaders = { Authorization: string };

type FundSourceRow = {
  FS_ID: number;
  FS_ACCOUNT_CODE: string;
  FS_NAME: string;
  FS_OPEN_STATUS: boolean;
  DELETED_AT?: string | null;
};

type DailyRevenueSummary = {
  rows: Array<{ index: number; examName: string; amount: number }>;
  totalAmount: number;
};

type EnrollmentRow = {
  ERM_ID: number;
  USER_ID: number;
  SESSION_ID: number;
};

type TransactionRefRow = {
  TSR_ID: number;
  TRANX_ID: number;
  TSC_REF1: string;
  TSC_REF2: string | null;
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
  const startH = 8 + Math.floor(slot / 2);
  const startM = slot % 2 === 0 ? 0 : 30;
  const endH = startH + 1;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    start: `${pad(startH)}:${pad(startM)}:00`,
    end: `${pad(endH)}:${pad(startM)}:00`,
  };
}

function todayYmd(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function headersFor(
  request: APIRequestContext,
  role: TestRoleKey,
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

function createPayload(
  suffix: string,
  overrides: Partial<{
    FS_ACCOUNT_CODE: string;
    FS_NAME: string;
    FS_OPEN_STATUS: boolean;
  }> = {},
): Record<string, unknown> {
  return {
    FS_ACCOUNT_CODE: `FS-${suffix}`.slice(0, 50),
    FS_NAME: `FundSource ${suffix}`.slice(0, 255),
    FS_OPEN_STATUS: true,
    ...overrides,
  };
}

function buildPaymentCsv(
  rows: Array<{
    applicantId: string;
    referenceNo: string | null;
    payerName: string;
    amount: number;
    paymentDate?: string;
    paymentTime?: string;
  }>,
): string {
  const header =
    'applicantId,referenceNo,payerName,amount,paymentDate,paymentTime';
  const lines = rows.map((r) =>
    [
      r.applicantId,
      r.referenceNo ?? '',
      r.payerName,
      r.amount,
      r.paymentDate ?? todayYmd(),
      r.paymentTime ?? '10:00:00',
    ].join(','),
  );
  return `${header}\n${lines.join('\n')}\n`;
}

test.describe('Fund Sources API — CRUD / authz / daily-revenue flows', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120_000);

  let adminHeaders: AuthHeaders;
  let financeHeaders: AuthHeaders;
  let staffHeaders: AuthHeaders;
  let registrationHeaders: AuthHeaders;
  let examOpsHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;
  let proctorHeaders: AuthHeaders;

  let candidateUserId: number;

  const fundSourceIds: number[] = [];
  const examIds: number[] = [];
  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const transactionIds: number[] = [];
  const receiptIds: number[] = [];
  let activePcId: number | null = null;

  let sessionSlot = 0;
  let revenueSeedReady = false;
  let revenueSeedSkipReason = '';
  let revenueExamAId: number | null = null;
  let revenueExamBId: number | null = null;
  let revenueExamAName = '';
  let revenueExamBName = '';
  let approvedAmountA = 0;
  let approvedAmountB = 0;
  let paidOnlyTranxId: number | null = null;

  async function createFundSource(
    request: APIRequestContext,
    headers: AuthHeaders,
    overrides: Parameters<typeof createPayload>[1] = {},
  ): Promise<FundSourceRow> {
    const suffix = uniqueSuffix();
    const res = await request.post('/api/fund-sources', {
      headers,
      data: createPayload(suffix, overrides),
    });
    const text = await res.text();
    expect(res.status(), text).toBe(201);
    const body = JSON.parse(text) as FundSourceRow;
    fundSourceIds.push(body.FS_ID);
    return body;
  }

  async function createSession(
    request: APIRequestContext,
    examId: number,
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
    examId: number,
  ): Promise<EnrollmentRow> {
    const sessionId = await createSession(request, examId);
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
    examId: number,
    amount: number,
  ): Promise<{ ermId: number; tranxId: number }> {
    const enrollment = await createEnrollment(request, examId);
    const res = await request.post('/api/transactions', {
      headers: candidateHeaders,
      data: {
        ermId: enrollment.ERM_ID,
        pcId: activePcId,
        amount,
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
    userCode: string,
  ): Promise<void> {
    const res = await request.patch(`/api/transactions/${tranxId}/confirm`, {
      headers: candidateHeaders,
      data: {
        userCode,
        receiptName: 'FUND-I Confirm',
        receiptTaxId: '1234567890123',
        receiptPhone: '0812345678',
        receiptAddress: 'BUU FUND Test Addr',
      },
    });
    expect(res.status(), await res.text()).toBe(200);
  }

  async function findRefByUserCode(
    request: APIRequestContext,
    userCode: string,
    tranxId: number,
  ): Promise<TransactionRefRow> {
    const res = await request.get('/api/transaction-refs/search', {
      headers: financeHeaders,
      params: { ref1: userCode, page: 1, limit: 20 },
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as Paginated<TransactionRefRow>;
    const ref = (body.data ?? []).find((r) => r.TRANX_ID === tranxId);
    expect(
      ref,
      `TransactionRef for TRANX_ID=${tranxId} ref1=${userCode}`,
    ).toBeTruthy();
    return ref!;
  }

  async function ensureUnissuedReceipt(
    request: APIRequestContext,
    tranxId: number,
    label: string,
  ): Promise<ReceiptRow> {
    const res = await request.post('/api/receipts', {
      headers: financeHeaders,
      data: {
        TRANX_ID: tranxId,
        RC_SIGNATURE_ID: `${label}-${uniqueSuffix()}`.slice(0, 100),
        RC_STATUS: ReceiptStatus.UNISSUED,
      },
    });
    const text = await res.text();
    if (res.status() === 201) {
      const body = JSON.parse(text) as ReceiptRow;
      receiptIds.push(body.RC_ID);
      return body;
    }
    for (let page = 1; page <= 20; page += 1) {
      const list = await request.get('/api/receipts', {
        headers: financeHeaders,
        params: { page, limit: 50 },
      });
      if (!list.ok()) break;
      const body = (await list.json()) as Paginated<ReceiptRow>;
      const found = (body.data ?? []).find((r) => r.TRANX_ID === tranxId);
      if (found) {
        receiptIds.push(found.RC_ID);
        return found;
      }
      if (!(body.data?.length)) break;
    }
    throw new Error(
      `No receipt for TRANX_ID=${tranxId} (create status ${res.status()}: ${text})`,
    );
  }

  async function importCsv(
    request: APIRequestContext,
    csv: string,
  ): Promise<{ status: number; brId: number }> {
    const res = await request.post('/api/bank-reconciles/import', {
      headers: financeHeaders,
      multipart: {
        file: {
          name: `fund-i-${uniqueSuffix()}.csv`,
          mimeType: 'text/csv',
          buffer: Buffer.from(csv, 'utf8'),
        },
      },
    });
    const status = res.status();
    const text = await res.text();
    expect(status, text).toBe(201);
    const body = JSON.parse(text) as {
      imported: number;
      data: Array<{ BR_ID: number }>;
    };
    expect(body.imported).toBeGreaterThanOrEqual(1);
    return { status, brId: body.data[0].BR_ID };
  }

  /** PAID → bank verify → confirm-payment → APPROVED */
  async function seedApprovedTxn(
    request: APIRequestContext,
    examId: number,
    amount: number,
    label: string,
  ): Promise<{ ermId: number; tranxId: number }> {
    const { ermId, tranxId } = await createPendingTxn(request, examId, amount);
    const userCode = `f${label}${uniqueSuffix()}`.slice(0, 20);
    await confirmPaid(request, tranxId, userCode);
    const ref = await findRefByUserCode(request, userCode, tranxId);

    const { brId } = await importCsv(
      request,
      buildPaymentCsv([
        {
          applicantId: userCode,
          referenceNo: ref.TSC_REF2,
          payerName: `FUND ${label}`,
          amount,
        },
      ]),
    );

    const verifyRes = await request.post('/api/bank-reconciles/verify', {
      headers: financeHeaders,
      data: { brIds: [brId] },
    });
    expect(verifyRes.status(), await verifyRes.text()).toBe(201);

    await ensureUnissuedReceipt(request, tranxId, `fund-${label}`);

    const confirmRes = await request.post(
      '/api/bank-reconciles/confirm-payment',
      {
        headers: financeHeaders,
        data: { tranxIds: [tranxId] },
      },
    );
    expect(confirmRes.status(), await confirmRes.text()).toBe(201);

    const txnRes = await request.get(`/api/transactions/${tranxId}`, {
      headers: financeHeaders,
    });
    expect(txnRes.status()).toBe(200);
    const txn = (await txnRes.json()) as {
      TRANX_PAYMENT_STATUS: number;
    };
    expect(txn.TRANX_PAYMENT_STATUS).toBe(TransactionPaymentStatus.APPROVED);

    return { ermId, tranxId };
  }

  async function createDisposableExam(
    request: APIRequestContext,
    name: string,
    fundSourceId: number,
    fee: number,
  ): Promise<number> {
    const res = await request.post('/api/exam', {
      headers: adminHeaders,
      data: {
        EXAM_NAME: name,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE: fee,
        EXAM_DATE: '2026-12-28',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: 'FS',
        EXAM_FISCAL_YEAR: '2026',
        FUND_SOURCE_ID: fundSourceId,
        SRB_ID: 1,
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { EXAM_ID: number };
    examIds.push(body.EXAM_ID);
    return body.EXAM_ID;
  }

  test.beforeAll(async ({ request }) => {
    test.setTimeout(180_000);

    adminHeaders = await headersFor(request, 'admin');
    financeHeaders = await headersFor(request, 'finance');
    staffHeaders = await headersFor(request, 'staff');
    registrationHeaders = await headersFor(request, 'registration_officer');
    examOpsHeaders = await headersFor(request, 'exam_operations_officer');
    candidateHeaders = await headersFor(request, 'candidate');
    proctorHeaders = await headersFor(request, 'proctor');

    const me = await request.get('/api/auth/me', {
      headers: candidateHeaders,
    });
    expect(me.status()).toBe(200);
    candidateUserId = ((await me.json()) as { id: number }).id;

    // Seed for daily-revenue cases (I-011 / I-012)
    try {
      const suffix = uniqueSuffix();
      const fs = await createFundSource(request, financeHeaders, {
        FS_ACCOUNT_CODE: `REV-${suffix}`.slice(0, 50),
        FS_NAME: `Revenue FS ${suffix}`.slice(0, 255),
      });

      revenueExamAName = `FUND-REV-A-${suffix}`;
      revenueExamBName = `FUND-REV-B-${suffix}`;
      revenueExamAId = await createDisposableExam(
        request,
        revenueExamAName,
        fs.FS_ID,
        EXAM_FEE,
      );
      revenueExamBId = await createDisposableExam(
        request,
        revenueExamBName,
        fs.FS_ID,
        EXAM_FEE_B,
      );

      const pcRes = await request.post('/api/payment-configs', {
        headers: financeHeaders,
        data: {
          PROVIDER_NAME: `FUND-pc-${suffix}`.slice(0, 100),
          PC_COMP_CODE: `FC${suffix}`.slice(0, 20),
          PC_PROD_CODE: `FP${suffix}`.slice(0, 20),
          PC_IS_ACTIVE: true,
          PC_EFFECTIVE_FROM: '2026-01-01T00:00:00.000Z',
        },
      });
      if (pcRes.status() !== 201) {
        throw new Error(
          `Cannot create seed PC: ${pcRes.status()} ${await pcRes.text()}`,
        );
      }
      activePcId = ((await pcRes.json()) as { PC_ID: number }).PC_ID;

      // Two APPROVED on exam A, one APPROVED on exam B
      await seedApprovedTxn(request, revenueExamAId, EXAM_FEE, 'a1');
      approvedAmountA += EXAM_FEE;
      await seedApprovedTxn(request, revenueExamAId, EXAM_FEE, 'a2');
      approvedAmountA += EXAM_FEE;
      await seedApprovedTxn(request, revenueExamBId, EXAM_FEE_B, 'b1');
      approvedAmountB += EXAM_FEE_B;

      // PAID-only (not APPROVED) must not count toward daily-revenue
      const paidOnly = await createPendingTxn(
        request,
        revenueExamAId,
        EXAM_FEE,
      );
      await confirmPaid(
        request,
        paidOnly.tranxId,
        `fp${uniqueSuffix()}`.slice(0, 20),
      );
      paidOnlyTranxId = paidOnly.tranxId;

      revenueSeedReady = true;
    } catch (err) {
      revenueSeedSkipReason = `Revenue seed failed: ${String(err)}`;
      revenueSeedReady = false;
    }
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(120_000);
    for (const rcId of [...new Set(receiptIds)]) {
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
    if (activePcId) {
      await request
        .delete(`/api/payment-configs/${activePcId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const examId of examIds) {
      await request
        .delete(`/api/exam/${examId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    for (const fsId of fundSourceIds) {
      await request
        .delete(`/api/fund-sources/${fsId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
  });

  function requireRevenueSeed(): void {
    test.skip(
      !revenueSeedReady,
      revenueSeedSkipReason || 'Daily-revenue seed failed',
    );
  }

  // FUND-I-001
  test('POST create fund-source (FINANCE) → 201', async ({ request }) => {
    const suffix = uniqueSuffix();
    const payload = createPayload(suffix);
    const res = await request.post('/api/fund-sources', {
      headers: financeHeaders,
      data: payload,
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as FundSourceRow;
    fundSourceIds.push(body.FS_ID);

    expect(body.FS_ID).toEqual(expect.any(Number));
    expect(body.FS_ACCOUNT_CODE).toBe(payload.FS_ACCOUNT_CODE);
    expect(body.FS_NAME).toBe(payload.FS_NAME);
    expect(body.FS_OPEN_STATUS).toBe(true);

    const getRes = await request.get(`/api/fund-sources/${body.FS_ID}`, {
      headers: financeHeaders,
    });
    expect(getRes.status(), await getRes.text()).toBe(200);
    const fetched = (await getRes.json()) as FundSourceRow;
    expect(fetched.FS_ID).toBe(body.FS_ID);
    expect(fetched.FS_NAME).toBe(payload.FS_NAME);
  });

  // FUND-I-002
  test('POST invalid body → 400', async ({ request }) => {
    const cases: Record<string, unknown>[] = [
      {},
      {
        FS_ACCOUNT_CODE: '',
        FS_NAME: 'Ok',
      },
      {
        FS_ACCOUNT_CODE: 'x'.repeat(51),
        FS_NAME: 'Ok',
      },
      {
        FS_ACCOUNT_CODE: 'ACC',
        FS_NAME: '',
      },
      {
        FS_ACCOUNT_CODE: 'ACC',
        FS_NAME: 'x'.repeat(256),
      },
      {
        FS_ACCOUNT_CODE: 'ACC',
        FS_NAME: 'Ok',
        FS_OPEN_STATUS: 'yes',
      },
      {
        FS_ACCOUNT_CODE: 'ACC',
        // missing FS_NAME
      },
    ];

    for (const data of cases) {
      const res = await request.post('/api/fund-sources', {
        headers: financeHeaders,
        data,
      });
      expect(
        res.status(),
        `create expected 400 for ${JSON.stringify(data)}`,
      ).toBe(400);
    }
  });

  // FUND-I-003
  test('Mutate forbidden for non-FINANCE → 403', async ({ request }) => {
    const target = await createFundSource(request, financeHeaders);
    const forbiddenRoles: AuthHeaders[] = [
      registrationHeaders,
      examOpsHeaders,
      candidateHeaders,
      proctorHeaders,
    ];

    for (const headers of forbiddenRoles) {
      const create = await request.post('/api/fund-sources', {
        headers,
        data: createPayload(uniqueSuffix()),
      });
      expect(create.status(), 'POST should be 403').toBe(403);

      const patch = await request.patch(`/api/fund-sources/${target.FS_ID}`, {
        headers,
        data: { FS_NAME: 'Hacked' },
      });
      expect(patch.status(), 'PATCH should be 403').toBe(403);

      const del = await request.delete(`/api/fund-sources/${target.FS_ID}`, {
        headers,
      });
      expect(del.status(), 'DELETE should be 403').toBe(403);
    }
  });

  // FUND-I-004
  test('Unauthenticated → 401', async ({ request }) => {
    const routes: Array<{
      method: 'get' | 'post' | 'patch' | 'delete';
      path: string;
      data?: Record<string, unknown>;
    }> = [
      { method: 'get', path: '/api/fund-sources' },
      {
        method: 'post',
        path: '/api/fund-sources',
        data: createPayload(uniqueSuffix()),
      },
      { method: 'get', path: '/api/fund-sources/1' },
      {
        method: 'patch',
        path: '/api/fund-sources/1',
        data: { FS_NAME: 'x' },
      },
      { method: 'delete', path: '/api/fund-sources/1' },
      { method: 'get', path: '/api/fund-sources/daily-revenue' },
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

  // FUND-I-005
  test('GET list allowed for FUND_SOURCE_READ_ROLES', async ({ request }) => {
    const created = await createFundSource(request, financeHeaders);
    const readRoles: AuthHeaders[] = [
      adminHeaders,
      financeHeaders,
      staffHeaders,
      registrationHeaders,
      examOpsHeaders,
    ];

    for (const headers of readRoles) {
      const res = await request.get('/api/fund-sources', { headers });
      expect(res.status(), await res.text()).toBe(200);
      const rows = (await res.json()) as FundSourceRow[];
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.some((r) => r.FS_ID === created.FS_ID)).toBe(true);
    }

    // Non-read roles
    for (const headers of [candidateHeaders, proctorHeaders]) {
      const res = await request.get('/api/fund-sources', { headers });
      expect(res.status()).toBe(403);
    }
  });

  // FUND-I-006
  test('GET :id → 200 when exists, 404 when missing', async ({ request }) => {
    const created = await createFundSource(request, financeHeaders);

    const ok = await request.get(`/api/fund-sources/${created.FS_ID}`, {
      headers: registrationHeaders,
    });
    expect(ok.status(), await ok.text()).toBe(200);
    const body = (await ok.json()) as FundSourceRow;
    expect(body.FS_ID).toBe(created.FS_ID);
    expect(body.FS_ACCOUNT_CODE).toBe(created.FS_ACCOUNT_CODE);

    const missingId = 2_147_483_646;
    const missing = await request.get(`/api/fund-sources/${missingId}`, {
      headers: financeHeaders,
    });
    expect(missing.status()).toBe(404);
    const err = await jsonOrEmpty(missing);
    expect(String(err.message)).toMatch(/not found/i);
  });

  // FUND-I-007
  test('GET non-int :id → 400', async ({ request }) => {
    const res = await request.get('/api/fund-sources/abc', {
      headers: financeHeaders,
    });
    expect(res.status()).toBe(400);
  });

  // FUND-I-008
  test('PATCH updates fields (FINANCE) → 200', async ({ request }) => {
    const created = await createFundSource(request, financeHeaders);
    const newName = `Fund patched ${uniqueSuffix()}`.slice(0, 255);
    const newCode = `PATCH-${uniqueSuffix()}`.slice(0, 50);

    const res = await request.patch(`/api/fund-sources/${created.FS_ID}`, {
      headers: financeHeaders,
      data: {
        FS_NAME: newName,
        FS_ACCOUNT_CODE: newCode,
        FS_OPEN_STATUS: false,
      },
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as FundSourceRow;
    expect(body.FS_NAME).toBe(newName);
    expect(body.FS_ACCOUNT_CODE).toBe(newCode);
    expect(body.FS_OPEN_STATUS).toBe(false);

    const getRes = await request.get(`/api/fund-sources/${created.FS_ID}`, {
      headers: financeHeaders,
    });
    expect(getRes.status()).toBe(200);
    const fetched = (await getRes.json()) as FundSourceRow;
    expect(fetched.FS_NAME).toBe(newName);
    expect(fetched.FS_ACCOUNT_CODE).toBe(newCode);
    expect(fetched.FS_OPEN_STATUS).toBe(false);
  });

  // FUND-I-009
  test('DELETE soft-deletes; subsequent GET → 404', async ({ request }) => {
    const created = await createFundSource(request, financeHeaders);
    const del = await request.delete(`/api/fund-sources/${created.FS_ID}`, {
      headers: financeHeaders,
    });
    expect([200, 204]).toContain(del.status());

    const getRes = await request.get(`/api/fund-sources/${created.FS_ID}`, {
      headers: financeHeaders,
    });
    expect(getRes.status()).toBe(404);

    const list = await request.get('/api/fund-sources', {
      headers: financeHeaders,
    });
    expect(list.status()).toBe(200);
    const rows = (await list.json()) as FundSourceRow[];
    expect(rows.some((r) => r.FS_ID === created.FS_ID)).toBe(false);
  });

  // FUND-I-010
  test('daily-revenue FINANCE only (REG → 403, FINANCE → 200)', async ({
    request,
  }) => {
    const financeOk = await request.get('/api/fund-sources/daily-revenue', {
      headers: financeHeaders,
    });
    expect(financeOk.status(), await financeOk.text()).toBe(200);
    const body = (await financeOk.json()) as DailyRevenueSummary;
    expect(body).toHaveProperty('rows');
    expect(body).toHaveProperty('totalAmount');
    expect(Array.isArray(body.rows)).toBe(true);
    expect(typeof body.totalAmount).toBe('number');

    // ADMIN / STAFF also in FINANCE_ROLES
    for (const headers of [adminHeaders, staffHeaders]) {
      const res = await request.get('/api/fund-sources/daily-revenue', {
        headers,
      });
      expect(res.status(), await res.text()).toBe(200);
    }

    // REG / EXAM_OPS can read fund-sources list but NOT daily-revenue
    for (const headers of [registrationHeaders, examOpsHeaders]) {
      const res = await request.get('/api/fund-sources/daily-revenue', {
        headers,
      });
      expect(res.status()).toBe(403);
    }

    for (const headers of [candidateHeaders, proctorHeaders]) {
      const res = await request.get('/api/fund-sources/daily-revenue', {
        headers,
      });
      expect(res.status()).toBe(403);
    }
  });

  // FUND-I-011
  test('daily-revenue sums APPROVED only (excludes PAID-only)', async ({
    request,
  }) => {
    requireRevenueSeed();

    const today = todayYmd();
    const res = await request.get('/api/fund-sources/daily-revenue', {
      headers: financeHeaders,
      params: {
        startDate: today,
        endDate: today,
        examName: 'FUND-REV-',
      },
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as DailyRevenueSummary;

    const rowA = body.rows.find((r) => r.examName === revenueExamAName);
    const rowB = body.rows.find((r) => r.examName === revenueExamBName);
    expect(rowA, `expected row for ${revenueExamAName}`).toBeTruthy();
    expect(rowB, `expected row for ${revenueExamBName}`).toBeTruthy();
    expect(rowA!.amount).toBe(approvedAmountA);
    expect(rowB!.amount).toBe(approvedAmountB);

    // PAID-only txn must not inflate exam A total (would be +EXAM_FEE if PAID counted)
    expect(paidOnlyTranxId).not.toBeNull();
    expect(rowA!.amount).not.toBe(approvedAmountA + EXAM_FEE);

    const filteredTotal = body.rows
      .filter(
        (r) =>
          r.examName === revenueExamAName || r.examName === revenueExamBName,
      )
      .reduce((sum, r) => sum + r.amount, 0);
    expect(filteredTotal).toBe(approvedAmountA + approvedAmountB);

    // index is 1-based sequential in response
    for (let i = 0; i < body.rows.length; i += 1) {
      expect(body.rows[i].index).toBe(i + 1);
    }
  });

  // FUND-I-012
  test('daily-revenue date / examName filters', async ({ request }) => {
    requireRevenueSeed();
    const today = todayYmd();

    // Filter by exam A name only
    const byExam = await request.get('/api/fund-sources/daily-revenue', {
      headers: financeHeaders,
      params: {
        startDate: today,
        endDate: today,
        examName: revenueExamAName,
      },
    });
    expect(byExam.status(), await byExam.text()).toBe(200);
    const examBody = (await byExam.json()) as DailyRevenueSummary;
    expect(
      examBody.rows.every((r) => r.examName.includes(revenueExamAName)),
    ).toBe(true);
    const examARow = examBody.rows.find(
      (r) => r.examName === revenueExamAName,
    );
    expect(examARow?.amount).toBe(approvedAmountA);
    expect(
      examBody.rows.some((r) => r.examName === revenueExamBName),
    ).toBe(false);

    // Partial examName match (shared prefix)
    const byPrefix = await request.get('/api/fund-sources/daily-revenue', {
      headers: financeHeaders,
      params: {
        startDate: today,
        endDate: today,
        examName: 'FUND-REV-B-',
      },
    });
    expect(byPrefix.status(), await byPrefix.text()).toBe(200);
    const prefixBody = (await byPrefix.json()) as DailyRevenueSummary;
    expect(
      prefixBody.rows.some((r) => r.examName === revenueExamBName),
    ).toBe(true);
    expect(
      prefixBody.rows.some((r) => r.examName === revenueExamAName),
    ).toBe(false);
    expect(
      prefixBody.rows.find((r) => r.examName === revenueExamBName)?.amount,
    ).toBe(approvedAmountB);

    // Date range in the past → our seeded paid_at is today, so empty for our exams
    const past = await request.get('/api/fund-sources/daily-revenue', {
      headers: financeHeaders,
      params: {
        startDate: '2020-01-01',
        endDate: '2020-01-31',
        examName: 'FUND-REV-',
      },
    });
    expect(past.status(), await past.text()).toBe(200);
    const pastBody = (await past.json()) as DailyRevenueSummary;
    expect(
      pastBody.rows.some(
        (r) =>
          r.examName === revenueExamAName || r.examName === revenueExamBName,
      ),
    ).toBe(false);

    // Future-only window → empty for our exams
    const future = await request.get('/api/fund-sources/daily-revenue', {
      headers: financeHeaders,
      params: {
        startDate: '2099-01-01',
        endDate: '2099-12-31',
        examName: 'FUND-REV-',
      },
    });
    expect(future.status(), await future.text()).toBe(200);
    const futureBody = (await future.json()) as DailyRevenueSummary;
    expect(
      futureBody.rows.some(
        (r) =>
          r.examName === revenueExamAName || r.examName === revenueExamBName,
      ),
    ).toBe(false);
  });
});
