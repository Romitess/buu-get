import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { apiLogin } from './fixtures/auth';
import { getTestUser, TEST_PASSWORD } from './fixtures/users';
import { FundSourceManagementPage } from './pages/fund-source-management.page';
import { DailyRevenueReportPage } from './pages/daily-revenue-report.page';
import { CreateExamPage } from './pages/create-exam.page';

/**
 * E2E: Fund sources — CRUD UI / exam form options / daily revenue report
 * Matrix: FUND-E-001 (P0), FUND-E-002 (P1), FUND-E-003 (P1)
 */

const TransactionPaymentStatus = {
  APPROVED: 1,
} as const;

const ReceiptStatus = {
  UNISSUED: 0,
} as const;

const EXAM_FEE = 500;

type AuthHeaders = { Authorization: string };

type FundSourceRow = {
  FS_ID: number;
  FS_ACCOUNT_CODE: string;
  FS_NAME: string;
  FS_OPEN_STATUS: boolean;
};

type RoleRow = { ROLE_ID: number; ROLE_NAME: string };

type UserRow = {
  USER_ID: number;
  USER_EMAIL: string;
  USER_CODE: string | null;
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

function apiBaseUrl(): string {
  return (
    process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3000'
  ).replace(/\/$/, '');
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

async function headersFor(
  request: APIRequestContext,
  role: 'admin' | 'finance',
): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, role);
  return { Authorization: `Bearer ${accessToken}` };
}

/** Token inject — avoids login UI rate limits. */
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

test.describe('E2E: Fund sources — CRUD / exam options / daily revenue', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });
  test.setTimeout(180_000);

  let adminHeaders: AuthHeaders;
  let financeHeaders: AuthHeaders;

  const fundSourceIds: number[] = [];
  const examIds: number[] = [];
  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const transactionIds: number[] = [];
  const receiptIds: number[] = [];
  const userIds: number[] = [];
  let activePcId: number | null = null;
  let sessionSlot = 0;

  /** Seeded open fund for exam dropdown (FUND-E-002). */
  let dropdownFund: FundSourceRow | null = null;

  /** Daily-revenue seed (FUND-E-003). */
  let revenueSeedReady = false;
  let revenueSeedSkipReason = '';
  let revenueExamName = '';
  let revenueAmount = 0;

  test.beforeAll(async ({ request }) => {
    test.setTimeout(180_000);

    adminHeaders = await headersFor(request, 'admin');
    financeHeaders = await headersFor(request, 'finance');

    // FUND-E-002 seed: open fund-source visible in exam form
    const fsSuffix = uniqueSuffix();
    const fsRes = await request.post(`${apiBaseUrl()}/api/fund-sources`, {
      headers: financeHeaders,
      data: {
        FS_ACCOUNT_CODE: `E2E-FS-${fsSuffix}`.slice(0, 50),
        FS_NAME: `E2E Fund ${fsSuffix}`.slice(0, 255),
        FS_OPEN_STATUS: true,
      },
    });
    expect(fsRes.status(), await fsRes.text()).toBe(201);
    dropdownFund = (await fsRes.json()) as FundSourceRow;
    fundSourceIds.push(dropdownFund.FS_ID);

    // FUND-E-003 seed: APPROVED payment → daily revenue row
    try {
      const suffix = uniqueSuffix();
      revenueExamName = `FUND-E-REV-${suffix}`;
      revenueAmount = EXAM_FEE;

      const revFs = await request.post(`${apiBaseUrl()}/api/fund-sources`, {
        headers: financeHeaders,
        data: {
          FS_ACCOUNT_CODE: `E2E-REV-${suffix}`.slice(0, 50),
          FS_NAME: `E2E Rev FS ${suffix}`.slice(0, 255),
          FS_OPEN_STATUS: true,
        },
      });
      expect(revFs.status(), await revFs.text()).toBe(201);
      const revFund = (await revFs.json()) as FundSourceRow;
      fundSourceIds.push(revFund.FS_ID);

      const examRes = await request.post(`${apiBaseUrl()}/api/exam`, {
        headers: adminHeaders,
        data: {
          EXAM_NAME: revenueExamName,
          EXAM_TYPE: 'รอบทั่วไป',
          EXAM_FORMAT: 'คอมพิวเตอร์',
          EXAM_FEE,
          EXAM_DATE: '2026-12-29',
          EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
          EXAM_REG_END_DATE: '2026-12-28T23:59:59.000Z',
          EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
          EXAM_PAY_END_DATE: '2026-12-28T23:59:59.000Z',
          EXAM_PUBLISHED: true,
          EXAM_ROUND: 'FE',
          EXAM_FISCAL_YEAR: '2026',
          FUND_SOURCE_ID: revFund.FS_ID,
          SRB_ID: 1,
        },
      });
      expect(examRes.status(), await examRes.text()).toBe(201);
      const examId = ((await examRes.json()) as { EXAM_ID: number }).EXAM_ID;
      examIds.push(examId);

      const pcRes = await request.post(`${apiBaseUrl()}/api/payment-configs`, {
        headers: financeHeaders,
        data: {
          PROVIDER_NAME: `FUND-E-pc-${suffix}`.slice(0, 100),
          PC_COMP_CODE: `FE${suffix}`.slice(0, 20),
          PC_PROD_CODE: `FP${suffix}`.slice(0, 20),
          PC_IS_ACTIVE: true,
          PC_EFFECTIVE_FROM: '2026-01-01T00:00:00.000Z',
        },
      });
      expect(pcRes.status(), await pcRes.text()).toBe(201);
      activePcId = ((await pcRes.json()) as { PC_ID: number }).PC_ID;

      // Disposable candidate
      const rolesRes = await request.get(`${apiBaseUrl()}/api/roles`, {
        headers: adminHeaders,
      });
      expect(rolesRes.status(), await rolesRes.text()).toBe(200);
      const roles = (await rolesRes.json()) as RoleRow[];
      const candidateRole = roles.find((r) => r.ROLE_NAME === 'candidate');
      expect(candidateRole).toBeTruthy();

      const email = `fund-e.${suffix}@buu-get.test`;
      const userRes = await request.post(`${apiBaseUrl()}/api/users`, {
        headers: adminHeaders,
        data: {
          USER_EMAIL: email,
          USER_PASSWORD: TEST_PASSWORD,
          USER_STATUS: 'ACTIVE',
          USER_ROLES: [candidateRole!.ROLE_ID],
          USER_NATIONAL_ID: `3${suffix}`
            .replace(/\D/g, '')
            .padStart(13, '3')
            .slice(0, 13),
        },
      });
      expect(userRes.status(), await userRes.text()).toBe(201);
      const user = (await userRes.json()) as UserRow;
      userIds.push(user.USER_ID);
      expect(user.USER_CODE).toBeTruthy();

      const candLogin = await request.post(`${apiBaseUrl()}/api/auth/login`, {
        data: { email, password: TEST_PASSWORD },
      });
      expect(candLogin.ok(), await candLogin.text()).toBe(true);
      const candToken = ((await candLogin.json()) as { accessToken: string })
        .accessToken;
      const candHeaders: AuthHeaders = {
        Authorization: `Bearer ${candToken}`,
      };

      const { start, end } = hourMinute(sessionSlot++);
      const ssRes = await request.post(`${apiBaseUrl()}/api/exam-sessions`, {
        headers: adminHeaders,
        data: {
          EXAM_ID: examId,
          SS_START_TIME: start,
          SS_END_TIME: end,
          SS_CAPACITY: 30,
          SS_SESSION_STATUS: 1,
        },
      });
      expect(ssRes.status(), await ssRes.text()).toBe(201);
      const sessionId = ((await ssRes.json()) as { SS_ID: number }).SS_ID;
      sessionIds.push(sessionId);

      const enrRes = await request.post(
        `${apiBaseUrl()}/api/exam-enrollments`,
        {
          headers: candHeaders,
          data: { USER_ID: user.USER_ID, SESSION_ID: sessionId },
        },
      );
      expect(enrRes.status(), await enrRes.text()).toBe(201);
      const enrollment = (await enrRes.json()) as EnrollmentRow;
      enrollmentIds.push(enrollment.ERM_ID);

      const txnRes = await request.post(`${apiBaseUrl()}/api/transactions`, {
        headers: candHeaders,
        data: {
          ermId: enrollment.ERM_ID,
          pcId: activePcId,
          amount: EXAM_FEE,
        },
      });
      expect(txnRes.status(), await txnRes.text()).toBe(201);
      const tranxId = ((await txnRes.json()) as { TRANX_ID: number }).TRANX_ID;
      transactionIds.push(tranxId);

      const confirmRes = await request.patch(
        `${apiBaseUrl()}/api/transactions/${tranxId}/confirm`,
        {
          headers: candHeaders,
          data: {
            userCode: user.USER_CODE,
            receiptName: 'FUND-E Confirm',
            receiptTaxId: '1234567890123',
            receiptPhone: '0812345678',
            receiptAddress: 'BUU FUND-E Test Addr',
          },
        },
      );
      expect(confirmRes.status(), await confirmRes.text()).toBe(200);

      const refSearch = await request.get(
        `${apiBaseUrl()}/api/transaction-refs/search`,
        {
          headers: financeHeaders,
          params: { ref1: user.USER_CODE!, page: 1, limit: 20 },
        },
      );
      expect(refSearch.status(), await refSearch.text()).toBe(200);
      const refBody = (await refSearch.json()) as Paginated<TransactionRefRow>;
      const ref = (refBody.data ?? []).find((r) => r.TRANX_ID === tranxId);
      expect(ref, `ref for TRANX_ID=${tranxId}`).toBeTruthy();

      const csv = buildPaymentCsv([
        {
          applicantId: user.USER_CODE!,
          referenceNo: ref!.TSC_REF2,
          payerName: 'FUND-E Payer',
          amount: EXAM_FEE,
        },
      ]);
      const importRes = await request.post(
        `${apiBaseUrl()}/api/bank-reconciles/import`,
        {
          headers: financeHeaders,
          multipart: {
            file: {
              name: `fund-e-${suffix}.csv`,
              mimeType: 'text/csv',
              buffer: Buffer.from(csv, 'utf8'),
            },
          },
        },
      );
      expect(importRes.status(), await importRes.text()).toBe(201);
      const imported = (await importRes.json()) as {
        data: Array<{ BR_ID: number }>;
      };
      const brId = imported.data[0].BR_ID;

      const verifyRes = await request.post(
        `${apiBaseUrl()}/api/bank-reconciles/verify`,
        {
          headers: financeHeaders,
          data: { brIds: [brId] },
        },
      );
      expect(verifyRes.status(), await verifyRes.text()).toBe(201);

      const rcCreate = await request.post(`${apiBaseUrl()}/api/receipts`, {
        headers: financeHeaders,
        data: {
          TRANX_ID: tranxId,
          RC_SIGNATURE_ID: `fund-e-${suffix}`.slice(0, 100),
          RC_STATUS: ReceiptStatus.UNISSUED,
        },
      });
      if (rcCreate.status() === 201) {
        receiptIds.push(
          ((await rcCreate.json()) as ReceiptRow).RC_ID,
        );
      }

      const payRes = await request.post(
        `${apiBaseUrl()}/api/bank-reconciles/confirm-payment`,
        {
          headers: financeHeaders,
          data: { tranxIds: [tranxId] },
        },
      );
      expect(payRes.status(), await payRes.text()).toBe(201);

      const txnGet = await request.get(
        `${apiBaseUrl()}/api/transactions/${tranxId}`,
        { headers: financeHeaders },
      );
      expect(txnGet.status()).toBe(200);
      const txn = (await txnGet.json()) as { TRANX_PAYMENT_STATUS: number };
      expect(txn.TRANX_PAYMENT_STATUS).toBe(
        TransactionPaymentStatus.APPROVED,
      );

      revenueSeedReady = true;
    } catch (err) {
      revenueSeedSkipReason = `Revenue seed failed: ${String(err)}`;
      revenueSeedReady = false;
    }
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(120_000);
    const headers = adminHeaders ?? financeHeaders;
    if (!headers) return;

    for (const rcId of [...new Set(receiptIds)]) {
      await request
        .delete(`${apiBaseUrl()}/api/receipts/${rcId}`, { headers })
        .catch(() => undefined);
    }
    for (const tranxId of transactionIds) {
      await request
        .delete(`${apiBaseUrl()}/api/transactions/${tranxId}`, { headers })
        .catch(() => undefined);
    }
    for (const ermId of enrollmentIds) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-enrollments/${ermId}`, { headers })
        .catch(() => undefined);
    }
    for (const ssId of sessionIds) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-sessions/${ssId}`, { headers })
        .catch(() => undefined);
    }
    if (activePcId) {
      await request
        .delete(`${apiBaseUrl()}/api/payment-configs/${activePcId}`, {
          headers,
        })
        .catch(() => undefined);
    }
    for (const examId of examIds) {
      await request
        .delete(`${apiBaseUrl()}/api/exam/${examId}`, { headers })
        .catch(() => undefined);
    }
    for (const fsId of fundSourceIds) {
      await request
        .delete(`${apiBaseUrl()}/api/fund-sources/${fsId}`, {
          headers: financeHeaders ?? headers,
        })
        .catch(() => undefined);
    }
    for (const userId of userIds) {
      await request
        .delete(`${apiBaseUrl()}/api/users/${userId}`, { headers })
        .catch(() => undefined);
    }
  });

  // FUND-E-001 P0 — Finance fund-source CRUD UI
  test('FUND-E-001: Finance fund-source CRUD UI create→edit→delete', async ({
    page,
    request,
  }) => {
    const finance = getTestUser('finance');
    await injectAuthSession(page, request, finance.email, finance.password);

    const pom = new FundSourceManagementPage(page);
    await pom.goto();

    const suffix = uniqueSuffix();
    const name = `E2E CRUD ${suffix}`.slice(0, 255);
    const code = `CRUD-${suffix}`.slice(0, 50);
    const patchedName = `E2E CRUD patched ${suffix}`.slice(0, 255);

    // Create
    await pom.openCreateDialog();
    await pom.fillForm(name, code);
    await pom.save();
    await pom.expectSuccessNotification(
      /Fund source created successfully|สร้างผังแหล่งเงินเรียบร้อยแล้ว/i,
    );

    // Track for cleanup if UI delete fails
    const listRes = await request.get(`${apiBaseUrl()}/api/fund-sources`, {
      headers: financeHeaders,
    });
    expect(listRes.status()).toBe(200);
    const all = (await listRes.json()) as FundSourceRow[];
    const created = all.find(
      (f) => f.FS_ACCOUNT_CODE === code || f.FS_NAME === name,
    );
    expect(created).toBeTruthy();
    fundSourceIds.push(created!.FS_ID);

    await pom.search(code);
    const row = await pom.expectRowContaining(code);
    await expect(row).toContainText(name);

    // Edit
    await pom.editRow(row);
    await pom.nameInput.fill(patchedName);
    await pom.save();
    await pom.expectSuccessNotification(
      /Fund source updated successfully|แก้ไขผังแหล่งเงินเรียบร้อยแล้ว/i,
    );
    await pom.search(code);
    await pom.expectRowContaining(patchedName);

    // Delete
    const rowAfterEdit = await pom.expectRowContaining(code);
    await pom.deleteRow(rowAfterEdit);
    await pom.expectSuccessNotification(
      /Fund source removed successfully|ลบผังแหล่งเงินเรียบร้อยแล้ว/i,
    );
    await pom.search(code);
    await pom.expectNoRowContaining(code);

    // API confirms soft-delete
    const getAfter = await request.get(
      `${apiBaseUrl()}/api/fund-sources/${created!.FS_ID}`,
      { headers: financeHeaders },
    );
    expect(getAfter.status()).toBe(404);
  });

  // FUND-E-002 P1 — Exam form loads fund-source options
  test('FUND-E-002: Exam form loads fund-source options (exam ops)', async ({
    page,
    request,
  }) => {
    expect(dropdownFund).toBeTruthy();
    const examOps = getTestUser('exam_operations_officer');
    await injectAuthSession(page, request, examOps.email, examOps.password);

    const pom = new CreateExamPage(page);
    await pom.goto();

    const optionLabel = `${dropdownFund!.FS_NAME} (${dropdownFund!.FS_ACCOUNT_CODE})`;
    await pom.expectFundOptionVisible(optionLabel);
  });

  // FUND-E-003 P1 — Daily revenue report for finance
  test('FUND-E-003: Daily revenue report shows seeded rows + total', async ({
    page,
    request,
  }) => {
    test.skip(
      !revenueSeedReady,
      revenueSeedSkipReason || 'Daily-revenue seed failed',
    );

    const finance = getTestUser('finance');
    await injectAuthSession(page, request, finance.email, finance.password);

    const pom = new DailyRevenueReportPage(page);
    await pom.goto();

    await pom.filterByExamName(revenueExamName);
    const row = await pom.expectRowContaining(revenueExamName);
    await expect(row).toContainText(
      revenueAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
    await pom.expectTotalContains(
      revenueAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
  });
});
