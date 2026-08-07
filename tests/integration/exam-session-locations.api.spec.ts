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

test.describe('Exam session-locations API — Batch4 P0/P1', () => {
  test.describe.configure({ mode: 'serial' });
  let headers: AuthHeaders;
  const examIds: number[] = [];
  const locationIds: number[] = [];
  const sessionIds: number[] = [];
  const slIds: number[] = [];

  async function createExam(request: APIRequestContext, round: string) {
    const res = await request.post('/api/exam', {
      headers,
      data: {
        EXAM_NAME: `SL-I ${uniqueSuffix()}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE: 500,
        EXAM_DATE: '2026-12-20',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-19T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-19T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: round,
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

  async function createSession(
    request: APIRequestContext,
    examId: number,
    start: string,
    end: string,
  ) {
    const res = await request.post('/api/exam-sessions', {
      headers,
      data: { EXAM_ID: examId, SS_START_TIME: start, SS_END_TIME: end, SS_CAPACITY: 20, SS_SESSION_STATUS: 1 },
    });
    expect(res.status(), await res.text()).toBe(201);
    const id = ((await res.json()) as { SS_ID: number }).SS_ID;
    sessionIds.push(id);
    return id;
  }

  async function createLocation(request: APIRequestContext) {
    const s = uniqueSuffix();
    const res = await request.post('/api/exam-locations', {
      headers,
      data: { LOCATION_NAME: `SL room ${s}`, LOCATION_ROOM_NO: `R${s.slice(-4)}`, LOCATION_TOTAL_ROWS: 2, LOCATION_TOTAL_COLS: 2, LOCATION_SEAT_CAPACITY: 4 },
    });
    expect(res.status(), await res.text()).toBe(201);
    const id = ((await res.json()) as { LOCATION_ID: number }).LOCATION_ID;
    locationIds.push(id);
    return id;
  }

  test.beforeAll(async ({ request }) => {
    headers = await adminHeaders(request);
  });

  test.afterAll(async ({ request }) => {
    for (const id of slIds) await request.delete(`/api/exam-session-locations/${id}`, { headers }).catch(() => undefined);
    for (const id of sessionIds) await request.delete(`/api/exam-sessions/${id}`, { headers }).catch(() => undefined);
    for (const id of locationIds) await request.delete(`/api/exam-locations/${id}`, { headers }).catch(() => undefined);
    for (const id of examIds) await request.delete(`/api/exam/${id}`, { headers }).catch(() => undefined);
  });

  // SL-I-001 + SL-I-002
  test('POST allows non-overlap and blocks overlap with same room/date', async ({ request }) => {
    const locationId = await createLocation(request);
    const examA = await createExam(request, '41');
    const examB = await createExam(request, '42');
    const s1 = await createSession(request, examA, '09:00:00', '10:00:00');
    const s2 = await createSession(request, examB, '10:00:00', '11:00:00');
    const s3 = await createSession(request, examB, '09:30:00', '10:30:00');

    const nonOverlap = await request.post('/api/exam-session-locations', {
      headers,
      data: { LOCATION_ID: locationId, SS_ID: s1, LOCATION_SEAT_CAPACITY: 4 },
    });
    expect(nonOverlap.status(), await nonOverlap.text()).toBe(201);
    slIds.push(((await nonOverlap.json()) as { SL_ID: number }).SL_ID);

    const nonOverlap2 = await request.post('/api/exam-session-locations', {
      headers,
      data: { LOCATION_ID: locationId, SS_ID: s2, LOCATION_SEAT_CAPACITY: 4 },
    });
    expect(nonOverlap2.status(), await nonOverlap2.text()).toBe(201);
    slIds.push(((await nonOverlap2.json()) as { SL_ID: number }).SL_ID);

    const overlap = await request.post('/api/exam-session-locations', {
      headers,
      data: { LOCATION_ID: locationId, SS_ID: s3, LOCATION_SEAT_CAPACITY: 4 },
    });
    expect(overlap.status(), await overlap.text()).toBe(409);
  });

  // SL-I-003
  test('PATCH rechecks overlap excluding self', async ({ request }) => {
    const locationId = await createLocation(request);
    const exam = await createExam(request, '43');
    const exam2 = await createExam(request, '44');
    const s1 = await createSession(request, exam, '13:00:00', '14:00:00');
    const s2 = await createSession(request, exam2, '15:00:00', '16:00:00');
    const s3 = await createSession(request, exam2, '13:30:00', '14:30:00');

    const l1 = await request.post('/api/exam-session-locations', { headers, data: { LOCATION_ID: locationId, SS_ID: s1, LOCATION_SEAT_CAPACITY: 4 } });
    expect(l1.status(), await l1.text()).toBe(201);
    const sl1 = ((await l1.json()) as { SL_ID: number }).SL_ID;
    slIds.push(sl1);

    const l2 = await request.post('/api/exam-session-locations', { headers, data: { LOCATION_ID: locationId, SS_ID: s2, LOCATION_SEAT_CAPACITY: 4 } });
    expect(l2.status(), await l2.text()).toBe(201);
    const sl2 = ((await l2.json()) as { SL_ID: number }).SL_ID;
    slIds.push(sl2);

    const noConflictSelf = await request.patch(`/api/exam-session-locations/${sl2}`, {
      headers,
      data: { LOCATION_SEAT_CAPACITY: 5 },
    });
    expect(noConflictSelf.status(), await noConflictSelf.text()).toBe(200);

    const conflict = await request.patch(`/api/exam-session-locations/${sl2}`, {
      headers,
      data: { SS_ID: s3 },
    });
    expect(conflict.status(), await conflict.text()).toBe(409);
  });

  // SL-I-004
  test('DELETE soft-delete frees room for same slot re-link', async ({ request }) => {
    const locationId = await createLocation(request);
    const exam = await createExam(request, '45');
    const session = await createSession(request, exam, '17:00:00', '18:00:00');

    const first = await request.post('/api/exam-session-locations', {
      headers,
      data: { LOCATION_ID: locationId, SS_ID: session, LOCATION_SEAT_CAPACITY: 4 },
    });
    expect(first.status(), await first.text()).toBe(201);
    const slId = ((await first.json()) as { SL_ID: number }).SL_ID;
    slIds.push(slId);

    const del = await request.delete(`/api/exam-session-locations/${slId}`, { headers });
    expect([200, 204].includes(del.status()), await del.text()).toBe(true);

    const relink = await request.post('/api/exam-session-locations', {
      headers,
      data: { LOCATION_ID: locationId, SS_ID: session, LOCATION_SEAT_CAPACITY: 4 },
    });
    expect(relink.status(), await relink.text()).toBe(201);
    slIds.push(((await relink.json()) as { SL_ID: number }).SL_ID);
  });
});
