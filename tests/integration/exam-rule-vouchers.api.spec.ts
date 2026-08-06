import { test, expect, type APIRequestContext } from '@playwright/test';
import type { Connection, RowDataPacket } from 'mysql2/promise';
import mysql from 'mysql2/promise';
import { apiLogin } from '../e2e/fixtures/auth';

/**
 * Exam rule vouchers API integration — matrix ERV-I-001 … ERV-I-006
 *
 * Regulations are a singleton upsert (latest non-deleted row). Shared-DB mode:
 * - Auth/validation asserted via HTTP only
 * - Create-when-empty + row-count use DB helpers (no list/delete API exists)
 * - afterAll restores the original GET snapshot via PUT
 */

const REGULATIONS_PATH = '/api/exam-rule-vouchers/regulations';

type AuthHeaders = { Authorization: string };

type RegulationsBody = {
  regulationsEn: string;
  regulationsTh: string;
};

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

async function adminHeaders(
  request: APIRequestContext,
): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, 'admin');
  return { Authorization: `Bearer ${accessToken}` };
}

async function withDb<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  if (!host || !user || !password || !database) {
    throw new Error(
      'DB_HOST/DB_USER/DB_PASSWORD/DB_NAME required for ERV row-count helpers',
    );
  }
  const conn = await mysql.createConnection({
    host,
    port: Number(process.env.DB_PORT ?? 3306),
    user,
    password,
    database,
    connectTimeout: 10_000,
  });
  try {
    return await fn(conn);
  } finally {
    await conn.end();
  }
}

async function countActiveRules(): Promise<number> {
  return withDb(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS c FROM BUU_GET_T_EXAM_RULE_VOUCHERS WHERE DELETED_AT IS NULL',
    );
    return Number(rows[0]?.c ?? 0);
  });
}

/** Soft-delete active rows so saveRegulations takes the create path. */
async function softDeleteActiveRules(): Promise<void> {
  await withDb(async (conn) => {
    await conn.query(
      'UPDATE BUU_GET_T_EXAM_RULE_VOUCHERS SET DELETED_AT = NOW(6) WHERE DELETED_AT IS NULL',
    );
  });
}

test.describe('Exam rule vouchers API — regulations auth / validation / upsert', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(60_000);

  let headers: AuthHeaders;
  let original: RegulationsBody = { regulationsEn: '', regulationsTh: '' };
  let dbAvailable = true;
  let dbSkipReason = '';

  test.beforeAll(async ({ request }) => {
    headers = await adminHeaders(request);

    const getRes = await request.get(REGULATIONS_PATH, { headers });
    expect(getRes.status(), await getRes.text()).toBe(200);
    original = (await getRes.json()) as RegulationsBody;

    try {
      await countActiveRules();
    } catch (err) {
      dbAvailable = false;
      dbSkipReason = `DB helper unavailable: ${
        err instanceof Error ? err.message : String(err)
      }`;
    }
  });

  test.afterAll(async ({ request }) => {
    if (!headers) return;
    await request
      .put(REGULATIONS_PATH, {
        headers,
        data: {
          regulationsEn: original.regulationsEn ?? '',
          regulationsTh: original.regulationsTh ?? '',
        },
      })
      .catch(() => undefined);
  });

  // ERV-I-001
  test('GET regulations without JWT → 401', async ({ request }) => {
    const res = await request.get(REGULATIONS_PATH);
    expect(res.status(), await res.text()).toBe(401);
  });

  // ERV-I-002
  test('PUT regulations without JWT → 401', async ({ request }) => {
    const res = await request.put(REGULATIONS_PATH, {
      data: {
        regulationsEn: 'no-auth-en',
        regulationsTh: 'no-auth-th',
      },
    });
    expect(res.status(), await res.text()).toBe(401);
  });

  // ERV-I-003
  test('PUT regulations invalid body → 400', async ({ request }) => {
    const cases: unknown[] = [
      {},
      { regulationsEn: 'only-en' },
      { regulationsTh: 'only-th' },
      { regulationsEn: 123, regulationsTh: 'th' },
      { regulationsEn: 'en', regulationsTh: null },
      { regulationsEn: ['a'], regulationsTh: 'th' },
      { regulationsEn: 'en', regulationsTh: { x: 1 } },
    ];

    for (const data of cases) {
      const res = await request.put(REGULATIONS_PATH, {
        headers,
        data: data as Record<string, unknown>,
      });
      expect(
        res.status(),
        `expected 400 for body=${JSON.stringify(data)} got ${await res.text()}`,
      ).toBe(400);
    }
  });

  // ERV-I-004
  test('GET regulations returns persisted content', async ({ request }) => {
    const suffix = uniqueSuffix();
    const payload: RegulationsBody = {
      regulationsEn: `ERV-I-004 EN ${suffix}`,
      regulationsTh: `ERV-I-004 TH ${suffix}`,
    };

    const putRes = await request.put(REGULATIONS_PATH, {
      headers,
      data: payload,
    });
    expect(putRes.status(), await putRes.text()).toBe(200);
    const putBody = (await putRes.json()) as RegulationsBody;
    expect(putBody).toEqual(payload);

    const getRes = await request.get(REGULATIONS_PATH, { headers });
    expect(getRes.status(), await getRes.text()).toBe(200);
    const getBody = (await getRes.json()) as RegulationsBody;
    expect(getBody).toEqual(payload);
  });

  // ERV-I-005
  test('PUT create when empty then GET matches; 1 active row', async ({
    request,
  }) => {
    test.skip(!dbAvailable, dbSkipReason);

    await softDeleteActiveRules();
    expect(await countActiveRules()).toBe(0);

    const suffix = uniqueSuffix();
    const payload: RegulationsBody = {
      regulationsEn: `ERV-I-005 EN ${suffix}`,
      regulationsTh: `ERV-I-005 TH ${suffix}`,
    };

    const putRes = await request.put(REGULATIONS_PATH, {
      headers,
      data: payload,
    });
    expect(putRes.status(), await putRes.text()).toBe(200);
    expect(await putRes.json()).toEqual(payload);

    const getRes = await request.get(REGULATIONS_PATH, { headers });
    expect(getRes.status(), await getRes.text()).toBe(200);
    expect(await getRes.json()).toEqual(payload);

    expect(await countActiveRules()).toBe(1);
  });

  // ERV-I-006
  test('PUT twice updates same row (still 1 active row)', async ({
    request,
  }) => {
    test.skip(!dbAvailable, dbSkipReason);

    const before = await countActiveRules();
    if (before === 0) {
      const seed: RegulationsBody = {
        regulationsEn: `ERV-I-006 seed EN ${uniqueSuffix()}`,
        regulationsTh: `ERV-I-006 seed TH ${uniqueSuffix()}`,
      };
      const seedRes = await request.put(REGULATIONS_PATH, {
        headers,
        data: seed,
      });
      expect(seedRes.status(), await seedRes.text()).toBe(200);
    }
    expect(await countActiveRules()).toBe(1);

    const first: RegulationsBody = {
      regulationsEn: `ERV-I-006 first EN ${uniqueSuffix()}`,
      regulationsTh: `ERV-I-006 first TH ${uniqueSuffix()}`,
    };
    const second: RegulationsBody = {
      regulationsEn: `ERV-I-006 second EN ${uniqueSuffix()}`,
      regulationsTh: `ERV-I-006 second TH ${uniqueSuffix()}`,
    };

    const put1 = await request.put(REGULATIONS_PATH, {
      headers,
      data: first,
    });
    expect(put1.status(), await put1.text()).toBe(200);

    const put2 = await request.put(REGULATIONS_PATH, {
      headers,
      data: second,
    });
    expect(put2.status(), await put2.text()).toBe(200);
    expect(await put2.json()).toEqual(second);

    const getRes = await request.get(REGULATIONS_PATH, { headers });
    expect(getRes.status(), await getRes.text()).toBe(200);
    expect(await getRes.json()).toEqual(second);

    expect(await countActiveRules()).toBe(1);
  });
});
