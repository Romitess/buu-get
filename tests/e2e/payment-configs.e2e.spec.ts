import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from './fixtures/auth';
import type { TestRoleKey } from './fixtures/users';

/**
 * E2E (API-only): Payment Configs HTTP lifecycle
 * Matrix: PCFG-E-001, PCFG-E-002, PCFG-E-003 (P0–P1)
 *
 * No Quasar UI for payment-configs — these assert full HTTP flows with
 * Playwright `request` + `apiLogin` under `--project=e2e`.
 */

type AuthHeaders = { Authorization: string };

type PaymentConfigRow = {
  PC_ID: number;
  PROVIDER_NAME: string;
  PC_COMP_CODE: string;
  PC_PROD_CODE: string;
  PC_IS_ACTIVE: boolean;
  PC_EFFECTIVE_FROM: string;
  PC_EFFECTIVE_TO: string | null;
};

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function apiBaseUrl(): string {
  return (
    process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3000'
  ).replace(/\/$/, '');
}

function pcApi(path = ''): string {
  return `${apiBaseUrl()}/api/payment-configs${path}`;
}

async function headersFor(
  request: APIRequestContext,
  role: TestRoleKey,
): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, role);
  return { Authorization: `Bearer ${accessToken}` };
}

function createPayload(
  suffix: string,
  overrides: Partial<{
    PROVIDER_NAME: string;
    PC_COMP_CODE: string;
    PC_PROD_CODE: string;
    PC_IS_ACTIVE: boolean;
    PC_EFFECTIVE_FROM: string;
    PC_EFFECTIVE_TO: string | null;
  }> = {},
): Record<string, unknown> {
  return {
    PROVIDER_NAME: `PCFG-E-${suffix}`.slice(0, 100),
    PC_COMP_CODE: `E${suffix}`.slice(0, 20),
    PC_PROD_CODE: `E${suffix}`.slice(0, 20),
    PC_IS_ACTIVE: true,
    PC_EFFECTIVE_FROM: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

test.describe('E2E API: Payment Configs lifecycle / RBAC / deactivate-delete', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90_000);

  let financeHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;
  let adminHeaders: AuthHeaders;

  /** Soft-delete in afterAll even if a case fails mid-flow. */
  const pcIds: number[] = [];

  test.beforeAll(async ({ request }) => {
    financeHeaders = await headersFor(request, 'finance');
    candidateHeaders = await headersFor(request, 'candidate');
    adminHeaders = await headersFor(request, 'admin');
  });

  test.afterAll(async ({ request }) => {
    const headers = adminHeaders ?? financeHeaders;
    if (!headers) return;
    for (const pcId of pcIds) {
      await request
        .delete(pcApi(`/${pcId}`), { headers })
        .catch(() => undefined);
    }
  });

  // PCFG-E-001 P1 — Finance CRUD create→list→get→patch→soft-delete
  test('PCFG-E-001: Finance CRUD create→list→get→patch→soft-delete', async ({
    request,
  }) => {
    const suffix = uniqueSuffix();
    const payload = createPayload(suffix);

    const createRes = await request.post(pcApi(), {
      headers: financeHeaders,
      data: payload,
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const created = (await createRes.json()) as PaymentConfigRow;
    pcIds.push(created.PC_ID);
    expect(created.PC_ID).toEqual(expect.any(Number));
    expect(created.PROVIDER_NAME).toBe(payload.PROVIDER_NAME);
    expect(created.PC_IS_ACTIVE).toBe(true);

    const listRes = await request.get(pcApi(), { headers: financeHeaders });
    expect(listRes.status(), await listRes.text()).toBe(200);
    const list = (await listRes.json()) as PaymentConfigRow[];
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((r) => r.PC_ID === created.PC_ID)).toBe(true);

    const getRes = await request.get(pcApi(`/${created.PC_ID}`), {
      headers: financeHeaders,
    });
    expect(getRes.status(), await getRes.text()).toBe(200);
    const fetched = (await getRes.json()) as PaymentConfigRow;
    expect(fetched.PC_ID).toBe(created.PC_ID);
    expect(fetched.PROVIDER_NAME).toBe(payload.PROVIDER_NAME);

    const patchedName = `PCFG-E-patched-${suffix}`.slice(0, 100);
    const patchRes = await request.patch(pcApi(`/${created.PC_ID}`), {
      headers: financeHeaders,
      data: { PROVIDER_NAME: patchedName, PC_COMP_CODE: 'EPATCH' },
    });
    expect(patchRes.status(), await patchRes.text()).toBe(200);
    const patched = (await patchRes.json()) as PaymentConfigRow;
    expect(patched.PROVIDER_NAME).toBe(patchedName);
    expect(patched.PC_COMP_CODE).toBe('EPATCH');

    const delRes = await request.delete(pcApi(`/${created.PC_ID}`), {
      headers: financeHeaders,
    });
    expect([200, 204]).toContain(delRes.status());

    const getAfter = await request.get(pcApi(`/${created.PC_ID}`), {
      headers: financeHeaders,
    });
    expect(getAfter.status()).toBe(404);

    const listAfter = await request.get(pcApi(), { headers: financeHeaders });
    expect(listAfter.status()).toBe(200);
    const rowsAfter = (await listAfter.json()) as PaymentConfigRow[];
    expect(rowsAfter.some((r) => r.PC_ID === created.PC_ID)).toBe(false);
  });

  // PCFG-E-002 P0 — Finance mutates OK; candidate GET/POST → 403
  test('PCFG-E-002: Finance mutates OK; candidate GET/POST → 403', async ({
    request,
  }) => {
    const suffix = uniqueSuffix();
    const createRes = await request.post(pcApi(), {
      headers: financeHeaders,
      data: createPayload(suffix),
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const created = (await createRes.json()) as PaymentConfigRow;
    pcIds.push(created.PC_ID);

    const financeGet = await request.get(pcApi(`/${created.PC_ID}`), {
      headers: financeHeaders,
    });
    expect(financeGet.status(), await financeGet.text()).toBe(200);

    const financePatch = await request.patch(pcApi(`/${created.PC_ID}`), {
      headers: financeHeaders,
      data: { PROVIDER_NAME: `PCFG-E-rbac-${suffix}`.slice(0, 100) },
    });
    expect(financePatch.status(), await financePatch.text()).toBe(200);

    const candidateList = await request.get(pcApi(), {
      headers: candidateHeaders,
    });
    expect(candidateList.status()).toBe(403);

    const candidateGet = await request.get(pcApi(`/${created.PC_ID}`), {
      headers: candidateHeaders,
    });
    expect(candidateGet.status()).toBe(403);

    const candidatePost = await request.post(pcApi(), {
      headers: candidateHeaders,
      data: createPayload(`cand${suffix}`),
    });
    expect(candidatePost.status()).toBe(403);
  });

  // PCFG-E-003 P1 — Deactivate then soft-delete → GET 404 / absent from list
  test('PCFG-E-003: Deactivate then soft-delete → GET 404 / absent from list', async ({
    request,
  }) => {
    const suffix = uniqueSuffix();
    const createRes = await request.post(pcApi(), {
      headers: financeHeaders,
      data: createPayload(suffix, { PC_IS_ACTIVE: true }),
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const created = (await createRes.json()) as PaymentConfigRow;
    pcIds.push(created.PC_ID);
    expect(created.PC_IS_ACTIVE).toBe(true);

    const deactivate = await request.patch(pcApi(`/${created.PC_ID}`), {
      headers: financeHeaders,
      data: { PC_IS_ACTIVE: false },
    });
    expect(deactivate.status(), await deactivate.text()).toBe(200);
    const inactive = (await deactivate.json()) as PaymentConfigRow;
    expect(inactive.PC_IS_ACTIVE).toBe(false);

    const getInactive = await request.get(pcApi(`/${created.PC_ID}`), {
      headers: financeHeaders,
    });
    expect(getInactive.status()).toBe(200);
    expect(
      ((await getInactive.json()) as PaymentConfigRow).PC_IS_ACTIVE,
    ).toBe(false);

    const delRes = await request.delete(pcApi(`/${created.PC_ID}`), {
      headers: financeHeaders,
    });
    expect([200, 204]).toContain(delRes.status());

    const getAfter = await request.get(pcApi(`/${created.PC_ID}`), {
      headers: financeHeaders,
    });
    expect(getAfter.status()).toBe(404);

    const listAfter = await request.get(pcApi(), { headers: financeHeaders });
    expect(listAfter.status()).toBe(200);
    const rows = (await listAfter.json()) as PaymentConfigRow[];
    expect(rows.some((r) => r.PC_ID === created.PC_ID)).toBe(false);
  });
});
