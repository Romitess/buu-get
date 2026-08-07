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

test.describe('Exam blocked seats API — Batch4 P0/P1', () => {
  test.describe.configure({ mode: 'serial' });
  let headers: AuthHeaders;
  const examIds: number[] = [];
  const sessionIds: number[] = [];
  const locationIds: number[] = [];
  const seatIds: number[] = [];
  const blockIds: number[] = [];

  async function createExamAndSession(request: APIRequestContext) {
    const ex = await request.post('/api/exam', {
      headers,
      data: {
        EXAM_NAME: `BLOCK-I ${uniqueSuffix()}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE: 500,
        EXAM_DATE: '2026-12-20',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-19T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-19T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: '51',
        EXAM_FISCAL_YEAR: '2026',
        FUND_SOURCE_ID: 1,
        SRB_ID: 1,
      },
    });
    expect(ex.status(), await ex.text()).toBe(201);
    const examId = ((await ex.json()) as { EXAM_ID: number }).EXAM_ID;
    examIds.push(examId);

    const ss = await request.post('/api/exam-sessions', {
      headers,
      data: { EXAM_ID: examId, SS_START_TIME: '09:00:00', SS_END_TIME: '10:00:00', SS_CAPACITY: 20, SS_SESSION_STATUS: 1 },
    });
    expect(ss.status(), await ss.text()).toBe(201);
    const sessionId = ((await ss.json()) as { SS_ID: number }).SS_ID;
    sessionIds.push(sessionId);
    return sessionId;
  }

  async function createLocationAndSeat(request: APIRequestContext) {
    const s = uniqueSuffix();
    const location = await request.post('/api/exam-locations', {
      headers,
      data: { LOCATION_NAME: `BLOCK room ${s}`, LOCATION_ROOM_NO: `B${s.slice(-4)}`, LOCATION_TOTAL_ROWS: 2, LOCATION_TOTAL_COLS: 2, LOCATION_SEAT_CAPACITY: 4 },
    });
    expect(location.status(), await location.text()).toBe(201);
    const locationId = ((await location.json()) as { LOCATION_ID: number }).LOCATION_ID;
    locationIds.push(locationId);

    const seat = await request.post('/api/exam-location-seats', {
      headers,
      data: { LOCATION_ID: locationId, LS_ROW_NO: 1, LS_COL_NO: 1, LS_SEAT_LABEL: 'A1', LS_SEAT_STATUS: 0 },
    });
    expect(seat.status(), await seat.text()).toBe(201);
    const seatId = ((await seat.json()) as { LS_ID: number }).LS_ID;
    seatIds.push(seatId);
    return seatId;
  }

  test.beforeAll(async ({ request }) => {
    headers = await adminHeaders(request);
  });

  test.afterAll(async ({ request }) => {
    for (const id of blockIds) await request.delete(`/api/exam-blocked-seats/${id}`, { headers }).catch(() => undefined);
    for (const id of seatIds) await request.delete(`/api/exam-location-seats/${id}`, { headers }).catch(() => undefined);
    for (const id of locationIds) await request.delete(`/api/exam-locations/${id}`, { headers }).catch(() => undefined);
    for (const id of sessionIds) await request.delete(`/api/exam-sessions/${id}`, { headers }).catch(() => undefined);
    for (const id of examIds) await request.delete(`/api/exam/${id}`, { headers }).catch(() => undefined);
  });

  // BLOCK-I-001
  test('replace endpoint is all-or-nothing for session', async ({ request }) => {
    const sessionId = await createExamAndSession(request);
    const seatId = await createLocationAndSeat(request);

    const first = await request.post(`/api/exam-blocked-seats/session/${sessionId}/replace`, {
      headers,
      data: { seats: [{ LS_ID: seatId, BLOCK_STATUS: 2 }] },
    });
    expect(first.status(), await first.text()).toBe(201);
    const body = (await first.json()) as Array<{ BLOCK_ID: number; LS_ID: number }>;
    body.forEach((b) => blockIds.push(b.BLOCK_ID));
    expect(body).toHaveLength(1);
    expect(body[0].LS_ID).toBe(seatId);
  });

  // BLOCK-I-002
  test('GET with sessionId filters only target session rows', async ({ request }) => {
    const sessionA = await createExamAndSession(request);
    const sessionB = await createExamAndSession(request);
    const seatA = await createLocationAndSeat(request);
    const seatB = await createLocationAndSeat(request);

    const a = await request.post(`/api/exam-blocked-seats/session/${sessionA}/replace`, {
      headers,
      data: { seats: [{ LS_ID: seatA, BLOCK_STATUS: 2 }] },
    });
    expect(a.status(), await a.text()).toBe(201);
    ((await a.json()) as Array<{ BLOCK_ID: number }>).forEach((b) => blockIds.push(b.BLOCK_ID));

    const b = await request.post(`/api/exam-blocked-seats/session/${sessionB}/replace`, {
      headers,
      data: { seats: [{ LS_ID: seatB, BLOCK_STATUS: 1 }] },
    });
    expect(b.status(), await b.text()).toBe(201);
    ((await b.json()) as Array<{ BLOCK_ID: number }>).forEach((x) => blockIds.push(x.BLOCK_ID));

    const list = await request.get(`/api/exam-blocked-seats?sessionId=${sessionA}`, { headers });
    expect(list.status(), await list.text()).toBe(200);
    const rows = (await list.json()) as Array<{ SS_ID: number }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.SS_ID === sessionA)).toBe(true);
  });

  // BLOCK-I-003
  test('DELETE override removes blocked-seat row', async ({ request }) => {
    const sessionId = await createExamAndSession(request);
    const seatId = await createLocationAndSeat(request);

    const create = await request.post(`/api/exam-blocked-seats/session/${sessionId}/replace`, {
      headers,
      data: { seats: [{ LS_ID: seatId, BLOCK_STATUS: 2 }] },
    });
    expect(create.status(), await create.text()).toBe(201);
    const blockId = ((await create.json()) as Array<{ BLOCK_ID: number }>)[0].BLOCK_ID;
    blockIds.push(blockId);

    const del = await request.delete(`/api/exam-blocked-seats/${blockId}`, { headers });
    expect([200, 204].includes(del.status()), await del.text()).toBe(true);

    const get = await request.get(`/api/exam-blocked-seats/${blockId}`, { headers });
    expect(get.status(), await get.text()).toBe(404);
  });
});
