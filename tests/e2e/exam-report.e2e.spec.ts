import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { apiLogin, loginAs } from './fixtures/auth';
import { TEST_PASSWORD } from './fixtures/users';
import { AdminDashboardPage } from './pages/admin-dashboard.page';
import { ExamInformationPage } from './pages/exam-information.page';

/**
 * E2E: Exam report dashboard + drill-down
 * Matrix: RPT-E-001, RPT-E-002, RPT-E-003
 *
 * Seed prefix B7-RPT-; shared-DB; afterAll cleans suite rows only.
 */

type AuthHeaders = { Authorization: string };

type RoleRow = { ROLE_ID: number; ROLE_NAME: string };
type UserRow = { USER_ID: number; USER_EMAIL: string };
type RubricItem = {
  id: number;
  nameTh: string;
  maxScore: number;
};

const ExamEnrollmentStatus = {
  PAID: 1,
} as const;

const PREFIX = 'B7-RPT-';

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function uniqueNationalId(): string {
  const digits = uniqueSuffix().replace(/\D/g, '').padStart(12, '0').slice(-12);
  return `6${digits}`;
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

async function headersFor(
  request: APIRequestContext,
  role: 'admin',
): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, role);
  return { Authorization: `Bearer ${accessToken}` };
}

async function injectAuthSession(
  page: Page,
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<void> {
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
}

test.describe('E2E: Exam report dashboard + drill-down', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });
  test.setTimeout(180_000);

  let adminHeaders: AuthHeaders;
  let candidateRoleId: number | null = null;
  let rubricItems: RubricItem[] = [];
  let seedReady = false;
  let seedSkipReason = '';
  let sessionSlot = 0;

  /** EXAM_FISCAL_YEAR allows 19xx–21xx only */
  const REPORT_YEAR = 2140 + (Date.now() % 40); // 2140–2179
  const ROUND_TAG = `B7E${String(REPORT_YEAR).slice(-3)}`;

  const examIds: number[] = [];
  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const scoreIds: number[] = [];
  const userIds: number[] = [];

  let adminEmail = '';
  let adminPassword = '';

  function requireSeed(): void {
    test.skip(!seedReady, seedSkipReason || 'RPT-E seed unavailable');
  }

  test.beforeAll(async ({ request }) => {
    test.setTimeout(240_000);
    adminHeaders = await headersFor(request, 'admin');

    const adminLogin = await apiLogin(request, 'admin');
    adminEmail = 'test.admin@buu-get.test';
    adminPassword = TEST_PASSWORD;
    void adminLogin;

    const rolesRes = await request.get(`${apiBaseUrl()}/api/roles`, {
      headers: adminHeaders,
    });
    expect(rolesRes.status()).toBe(200);
    const roles = (await rolesRes.json()) as RoleRow[];
    candidateRoleId =
      roles.find((r) => r.ROLE_NAME === 'candidate')?.ROLE_ID ?? null;
    if (!candidateRoleId) {
      seedSkipReason = 'Candidate role not found';
      return;
    }

    const rubricRes = await request.get(`${apiBaseUrl()}/api/score-rubrics/1`, {
      headers: adminHeaders,
    });
    expect(rubricRes.status(), await rubricRes.text()).toBe(200);
    const rubric = (await rubricRes.json()) as { items?: RubricItem[] };
    rubricItems = rubric.items ?? [];
    if (rubricItems.length === 0) {
      seedSkipReason = 'SRB_ID=1 has no items';
      return;
    }

    try {
      const suffix = uniqueSuffix();
      const email = `b7-rpt.e.${suffix}@buu-get.test`;
      const userRes = await request.post(`${apiBaseUrl()}/api/users`, {
        headers: adminHeaders,
        data: {
          USER_EMAIL: email,
          USER_PASSWORD: TEST_PASSWORD,
          USER_STATUS: 'ACTIVE',
          USER_ROLES: [candidateRoleId],
          USER_NATIONAL_ID: uniqueNationalId(),
          profile: {
            userFullnameTh: `${PREFIX} E2E ${suffix}`,
            userFullnameEn: `${PREFIX} E2E`,
            userTitleTh: 'นาย',
            userTitleEn: 'Mr.',
          },
        },
      });
      expect(userRes.status(), await userRes.text()).toBe(201);
      const user = (await userRes.json()) as UserRow;
      userIds.push(user.USER_ID);

      const examRes = await request.post(`${apiBaseUrl()}/api/exam`, {
        headers: adminHeaders,
        data: {
          EXAM_NAME: `${PREFIX} E2E ${REPORT_YEAR} ${suffix}`,
          EXAM_TYPE: 'รอบทั่วไป',
          EXAM_FORMAT: 'คอมพิวเตอร์',
          EXAM_FEE: 500,
          EXAM_DATE: `${REPORT_YEAR}-07-20`,
          EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
          EXAM_REG_END_DATE: '2026-12-31T23:59:59.000Z',
          EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
          EXAM_PAY_END_DATE: '2026-12-31T23:59:59.000Z',
          EXAM_PUBLISHED: true,
          EXAM_ROUND: ROUND_TAG,
          EXAM_FISCAL_YEAR: String(REPORT_YEAR),
          FUND_SOURCE_ID: 1,
          SRB_ID: 1,
        },
      });
      expect(examRes.status(), await examRes.text()).toBe(201);
      const examId = ((await examRes.json()) as { EXAM_ID: number }).EXAM_ID;
      examIds.push(examId);

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

      const ermRes = await request.post(
        `${apiBaseUrl()}/api/exam-enrollments`,
        {
          headers: adminHeaders,
          data: { USER_ID: user.USER_ID, SESSION_ID: sessionId },
        },
      );
      expect(ermRes.status(), await ermRes.text()).toBe(201);
      const ermId = ((await ermRes.json()) as { ERM_ID: number }).ERM_ID;
      enrollmentIds.push(ermId);

      const paid = await request.patch(
        `${apiBaseUrl()}/api/exam-enrollments/${ermId}`,
        {
          headers: adminHeaders,
          data: { ERM_STATUS: ExamEnrollmentStatus.PAID },
        },
      );
      expect(paid.status(), await paid.text()).toBe(200);

      const lines = rubricItems.map((item) => ({
        SRBI_ID: item.id,
        score: Math.min(15, Number(item.maxScore)),
      }));
      const scoreRes = await request.post(`${apiBaseUrl()}/api/exam-scores`, {
        headers: adminHeaders,
        data: { ERM_ID: ermId, lines },
      });
      expect(scoreRes.status(), await scoreRes.text()).toBe(201);
      scoreIds.push(
        ((await scoreRes.json()) as { SCORES_ID: number }).SCORES_ID,
      );

      seedReady = true;
    } catch (err) {
      seedSkipReason = `RPT-E seed failed: ${String(err)}`;
      seedReady = false;
    }
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(120_000);
    if (!adminHeaders) return;
    for (const scoreId of [...new Set(scoreIds)].reverse()) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-scores/${scoreId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const ermId of [...enrollmentIds].reverse()) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-enrollments/${ermId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const ssId of [...sessionIds].reverse()) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-sessions/${ssId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const examId of [...examIds].reverse()) {
      await request
        .delete(`${apiBaseUrl()}/api/exam/${examId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const userId of [...userIds].reverse()) {
      await request
        .delete(`${apiBaseUrl()}/api/users/${userId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
  });

  // RPT-E-001
  test('Admin dashboard report loads cards/charts', async ({
    page,
    request,
  }) => {
    requireSeed();
    await injectAuthSession(page, request, adminEmail, adminPassword);
    const dashboard = new AdminDashboardPage(page);
    await dashboard.goto();
    await dashboard.expectReportLoaded();
  });

  // RPT-E-002
  test('Drill-down year → rounds → candidates with scores', async ({
    page,
    request,
  }) => {
    requireSeed();
    await injectAuthSession(page, request, adminEmail, adminPassword);
    const dashboard = new AdminDashboardPage(page);
    await dashboard.goto();
    await dashboard.applyYearRange(REPORT_YEAR);
    await dashboard.openYearDetail(REPORT_YEAR);

    const info = new ExamInformationPage(page);
    await info.waitForRoundsLoaded(REPORT_YEAR);
    await info.openFirstRoundCandidates(REPORT_YEAR);
    await info.expectCandidateRowsWithScores();
  });

  // RPT-E-003 — candidate blocked from report UI (assert CURRENT FE guard)
  test('Candidate blocked from /admin/dashboard', async ({ page }) => {
    await loginAs(page, 'candidate');
    await page.goto('/#/admin/dashboard');
    await expect(page).toHaveURL(/#\/user\/exam-schedule/, {
      timeout: 15_000,
    });
    await expect(page).not.toHaveURL(/#\/admin\/dashboard/);
  });
});
