import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';

type AuthHeaders = { Authorization: string };

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

async function headersFor(
  request: APIRequestContext,
  role: 'admin' | 'candidate',
): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, role);
  return { Authorization: `Bearer ${accessToken}` };
}

test.describe('Exam API — Batch4 P0/P1', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90_000);

  let adminHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;
  const examIds: number[] = [];
  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const scoreIds: number[] = [];

  async function createExam(request: APIRequestContext, suffix: string) {
    const res = await request.post('/api/exam', {
      headers: adminHeaders,
      data: {
        EXAM_NAME: `EXAM-I ${suffix}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE: 500,
        EXAM_DATE: '2026-12-20',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-19T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-19T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: '21',
        EXAM_FISCAL_YEAR: '2026',
        FUND_SOURCE_ID: 1,
        SRB_ID: 1,
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { EXAM_ID: number };
    examIds.push(body.EXAM_ID);
    return body.EXAM_ID;
  }

  test.beforeAll(async ({ request }) => {
    adminHeaders = await headersFor(request, 'admin');
    candidateHeaders = await headersFor(request, 'candidate');
  });

  test.afterAll(async ({ request }) => {
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
  });

  // EXAM-I-001
  test('POST /api/exam persists even if Moodle sync fails', async ({
    request,
  }) => {
    const id = await createExam(request, uniqueSuffix());
    const getRes = await request.get(`/api/exam/${id}`);
    expect(getRes.status(), await getRes.text()).toBe(200);
  });

  // EXAM-I-002
  test('PATCH /api/exam/:id rubric change conflicts after score exists', async ({
    request,
  }) => {
    const examId = await createExam(request, `rubric-${uniqueSuffix()}`);
    const rubricRes = await request.get('/api/score-rubrics/1', {
      headers: adminHeaders,
    });
    expect(rubricRes.status(), await rubricRes.text()).toBe(200);
    const rubric = (await rubricRes.json()) as {
      ITEMS?: Array<{ SRBI_ID: number }>;
    };
    const lines = (rubric.ITEMS ?? []).map((item) => ({
      SRBI_ID: item.SRBI_ID,
      score: 10,
    }));
    test.skip(
      lines.length === 0,
      'SRB_ID=1 has no rubric items in current seed; cannot create persisted score for conflict path',
    );

    const me = await request.get('/api/auth/me', { headers: candidateHeaders });
    expect(me.status()).toBe(200);
    const userId = ((await me.json()) as { id: number }).id;

    const ssRes = await request.post('/api/exam-sessions', {
      headers: adminHeaders,
      data: {
        EXAM_ID: examId,
        SS_START_TIME: '09:00:00',
        SS_END_TIME: '10:00:00',
        SS_CAPACITY: 20,
        SS_SESSION_STATUS: 1,
      },
    });
    expect(ssRes.status(), await ssRes.text()).toBe(201);
    const sessionId = ((await ssRes.json()) as { SS_ID: number }).SS_ID;
    sessionIds.push(sessionId);

    const ermRes = await request.post('/api/exam-enrollments', {
      headers: candidateHeaders,
      data: { USER_ID: userId, SESSION_ID: sessionId },
    });
    expect(ermRes.status(), await ermRes.text()).toBe(201);
    const ermId = ((await ermRes.json()) as { ERM_ID: number }).ERM_ID;
    enrollmentIds.push(ermId);

    const scoreRes = await request.post('/api/exam-scores', {
      headers: adminHeaders,
      data: {
        ERM_ID: ermId,
        lines,
      },
    });
    expect(scoreRes.status(), await scoreRes.text()).toBe(201);
    const scoreId = ((await scoreRes.json()) as { SCORES_ID: number }).SCORES_ID;
    scoreIds.push(scoreId);

    const patch = await request.patch(`/api/exam/${examId}`, {
      headers: adminHeaders,
      data: { SRB_ID: 2 },
    });
    expect(patch.status(), await patch.text()).toBe(409);
  });

  // EXAM-I-003
  test('POST /api/exam/:id/passcodes replaces old set', async ({ request }) => {
    const examId = await createExam(request, `passcode-${uniqueSuffix()}`);
    const first = await request.post(`/api/exam/${examId}/passcodes`, {
      headers: adminHeaders,
      data: {
        passcodes: [{ nationalId: '1234567890123', fullName: 'First One', passcode: 'A001' }],
      },
    });
    expect(first.status(), await first.text()).toBe(201);
    expect(((await first.json()) as Array<{ PASSCODE: string }>)[0].PASSCODE).toBe(
      'A001',
    );

    const second = await request.post(`/api/exam/${examId}/passcodes`, {
      headers: adminHeaders,
      data: {
        passcodes: [{ nationalId: '2234567890123', fullName: 'Second One', passcode: 'B001' }],
      },
    });
    expect(second.status(), await second.text()).toBe(201);
    const body = (await second.json()) as Array<{ PASSCODE: string }>;
    expect(body).toHaveLength(1);
    expect(body[0].PASSCODE).toBe('B001');
  });

  // EXAM-I-004
  test('RBAC on exam mutate endpoints', async ({ request }) => {
    const suffix = uniqueSuffix();
    const candidateCreate = await request.post('/api/exam', {
      headers: candidateHeaders,
      data: { EXAM_NAME: `deny-${suffix}`, SRB_ID: 1 },
    });
    expect(candidateCreate.status(), await candidateCreate.text()).toBe(403);

    const examId = await createExam(request, `rbac-${suffix}`);
    const candidatePatch = await request.patch(`/api/exam/${examId}`, {
      headers: candidateHeaders,
      data: { EXAM_NAME: `patched-${suffix}` },
    });
    expect(candidatePatch.status(), await candidatePatch.text()).toBe(403);

    const notifyOk = await request.post(`/api/exam/${examId}/notify-changes`, {
      headers: adminHeaders,
      data: { changes: [{ label: 'เวลา', oldValue: '09:00', newValue: '10:00' }] },
    });
    expect(notifyOk.status(), await notifyOk.text()).toBe(201);
    expect((await notifyOk.json()) as { success: boolean }).toEqual({ success: true });
  });
});
