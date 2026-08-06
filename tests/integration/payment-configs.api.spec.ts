import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import type { TestRoleKey } from '../e2e/fixtures/users';

/**
 * Payment Configs API integration — matrix PCFG-I-001 … PCFG-I-016
 *
 * Seed approach (shared-DB, disposable via API):
 * 1. Login FINANCE_ROLES (admin/finance/staff) + candidate for RBAC
 * 2. Admin creates exam + payment-config when txn side-effects are needed
 * 3. afterAll soft-deletes created txns, enrollments, sessions, PCs, exam
 */

const EXAM_FEE = 500;

type AuthHeaders = { Authorization: string };

type PaymentConfigRow = {
  PC_ID: number;
  PROVIDER_NAME: string;
  PC_COMP_CODE: string;
  PC_PROD_CODE: string;
  PC_IS_ACTIVE: boolean;
  PC_EFFECTIVE_FROM: string;
  PC_EFFECTIVE_TO: string | null;
  TRANSACTIONS?: Array<{ TRANX_ID: number; PC_ID?: number }>;
  DELETED_AT?: string | null;
};

type EnrollmentRow = {
  ERM_ID: number;
  USER_ID: number;
  SESSION_ID: number;
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

async function jsonOrEmpty(res: {
  json: () => Promise<unknown>;
}): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
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
  const base: Record<string, unknown> = {
    PROVIDER_NAME: `PCFG-${suffix}`.slice(0, 100),
    PC_COMP_CODE: `C${suffix}`.slice(0, 20),
    PC_PROD_CODE: `P${suffix}`.slice(0, 20),
    PC_IS_ACTIVE: true,
    PC_EFFECTIVE_FROM: '2026-01-01T00:00:00.000Z',
  };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null && key === 'PC_EFFECTIVE_TO') {
      // omit null TO — callers that want explicit null pass it differently
      continue;
    }
    if (value !== undefined) {
      base[key] = value;
    }
  }
  if (
    Object.prototype.hasOwnProperty.call(overrides, 'PC_EFFECTIVE_TO') &&
    overrides.PC_EFFECTIVE_TO !== undefined &&
    overrides.PC_EFFECTIVE_TO !== null
  ) {
    base.PC_EFFECTIVE_TO = overrides.PC_EFFECTIVE_TO;
  }
  return base;
}

test.describe('Payment Configs API — CRUD / authz / validation flows', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120_000);

  let adminHeaders: AuthHeaders;
  let financeHeaders: AuthHeaders;
  let staffHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;

  let candidateUserId: number;
  let examId: number | null = null;
  let seedPcId: number | null = null;

  const pcIds: number[] = [];
  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const transactionIds: number[] = [];

  let sessionSlot = 0;
  let txnSeedReady = false;
  let txnSeedSkipReason = '';

  async function createPc(
    request: APIRequestContext,
    headers: AuthHeaders,
    overrides: Parameters<typeof createPayload>[1] = {},
  ): Promise<PaymentConfigRow> {
    const suffix = uniqueSuffix();
    const res = await request.post('/api/payment-configs', {
      headers,
      data: createPayload(suffix, overrides),
    });
    const text = await res.text();
    expect(res.status(), text).toBe(201);
    const body = JSON.parse(text) as PaymentConfigRow;
    pcIds.push(body.PC_ID);
    return body;
  }

  async function createSession(
    request: APIRequestContext,
  ): Promise<number> {
    const { start, end } = hourMinute(sessionSlot++);
    const res = await request.post('/api/exam-sessions', {
      headers: adminHeaders,
      data: {
        EXAM_ID: examId,
        SS_START_TIME: start,
        SS_END_TIME: end,
        SS_CAPACITY: 30,
        SS_SESSION_STATUS: 1,
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { SS_ID: number };
    sessionIds.push(body.SS_ID);
    return body.SS_ID;
  }

  async function createEnrollment(
    request: APIRequestContext,
  ): Promise<EnrollmentRow> {
    const sessionId = await createSession(request);
    const res = await request.post('/api/exam-enrollments', {
      headers: candidateHeaders,
      data: {
        USER_ID: candidateUserId,
        SESSION_ID: sessionId,
      },
    });
    const text = await res.text();
    expect(res.status(), text).toBe(201);
    const body = JSON.parse(text) as EnrollmentRow;
    enrollmentIds.push(body.ERM_ID);
    return body;
  }

  async function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    label: string,
  ): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`${label} timed out after ${ms}ms`)),
            ms,
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function createPendingTxn(
    request: APIRequestContext,
    pcId: number,
  ): Promise<number> {
    const enrollment = await withTimeout(
      createEnrollment(request),
      20_000,
      'createEnrollment',
    );
    const res = await withTimeout(
      request.post('/api/transactions', {
        headers: candidateHeaders,
        data: {
          ermId: enrollment.ERM_ID,
          pcId,
          amount: EXAM_FEE,
        },
      }),
      20_000,
      'POST /transactions',
    );
    const text = await res.text();
    expect(res.status(), text).toBe(201);
    const body = JSON.parse(text) as { TRANX_ID: number };
    transactionIds.push(body.TRANX_ID);
    return body.TRANX_ID;
  }

  test.beforeAll(async ({ request }) => {
    adminHeaders = await headersFor(request, 'admin');
    financeHeaders = await headersFor(request, 'finance');
    staffHeaders = await headersFor(request, 'staff');
    candidateHeaders = await headersFor(request, 'candidate');

    const me = await request.get('/api/auth/me', {
      headers: candidateHeaders,
    });
    expect(me.status()).toBe(200);
    candidateUserId = ((await me.json()) as { id: number }).id;

    // Disposable exam + PC for cases that need a linked transaction
    const suffix = uniqueSuffix();
    const examRes = await request.post('/api/exam', {
      headers: adminHeaders,
      data: {
        EXAM_NAME: `PCFG-I ${suffix}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE,
        EXAM_DATE: '2026-12-28',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: 'PC',
        EXAM_FISCAL_YEAR: '2026',
        FUND_SOURCE_ID: 1,
        SRB_ID: 1,
      },
    });
    if (![200, 201].includes(examRes.status())) {
      txnSeedSkipReason = `Cannot create disposable exam: ${examRes.status()} ${await examRes.text()}`;
      return;
    }
    examId = ((await examRes.json()) as { EXAM_ID: number }).EXAM_ID;

    const pcRes = await request.post('/api/payment-configs', {
      headers: financeHeaders,
      data: createPayload(`seed${suffix}`),
    });
    if (pcRes.status() !== 201) {
      txnSeedSkipReason = `Cannot create seed PC: ${pcRes.status()} ${await pcRes.text()}`;
      return;
    }
    seedPcId = ((await pcRes.json()) as PaymentConfigRow).PC_ID;
    pcIds.push(seedPcId);
    txnSeedReady = true;
  });

  test.afterAll(async ({ request }) => {
    for (const tranxId of transactionIds) {
      await request
        .delete(`/api/transactions/${tranxId}`, { headers: adminHeaders })
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
    for (const pcId of pcIds) {
      await request
        .delete(`/api/payment-configs/${pcId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    if (examId) {
      await request
        .delete(`/api/exam/${examId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
  });

  function requireTxnSeed(): void {
    test.skip(
      !txnSeedReady,
      txnSeedSkipReason || 'Disposable exam/PC seed failed',
    );
  }

  // PCFG-I-001
  test('POST creates row (FINANCE)', async ({ request }) => {
    const suffix = uniqueSuffix();
    const payload = createPayload(suffix);
    const res = await request.post('/api/payment-configs', {
      headers: financeHeaders,
      data: payload,
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as PaymentConfigRow;
    pcIds.push(body.PC_ID);

    expect(body.PC_ID).toEqual(expect.any(Number));
    expect(body.PROVIDER_NAME).toBe(payload.PROVIDER_NAME);
    expect(body.PC_COMP_CODE).toBe(payload.PC_COMP_CODE);
    expect(body.PC_PROD_CODE).toBe(payload.PC_PROD_CODE);
    expect(body.PC_IS_ACTIVE).toBe(true);

    const getRes = await request.get(`/api/payment-configs/${body.PC_ID}`, {
      headers: financeHeaders,
    });
    expect(getRes.status(), await getRes.text()).toBe(200);
    const fetched = (await getRes.json()) as PaymentConfigRow;
    expect(fetched.PC_ID).toBe(body.PC_ID);
    expect(fetched.PROVIDER_NAME).toBe(payload.PROVIDER_NAME);
  });

  // PCFG-I-002
  test('GET lists configs; soft-deleted excluded', async ({ request }) => {
    const created = await createPc(request, financeHeaders);
    const listBefore = await request.get('/api/payment-configs', {
      headers: financeHeaders,
    });
    expect(listBefore.status(), await listBefore.text()).toBe(200);
    const rowsBefore = (await listBefore.json()) as PaymentConfigRow[];
    expect(Array.isArray(rowsBefore)).toBe(true);
    expect(rowsBefore.some((r) => r.PC_ID === created.PC_ID)).toBe(true);

    const del = await request.delete(
      `/api/payment-configs/${created.PC_ID}`,
      { headers: financeHeaders },
    );
    expect([200, 204]).toContain(del.status());

    const listAfter = await request.get('/api/payment-configs', {
      headers: financeHeaders,
    });
    expect(listAfter.status(), await listAfter.text()).toBe(200);
    const rowsAfter = (await listAfter.json()) as PaymentConfigRow[];
    expect(rowsAfter.some((r) => r.PC_ID === created.PC_ID)).toBe(false);
  });

  // PCFG-I-004
  test('GET /:id unknown → 404', async ({ request }) => {
    const missingId = 2_147_483_646;
    const res = await request.get(`/api/payment-configs/${missingId}`, {
      headers: financeHeaders,
    });
    expect(res.status()).toBe(404);
    const err = await jsonOrEmpty(res);
    expect(String(err.message)).toMatch(/not found/i);
  });

  // PCFG-I-005
  test('PATCH updates fields', async ({ request }) => {
    const created = await createPc(request, financeHeaders);
    const newName = `PCFG-patched-${uniqueSuffix()}`.slice(0, 100);
    const res = await request.patch(
      `/api/payment-configs/${created.PC_ID}`,
      {
        headers: financeHeaders,
        data: {
          PROVIDER_NAME: newName,
          PC_COMP_CODE: 'PATCHEDCOMP',
        },
      },
    );
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as PaymentConfigRow;
    expect(body.PROVIDER_NAME).toBe(newName);
    expect(body.PC_COMP_CODE).toBe('PATCHEDCOMP');

    const getRes = await request.get(
      `/api/payment-configs/${created.PC_ID}`,
      { headers: financeHeaders },
    );
    expect(getRes.status()).toBe(200);
    const fetched = (await getRes.json()) as PaymentConfigRow;
    expect(fetched.PROVIDER_NAME).toBe(newName);
    expect(fetched.PC_COMP_CODE).toBe('PATCHEDCOMP');
  });

  // PCFG-I-006
  test('DELETE soft-deletes; subsequent GET → 404', async ({ request }) => {
    const created = await createPc(request, financeHeaders);
    const del = await request.delete(
      `/api/payment-configs/${created.PC_ID}`,
      { headers: financeHeaders },
    );
    expect([200, 204]).toContain(del.status());

    const getRes = await request.get(
      `/api/payment-configs/${created.PC_ID}`,
      { headers: financeHeaders },
    );
    expect(getRes.status()).toBe(404);
  });

  // PCFG-I-008
  test('ValidationPipe rejects bad create', async ({ request }) => {
    const cases: Record<string, unknown>[] = [
      {},
      {
        PROVIDER_NAME: '',
        PC_COMP_CODE: 'C1',
        PC_PROD_CODE: 'P1',
        PC_IS_ACTIVE: true,
        PC_EFFECTIVE_FROM: '2026-01-01T00:00:00.000Z',
      },
      {
        PROVIDER_NAME: 'x'.repeat(101),
        PC_COMP_CODE: 'C1',
        PC_PROD_CODE: 'P1',
        PC_IS_ACTIVE: true,
        PC_EFFECTIVE_FROM: '2026-01-01T00:00:00.000Z',
      },
      {
        PROVIDER_NAME: 'Ok',
        PC_COMP_CODE: 'C1',
        PC_PROD_CODE: 'P1',
        PC_IS_ACTIVE: 'yes',
        PC_EFFECTIVE_FROM: '2026-01-01T00:00:00.000Z',
      },
      {
        PROVIDER_NAME: 'Ok',
        PC_COMP_CODE: 'C1',
        PC_PROD_CODE: 'P1',
        PC_IS_ACTIVE: true,
        PC_EFFECTIVE_FROM: 'not-a-date',
      },
      {
        PROVIDER_NAME: 'Ok',
        PC_COMP_CODE: 'C1',
        PC_PROD_CODE: 'P1',
        // missing PC_IS_ACTIVE + EFFECTIVE_FROM
      },
    ];

    for (const data of cases) {
      const res = await request.post('/api/payment-configs', {
        headers: financeHeaders,
        data,
      });
      expect(
        res.status(),
        `create expected 400 for ${JSON.stringify(data)}`,
      ).toBe(400);
    }
  });

  // PCFG-I-009
  test('ParseIntPipe non-int :id → 400', async ({ request }) => {
    const res = await request.get('/api/payment-configs/abc', {
      headers: financeHeaders,
    });
    expect(res.status()).toBe(400);
  });

  // PCFG-I-010
  test('Unauthenticated → 401', async ({ request }) => {
    const routes: Array<{
      method: 'get' | 'post' | 'patch' | 'delete';
      path: string;
      data?: Record<string, unknown>;
    }> = [
      { method: 'get', path: '/api/payment-configs' },
      {
        method: 'post',
        path: '/api/payment-configs',
        data: createPayload(uniqueSuffix()),
      },
      { method: 'get', path: '/api/payment-configs/1' },
      {
        method: 'patch',
        path: '/api/payment-configs/1',
        data: { PC_IS_ACTIVE: false },
      },
      { method: 'delete', path: '/api/payment-configs/1' },
    ];

    for (const route of routes) {
      const res = await request[route.method](route.path, {
        data: route.data,
      });
      expect(
        res.status(),
        `${route.method.toUpperCase()} ${route.path} should be 401`,
      ).toBe(401);
    }
  });

  // PCFG-I-011
  test('Non-FINANCE (candidate) → 403', async ({ request }) => {
    const list = await request.get('/api/payment-configs', {
      headers: candidateHeaders,
    });
    expect(list.status()).toBe(403);

    const create = await request.post('/api/payment-configs', {
      headers: candidateHeaders,
      data: createPayload(uniqueSuffix()),
    });
    expect(create.status()).toBe(403);

    const targetId = seedPcId ?? 1;
    const patch = await request.patch(`/api/payment-configs/${targetId}`, {
      headers: candidateHeaders,
      data: { PC_IS_ACTIVE: false },
    });
    expect(patch.status()).toBe(403);

    const del = await request.delete(`/api/payment-configs/${targetId}`, {
      headers: candidateHeaders,
    });
    expect(del.status()).toBe(403);
  });

  // PCFG-I-012
  test('ADMIN / FINANCE / STAFF allowed on GET', async ({ request }) => {
    for (const headers of [adminHeaders, financeHeaders, staffHeaders]) {
      const res = await request.get('/api/payment-configs', { headers });
      expect(res.status(), await res.text()).toBe(200);
      const rows = (await res.json()) as PaymentConfigRow[];
      expect(Array.isArray(rows)).toBe(true);
    }
  });

  // PCFG-I-013
  test('Persist EFFECTIVE_TO null when omitted', async ({ request }) => {
    const suffix = uniqueSuffix();
    const payload = createPayload(suffix); // no PC_EFFECTIVE_TO
    expect(payload).not.toHaveProperty('PC_EFFECTIVE_TO');

    const res = await request.post('/api/payment-configs', {
      headers: financeHeaders,
      data: payload,
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as PaymentConfigRow;
    pcIds.push(body.PC_ID);
    expect(body.PC_EFFECTIVE_TO).toBeNull();

    const getRes = await request.get(`/api/payment-configs/${body.PC_ID}`, {
      headers: financeHeaders,
    });
    expect(getRes.status()).toBe(200);
    const fetched = (await getRes.json()) as PaymentConfigRow;
    expect(fetched.PC_EFFECTIVE_TO).toBeNull();
  });

  // PCFG-I-014
  test('Deactivate PC_IS_ACTIVE false', async ({ request }) => {
    const created = await createPc(request, financeHeaders, {
      PC_IS_ACTIVE: true,
    });
    expect(created.PC_IS_ACTIVE).toBe(true);

    const res = await request.patch(
      `/api/payment-configs/${created.PC_ID}`,
      {
        headers: financeHeaders,
        data: { PC_IS_ACTIVE: false },
      },
    );
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as PaymentConfigRow;
    expect(body.PC_IS_ACTIVE).toBe(false);

    const getRes = await request.get(
      `/api/payment-configs/${created.PC_ID}`,
      { headers: financeHeaders },
    );
    expect(getRes.status()).toBe(200);
    expect(((await getRes.json()) as PaymentConfigRow).PC_IS_ACTIVE).toBe(
      false,
    );
  });

  // PCFG-I-015 — documented current behavior: no FROM≤TO range check
  test('Accepts TO < FROM (no range validation)', async ({ request }) => {
    const suffix = uniqueSuffix();
    const res = await request.post('/api/payment-configs', {
      headers: financeHeaders,
      data: createPayload(suffix, {
        PC_EFFECTIVE_FROM: '2026-12-31T00:00:00.000Z',
        PC_EFFECTIVE_TO: '2026-01-01T00:00:00.000Z',
      }),
    });
    expect(
      res.status(),
      `Expected 201 (no range check); got ${res.status()} ${await res.text()}`,
    ).toBe(201);
    const body = (await res.json()) as PaymentConfigRow;
    pcIds.push(body.PC_ID);
    expect(body.PC_ID).toEqual(expect.any(Number));
  });

  // PCFG-I-016 — documented current behavior: no unique on COMP/PROD
  test('Duplicate COMP/PROD codes allowed', async ({ request }) => {
    const suffix = uniqueSuffix();
    const shared = {
      PC_COMP_CODE: `DUP${suffix}`.slice(0, 20),
      PC_PROD_CODE: `DUP${suffix}`.slice(0, 20),
    };
    const first = await createPc(request, financeHeaders, shared);
    const secondRes = await request.post('/api/payment-configs', {
      headers: financeHeaders,
      data: createPayload(`b${suffix}`, {
        ...shared,
        PROVIDER_NAME: `PCFG-dup-${suffix}`.slice(0, 100),
      }),
    });
    expect(
      secondRes.status(),
      `Expected 201 (no unique constraint); got ${secondRes.status()} ${await secondRes.text()}`,
    ).toBe(201);
    const second = (await secondRes.json()) as PaymentConfigRow;
    pcIds.push(second.PC_ID);
    expect(second.PC_ID).not.toBe(first.PC_ID);
    expect(second.PC_COMP_CODE).toBe(shared.PC_COMP_CODE);
    expect(second.PC_PROD_CODE).toBe(shared.PC_PROD_CODE);
  });

  // PCFG-I-003 — matrix allows ± txn; assert relation key always present
  test('GET /:id includes TRANSACTIONS relation', async ({ request }) => {
    const pc = await createPc(request, financeHeaders);
    const res = await request.get(`/api/payment-configs/${pc.PC_ID}`, {
      headers: financeHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as PaymentConfigRow;
    expect(body.TRANSACTIONS).toEqual(expect.any(Array));

    // Optional: attach a txn when exam seed is healthy
    if (!txnSeedReady) return;
    let tranxId: number;
    try {
      tranxId = await createPendingTxn(request, pc.PC_ID);
    } catch (err) {
      test.info().annotations.push({
        type: 'note',
        description: `Skipped txn attach: ${String(err)}`,
      });
      return;
    }
    const withTxn = await request.get(`/api/payment-configs/${pc.PC_ID}`, {
      headers: financeHeaders,
    });
    expect(withTxn.status(), await withTxn.text()).toBe(200);
    const linked = (await withTxn.json()) as PaymentConfigRow;
    expect(linked.TRANSACTIONS!.some((t) => t.TRANX_ID === tranxId)).toBe(
      true,
    );
  });

  // PCFG-I-007
  test('Soft-delete OK when FK transaction exists', async ({ request }) => {
    requireTxnSeed();
    const pc = await createPc(request, financeHeaders);
    let tranxId: number;
    try {
      tranxId = await createPendingTxn(request, pc.PC_ID);
    } catch (err) {
      test.skip(true, `Cannot seed FK transaction: ${String(err)}`);
      return;
    }

    const del = await request.delete(`/api/payment-configs/${pc.PC_ID}`, {
      headers: financeHeaders,
    });
    expect(
      [200, 204].includes(del.status()),
      `Expected soft-delete OK with FK txn; got ${del.status()} ${await del.text()}`,
    ).toBe(true);

    const getPc = await request.get(`/api/payment-configs/${pc.PC_ID}`, {
      headers: financeHeaders,
    });
    expect(getPc.status()).toBe(404);

    // Transaction row should still be reachable (PC soft-delete must not cascade)
    const getTxn = await request.get(`/api/transactions/${tranxId}`, {
      headers: adminHeaders,
    });
    expect(
      getTxn.status(),
      `Txn should remain after PC soft-delete: ${await getTxn.text()}`,
    ).toBe(200);
  });
});
