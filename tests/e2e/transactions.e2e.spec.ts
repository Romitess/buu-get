import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { apiLogin } from './fixtures/auth';
import { TEST_PASSWORD } from './fixtures/users';
import { ExamHistoryPage } from './pages/exam-history.page';

/**
 * E2E: Candidate payment flow on exam-history
 * Matrix: TXN-E-001, TXN-E-002, TXN-E-003 (P0–P1)
 *
 * Seed: disposable candidate (has USER_CODE) + unpaid enrollment.
 * UI hardcodes pcId=1 on createTransaction — PC_ID=1 must exist.
 */

const TransactionPaymentStatus = {
  PENDING: 0,
  PAID: 3,
  EXPIRED: 5,
} as const;

const EXAM_FEE = 500;

type AuthHeaders = { Authorization: string };

type RoleRow = { ROLE_ID: number; ROLE_NAME: string };

type UserRow = {
  USER_ID: number;
  USER_EMAIL: string;
  USER_CODE: string | null;
};

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

async function headersFor(
  request: APIRequestContext,
  role: 'admin' | 'candidate' | 'proctor',
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
  // Full reload so Pinia/auth boot re-reads localStorage
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForURL((url) => !url.hash.includes('/login'), {
    timeout: 30_000,
  });
  return body.accessToken;
}

test.describe('E2E: Candidate payment create → confirm / expire / ownership', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });
  test.setTimeout(180_000);

  let adminHeaders: AuthHeaders;
  let examId: number | null = null;
  let examName = '';
  let sessionSlot = 0;

  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const transactionIds: number[] = [];
  const userIds: number[] = [];

  let seedReady = false;
  let seedSkipReason = '';
  let candidateA: { email: string; password: string; userId: number; userCode: string } | null =
    null;
  let candidateB: { email: string; password: string; userId: number } | null = null;
  let ermIdA: number | null = null;

  async function createDisposableCandidate(
    request: APIRequestContext,
    label: string,
  ): Promise<{ email: string; password: string; userId: number; userCode: string }> {
    const rolesRes = await request.get(`${apiBaseUrl()}/api/roles`, {
      headers: adminHeaders,
    });
    expect(rolesRes.status(), await rolesRes.text()).toBe(200);
    const roles = (await rolesRes.json()) as RoleRow[];
    const candidateRole = roles.find((r) => r.ROLE_NAME === 'candidate');
    expect(candidateRole, 'candidate role must exist').toBeTruthy();

    const email = `txn-e.${label}.${uniqueSuffix()}@buu-get.test`;
    const res = await request.post(`${apiBaseUrl()}/api/users`, {
      headers: adminHeaders,
      data: {
        USER_EMAIL: email,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRole!.ROLE_ID],
        USER_NATIONAL_ID: `1${uniqueSuffix()}`.replace(/\D/g, '').padStart(13, '1').slice(0, 13),
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as UserRow;
    userIds.push(body.USER_ID);
    expect(body.USER_CODE, 'created user must have USER_CODE for confirm').toBeTruthy();
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
    userId: number,
    candidateToken: string,
  ): Promise<number> {
    const sessionId = await createSession(request);
    const res = await request.post(`${apiBaseUrl()}/api/exam-enrollments`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
      data: { USER_ID: userId, SESSION_ID: sessionId },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { ERM_ID: number };
    enrollmentIds.push(body.ERM_ID);
    return body.ERM_ID;
  }

  async function trackTxnFromResponse(body: { TRANX_ID?: number }): Promise<void> {
    if (body.TRANX_ID && !transactionIds.includes(body.TRANX_ID)) {
      transactionIds.push(body.TRANX_ID);
    }
  }

  test.beforeAll(async ({ request }) => {
    test.setTimeout(120_000);

    adminHeaders = await headersFor(request, 'admin');

    const pc1 = await request.get(`${apiBaseUrl()}/api/payment-configs/1`, {
      headers: adminHeaders,
    });
    if (!pc1.ok()) {
      seedSkipReason = `Payment config ID 1 missing (UI hardcodes pcId=1): ${pc1.status()}`;
      return;
    }

    try {
      candidateA = await createDisposableCandidate(request, 'a');
      candidateB = await createDisposableCandidate(request, 'b');
    } catch (err) {
      seedSkipReason = `Cannot create disposable candidates: ${String(err)}`;
      return;
    }

    const suffix = uniqueSuffix();
    examName = `TXN-E ${suffix}`;
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
        EXAM_ROUND: 'TE',
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

    const loginA = await request.post(`${apiBaseUrl()}/api/auth/login`, {
      data: { email: candidateA!.email, password: candidateA!.password },
    });
    if (!loginA.ok()) {
      seedSkipReason = `Candidate A login failed: ${loginA.status()} ${await loginA.text()}`;
      return;
    }
    const tokenA = ((await loginA.json()) as { accessToken: string }).accessToken;
    ermIdA = await createEnrollment(request, candidateA!.userId, tokenA);

    seedReady = true;
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(60_000);
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
    test.skip(!seedReady, seedSkipReason || 'TXN-E seed failed');
  }

  // TXN-E-001
  test('Candidate unpaid enrollment → UI create QR txn → confirm → PENDING then PAID', async ({
    page,
    request,
  }) => {
    requireSeed();
    expect(candidateA && ermIdA).toBeTruthy();

    await injectAuthSession(page, request, candidateA!.email, candidateA!.password);
    const history = new ExamHistoryPage(page);
    await history.goto();

    const createPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/transactions') &&
        res.request().method() === 'POST' &&
        res.status() === 201,
      { timeout: 30_000 },
    );

    await history.clickPay(examName);
    const createRes = await createPromise;
    const created = (await createRes.json()) as { TRANX_ID: number };
    await trackTxnFromResponse(created);
    const tranxId = created.TRANX_ID;

    // Assert PENDING via API after create
    const loginA = await request.post(`${apiBaseUrl()}/api/auth/login`, {
      data: { email: candidateA!.email, password: candidateA!.password },
    });
    const tokenA = ((await loginA.json()) as { accessToken: string }).accessToken;
    const pendingGet = await request.get(
      `${apiBaseUrl()}/api/transactions/${tranxId}`,
      { headers: { Authorization: `Bearer ${tokenA}` } },
    );
    expect(pendingGet.status()).toBe(200);
    expect(
      ((await pendingGet.json()) as { TRANX_PAYMENT_STATUS: number })
        .TRANX_PAYMENT_STATUS,
    ).toBe(TransactionPaymentStatus.PENDING);

    await history.fillReceiptInformation({
      taxId: '1234567890123',
      fullName: 'Test Candidate A',
      phone: '0812345678',
      address: '169 Longhad Bangsaen Rd, Saen Suk, Chon Buri 20131',
    });

    const confirmPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/transactions/${tranxId}/confirm`) &&
        res.request().method() === 'PATCH',
      { timeout: 30_000 },
    );
    await history.confirmPaymentViaSaveQr();
    const confirmRes = await confirmPromise;
    expect(confirmRes.status(), await confirmRes.text()).toBe(200);

    await history.expectSuccessNotification();

    const paidGet = await request.get(`${apiBaseUrl()}/api/transactions/${tranxId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    expect(paidGet.status()).toBe(200);
    expect(
      ((await paidGet.json()) as { TRANX_PAYMENT_STATUS: number })
        .TRANX_PAYMENT_STATUS,
    ).toBe(TransactionPaymentStatus.PAID);
  });

  // TXN-E-002
  test('Candidate expires abandoned PENDING in UI → EXPIRED; can restart', async ({
    page,
    request,
  }) => {
    requireSeed();

    // Fresh unpaid enrollment for expire/restart (TXN-E-001 may have paid ermIdA)
    const loginA = await request.post(`${apiBaseUrl()}/api/auth/login`, {
      data: { email: candidateA!.email, password: candidateA!.password },
    });
    const tokenA = ((await loginA.json()) as { accessToken: string }).accessToken;
    await createEnrollment(request, candidateA!.userId, tokenA);

    await injectAuthSession(page, request, candidateA!.email, candidateA!.password);
    const history = new ExamHistoryPage(page);
    await history.goto();

    const createPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/transactions') &&
        res.request().method() === 'POST' &&
        res.status() === 201,
      { timeout: 30_000 },
    );

    await history.clickPay(examName);
    const createRes = await createPromise;
    const created = (await createRes.json()) as { TRANX_ID: number };
    await trackTxnFromResponse(created);
    const tranxId = created.TRANX_ID;

    await history.fillReceiptInformation({
      taxId: '1234567890123',
      fullName: 'Test Candidate Expire',
      phone: '0899999999',
      address: 'Expire Test Address',
    });
    await history.expectPaymentDialog();

    // Abandon payment dialog (leave PENDING open). Full UI countdown is ~1790s;
    // clock.fastForward breaks later enrollments, so expire via the same endpoint
    // AppPaymentDialog @timeout → handlePaymentTimeout calls.
    await history.closePaymentDialog();
    await expect(history.paymentDialog).toBeHidden({ timeout: 10_000 });

    const expireRes = await request.patch(
      `${apiBaseUrl()}/api/transactions/${tranxId}/expire`,
      { headers: { Authorization: `Bearer ${tokenA}` } },
    );
    expect(expireRes.status(), await expireRes.text()).toBe(200);

    const expiredGet = await request.get(
      `${apiBaseUrl()}/api/transactions/${tranxId}`,
      { headers: { Authorization: `Bearer ${tokenA}` } },
    );
    expect(expiredGet.status()).toBe(200);
    expect(
      ((await expiredGet.json()) as { TRANX_PAYMENT_STATUS: number })
        .TRANX_PAYMENT_STATUS,
    ).toBe(TransactionPaymentStatus.EXPIRED);

    // Can restart: Pay Now again → PENDING (reuses/restarts txn row)
    await history.goto();
    const restartPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/transactions') &&
        res.request().method() === 'POST' &&
        res.status() === 201,
      { timeout: 30_000 },
    );
    await history.clickPay(examName);
    const restartRes = await restartPromise;
    const restarted = (await restartRes.json()) as { TRANX_ID: number };
    await trackTxnFromResponse(restarted);

    const pendingAgain = await request.get(
      `${apiBaseUrl()}/api/transactions/${restarted.TRANX_ID}`,
      { headers: { Authorization: `Bearer ${tokenA}` } },
    );
    expect(pendingAgain.status()).toBe(200);
    expect(
      ((await pendingAgain.json()) as { TRANX_PAYMENT_STATUS: number })
        .TRANX_PAYMENT_STATUS,
    ).toBe(TransactionPaymentStatus.PENDING);

    // Close receipt dialog if opened and expire abandoned restart
    if (await history.receiptDialog.isVisible().catch(() => false)) {
      await history.receiptDialog.locator('.close-btn').click();
    }
    await request
      .patch(`${apiBaseUrl()}/api/transactions/${restarted.TRANX_ID}/expire`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      })
      .catch(() => undefined);
  });

  // TXN-E-003
  test("Candidate B cannot confirm A's transaction (403)", async ({
    page,
    request,
  }) => {
    requireSeed();
    expect(candidateA && candidateB).toBeTruthy();

    // Seed PENDING for A via API (UI setup optional — ownership is API-enforced)
    const loginA = await request.post(`${apiBaseUrl()}/api/auth/login`, {
      data: { email: candidateA!.email, password: candidateA!.password },
    });
    const tokenA = ((await loginA.json()) as { accessToken: string }).accessToken;
    const ermId = await createEnrollment(request, candidateA!.userId, tokenA);

    const createRes = await request.post(`${apiBaseUrl()}/api/transactions`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: { ermId, pcId: 1, amount: EXAM_FEE },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const { TRANX_ID: tranxId } = (await createRes.json()) as { TRANX_ID: number };
    transactionIds.push(tranxId);

    // Optional UI visibility: A can see pending card
    await injectAuthSession(page, request, candidateA!.email, candidateA!.password);
    const history = new ExamHistoryPage(page);
    await history.goto();
    await history.expectPendingCard(examName);

    // B attempts confirm via API (ownership check — same as UI would hit)
    const loginB = await request.post(`${apiBaseUrl()}/api/auth/login`, {
      data: { email: candidateB!.email, password: candidateB!.password },
    });
    expect(loginB.ok()).toBeTruthy();
    const tokenB = ((await loginB.json()) as { accessToken: string }).accessToken;

    const confirmB = await request.patch(
      `${apiBaseUrl()}/api/transactions/${tranxId}/confirm`,
      {
        headers: { Authorization: `Bearer ${tokenB}` },
        data: { userCode: 'hacker' },
      },
    );
    expect(confirmB.status()).toBe(403);
    const body = await confirmB.json().catch(() => ({}));
    expect(String((body as { message?: string }).message ?? '')).toMatch(
      /does not belong/i,
    );

    // Cleanup expire A's pending
    await request
      .patch(`${apiBaseUrl()}/api/transactions/${tranxId}/expire`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      })
      .catch(() => undefined);
  });
});
