import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { apiLogin } from './fixtures/auth';
import { getTestUser, TEST_PASSWORD } from './fixtures/users';
import { ReceiptVoidRefundPage } from './pages/receipt-void-refund.page';

/**
 * E2E: Receipt void / refund admin flow
 * Matrix: VOID-E-001 … VOID-E-004 (VOID-E-005 P2 not in scope)
 */

const ReceiptStatus = {
  UNISSUED: 0,
  ISSUED: 1,
  VOIDED: 2,
} as const;

const TransactionPaymentStatus = {
  PAID: 3,
  RECEIPT_VOIDED: 8,
} as const;

const EXAM_FEE = 500;

type AuthHeaders = { Authorization: string };

type RoleRow = { ROLE_ID: number; ROLE_NAME: string };

type UserRow = {
  USER_ID: number;
  USER_EMAIL: string;
  USER_CODE: string | null;
};

type ReceiptRow = {
  RC_ID: number;
  TRANX_ID: number;
  RC_STATUS: number;
};

type TransactionRefRow = {
  TSR_ID: number;
  TRANX_ID: number;
  TSC_REF1: string;
  TSC_REF2: string | null;
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
  role: 'admin' | 'finance' | 'candidate' | 'proctor',
): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, role);
  return { Authorization: `Bearer ${accessToken}` };
}

/** Token inject — avoids login UI rate limits (same pattern as receipts/transactions E2E). */
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

test.describe('E2E: Finance voids ISSUED receipt on receipt-void-refund', () => {
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

  /** Shared ISSUED seed for VOID-E-001 / 002 / 004 */
  let voidTarget: {
    tranxId: number;
    rcId: number;
    ref1: string;
    ref2: string;
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

    const email = `void-e.${uniqueSuffix()}@buu-get.test`;
    const res = await request.post(`${apiBaseUrl()}/api/users`, {
      headers: adminHeaders,
      data: {
        USER_EMAIL: email,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRole!.ROLE_ID],
        USER_NATIONAL_ID: `3${uniqueSuffix()}`.replace(/\D/g, '').padStart(13, '3').slice(0, 13),
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

  async function seedIssuedWithRef(
    request: APIRequestContext,
    candidateToken: string,
    label: string,
  ): Promise<{ tranxId: number; rcId: number; ref1: string; ref2: string }> {
    const ermId = await createEnrollment(request, candidateToken);

    const createRes = await request.post(`${apiBaseUrl()}/api/transactions`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
      data: { ermId, pcId: activePcId ?? 1, amount: EXAM_FEE },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const { TRANX_ID: tranxId } = (await createRes.json()) as { TRANX_ID: number };
    transactionIds.push(tranxId);

    const ref1 = `ve${label}${uniqueSuffix()}`.slice(0, 20);
    const confirmRes = await request.patch(
      `${apiBaseUrl()}/api/transactions/${tranxId}/confirm`,
      {
        headers: { Authorization: `Bearer ${candidateToken}` },
        data: {
          userCode: ref1,
          receiptName: `VOID-E ${label}`,
          receiptTaxId: '1234567890123',
          receiptPhone: '0812345678',
          receiptAddress: 'VOID-E Address',
        },
      },
    );
    expect(confirmRes.status(), await confirmRes.text()).toBe(200);

    // confirm creates UNISSUED receipt — promote to ISSUED for void UI
    let rcId: number | null = null;
    for (let page = 1; page <= 10 && rcId === null; page += 1) {
      const list = await request.get(`${apiBaseUrl()}/api/receipts`, {
        headers: financeHeaders,
        params: { page, limit: 50 },
      });
      if (!list.ok()) break;
      const body = (await list.json()) as { data: ReceiptRow[] };
      const found = (body.data ?? []).find((r) => r.TRANX_ID === tranxId);
      if (found) {
        rcId = found.RC_ID;
        receiptIds.push(rcId);
        if (found.RC_STATUS !== ReceiptStatus.ISSUED) {
          const patch = await request.patch(
            `${apiBaseUrl()}/api/receipts/${rcId}`,
            {
              headers: financeHeaders,
              data: {
                RC_STATUS: ReceiptStatus.ISSUED,
                RC_ISSUED_AT: '2026-08-05T00:00:00.000Z',
              },
            },
          );
          expect(patch.status(), await patch.text()).toBe(200);
        }
        break;
      }
      if (!(body.data?.length)) break;
    }

    if (rcId === null) {
      const receiptRes = await request.post(`${apiBaseUrl()}/api/receipts`, {
        headers: financeHeaders,
        data: {
          TRANX_ID: tranxId,
          RC_SIGNATURE_ID: `void-e-${label}-${uniqueSuffix()}`.slice(0, 100),
          RC_STATUS: ReceiptStatus.ISSUED,
          RC_ISSUED_AT: '2026-08-05T00:00:00.000Z',
        },
      });
      expect(receiptRes.status(), await receiptRes.text()).toBe(201);
      rcId = ((await receiptRes.json()) as ReceiptRow).RC_ID;
      receiptIds.push(rcId);
    }

    const refSearch = await request.get(
      `${apiBaseUrl()}/api/transaction-refs/search`,
      {
        headers: financeHeaders,
        params: { ref1, page: 1, limit: 20 },
      },
    );
    expect(refSearch.status(), await refSearch.text()).toBe(200);
    const refs = (await refSearch.json()) as { data: TransactionRefRow[] };
    const ref = (refs.data ?? []).find((r) => r.TRANX_ID === tranxId);
    expect(ref, `TransactionRef for ${ref1}`).toBeTruthy();

    return {
      tranxId,
      rcId,
      ref1,
      ref2: ref!.TSC_REF2 ?? '',
    };
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
      // Create disposable active PC if ID 1 missing
      const suffix = uniqueSuffix();
      const pcRes = await request.post(`${apiBaseUrl()}/api/payment-configs`, {
        headers: adminHeaders,
        data: {
          PC_COMP_CODE: `VE${suffix}`.slice(0, 20),
          PC_PROD_CODE: `VP${suffix}`.slice(0, 20),
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
    examName = `VOID-E ${suffix}`;
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
        EXAM_ROUND: 'VE',
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

    const login = await request.post(`${apiBaseUrl()}/api/auth/login`, {
      data: { email: candidate!.email, password: candidate!.password },
    });
    if (!login.ok()) {
      seedSkipReason = `Candidate login failed: ${login.status()} ${await login.text()}`;
      return;
    }
    const token = ((await login.json()) as { accessToken: string }).accessToken;

    try {
      voidTarget = await seedIssuedWithRef(request, token, 'a');
    } catch (err) {
      seedSkipReason = `Cannot seed ISSUED+ref: ${String(err)}`;
      return;
    }

    seedReady = true;
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(60_000);
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
    test.skip(!seedReady, seedSkipReason || 'VOID-E seed failed');
  }

  // VOID-E-001
  test('Finance voids ISSUED receipt via receipt-void-refund UI', async ({
    page,
    request,
  }) => {
    requireSeed();
    expect(voidTarget).toBeTruthy();

    const finance = getTestUser('finance');
    await injectAuthSession(page, request, finance.email, finance.password);
    const voidPage = new ReceiptVoidRefundPage(page);
    await voidPage.goto();

    await voidPage.searchByRef1(voidTarget!.ref1);
    const row = await voidPage.expectRowContaining(voidTarget!.ref1);
    await expect(voidPage.voidButtonInRow(row)).toBeVisible();

    await voidPage.openVoidDialogForRow(row);
    await voidPage.fillVoidReason('VOID-E-001 e2e void reason');

    const voidPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/voided-receipts') &&
        res.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await voidPage.confirmVoid();
    const voidRes = await voidPromise;
    expect(voidRes.status(), await voidRes.text()).toBe(201);

    await voidPage.expectVoidSuccessNotification();

    const receiptGet = await request.get(
      `${apiBaseUrl()}/api/receipts/${voidTarget!.rcId}`,
      { headers: financeHeaders },
    );
    expect(receiptGet.status()).toBe(200);
    expect(((await receiptGet.json()) as ReceiptRow).RC_STATUS).toBe(
      ReceiptStatus.VOIDED,
    );

    const txnGet = await request.get(
      `${apiBaseUrl()}/api/transactions/${voidTarget!.tranxId}`,
      { headers: financeHeaders },
    );
    expect(txnGet.status()).toBe(200);
    expect(
      ((await txnGet.json()) as { TRANX_PAYMENT_STATUS: number })
        .TRANX_PAYMENT_STATUS,
    ).toBe(TransactionPaymentStatus.RECEIPT_VOIDED);
  });

  // VOID-E-002
  test('Empty / whitespace void reason blocked client-side', async ({
    page,
    request,
  }) => {
    requireSeed();

    // Fresh ISSUED target so dialog can open after E-001 voided the shared seed
    const login = await request.post(`${apiBaseUrl()}/api/auth/login`, {
      data: { email: candidate!.email, password: candidate!.password },
    });
    const token = ((await login.json()) as { accessToken: string }).accessToken;
    const fresh = await seedIssuedWithRef(request, token, 'b');

    const finance = getTestUser('finance');
    await injectAuthSession(page, request, finance.email, finance.password);

    const voidPage = new ReceiptVoidRefundPage(page);
    await voidPage.goto();
    await voidPage.searchByRef1(fresh.ref1);
    const row = await voidPage.expectRowContaining(fresh.ref1);
    await voidPage.openVoidDialogForRow(row);

    // Empty
    await voidPage.fillVoidReason('');
    let apiCalled = false;
    const spyEmpty = (res: { url: () => string; request: () => { method: () => string } }) => {
      if (
        res.url().includes('/api/voided-receipts') &&
        res.request().method() === 'POST'
      ) {
        apiCalled = true;
      }
    };
    page.on('response', spyEmpty);
    await voidPage.confirmVoid();
    await voidPage.expectVoidReasonRequiredError();
    await expect(voidPage.voidDialog).toBeVisible();
    expect(apiCalled).toBe(false);

    // Whitespace only
    await voidPage.fillVoidReason('   ');
    await voidPage.confirmVoid();
    await voidPage.expectVoidReasonRequiredError();
    await expect(voidPage.voidDialog).toBeVisible();
    expect(apiCalled).toBe(false);
    page.off('response', spyEmpty);

    // Cleanup: void via API so leftover ISSUED is soft-deleted later
    await request
      .post(`${apiBaseUrl()}/api/voided-receipts`, {
        headers: financeHeaders,
        data: { RC_ID: fresh.rcId, VR_REASON: 'VOID-E-002 cleanup' },
      })
      .catch(() => undefined);
  });

  // VOID-E-003
  test('Non-finance cannot open receipt-void-refund (redirect)', async ({
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

    await page.goto('/#/admin/receipt-void-refund');
    await expect(page).toHaveURL(/#\/user\/exam-schedule/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/#\/admin\/receipt-void-refund/);
  });

  // VOID-E-004
  test('After void, canVoid/canRefund false — actions none', async ({
    page,
    request,
  }) => {
    requireSeed();
    expect(voidTarget).toBeTruthy();

    // Ensure target from E-001 is voided (re-void should 4xx; search still finds row)
    const receiptGet = await request.get(
      `${apiBaseUrl()}/api/receipts/${voidTarget!.rcId}`,
      { headers: financeHeaders },
    );
    expect(receiptGet.status()).toBe(200);
    expect(((await receiptGet.json()) as ReceiptRow).RC_STATUS).toBe(
      ReceiptStatus.VOIDED,
    );

    const finance = getTestUser('finance');
    await injectAuthSession(page, request, finance.email, finance.password);

    const voidPage = new ReceiptVoidRefundPage(page);
    await voidPage.goto();
    await voidPage.searchByRef1(voidTarget!.ref1);
    const row = await voidPage.expectRowContaining(voidTarget!.ref1);
    await voidPage.expectActionsNoneForRow(row);
  });
});
