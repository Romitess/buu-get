import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { apiLogin } from './fixtures/auth';
import { getTestUser } from './fixtures/users';
import { ScoreRubricManagementPage } from './pages/score-rubric-management.page';
import { CreateExamPage } from './pages/create-exam.page';

/**
 * E2E: Score rubrics — create/reuse + locked edit conflict
 * Matrix: RUB-E-001 (P0), RUB-E-002 (P1)
 */

type AuthHeaders = { Authorization: string };

type RubricItem = {
  id: number;
  nameTh: string;
  maxScore: number;
};

type RubricRow = {
  id: number;
  nameTh: string;
  nameEn: string;
  isDefault: boolean;
  items: RubricItem[];
};

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function apiBaseUrl(): string {
  return (
    process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3000'
  ).replace(/\/$/, '');
}

function hourMinute(slot: number): { start: string; end: string } {
  const startH = 10 + Math.floor(slot / 2);
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
  role: 'admin' | 'candidate',
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
  await page
    .waitForURL((url) => !url.hash.includes('/login'), { timeout: 60_000 })
    .catch(async () => {
      // Retry once if SPA stayed on login after token inject
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForURL((url) => !url.hash.includes('/login'), {
        timeout: 30_000,
      });
    });
}

test.describe('E2E: Score rubrics — CRUD UI + locked conflict', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });
  test.setTimeout(180_000);

  let adminHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;
  let candidateUserId: number;

  const rubricIds: number[] = [];
  const examIds: number[] = [];
  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const scoreIds: number[] = [];
  let sessionSlot = 0;

  let createdRubricName = '';
  let lockedRubricId: number | null = null;
  let lockedRubricName = '';

  test.beforeAll(async ({ request }) => {
    test.setTimeout(180_000);
    adminHeaders = await headersFor(request, 'admin');
    candidateHeaders = await headersFor(request, 'candidate');
    const me = await request.get(`${apiBaseUrl()}/api/auth/me`, {
      headers: candidateHeaders,
    });
    expect(me.status()).toBe(200);
    candidateUserId = ((await me.json()) as { id: number }).id;

    // Seed locked rubric (used by saved score) for RUB-E-002
    const suffix = uniqueSuffix();
    lockedRubricName = `RUB-E-LOCK ${suffix}`;
    const createRes = await request.post(`${apiBaseUrl()}/api/score-rubrics`, {
      headers: adminHeaders,
      data: {
        nameTh: lockedRubricName,
        nameEn: `RUB-E-LOCK EN ${suffix}`,
        items: [
          {
            nameTh: 'หมวดล็อก A',
            nameEn: 'Lock A',
            maxScore: 40,
            sortOrder: 1,
            code: 'LOCK_A',
          },
          {
            nameTh: 'หมวดล็อก B',
            nameEn: 'Lock B',
            maxScore: 60,
            sortOrder: 2,
            code: 'LOCK_B',
          },
        ],
      },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const locked = (await createRes.json()) as RubricRow;
    lockedRubricId = locked.id;
    rubricIds.push(locked.id);

    const examRes = await request.post(`${apiBaseUrl()}/api/exam`, {
      headers: adminHeaders,
      data: {
        EXAM_NAME: `RUB-E-LOCK exam ${suffix}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE: 500,
        EXAM_DATE: '2026-11-18',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-11-17T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-11-17T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: 'RL',
        EXAM_FISCAL_YEAR: '2026',
        FUND_SOURCE_ID: 1,
        SRB_ID: locked.id,
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
        SS_CAPACITY: 20,
        SS_SESSION_STATUS: 1,
      },
    });
    expect(ssRes.status(), await ssRes.text()).toBe(201);
    const sessionId = ((await ssRes.json()) as { SS_ID: number }).SS_ID;
    sessionIds.push(sessionId);

    const ermRes = await request.post(`${apiBaseUrl()}/api/exam-enrollments`, {
      headers: candidateHeaders,
      data: { USER_ID: candidateUserId, SESSION_ID: sessionId },
    });
    expect(ermRes.status(), await ermRes.text()).toBe(201);
    const ermId = ((await ermRes.json()) as { ERM_ID: number }).ERM_ID;
    enrollmentIds.push(ermId);

    const scoreRes = await request.post(`${apiBaseUrl()}/api/exam-scores`, {
      headers: adminHeaders,
      data: {
        ERM_ID: ermId,
        lines: locked.items.map((item) => ({
          SRBI_ID: item.id,
          score: Math.min(10, Number(item.maxScore)),
        })),
      },
    });
    expect(scoreRes.status(), await scoreRes.text()).toBe(201);
    scoreIds.push(((await scoreRes.json()) as { SCORES_ID: number }).SCORES_ID);
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(120_000);
    if (!adminHeaders) return;
    for (const scoreId of [...new Set(scoreIds)]) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-scores/${scoreId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const ermId of enrollmentIds) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-enrollments/${ermId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const ssId of sessionIds) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-sessions/${ssId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const examId of examIds) {
      await request
        .delete(`${apiBaseUrl()}/api/exam/${examId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const rubricId of rubricIds) {
      await request
        .delete(`${apiBaseUrl()}/api/score-rubrics/${rubricId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
  });

  // RUB-E-001
  test('RUB-E-001 Admin creates rubric and sees it in exam form', async ({
    page,
    request,
  }) => {
    const admin = getTestUser('admin');
    await injectAuthSession(page, request, admin.email, admin.password);

    const suffix = uniqueSuffix();
    createdRubricName = `RUB-E-UI ${suffix}`;

    const rubricPage = new ScoreRubricManagementPage(page);
    await rubricPage.goto();
    await rubricPage.openCreateDialog();
    await rubricPage.fillRubricForm({
      nameTh: createdRubricName,
      nameEn: `RUB-E-UI EN ${suffix}`,
      itemNameTh: 'หมวดทดสอบ',
      itemNameEn: 'Test Section',
      maxScore: 50,
    });
    // Ensure at least one item filled — form may start with empty default item
    await rubricPage.save(true);

    await rubricPage.search(createdRubricName);
    await rubricPage.expectRowContaining(createdRubricName);

    // Track created id for cleanup
    const listRes = await request.get(`${apiBaseUrl()}/api/score-rubrics`, {
      headers: adminHeaders,
    });
    if (listRes.ok()) {
      const list = (await listRes.json()) as RubricRow[];
      const created = list.find((r) => r.nameTh === createdRubricName);
      if (created) rubricIds.push(created.id);
    }

    const createExam = new CreateExamPage(page);
    await createExam.goto();
    await expect(createExam.rubricField).toBeVisible({ timeout: 20_000 });
    await createExam.expectRubricOptionVisible(createdRubricName);
  });

  // RUB-E-002
  test('RUB-E-002 Locked rubric edit shows conflict feedback', async ({
    page,
    request,
  }) => {
    test.skip(!lockedRubricId, 'Locked rubric seed missing');

    const admin = getTestUser('admin');
    await injectAuthSession(page, request, admin.email, admin.password);

    const rubricPage = new ScoreRubricManagementPage(page);
    await rubricPage.goto();
    await rubricPage.search(lockedRubricName);
    await rubricPage.openEditFor(lockedRubricName);
    await rubricPage.bumpFirstItemMaxScore(1);

    const status = await rubricPage.save(false);
    expect(status).toBe(409);
    await rubricPage.expectSaveErrorNotification();

    // Confirm items unchanged via API
    const getRes = await request.get(
      `${apiBaseUrl()}/api/score-rubrics/${lockedRubricId}`,
      { headers: adminHeaders },
    );
    expect(getRes.status()).toBe(200);
    const body = (await getRes.json()) as RubricRow;
    expect(body.items[0]?.maxScore).toBe(40);
  });
});
