import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';

type AuthHeaders = { Authorization: string };

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

async function adminHeaders(request: APIRequestContext): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, 'admin');
  return { Authorization: `Bearer ${accessToken}` };
}

test.describe('Exam sessions API — Batch4 P0/P1', () => {
  test.describe.configure({ mode: 'serial' });
  let headers: AuthHeaders;
  const examIds: number[] = [];
  const sessionIds: number[] = [];

  async function createExam(request: APIRequestContext): Promise<number> {
    const res = await request.post('/api/exam', {
      headers,
      data: {
        EXAM_NAME: `SES-I ${uniqueSuffix()}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE: 500,
        EXAM_DATE: '2026-12-20',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-19T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-19T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: '31',
        EXAM_FISCAL_YEAR: '2026',
        FUND_SOURCE_ID: 1,
        SRB_ID: 1,
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const id = ((await res.json()) as { EXAM_ID: number }).EXAM_ID;
    examIds.push(id);
    return id;
  }

  test.beforeAll(async ({ request }) => {
    headers = await adminHeaders(request);
  });

  test.afterAll(async ({ request }) => {
    for (const ssId of sessionIds) {
      await request
        .delete(`/api/exam-sessions/${ssId}`, { headers })
        .catch(() => undefined);
    }
    for (const examId of examIds) {
      await request.delete(`/api/exam/${examId}`, { headers }).catch(() => undefined);
    }
  });

  // SES-I-001
  test('POST /api/exam-sessions validates and creates', async ({ request }) => {
    const examId = await createExam(request);
    const create = await request.post('/api/exam-sessions', {
      headers,
      data: {
        EXAM_ID: examId,
        SS_START_TIME: '09:00:00',
        SS_END_TIME: '10:00:00',
        SS_CAPACITY: 20,
        SS_SESSION_STATUS: 1,
      },
    });
    expect(create.status(), await create.text()).toBe(201);
    const session = (await create.json()) as { SS_ID: number; EXAM_ID: number };
    sessionIds.push(session.SS_ID);
    expect(session.EXAM_ID).toBe(examId);
  });

  // SES-I-002
  test('PATCH /api/exam-sessions/:id updates metadata', async ({ request }) => {
    const examId = await createExam(request);
    const create = await request.post('/api/exam-sessions', {
      headers,
      data: { EXAM_ID: examId, SS_START_TIME: '11:00:00', SS_END_TIME: '12:00:00', SS_CAPACITY: 10, SS_SESSION_STATUS: 1 },
    });
    expect(create.status(), await create.text()).toBe(201);
    const sessionId = ((await create.json()) as { SS_ID: number }).SS_ID;
    sessionIds.push(sessionId);

    const patch = await request.patch(`/api/exam-sessions/${sessionId}`, {
      headers,
      data: { SS_CAPACITY: 99, SS_START_TIME: '11:30:00' },
    });
    expect(patch.status(), await patch.text()).toBe(200);
    const body = (await patch.json()) as { SS_CAPACITY: number; SS_START_TIME: string };
    expect(body.SS_CAPACITY).toBe(99);
    expect(body.SS_START_TIME).toContain('11:30');
  });

  // SES-I-003
  test('DELETE /api/exam-sessions/:id soft delete hides from list', async ({ request }) => {
    const examId = await createExam(request);
    const create = await request.post('/api/exam-sessions', {
      headers,
      data: { EXAM_ID: examId, SS_START_TIME: '13:00:00', SS_END_TIME: '14:00:00', SS_CAPACITY: 15, SS_SESSION_STATUS: 1 },
    });
    expect(create.status(), await create.text()).toBe(201);
    const sessionId = ((await create.json()) as { SS_ID: number }).SS_ID;
    sessionIds.push(sessionId);

    const del = await request.delete(`/api/exam-sessions/${sessionId}`, { headers });
    expect([200, 204].includes(del.status()), await del.text()).toBe(true);

    const get = await request.get(`/api/exam-sessions/${sessionId}`, { headers });
    expect(get.status(), await get.text()).toBe(404);
  });
});
