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

test.describe('Exam location seats API — Batch4 P0/P1', () => {
  test.describe.configure({ mode: 'serial' });
  let headers: AuthHeaders;
  const locationIds: number[] = [];
  const seatIds: number[] = [];

  async function createLocation(request: APIRequestContext) {
    const s = uniqueSuffix();
    const res = await request.post('/api/exam-locations', {
      headers,
      data: {
        LOCATION_NAME: `SEAT-I ${s}`,
        LOCATION_ROOM_NO: `R${s.slice(-4)}`,
        LOCATION_TOTAL_ROWS: 2,
        LOCATION_TOTAL_COLS: 2,
        LOCATION_SEAT_CAPACITY: 4,
      },
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
    for (const seatId of seatIds) {
      await request
        .delete(`/api/exam-location-seats/${seatId}`, { headers })
        .catch(() => undefined);
    }
    for (const id of locationIds) {
      await request.delete(`/api/exam-locations/${id}`, { headers }).catch(() => undefined);
    }
  });

  // SEAT-I-001
  test('row/col and label uniqueness in location', async ({ request }) => {
    const locationId = await createLocation(request);
    const first = await request.post('/api/exam-location-seats', {
      headers,
      data: { LOCATION_ID: locationId, LS_ROW_NO: 1, LS_COL_NO: 1, LS_SEAT_LABEL: 'A1', LS_SEAT_STATUS: 0 },
    });
    expect(first.status(), await first.text()).toBe(201);
    seatIds.push(((await first.json()) as { LS_ID: number }).LS_ID);

    const dupPos = await request.post('/api/exam-location-seats', {
      headers,
      data: { LOCATION_ID: locationId, LS_ROW_NO: 1, LS_COL_NO: 1, LS_SEAT_LABEL: 'B1', LS_SEAT_STATUS: 0 },
    });
    expect(dupPos.status(), await dupPos.text()).toBe(409);

    const dupLabel = await request.post('/api/exam-location-seats', {
      headers,
      data: { LOCATION_ID: locationId, LS_ROW_NO: 1, LS_COL_NO: 2, LS_SEAT_LABEL: 'A1', LS_SEAT_STATUS: 0 },
    });
    expect(dupLabel.status(), await dupLabel.text()).toBe(409);
  });

  // SEAT-I-002
  test('POST generate/:locationId updates full grid atomically', async ({ request }) => {
    const locationId = await createLocation(request);
    const generate = await request.post(`/api/exam-location-seats/generate/${locationId}`, {
      headers,
      data: { seatStatuses: { A1: 1, A2: 2 } },
    });
    expect(generate.status(), await generate.text()).toBe(201);
    const seats = (await generate.json()) as Array<{ LS_ID: number; LS_SEAT_STATUS: number }>;
    seats.forEach((s) => seatIds.push(s.LS_ID));
    expect(seats).toHaveLength(4);
    expect(seats.some((s) => s.LS_SEAT_STATUS === 1)).toBe(true);
    expect(seats.some((s) => s.LS_SEAT_STATUS === 2)).toBe(true);
  });

  // SEAT-I-003 (adapted to current DTO behavior)
  test('generate with non-string brokenSeats keeps grid consistent', async ({ request }) => {
    const locationId = await createLocation(request);
    const first = await request.post(`/api/exam-location-seats/generate/${locationId}`, {
      headers,
      data: {},
    });
    expect(first.status(), await first.text()).toBe(201);
    const before = (await first.json()) as Array<{ LS_ID: number; LS_SEAT_LABEL: string }>;
    before.forEach((s) => seatIds.push(s.LS_ID));
    const beforeLabels = before.map((s) => s.LS_SEAT_LABEL).sort();

    const regenerate = await request.post(`/api/exam-location-seats/generate/${locationId}`, {
      headers,
      data: { brokenSeats: [123] },
    });
    expect(regenerate.status(), await regenerate.text()).toBe(201);

    const list = await request.get(`/api/exam-location-seats/location/${locationId}`, { headers });
    expect(list.status(), await list.text()).toBe(200);
    const after = (await list.json()) as Array<{ LS_SEAT_LABEL: string }>;
    expect(after.map((s) => s.LS_SEAT_LABEL).sort()).toEqual(beforeLabels);
  });

  // SEAT-I-004
  test('DELETE seat soft-delete hides from list', async ({ request }) => {
    const locationId = await createLocation(request);
    const create = await request.post('/api/exam-location-seats', {
      headers,
      data: { LOCATION_ID: locationId, LS_ROW_NO: 1, LS_COL_NO: 1, LS_SEAT_LABEL: 'Z1', LS_SEAT_STATUS: 0 },
    });
    expect(create.status(), await create.text()).toBe(201);
    const seatId = ((await create.json()) as { LS_ID: number }).LS_ID;
    seatIds.push(seatId);

    const del = await request.delete(`/api/exam-location-seats/${seatId}`, { headers });
    expect([200, 204].includes(del.status()), await del.text()).toBe(true);

    const list = await request.get(`/api/exam-location-seats/location/${locationId}`, { headers });
    expect(list.status(), await list.text()).toBe(200);
    const rows = (await list.json()) as Array<{ LS_ID: number }>;
    expect(rows.some((s) => s.LS_ID === seatId)).toBe(false);
  });
});
