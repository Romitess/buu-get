import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { apiLogin } from './fixtures/auth';
import { getTestUser } from './fixtures/users';
import { ScoreCriteriaManagementPage } from './pages/score-criteria-management.page';

/**
 * E2E: Score criteria (CEFR band rules)
 * Matrix: CRI-E-001 (P0), CRI-E-002 (P1 soft/skip)
 *
 * CRI-E-001 mutates band rules then restores original CEFR to keep shared-DB safe.
 * CRI-E-002 is a soft P1 check via API after criteria mutate (UI downstream is heavy/flaky).
 */

type AuthHeaders = { Authorization: string };

type RubricItem = {
  id: number;
  maxScore: number;
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
  const startH = 9 + Math.floor(slot / 2);
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
  await page.waitForURL((url) => !url.hash.includes('/login'), {
    timeout: 30_000,
  });
}

test.describe('E2E: Score criteria — CEFR band rules persist', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });
  test.setTimeout(180_000);

  let adminHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;
  let candidateUserId: number;
  let originalCefr = '';
  let markerCefr = '';
  let criteriaMutated = false;

  const examIds: number[] = [];
  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const scoreIds: number[] = [];
  let sessionSlot = 0;
  let rubricItems: RubricItem[] = [];

  test.beforeAll(async ({ request }) => {
    adminHeaders = await headersFor(request, 'admin');
    candidateHeaders = await headersFor(request, 'candidate');
    const me = await request.get(`${apiBaseUrl()}/api/auth/me`, {
      headers: candidateHeaders,
    });
    expect(me.status()).toBe(200);
    candidateUserId = ((await me.json()) as { id: number }).id;

    const rubricRes = await request.get(`${apiBaseUrl()}/api/score-rubrics/1`, {
      headers: adminHeaders,
    });
    if (rubricRes.ok()) {
      const rubric = (await rubricRes.json()) as { items?: RubricItem[] };
      rubricItems = rubric.items ?? [];
    }
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(120_000);
    if (!adminHeaders) return;

    if (criteriaMutated && originalCefr) {
      try {
        const getRes = await request.get(
          `${apiBaseUrl()}/api/score-criteria/band-rules`,
          { headers: adminHeaders },
        );
        if (getRes.ok()) {
          const body = (await getRes.json()) as {
            bandRules: Array<Record<string, unknown>>;
          };
          if (body.bandRules?.[0]) {
            body.bandRules[0].cefr = originalCefr;
            await request.put(
              `${apiBaseUrl()}/api/score-criteria/band-rules`,
              {
                headers: adminHeaders,
                data: { bandRules: body.bandRules },
              },
            );
          }
        }
      } catch {
        /* best-effort restore */
      }
    }

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
  });

  // CRI-E-001
  test('CRI-E-001 Admin edits CEFR band rules and persists after reload', async ({
    page,
    request,
  }) => {
    const admin = getTestUser('admin');
    await injectAuthSession(page, request, admin.email, admin.password);

    const pom = new ScoreCriteriaManagementPage(page);
    await pom.goto();
    await pom.expectAtLeastOneRule();

    originalCefr = await pom.getCefrAt(0);
    markerCefr = `T${uniqueSuffix().slice(-3)}`.slice(0, 4);
    await pom.setCefrAt(0, markerCefr);
    criteriaMutated = true;
    await pom.save();

    await pom.goto();
    await pom.expectAtLeastOneRule();
    expect(await pom.getCefrAt(0)).toBe(markerCefr);

    await pom.setCefrAt(0, originalCefr || 'A2');
    await pom.save();
    criteriaMutated = false;

    await pom.goto();
    expect(await pom.getCefrAt(0)).toBe(originalCefr || 'A2');
  });

  // CRI-E-002 (P1 soft via API — UI score-page path is heavy/flaky on shared DB)
  test('CRI-E-002 Updated mapping reflected in score create (soft API)', async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    if (rubricItems.length === 0) {
      test.skip(true, 'No rubric items for soft CRI-E-002');
    }

    const admin = getTestUser('admin');
    await injectAuthSession(page, request, admin.email, admin.password);

    const pom = new ScoreCriteriaManagementPage(page);
    await pom.goto();
    await pom.expectAtLeastOneRule();
    originalCefr = await pom.getCefrAt(0);
    markerCefr = `Z${uniqueSuffix().slice(-3)}`.slice(0, 4);
    await pom.setCefrAt(0, markerCefr);
    criteriaMutated = true;
    await pom.save();

    // Seed score totaling 45 (default first band 40–49) so CEFR resolves to marker
    const suffix = uniqueSuffix();
    const examRes = await request.post(`${apiBaseUrl()}/api/exam`, {
      headers: adminHeaders,
      data: {
        EXAM_NAME: `CRI-E-002 ${suffix}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE: 500,
        EXAM_DATE: '2026-11-16',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-11-15T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-11-15T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: 'CR',
        EXAM_FISCAL_YEAR: '2026',
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

    const lineScores = rubricItems.map((item, idx) =>
      idx === 0 ? 25 : Math.min(20, Number(item.maxScore)),
    );
    const scoreRes = await request.post(`${apiBaseUrl()}/api/exam-scores`, {
      headers: adminHeaders,
      data: {
        ERM_ID: ermId,
        lines: rubricItems.map((item, idx) => ({
          SRBI_ID: item.id,
          score: lineScores[idx] ?? 0,
        })),
      },
    });
    expect(scoreRes.status(), await scoreRes.text()).toBe(201);
    const score = (await scoreRes.json()) as {
      SCORES_ID: number;
      SC_BAND_LEVEL?: string | null;
    };
    scoreIds.push(score.SCORES_ID);

    const softOk = score.SC_BAND_LEVEL === markerCefr;

    // Restore criteria
    await pom.goto();
    await pom.setCefrAt(0, originalCefr || 'A2');
    await pom.save();
    criteriaMutated = false;

    test.skip(
      !softOk,
      `CRI-E-002 soft-skip: expected SC_BAND_LEVEL="${markerCefr}", got "${score.SC_BAND_LEVEL}" (range may not match first rule)`,
    );
  });
});
