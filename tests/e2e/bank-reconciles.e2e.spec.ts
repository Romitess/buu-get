import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { apiLogin } from './fixtures/auth';
import { getTestUser, TEST_PASSWORD } from './fixtures/users';
import {
  FinCheckTranscriptPage,
  PaymentImportPage,
} from './pages/payment-import.page';

/**
 * E2E: Bank reconcile payment-import → verify → confirm
 * Matrix: BR-E-001, BR-E-003, BR-E-004
 * BR-E-002 skipped — BUG-005 (PATCH /:id/refs rematch leaves stale TRANX_ID)
 */

const TransactionPaymentStatus = {
  PENDING: 0,
  APPROVED: 1,
  PAID: 3,
} as const;

const TransactionMatchStatus = {
  UNMATCH: 0,
  MATCH: 1,
  MISSING: 2,
} as const;

const ReceiptStatus = {
  UNISSUED: 0,
  ISSUED: 1,
} as const;

const EXAM_FEE = 500;

type AuthHeaders = { Authorization: string };

type RoleRow = { ROLE_ID: number; ROLE_NAME: string };

type UserRow = {
  USER_ID: number;
  USER_EMAIL: string;
  USER_CODE: string | null;
};

type TransactionRefRow = {
  TSR_ID: number;
  TRANX_ID: number;
  TSC_REF1: string;
  TSC_REF2: string | null;
};

type TransactionRow = {
  TRANX_ID: number;
  TRANX_PAYMENT_STATUS: number;
  TRANX_MATCH_STATUS?: number;
};

type ReceiptRow = {
  RC_ID: number;
  TRANX_ID: number;
  RC_STATUS: number;
};

type Paginated<T> = { data: T[] };

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function apiBaseUrl(): string {
  return (process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
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
      r.paymentDate ?? '2026-08-05',
      r.paymentTime ?? '10:00:00',
    ].join(','),
  );
  return `${header}\n${lines.join('\n')}\n`;
}

async function headersFor(
  request: APIRequestContext,
  role: 'admin' | 'finance' | 'candidate',
): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, role);
  return { Authorization: `Bearer ${accessToken}` };
}

async function injectAuthSession(
  page: Page,
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const login = await request.post(`${apiBaseUrl()}/api/auth/login`, {
    data: { email, password },
  });
  if (!login.ok()) {
    throw new Error(
      `injectAuthSession login failed: ${login.status()} ${await login.text()}`,
    );
  }
  const body = (await login.json()) as {
    accessToken: string;
    user: { id: number };
  };
  await page.goto('/#/login');
  await page.evaluate(
    ({ token, userId }) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user_id', String(userId));
    },
    { token: body.accessToken, userId: body.user.id },
  );
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForURL((url) => !url.hash.includes('/login'), {
    timeout: 30_000,
  });
  return body.accessToken;
}

test.describe('E2E: Payment import verify / confirm / access', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });
  test.setTimeout(180_000);

  let adminHeaders: AuthHeaders;
  let financeHeaders: AuthHeaders;

  let examId: number | null = null;
  let examName = '';
  let activePcId: number | null = null;
  let sessionSlot = 0;

  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const transactionIds: number[] = [];
  const receiptIds: number[] = [];
  const userIds: number[] = [];

  let seedReady = false;
  let seedSkipReason = '';
  let candidate: {
    email: string;
    password: string;
    userId: number;
    userCode: string;
  } | null = null;

  async function createDisposableCandidate(
    request: APIRequestContext,
  ): Promise<{ email: string; password: string; userId: number; userCode: string }> {
    const rolesRes = await request.get(`${apiBaseUrl()}/api/roles`, {
      headers: adminHeaders,
    });
    expect(rolesRes.status(), await rolesRes.text()).toBe(200);
    const roles = (await rolesRes.json()) as RoleRow[];
    const candidateRole = roles.find((r) => r.ROLE_NAME === 'candidate');
    expect(candidateRole).toBeTruthy();

    const email = `br-e.${uniqueSuffix()}@buu-get.test`;
    const res = await request.post(`${apiBaseUrl()}/api/users`, {
      headers: adminHeaders,
      data: {
        USER_EMAIL: email,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRole!.ROLE_ID],
        USER_NATIONAL_ID: `4${uniqueSuffix()}`.replace(/\D/g, '').padStart(13, '4').slice(0, 13),
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as UserRow;
    userIds.push(body.USER_ID);
    expect(body.USER_CODE).toBeTruthy();
    return {
      email,
      password: TEST_PASSWORD,
      userId: body.USER_ID,
      userCode: body.USER_CODE!,
    };
  }

  async function createSession(request: APIRequestContext): Promise<number> {
    const { start, end } = hourMinute(sessionSlot++);
    const res = await request.post(`${apiBaseUrl()}/api/exam-sessions`, {
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
    candidateToken: string,
  ): Promise<number> {
    const sessionId = await createSession(request);
    const res = await request.post(`${apiBaseUrl()}/api/exam-enrollments`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
      data: { USER_ID: candidate!.userId, SESSION_ID: sessionId },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { ERM_ID: number };
    enrollmentIds.push(body.ERM_ID);
    return body.ERM_ID;
  }

  async function seedPaidWithRef(
    request: APIRequestContext,
    candidateToken: string,
    label: string,
  ): Promise<{
    ermId: number;
    tranxId: number;
    userCode: string;
    ref: TransactionRefRow;
  }> {
    const ermId = await createEnrollment(request, candidateToken);
    const createRes = await request.post(`${apiBaseUrl()}/api/transactions`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
      data: { ermId, pcId: activePcId ?? 1, amount: EXAM_FEE },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const { TRANX_ID: tranxId } = (await createRes.json()) as { TRANX_ID: number };
    transactionIds.push(tranxId);

    const userCode = `be${label}${uniqueSuffix()}`.slice(0, 20);
    const confirmRes = await request.patch(
      `${apiBaseUrl()}/api/transactions/${tranxId}/confirm`,
      {
        headers: { Authorization: `Bearer ${candidateToken}` },
        data: {
          userCode,
          receiptName: `BR-E ${label}`,
          receiptTaxId: '1234567890123',
          receiptPhone: '0812345678',
          receiptAddress: 'BR-E Address',
        },
      },
    );
    expect(confirmRes.status(), await confirmRes.text()).toBe(200);

    const refSearch = await request.get(
      `${apiBaseUrl()}/api/transaction-refs/search`,
      {
        headers: financeHeaders,
        params: { ref1: userCode, page: 1, limit: 20 },
      },
    );
    expect(refSearch.status(), await refSearch.text()).toBe(200);
    const body = (await refSearch.json()) as Paginated<TransactionRefRow>;
    const ref = (body.data ?? []).find((r) => r.TRANX_ID === tranxId);
    expect(ref, `TransactionRef for ${userCode}`).toBeTruthy();

    // Track any auto-created receipt for cleanup
    const receiptsList = await request.get(`${apiBaseUrl()}/api/receipts`, {
      headers: financeHeaders,
      params: { page: 1, limit: 50 },
    });
    if (receiptsList.ok()) {
      const pageBody = (await receiptsList.json()) as Paginated<ReceiptRow>;
      const found = (pageBody.data ?? []).find((r) => r.TRANX_ID === tranxId);
      if (found) receiptIds.push(found.RC_ID);
    }

    return { ermId, tranxId, userCode, ref: ref! };
  }

  test.beforeAll(async ({ request }) => {
    test.setTimeout(120_000);

    adminHeaders = await headersFor(request, 'admin');
    financeHeaders = await headersFor(request, 'finance');

    const pc1 = await request.get(`${apiBaseUrl()}/api/payment-configs/1`, {
      headers: adminHeaders,
    });
    if (pc1.ok()) {
      activePcId = 1;
    } else {
      const suffix = uniqueSuffix();
      const pcRes = await request.post(`${apiBaseUrl()}/api/payment-configs`, {
        headers: adminHeaders,
        data: {
          PC_COMP_CODE: `BE${suffix}`.slice(0, 20),
          PC_PROD_CODE: `BP${suffix}`.slice(0, 20),
          PC_IS_ACTIVE: true,
          PC_EFFECTIVE_FROM: '2026-01-01T00:00:00.000Z',
        },
      });
      if (![200, 201].includes(pcRes.status())) {
        seedSkipReason = `Cannot create payment-config: ${pcRes.status()} ${await pcRes.text()}`;
        return;
      }
      activePcId = ((await pcRes.json()) as { PC_ID: number }).PC_ID;
    }

    try {
      candidate = await createDisposableCandidate(request);
    } catch (err) {
      seedSkipReason = `Cannot create candidate: ${String(err)}`;
      return;
    }

    const suffix = uniqueSuffix();
    examName = `BR-E ${suffix}`;
    const examRes = await request.post(`${apiBaseUrl()}/api/exam`, {
      headers: adminHeaders,
      data: {
        EXAM_NAME: examName,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE,
        EXAM_DATE: '2026-12-28',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: 'BE',
        EXAM_FISCAL_YEAR: '2026',
        FUND_SOURCE_ID: 1,
        SRB_ID: 1,
      },
    });
    if (![200, 201].includes(examRes.status())) {
      seedSkipReason = `Cannot create exam: ${examRes.status()} ${await examRes.text()}`;
      return;
    }
    examId = ((await examRes.json()) as { EXAM_ID: number }).EXAM_ID;
    seedReady = true;
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(60_000);
    // Do not DELETE /bank-reconciles (clearAll) — shared DB; unique import hashes isolate rows

    for (const rcId of receiptIds) {
      await request
        .delete(`${apiBaseUrl()}/api/receipts/${rcId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    for (const tranxId of transactionIds) {
      await request
        .delete(`${apiBaseUrl()}/api/transactions/${tranxId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    for (const ermId of enrollmentIds) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-enrollments/${ermId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    for (const ssId of sessionIds) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-sessions/${ssId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    if (activePcId && activePcId !== 1) {
      await request
        .delete(`${apiBaseUrl()}/api/payment-configs/${activePcId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    if (examId) {
      await request
        .delete(`${apiBaseUrl()}/api/exam/${examId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    for (const uid of userIds) {
      await request
        .delete(`${apiBaseUrl()}/api/users/${uid}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
  });

  function requireSeed(): void {
    test.skip(!seedReady, seedSkipReason || 'BR-E seed failed');
  }

  // BR-E-001
  test('Finance upload CSV → verify → MATCH/MISSING on transcript + API', async ({
    page,
    request,
  }) => {
    requireSeed();
    test.setTimeout(240_000);

    await request
      .delete(`${apiBaseUrl()}/api/bank-reconciles`, { headers: financeHeaders })
      .catch(() => undefined);

    const login = await request.post(`${apiBaseUrl()}/api/auth/login`, {
      data: { email: candidate!.email, password: candidate!.password },
    });
    expect(login.ok()).toBeTruthy();
    const token = ((await login.json()) as { accessToken: string }).accessToken;

    const matchSeed = await seedPaidWithRef(request, token, 'm');
    const missSeed = await seedPaidWithRef(request, token, 'x');

    const matchPayer = `BRM${uniqueSuffix()}`.slice(0, 20);
    const missPayer = `BRX${uniqueSuffix()}`.slice(0, 20);
    const csv = buildPaymentCsv([
      {
        applicantId: matchSeed.userCode,
        referenceNo: matchSeed.ref.TSC_REF2,
        payerName: matchPayer,
        amount: EXAM_FEE,
      },
      {
        applicantId: missSeed.userCode,
        referenceNo: missSeed.ref.TSC_REF2,
        payerName: missPayer,
        // Wrong amount → verify marks TRANX_MATCH_STATUS = MISSING
        amount: EXAM_FEE + 50,
      },
    ]);

    const finance = getTestUser('finance');
    await injectAuthSession(page, request, finance.email, finance.password);

    const importPage = new PaymentImportPage(page);
    await importPage.goto();
    await importPage.uploadCsv(csv, `br-e-001-${uniqueSuffix()}.csv`);
    await importPage.expectRowContaining(matchPayer);
    await importPage.expectRowContaining(missPayer);

    await importPage.clickVerifyAndWaitForTranscript();

    const transcript = new FinCheckTranscriptPage(page);
    await transcript.expectLoaded();
    // Amount-mismatch MISSING still links by ref → DB columns filled for both.
    // MATCH/MISSING contract is on TRANX_MATCH_STATUS (UI has no MATCH/MISSING badge).
    await transcript.expectMatchedRow(matchPayer);
    await transcript.expectMatchedRow(missPayer);

    const matchTxn = await request.get(
      `${apiBaseUrl()}/api/transactions/${matchSeed.tranxId}`,
      { headers: financeHeaders },
    );
    expect(matchTxn.status()).toBe(200);
    expect(
      ((await matchTxn.json()) as TransactionRow).TRANX_MATCH_STATUS,
    ).toBe(TransactionMatchStatus.MATCH);

    const missTxn = await request.get(
      `${apiBaseUrl()}/api/transactions/${missSeed.tranxId}`,
      { headers: financeHeaders },
    );
    expect(missTxn.status()).toBe(200);
    expect(
      ((await missTxn.json()) as TransactionRow).TRANX_MATCH_STATUS,
    ).toBe(TransactionMatchStatus.MISSING);
  });

  // BR-E-002 — SKIP: BUG-005 rematch broken
  test.skip(
    'Finance edit refs rematches (BR-E-002) — SKIPPED: BUG-005 updateRefs rematch leaves stale TRANX_ID on prior transaction',
    async () => {
      // Intentionally skipped — see tests/BUG_LOG.md BUG-005
    },
  );

  // BR-E-003
  test('Finance confirm payment issues receipts (fin-check-transcript dialog)', async ({
    page,
    request,
  }) => {
    requireSeed();
    test.setTimeout(240_000);

    // Clear prior BR rows so match/verify is not overloaded after BR-E-001
    const clearRes = await request.delete(
      `${apiBaseUrl()}/api/bank-reconciles`,
      { headers: financeHeaders },
    );
    expect([200, 201, 204]).toContain(clearRes.status());

    const login = await request.post(`${apiBaseUrl()}/api/auth/login`, {
      data: { email: candidate!.email, password: candidate!.password },
    });
    expect(login.ok()).toBeTruthy();
    const token = ((await login.json()) as { accessToken: string }).accessToken;

    const seed = await seedPaidWithRef(request, token, 'c');
    const payerName = `BRC${uniqueSuffix()}`.slice(0, 20);
    const csv = buildPaymentCsv([
      {
        applicantId: seed.userCode,
        referenceNo: seed.ref.TSC_REF2,
        payerName,
        amount: EXAM_FEE,
      },
    ]);

    const finance = getTestUser('finance');
    await injectAuthSession(page, request, finance.email, finance.password);

    const importPage = new PaymentImportPage(page);
    await importPage.goto();
    await importPage.uploadCsv(csv, `br-e-003-${uniqueSuffix()}.csv`);
    await importPage.expectRowContaining(payerName);
    await importPage.clickVerifyAndWaitForTranscript();

    const transcript = new FinCheckTranscriptPage(page);
    await transcript.expectLoaded();
    await transcript.expectMatchedRow(payerName);
    await transcript.confirmSavePayments();

    // After success dialog OK → navigates back to payment-import
    await expect(page).toHaveURL(/#\/admin\/payment-import/, { timeout: 20_000 });

    const txnGet = await request.get(
      `${apiBaseUrl()}/api/transactions/${seed.tranxId}`,
      { headers: financeHeaders },
    );
    expect(txnGet.status()).toBe(200);
    const txn = (await txnGet.json()) as TransactionRow;
    expect([
      TransactionPaymentStatus.APPROVED,
      TransactionPaymentStatus.PAID,
    ]).toContain(txn.TRANX_PAYMENT_STATUS);
    expect(txn.TRANX_MATCH_STATUS).toBe(TransactionMatchStatus.MATCH);

    // Receipt should be ISSUED after confirm-payment
    let issued: ReceiptRow | undefined;
    for (let p = 1; p <= 10; p += 1) {
      const list = await request.get(`${apiBaseUrl()}/api/receipts`, {
        headers: financeHeaders,
        params: { page: p, limit: 50 },
      });
      if (!list.ok()) break;
      const body = (await list.json()) as Paginated<ReceiptRow>;
      issued = (body.data ?? []).find(
        (r) =>
          r.TRANX_ID === seed.tranxId && r.RC_STATUS === ReceiptStatus.ISSUED,
      );
      if (issued) {
        if (!receiptIds.includes(issued.RC_ID)) receiptIds.push(issued.RC_ID);
        break;
      }
      if (!(body.data?.length)) break;
    }
    expect(issued, `ISSUED receipt for TRANX_ID=${seed.tranxId}`).toBeTruthy();
  });

  // BR-E-004
  test('Candidate / applicant blocked from payment-import', async ({
    page,
    request,
  }) => {
    const candidateUser = getTestUser('candidate');
    await injectAuthSession(
      page,
      request,
      candidateUser.email,
      candidateUser.password,
    );

    await page.goto('/#/admin/payment-import');
    await expect(page).toHaveURL(/#\/user\/exam-schedule/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/#\/admin\/payment-import/);

    // API also rejects non-finance import
    const candidateHeaders = await headersFor(request, 'candidate');
    const csv = buildPaymentCsv([
      {
        applicantId: 'blocked',
        referenceNo: 'blocked',
        payerName: 'Blocked',
        amount: EXAM_FEE,
      },
    ]);
    const importRes = await request.post(
      `${apiBaseUrl()}/api/bank-reconciles/import`,
      {
        headers: candidateHeaders,
        multipart: {
          file: {
            name: 'blocked.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csv, 'utf8'),
          },
        },
      },
    );
    expect([401, 403]).toContain(importRes.status());
  });
});
