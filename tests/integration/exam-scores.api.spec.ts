import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import type { TestRoleKey } from '../e2e/fixtures/users';

/**
 * Exam Scores API integration — matrix SCR-I-001 … SCR-I-007
 *
 * Seed approach (shared-DB, disposable via API):
 * 1. Login ENROLLMENT_ADMIN + forbidden roles
 * 2. Resolve default rubric items (SRB_ID=1) or skip if empty
 * 3. Create disposable exam/session/enrollment per flow as needed
 * 4. afterAll soft-deletes scores → enrollments → sessions → exams
 */

type AuthHeaders = { Authorization: string };

type RubricItem = {
  id: number;
  nameTh: string;
  maxScore: number;
  sortOrder: number;
};

type ScoreLine = {
  SCL_ID?: number;
  SRBI_ID: number | null;
  SCL_SCORE: number | string | null;
  SCL_MAX_SCORE?: number | string;
};

type ExamScoreRow = {
  SCORES_ID: number;
  ERM_ID: number;
  SC_TOTAL_SCORE?: number | string | null;
  SC_BAND_LEVEL?: string | null;
  LINES?: ScoreLine[];
  DELETED_AT?: string | null;
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

async function headersFor(
  request: APIRequestContext,
  role: TestRoleKey,
): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, role);
  return { Authorization: `Bearer ${accessToken}` };
}

function linesAt(
  items: RubricItem[],
  scoreFn: (item: RubricItem, index: number) => number,
): Array<{ SRBI_ID: number; score: number }> {
  return items.map((item, index) => ({
    SRBI_ID: item.id,
    score: scoreFn(item, index),
  }));
}

test.describe('Exam Scores API — create / upsert / authz / soft-delete', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120_000);

  let adminHeaders: AuthHeaders;
  let staffHeaders: AuthHeaders;
  let registrationHeaders: AuthHeaders;
  let examOpsHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;
  let financeHeaders: AuthHeaders;
  let proctorHeaders: AuthHeaders;
  let executiveHeaders: AuthHeaders;

  let candidateUserId: number;
  let rubricItems: RubricItem[] = [];
  let seedReady = false;
  let seedSkipReason = '';

  const examIds: number[] = [];
  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const scoreIds: number[] = [];
  let sessionSlot = 0;

  function requireSeed(): void {
    test.skip(!seedReady, seedSkipReason || 'Score seed unavailable');
  }

  async function createExam(
    request: APIRequestContext,
    suffix: string,
    srbId = 1,
  ): Promise<number> {
    const res = await request.post('/api/exam', {
      headers: adminHeaders,
      data: {
        EXAM_NAME: `SCR-I ${suffix}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE: 500,
        EXAM_DATE: '2026-12-20',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-19T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-19T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: 'SCR',
        EXAM_FISCAL_YEAR: '2026',
        FUND_SOURCE_ID: 1,
        SRB_ID: srbId,
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { EXAM_ID: number };
    examIds.push(body.EXAM_ID);
    return body.EXAM_ID;
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
    sessionId: number,
  ): Promise<number> {
    const res = await request.post('/api/exam-enrollments', {
      headers: candidateHeaders,
      data: { USER_ID: candidateUserId, SESSION_ID: sessionId },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { ERM_ID: number };
    enrollmentIds.push(body.ERM_ID);
    return body.ERM_ID;
  }

  async function seedEnrollment(request: APIRequestContext): Promise<number> {
    const examId = await createExam(request, uniqueSuffix());
    const sessionId = await createSession(request, examId);
    return createEnrollment(request, sessionId);
  }

  async function createScore(
    request: APIRequestContext,
    headers: AuthHeaders,
    ermId: number,
    lines: Array<{ SRBI_ID: number; score: number }>,
  ): Promise<ExamScoreRow> {
    const res = await request.post('/api/exam-scores', {
      headers,
      data: { ERM_ID: ermId, lines },
    });
    const text = await res.text();
    expect(res.status(), text).toBe(201);
    const body = JSON.parse(text) as ExamScoreRow;
    scoreIds.push(body.SCORES_ID);
    return body;
  }

  test.beforeAll(async ({ request }) => {
    test.setTimeout(180_000);

    adminHeaders = await headersFor(request, 'admin');
    staffHeaders = await headersFor(request, 'staff');
    registrationHeaders = await headersFor(request, 'registration_officer');
    examOpsHeaders = await headersFor(request, 'exam_operations_officer');
    candidateHeaders = await headersFor(request, 'candidate');
    financeHeaders = await headersFor(request, 'finance');
    proctorHeaders = await headersFor(request, 'proctor');
    executiveHeaders = await headersFor(request, 'executive');

    const me = await request.get('/api/auth/me', { headers: candidateHeaders });
    expect(me.status()).toBe(200);
    candidateUserId = ((await me.json()) as { id: number }).id;

    const rubricRes = await request.get('/api/score-rubrics/1', {
      headers: adminHeaders,
    });
    expect(rubricRes.status(), await rubricRes.text()).toBe(200);
    const rubric = (await rubricRes.json()) as { items?: RubricItem[] };
    rubricItems = rubric.items ?? [];
    if (rubricItems.length === 0) {
      seedReady = false;
      seedSkipReason =
        'SRB_ID=1 has no rubric items; cannot exercise score line validation';
      return;
    }
    seedReady = true;
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(120_000);
    for (const scoreId of [...new Set(scoreIds)]) {
      await request
        .delete(`/api/exam-scores/${scoreId}`, { headers: adminHeaders })
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
    for (const examId of examIds) {
      await request
        .delete(`/api/exam/${examId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
  });

  // SCR-I-001
  test('POST /api/exam-scores happy path → 201 + lines/band', async ({
    request,
  }) => {
    requireSeed();
    const ermId = await seedEnrollment(request);
    const lines = linesAt(rubricItems, (item) =>
      Math.min(10, Number(item.maxScore)),
    );
    const expectedTotal = lines.reduce((sum, line) => sum + line.score, 0);

    const body = await createScore(request, adminHeaders, ermId, lines);
    expect(body.SCORES_ID).toEqual(expect.any(Number));
    expect(body.ERM_ID).toBe(ermId);
    expect(Number(body.SC_TOTAL_SCORE)).toBe(expectedTotal);
    expect(Array.isArray(body.LINES)).toBe(true);
    expect(body.LINES!.length).toBe(rubricItems.length);

    const getRes = await request.get(`/api/exam-scores/${body.SCORES_ID}`, {
      headers: adminHeaders,
    });
    expect(getRes.status(), await getRes.text()).toBe(200);
    const fetched = (await getRes.json()) as ExamScoreRow;
    expect(fetched.SCORES_ID).toBe(body.SCORES_ID);
    expect(Number(fetched.SC_TOTAL_SCORE)).toBe(expectedTotal);
    // Band may be null if total falls outside active criteria ranges
    expect(
      fetched.SC_BAND_LEVEL === null ||
        typeof fetched.SC_BAND_LEVEL === 'string',
    ).toBe(true);
  });

  // SCR-I-002
  test('POST rejects invalid line composition → 400', async ({ request }) => {
    requireSeed();
    const ermId = await seedEnrollment(request);
    const valid = linesAt(rubricItems, () => 5);

    const cases: Array<{ label: string; lines: unknown }> = [
      {
        label: 'duplicate SRBI_ID',
        lines: [
          { SRBI_ID: rubricItems[0].id, score: 5 },
          { SRBI_ID: rubricItems[0].id, score: 6 },
          ...valid.slice(1),
        ],
      },
      {
        label: 'missing required item',
        lines: valid.slice(0, Math.max(1, valid.length - 1)),
      },
      {
        label: 'foreign SRBI_ID',
        lines: [
          ...valid.slice(0, -1),
          { SRBI_ID: 2_147_483_640, score: 5 },
        ],
      },
    ];

    for (const c of cases) {
      const res = await request.post('/api/exam-scores', {
        headers: adminHeaders,
        data: { ERM_ID: ermId, lines: c.lines },
      });
      expect(res.status(), `${c.label} → ${await res.text()}`).toBe(400);
    }
  });

  // SCR-I-003
  test('POST rejects out-of-range scores → 400', async ({ request }) => {
    requireSeed();
    const ermId = await seedEnrollment(request);

    const negative = linesAt(rubricItems, () => -1);
    const overMax = linesAt(
      rubricItems,
      (item) => Number(item.maxScore) + 1,
    );

    for (const [label, lines] of [
      ['negative', negative],
      ['over-max', overMax],
    ] as const) {
      const res = await request.post('/api/exam-scores', {
        headers: adminHeaders,
        data: { ERM_ID: ermId, lines },
      });
      expect(res.status(), `${label} → ${await res.text()}`).toBe(400);
    }
  });

  // SCR-I-004
  test('POST upsert keeps single logical score per enrollment', async ({
    request,
  }) => {
    requireSeed();
    const ermId = await seedEnrollment(request);
    const firstLines = linesAt(rubricItems, () => 8);
    const first = await createScore(request, adminHeaders, ermId, firstLines);

    const secondLines = linesAt(rubricItems, (item, i) =>
      Math.min(12 + i, Number(item.maxScore)),
    );
    const expectedTotal = secondLines.reduce((s, l) => s + l.score, 0);

    const res = await request.post('/api/exam-scores', {
      headers: adminHeaders,
      data: { ERM_ID: ermId, lines: secondLines },
    });
    expect(res.status(), await res.text()).toBe(201);
    const second = (await res.json()) as ExamScoreRow;
    scoreIds.push(second.SCORES_ID);

    expect(second.SCORES_ID).toBe(first.SCORES_ID);
    expect(second.ERM_ID).toBe(ermId);
    expect(Number(second.SC_TOTAL_SCORE)).toBe(expectedTotal);
    expect(second.LINES?.length).toBe(rubricItems.length);

    for (const line of second.LINES ?? []) {
      const expected = secondLines.find((l) => l.SRBI_ID === line.SRBI_ID);
      expect(expected).toBeTruthy();
      expect(Number(line.SCL_SCORE)).toBe(expected!.score);
    }
  });

  // SCR-I-005
  test('PATCH with lines rewrites and recalculates', async ({ request }) => {
    requireSeed();
    const ermId = await seedEnrollment(request);
    const created = await createScore(
      request,
      adminHeaders,
      ermId,
      linesAt(rubricItems, () => 7),
    );

    const patchLines = linesAt(rubricItems, (item, i) =>
      Math.min(15 + i * 2, Number(item.maxScore)),
    );
    const expectedTotal = patchLines.reduce((s, l) => s + l.score, 0);

    const res = await request.patch(`/api/exam-scores/${created.SCORES_ID}`, {
      headers: adminHeaders,
      data: { lines: patchLines },
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as ExamScoreRow;
    expect(body.SCORES_ID).toBe(created.SCORES_ID);
    expect(Number(body.SC_TOTAL_SCORE)).toBe(expectedTotal);
    expect(body.LINES?.length).toBe(rubricItems.length);

    const getRes = await request.get(`/api/exam-scores/${created.SCORES_ID}`, {
      headers: adminHeaders,
    });
    expect(getRes.status()).toBe(200);
    const fetched = (await getRes.json()) as ExamScoreRow;
    expect(Number(fetched.SC_TOTAL_SCORE)).toBe(expectedTotal);
  });

  // SCR-I-006
  test('Role guard on /exam-scores routes', async ({ request }) => {
    requireSeed();
    const ermId = await seedEnrollment(request);
    const lines = linesAt(rubricItems, () => 6);
    const created = await createScore(request, adminHeaders, ermId, lines);

    const allowed: AuthHeaders[] = [
      adminHeaders,
      staffHeaders,
      registrationHeaders,
      examOpsHeaders,
    ];
    for (const headers of allowed) {
      const getRes = await request.get(`/api/exam-scores/${created.SCORES_ID}`, {
        headers,
      });
      expect(getRes.status(), await getRes.text()).toBe(200);
    }

    const forbidden: Array<{ role: string; headers: AuthHeaders }> = [
      { role: 'candidate', headers: candidateHeaders },
      { role: 'finance', headers: financeHeaders },
      { role: 'proctor', headers: proctorHeaders },
      { role: 'executive', headers: executiveHeaders },
    ];
    for (const f of forbidden) {
      const getRes = await request.get(`/api/exam-scores/${created.SCORES_ID}`, {
        headers: f.headers,
      });
      expect(getRes.status(), `${f.role} GET`).toBe(403);

      const postRes = await request.post('/api/exam-scores', {
        headers: f.headers,
        data: { ERM_ID: ermId, lines },
      });
      expect(postRes.status(), `${f.role} POST`).toBe(403);
    }

    const unauth = await request.get(`/api/exam-scores/${created.SCORES_ID}`);
    expect(unauth.status()).toBe(401);
    const unauthPost = await request.post('/api/exam-scores', {
      data: { ERM_ID: ermId, lines },
    });
    expect(unauthPost.status()).toBe(401);
  });

  // SCR-I-007
  test('DELETE soft-delete excludes score from normal GET', async ({
    request,
  }) => {
    requireSeed();
    const ermId = await seedEnrollment(request);
    const created = await createScore(
      request,
      adminHeaders,
      ermId,
      linesAt(rubricItems, () => 9),
    );

    const del = await request.delete(`/api/exam-scores/${created.SCORES_ID}`, {
      headers: adminHeaders,
    });
    expect([200, 204]).toContain(del.status());

    const getRes = await request.get(`/api/exam-scores/${created.SCORES_ID}`, {
      headers: adminHeaders,
    });
    expect(getRes.status()).toBe(404);

    const list = await request.get('/api/exam-scores', {
      headers: adminHeaders,
      params: { page: 1, limit: 50 },
    });
    expect(list.status(), await list.text()).toBe(200);
    const page = (await list.json()) as Paginated<ExamScoreRow>;
    expect(
      (page.data ?? []).some((s) => s.SCORES_ID === created.SCORES_ID),
    ).toBe(false);
  });
});
