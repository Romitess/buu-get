import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';

type AuthHeaders = { Authorization: string };

async function adminHeaders(request: APIRequestContext): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, 'admin');
  return { Authorization: `Bearer ${accessToken}` };
}

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

test.describe('Exam locations API — Batch4 P0/P1', () => {
  test.describe.configure({ mode: 'serial' });
  let headers: AuthHeaders;
  const locationIds: number[] = [];

  test.beforeAll(async ({ request }) => {
    headers = await adminHeaders(request);
  });

  test.afterAll(async ({ request }) => {
    for (const id of locationIds) {
      await request
        .delete(`/api/exam-locations/${id}`, { headers })
        .catch(() => undefined);
    }
  });

  // LOC-I-001
  test('POST /api/exam-locations/with-seats creates location and seats atomically', async ({
    request,
  }) => {
    const suffix = uniqueSuffix();
    const res = await request.post('/api/exam-locations/with-seats', {
      headers,
      data: {
        LOCATION_NAME: `LOC-I ${suffix}`,
        LOCATION_ROOM_NO: `L${suffix.slice(-4)}`,
        LOCATION_TOTAL_ROWS: 2,
        LOCATION_TOTAL_COLS: 2,
        LOCATION_SEAT_CAPACITY: 4,
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { locationId: number; seatCount: number };
    locationIds.push(body.locationId);
    expect(body.seatCount).toBe(4);
  });

  // LOC-I-002
  test('GET /api/exam-locations?includeSeats=true embeds seats', async ({ request }) => {
    const suffix = uniqueSuffix();
    const create = await request.post('/api/exam-locations/with-seats', {
      headers,
      data: {
        LOCATION_NAME: `LOC-I seats ${suffix}`,
        LOCATION_ROOM_NO: `S${suffix.slice(-4)}`,
        LOCATION_TOTAL_ROWS: 2,
        LOCATION_TOTAL_COLS: 3,
        LOCATION_SEAT_CAPACITY: 6,
      },
    });
    expect(create.status(), await create.text()).toBe(201);
    const locationId = ((await create.json()) as { locationId: number }).locationId;
    locationIds.push(locationId);

    const list = await request.get('/api/exam-locations?includeSeats=true', { headers });
    expect(list.status(), await list.text()).toBe(200);
    const rows = (await list.json()) as Array<{ LOCATION_ID: number; SEATS?: unknown[] }>;
    const row = rows.find((r) => r.LOCATION_ID === locationId);
    expect(row).toBeTruthy();
    expect(Array.isArray(row?.SEATS)).toBe(true);
    expect((row?.SEATS ?? []).length).toBe(6);
  });

  // LOC-I-003
  test('DELETE /api/exam-locations/:id soft delete hides location', async ({ request }) => {
    const suffix = uniqueSuffix();
    const create = await request.post('/api/exam-locations', {
      headers,
      data: {
        LOCATION_NAME: `LOC-I del ${suffix}`,
        LOCATION_ROOM_NO: `D${suffix.slice(-4)}`,
        LOCATION_TOTAL_ROWS: 1,
        LOCATION_TOTAL_COLS: 1,
        LOCATION_SEAT_CAPACITY: 1,
      },
    });
    expect(create.status(), await create.text()).toBe(201);
    const locationId = ((await create.json()) as { LOCATION_ID: number }).LOCATION_ID;
    locationIds.push(locationId);

    const del = await request.delete(`/api/exam-locations/${locationId}`, { headers });
    expect([200, 204].includes(del.status()), await del.text()).toBe(true);

    const get = await request.get(`/api/exam-locations/${locationId}`, { headers });
    expect(get.status(), await get.text()).toBe(404);
  });
});
