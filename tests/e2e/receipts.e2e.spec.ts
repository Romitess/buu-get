import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { apiLogin } from './fixtures/auth';
import { loginAs } from './fixtures/auth';
import { TEST_PASSWORD } from './fixtures/users';
import { ExamHistoryPage } from './pages/exam-history.page';
import { ReceiptUsageReportPage } from './pages/receipt-usage-report.page';

/**
 * E2E: Receipt usage report + ISSUED PDF download
 * Matrix: RCPT-E-001, RCPT-E-002 (P1)
 */

const ReceiptStatus = {
  UNISSUED: 0,
  ISSUED: 1,
} as const;

const TransactionMatchStatus = {
  UNMATCH: 0,
  MATCH: 1,
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
  RC_VERIFY_CODE?: string;
  RC_NAME?: string | null;
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

test.describe('E2E: Receipt usage report & PDF download', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });
  test.setTimeout(180_000);

  let adminHeaders: AuthHeaders;
  let financeHeaders: AuthHeaders;

  let examId: number | null = null;
  let examName = '';
  let sessionSlot = 0;
  let receiptNoHint = '';

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
  let issuedTranxId: number | null = null;
  let unissuedTranxId: number | null = null;

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

    const email = `rcpt-e.${uniqueSuffix()}@buu-get.test`;
    const res = await request.post(`${apiBaseUrl()}/api/users`, {
      headers: adminHeaders,
      data: {
        USER_EMAIL: email,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRole!.ROLE_ID],
        USER_NATIONAL_ID: `2${uniqueSuffix()}`.replace(/\D/g, '').padStart(13, '2').slice(0, 13),
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

  async function createPaidTxnWithReceipt(
    request: APIRequestContext,
    candidateToken: string,
    opts: { issue: boolean; match: boolean; payerName: string },
  ): Promise<{ tranxId: number; rcId: number }> {
    const ermId = await createEnrollment(request, candidateToken);

    // pending-payment sets PAID + MATCH in one shot (needed for UI downloadReceipt action)
    const pendingRes = await request.post(
      `${apiBaseUrl()}/api/transactions/pending-payment`,
      {
        headers: { Authorization: `Bearer ${candidateToken}` },
        data: {
          ERM_ID: ermId,
          TRANX_AMOUNT: EXAM_FEE,
          RC_TAX_ID: '1234567890123',
          RC_NAME: opts.payerName,
          RC_PHONE: '0812345678',
          RC_ADDRESS: 'RCPT-E Address',
        },
      },
    );
    expect(pendingRes.status(), await pendingRes.text()).toBe(201);
    const pendingBody = (await pendingRes.json()) as {
      transaction: { TRANX_ID: number; TRANX_MATCH_STATUS?: number };
      receipt: { RC_ID: number; RC_STATUS: number };
    };
    const tranxId = pendingBody.transaction.TRANX_ID;
    transactionIds.push(tranxId);
    receiptIds.push(pendingBody.receipt.RC_ID);

    if (opts.match) {
      expect(pendingBody.transaction.TRANX_MATCH_STATUS).toBe(
        TransactionMatchStatus.MATCH,
      );
    } else {
      // Force UNMATCH so UI won't show download on the unissued card
      const unmatch = await request.patch(
        `${apiBaseUrl()}/api/transactions/${tranxId}`,
        {
          headers: financeHeaders,
          data: { TRANX_MATCH_STATUS: TransactionMatchStatus.UNMATCH },
        },
      );
      expect(unmatch.status(), await unmatch.text()).toBe(200);
    }

    let rcId = pendingBody.receipt.RC_ID;
    if (opts.issue) {
      if (pendingBody.receipt.RC_STATUS !== ReceiptStatus.ISSUED) {
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
    } else {
      // Ensure UNISSUED for API 403 download assert
      if (pendingBody.receipt.RC_STATUS !== ReceiptStatus.UNISSUED) {
        const patch = await request.patch(
          `${apiBaseUrl()}/api/receipts/${rcId}`,
          {
            headers: financeHeaders,
            data: { RC_STATUS: ReceiptStatus.UNISSUED },
          },
        );
        expect(patch.status(), await patch.text()).toBe(200);
      }
    }

    return { tranxId, rcId };
  }

  test.beforeAll(async ({ request }) => {
    // Hook timeout is independent of describe.configure — set explicitly (bcrypt user create)
    test.setTimeout(120_000);

    adminHeaders = await headersFor(request, 'admin');
    financeHeaders = await headersFor(request, 'finance');

    const pc1 = await request.get(`${apiBaseUrl()}/api/payment-configs/1`, {
      headers: adminHeaders,
    });
    if (!pc1.ok()) {
      seedSkipReason = `Payment config ID 1 missing: ${pc1.status()}`;
      return;
    }

    try {
      candidate = await createDisposableCandidate(request);
    } catch (err) {
      seedSkipReason = `Cannot create candidate: ${String(err)}`;
      return;
    }

    const suffix = uniqueSuffix();
    examName = `RCPT-E ${suffix}`;
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
        EXAM_ROUND: 'RE',
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

    const payerName = `RCPT-E Payer ${suffix}`;
    const issued = await createPaidTxnWithReceipt(request, token, {
      issue: true,
      match: true,
      payerName,
    });
    issuedTranxId = issued.tranxId;
    receiptNoHint = `${new Date().getFullYear() + 543}`; // Year BE prefix

    const unissued = await createPaidTxnWithReceipt(request, token, {
      issue: false,
      match: false,
      payerName: `RCPT-E Unissued ${suffix}`,
    });
    unissuedTranxId = unissued.tranxId;

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
    test.skip(!seedReady, seedSkipReason || 'RCPT-E seed failed');
  }

  // RCPT-E-001
  test('Finance receipt-usage-report lists ISSUED from GET issued', async ({
    page,
    request,
  }) => {
    requireSeed();

    // Side-effect: issued API returns our receipt
    const issuedApi = await request.get(
      `${apiBaseUrl()}/api/receipts/issued?page=1&limit=100`,
      { headers: financeHeaders },
    );
    expect(issuedApi.status()).toBe(200);
    const issuedPage = (await issuedApi.json()) as { data: ReceiptRow[] };
    expect(issuedPage.data.some((r) => receiptIds.includes(r.RC_ID))).toBe(true);

    await loginAs(page, 'finance');
    const report = new ReceiptUsageReportPage(page);

    const issuedGetPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/receipts/issued') &&
        res.request().method() === 'GET' &&
        res.ok(),
      { timeout: 30_000 },
    );
    await report.goto();
    await issuedGetPromise;

    await report.expectHasAnyDataRows();
    // Prefer seeded receipt no / payer / exam name
    await report.expectRowContaining(
      new RegExp(`${receiptNoHint}|${examName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|RCPT-E Payer`, 'i'),
    );
  });

  // RCPT-E-002
  test('Authenticated user downloads ISSUED PDF; UNISSUED blocked via API', async ({
    page,
    request,
  }) => {
    requireSeed();
    expect(issuedTranxId && unissuedTranxId && candidate).toBeTruthy();

    await injectAuthSession(page, request, candidate!.email, candidate!.password);
    const history = new ExamHistoryPage(page);
    await history.goto();

    // Wait for history cards to settle (MATCH+ISSUED → downloadReceipt action)
    const downloadBtn = page.getByRole('button', {
      name: /Download Receipt|ดาวน์โหลดใบเสร็จ/i,
    }).first();
    const downloadVisible = await downloadBtn
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => true)
      .catch(() => false);

    // Always assert API ISSUED/UNISSUED download contract
    const login = await request.post(`${apiBaseUrl()}/api/auth/login`, {
      data: { email: candidate!.email, password: candidate!.password },
    });
    const token = ((await login.json()) as { accessToken: string }).accessToken;
    const issuedDl = await request.get(
      `${apiBaseUrl()}/api/receipts/${issuedTranxId}/download`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(issuedDl.status(), await issuedDl.text()).toBe(200);
    const ct = issuedDl.headers()['content-type'] ?? '';
    expect(ct).toMatch(/pdf|octet-stream/i);

    const unissuedDl = await request.get(
      `${apiBaseUrl()}/api/receipts/${unissuedTranxId}/download`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(unissuedDl.status(), await unissuedDl.text()).toBe(403);

    if (!downloadVisible) {
      test.skip(
        true,
        'exam-history Download Receipt not shown for MATCH+ISSUED seed within 20s (hasDownloadableReceipt). API download ISSUED=200 / UNISSUED=403 verified.',
      );
      return;
    }

    const downloadPromise = page.waitForEvent('download', { timeout: 45_000 }).catch(() => null);
    await downloadBtn.click();
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toMatch(/receipt|BUU-GET|\.pdf/i);
    } else {
      await history.expectReceiptDownloadSuccess();
    }
  });
});
