import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import type { TestRoleKey } from '../e2e/fixtures/users';

/**
 * Score Rubrics API integration — matrix RUB-I-001 … RUB-I-006
 *
 * Seed approach (shared-DB, disposable via API):
 * 1. Create disposable rubrics for happy-path / validation
 * 2. For lock cases: create rubric → exam (+ optional score) → assert 409/400
 * 3. afterAll soft-deletes scores → enrollments → sessions → exams → rubrics
 *    (never deletes the seeded default rubric)
 */

type AuthHeaders = { Authorization: string };

type RubricItem = {
  id: number;
  nameTh: string;
  nameEn: string;
  code: string | null;
  maxScore: number;
  sortOrder: number;
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

function rubricPayload(suffix: string) {
  return {
    nameTh: `RUB-I TH ${suffix}`,
    nameEn: `RUB-I EN ${suffix}`,
    items: [
      {
        nameTh: 'หมวด A',
        nameEn: 'Section A',
        maxScore: 40,
        sortOrder: 1,
        code: 'SEC_A',
      },
      {
        nameTh: 'หมวด B',
        nameEn: 'Section B',
        maxScore: 60,
        sortOrder: 2,
        code: 'SEC_B',
      },
    ],
  };
}

test.describe('Score Rubrics API — CRUD locks / authz / validation', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120_000);

  let adminHeaders: AuthHeaders;
  let staffHeaders: AuthHeaders;
  let registrationHeaders: AuthHeaders;
  let examOpsHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;
  let financeHeaders: AuthHeaders;
  let proctorHeaders: AuthHeaders;

  let candidateUserId: number;
  let defaultRubricId: number | null = null;

  const rubricIds: number[] = [];
  const examIds: number[] = [];
  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const scoreIds: number[] = [];
  let sessionSlot = 0;

  async function createRubric(
    request: APIRequestContext,
    headers: AuthHeaders = adminHeaders,
    suffix = uniqueSuffix(),
  ): Promise<RubricRow> {
    const res = await request.post('/api/score-rubrics', {
      headers,
      data: rubricPayload(suffix),
    });
    const text = await res.text();
    expect(res.status(), text).toBe(201);
    const body = JSON.parse(text) as RubricRow;
    rubricIds.push(body.id);
    return body;
  }

  async function createExamWithRubric(
    request: APIRequestContext,
    srbId: number,
    suffix: string,
  ): Promise<number> {
    const res = await request.post('/api/exam', {
      headers: adminHeaders,
      data: {
        EXAM_NAME: `RUB-EXAM ${suffix}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE: 500,
        EXAM_DATE: '2026-12-22',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-21T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-21T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: 'RUB',
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

  async function createScoredEnrollment(
    request: APIRequestContext,
    examId: number,
    items: RubricItem[],
  ): Promise<void> {
    const { start, end } = hourMinute(sessionSlot++);
    const ssRes = await request.post('/api/exam-sessions', {
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

    const ermRes = await request.post('/api/exam-enrollments', {
      headers: candidateHeaders,
      data: { USER_ID: candidateUserId, SESSION_ID: sessionId },
    });
    expect(ermRes.status(), await ermRes.text()).toBe(201);
    const ermId = ((await ermRes.json()) as { ERM_ID: number }).ERM_ID;
    enrollmentIds.push(ermId);

    const scoreRes = await request.post('/api/exam-scores', {
      headers: adminHeaders,
      data: {
        ERM_ID: ermId,
        lines: items.map((item) => ({
          SRBI_ID: item.id,
          score: Math.min(5, Number(item.maxScore)),
        })),
      },
    });
    expect(scoreRes.status(), await scoreRes.text()).toBe(201);
    const scoreId = ((await scoreRes.json()) as { SCORES_ID: number })
      .SCORES_ID;
    scoreIds.push(scoreId);
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

    const me = await request.get('/api/auth/me', { headers: candidateHeaders });
    expect(me.status()).toBe(200);
    candidateUserId = ((await me.json()) as { id: number }).id;

    const list = await request.get('/api/score-rubrics', {
      headers: adminHeaders,
    });
    expect(list.status(), await list.text()).toBe(200);
    const rubrics = (await list.json()) as RubricRow[];
    defaultRubricId = rubrics.find((r) => r.isDefault)?.id ?? null;
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(120_000);
    for (const scoreId of scoreIds) {
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
    for (const rubricId of rubricIds) {
      if (rubricId === defaultRubricId) continue;
      await request
        .delete(`/api/score-rubrics/${rubricId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
  });

  // RUB-I-001
  test('POST /api/score-rubrics create rubric/items → 201', async ({
    request,
  }) => {
    const suffix = uniqueSuffix();
    const payload = rubricPayload(suffix);
    const res = await request.post('/api/score-rubrics', {
      headers: adminHeaders,
      data: payload,
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as RubricRow;
    rubricIds.push(body.id);

    expect(body.id).toEqual(expect.any(Number));
    expect(body.nameTh).toBe(payload.nameTh);
    expect(body.nameEn).toBe(payload.nameEn);
    expect(body.isDefault).toBe(false);
    expect(body.items).toHaveLength(2);
    expect(body.items[0].maxScore).toBe(40);
    expect(body.items[1].maxScore).toBe(60);

    const getRes = await request.get(`/api/score-rubrics/${body.id}`, {
      headers: adminHeaders,
    });
    expect(getRes.status(), await getRes.text()).toBe(200);
    const fetched = (await getRes.json()) as RubricRow;
    expect(fetched.id).toBe(body.id);
    expect(fetched.items).toHaveLength(2);
  });

  // RUB-I-002
  test('PATCH default rubric items blocked → 400', async ({ request }) => {
    test.skip(
      defaultRubricId == null,
      'No seeded default rubric (isDefault=true)',
    );

    const res = await request.patch(`/api/score-rubrics/${defaultRubricId}`, {
      headers: adminHeaders,
      data: {
        items: [
          {
            nameTh: 'should-fail',
            nameEn: 'should-fail',
            maxScore: 50,
            sortOrder: 1,
          },
        ],
      },
    });
    expect(res.status(), await res.text()).toBe(400);

    // Name-only update should still be allowed on default (items not sent)
    const nameOnly = await request.patch(
      `/api/score-rubrics/${defaultRubricId}`,
      {
        headers: adminHeaders,
        data: { nameEn: 'BUU-GET Standard' },
      },
    );
    expect(nameOnly.status(), await nameOnly.text()).toBe(200);
  });

  // RUB-I-003
  test('PATCH used-by-score rubric items blocked → 409', async ({
    request,
  }) => {
    const rubric = await createRubric(request);
    const examId = await createExamWithRubric(
      request,
      rubric.id,
      uniqueSuffix(),
    );
    await createScoredEnrollment(request, examId, rubric.items);

    const res = await request.patch(`/api/score-rubrics/${rubric.id}`, {
      headers: adminHeaders,
      data: {
        items: [
          {
            nameTh: 'locked-change',
            nameEn: 'locked-change',
            maxScore: 50,
            sortOrder: 1,
          },
        ],
      },
    });
    expect(res.status(), await res.text()).toBe(409);
  });

  // RUB-I-004
  test('DELETE rubric referenced by exam blocked → 409', async ({
    request,
  }) => {
    const rubric = await createRubric(request);
    await createExamWithRubric(request, rubric.id, uniqueSuffix());

    const res = await request.delete(`/api/score-rubrics/${rubric.id}`, {
      headers: adminHeaders,
    });
    expect(res.status(), await res.text()).toBe(409);

    // Still fetchable
    const getRes = await request.get(`/api/score-rubrics/${rubric.id}`, {
      headers: adminHeaders,
    });
    expect(getRes.status()).toBe(200);
  });

  // RUB-I-005
  test('Role guard across rubric endpoints', async ({ request }) => {
    const created = await createRubric(request);

    const allowed: AuthHeaders[] = [
      adminHeaders,
      staffHeaders,
      registrationHeaders,
      examOpsHeaders,
    ];
    for (const headers of allowed) {
      const getRes = await request.get(`/api/score-rubrics/${created.id}`, {
        headers,
      });
      expect(getRes.status(), await getRes.text()).toBe(200);
    }

    const forbidden: Array<{ role: string; headers: AuthHeaders }> = [
      { role: 'candidate', headers: candidateHeaders },
      { role: 'finance', headers: financeHeaders },
      { role: 'proctor', headers: proctorHeaders },
    ];
    for (const f of forbidden) {
      const getRes = await request.get(`/api/score-rubrics/${created.id}`, {
        headers: f.headers,
      });
      expect(getRes.status(), `${f.role} GET`).toBe(403);

      const postRes = await request.post('/api/score-rubrics', {
        headers: f.headers,
        data: rubricPayload(`deny-${uniqueSuffix()}`),
      });
      expect(postRes.status(), `${f.role} POST`).toBe(403);
    }

    const unauth = await request.get('/api/score-rubrics');
    expect(unauth.status()).toBe(401);
    const unauthPost = await request.post('/api/score-rubrics', {
      data: rubricPayload(`unauth-${uniqueSuffix()}`),
    });
    expect(unauthPost.status()).toBe(401);
  });

  // RUB-I-006
  test('DTO validation on items/min constraints → 400', async ({
    request,
  }) => {
    const cases: Record<string, unknown>[] = [
      {},
      { nameTh: '', nameEn: 'EN', items: rubricPayload('x').items },
      {
        nameTh: 'TH',
        nameEn: 'EN',
        items: [],
      },
      {
        nameTh: 'TH',
        nameEn: 'EN',
        items: [
          {
            nameTh: 'A',
            nameEn: 'A',
            maxScore: -1,
            sortOrder: 1,
          },
        ],
      },
      {
        nameTh: 'TH',
        nameEn: 'EN',
        items: [
          {
            nameTh: 'A',
            nameEn: 'A',
            maxScore: 50,
            sortOrder: -1,
          },
        ],
      },
      {
        nameTh: 'TH',
        nameEn: 'EN',
        items: [
          {
            nameTh: '',
            nameEn: 'A',
            maxScore: 50,
            sortOrder: 1,
          },
        ],
      },
    ];

    for (const data of cases) {
      const res = await request.post('/api/score-rubrics', {
        headers: adminHeaders,
        data,
      });
      expect(
        res.status(),
        `expected 400 for ${JSON.stringify(data)}`,
      ).toBe(400);
    }
  });
});
