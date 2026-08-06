import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import type { TestRoleKey } from '../e2e/fixtures/users';

/**
 * Score Criteria API integration — matrix CRI-I-001 … CRI-I-004
 *
 * Shared-DB note: band-rules are a single active global document.
 * beforeAll snapshots current rules; afterAll restores them.
 */

type AuthHeaders = { Authorization: string };

type BandRule = {
  id: string;
  band: string;
  minScore: number;
  maxScore: number;
  cefr: string;
  descriptor: string;
};

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

async function headersFor(
  request: APIRequestContext,
  role: TestRoleKey,
): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, role);
  return { Authorization: `Bearer ${accessToken}` };
}

function sampleRules(marker: string): BandRule[] {
  return [
    {
      id: '1',
      band: '1',
      minScore: 0,
      maxScore: 39,
      cefr: 'A1',
      descriptor: `CRI-I ${marker} low`,
    },
    {
      id: '2',
      band: '2',
      minScore: 40,
      maxScore: 100,
      cefr: 'B2',
      descriptor: `CRI-I ${marker} high`,
    },
  ];
}

test.describe('Score Criteria API — band-rules round-trip / authz', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90_000);

  let adminHeaders: AuthHeaders;
  let staffHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;
  let financeHeaders: AuthHeaders;
  let originalRules: BandRule[] = [];

  async function getBandRules(
    request: APIRequestContext,
    headers: AuthHeaders,
  ): Promise<BandRule[]> {
    const res = await request.get('/api/score-criteria/band-rules', {
      headers,
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as { bandRules: BandRule[] };
    return body.bandRules ?? [];
  }

  async function putBandRules(
    request: APIRequestContext,
    headers: AuthHeaders,
    bandRules: BandRule[],
  ): Promise<{ status: number; body: { bandRules?: BandRule[] } }> {
    const res = await request.put('/api/score-criteria/band-rules', {
      headers,
      data: { bandRules },
    });
    const body = (await res.json().catch(() => ({}))) as {
      bandRules?: BandRule[];
    };
    return { status: res.status(), body };
  }

  test.beforeAll(async ({ request }) => {
    adminHeaders = await headersFor(request, 'admin');
    staffHeaders = await headersFor(request, 'staff');
    candidateHeaders = await headersFor(request, 'candidate');
    financeHeaders = await headersFor(request, 'finance');
    originalRules = await getBandRules(request, adminHeaders);
  });

  test.afterAll(async ({ request }) => {
    // Restore shared active criteria so other suites are not polluted
    if (adminHeaders && originalRules) {
      await putBandRules(request, adminHeaders, originalRules).catch(
        () => undefined,
      );
    }
  });

  // CRI-I-001
  test('PUT band-rules then GET round-trip consistency', async ({
    request,
  }) => {
    const marker = uniqueSuffix();
    const payload = sampleRules(marker);

    const put = await putBandRules(request, adminHeaders, payload);
    expect(put.status).toBe(200);
    expect(put.body.bandRules).toEqual(payload);

    const fetched = await getBandRules(request, adminHeaders);
    expect(fetched).toEqual(payload);
  });

  // CRI-I-002
  test('PUT validation rejects invalid rule fields → 400', async ({
    request,
  }) => {
    const cases: unknown[] = [
      {},
      { bandRules: 'not-an-array' },
      {
        bandRules: [
          {
            id: 1,
            band: '1',
            minScore: 0,
            maxScore: 10,
            cefr: 'A1',
            descriptor: 'bad id type',
          },
        ],
      },
      {
        bandRules: [
          {
            id: '1',
            band: '1',
            minScore: 'zero',
            maxScore: 10,
            cefr: 'A1',
            descriptor: 'bad minScore',
          },
        ],
      },
      {
        bandRules: [
          {
            id: '1',
            band: '1',
            minScore: 0,
            maxScore: 10,
            // missing cefr / descriptor
          },
        ],
      },
    ];

    for (const data of cases) {
      const res = await request.put('/api/score-criteria/band-rules', {
        headers: adminHeaders,
        data,
      });
      expect(
        res.status(),
        `expected 400 for ${JSON.stringify(data)}`,
      ).toBe(400);
    }
  });

  // CRI-I-003
  test('GET/PUT require JWT → 401', async ({ request }) => {
    const getRes = await request.get('/api/score-criteria/band-rules');
    expect(getRes.status()).toBe(401);

    const putRes = await request.put('/api/score-criteria/band-rules', {
      data: { bandRules: sampleRules('unauth') },
    });
    expect(putRes.status()).toBe(401);
  });

  // CRI-I-004
  // Current product: no @Roles on controller → any authenticated JWT can mutate.
  // Authz risk flagged in MASTER_TEST_PLAN; assert current behavior.
  test('Any authenticated role can mutate band-rules (current behavior)', async ({
    request,
  }) => {
    const roles: Array<{ role: string; headers: AuthHeaders }> = [
      { role: 'admin', headers: adminHeaders },
      { role: 'staff', headers: staffHeaders },
      { role: 'candidate', headers: candidateHeaders },
      { role: 'finance', headers: financeHeaders },
    ];

    for (const r of roles) {
      const marker = `role-${r.role}-${uniqueSuffix()}`;
      const payload = sampleRules(marker);
      const put = await putBandRules(request, r.headers, payload);
      expect(put.status, `${r.role} PUT`).toBe(200);
      expect(put.body.bandRules).toEqual(payload);

      const fetched = await getBandRules(request, adminHeaders);
      expect(fetched, `${r.role} GET after PUT`).toEqual(payload);
    }
  });
});
