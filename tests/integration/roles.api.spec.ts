import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import { type TestRoleKey } from '../e2e/fixtures/users';

type RoleRow = {
  ROLE_ID: number;
  ROLE_NAME: string;
  ROLE_DESCRIPTION: string;
  DELETED_AT?: string | null;
};

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function disposableRoleName(prefix = 'roles-i'): string {
  return `${prefix}-${uniqueSuffix()}`;
}

function createRoleBody(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ROLE_NAME: disposableRoleName('create'),
    ROLE_DESCRIPTION: 'Disposable integration-test role',
    ...overrides,
  };
}

async function bearer(
  request: APIRequestContext,
  role: TestRoleKey,
): Promise<{ Authorization: string }> {
  const { accessToken } = await apiLogin(request, role);
  return { Authorization: `Bearer ${accessToken}` };
}

async function adminCreateRole(
  request: APIRequestContext,
  adminHeaders: { Authorization: string },
  overrides: Record<string, unknown> = {},
): Promise<{ status: number; body: RoleRow; name: string }> {
  const data = createRoleBody(overrides);
  const res = await request.post('/api/roles', {
    headers: adminHeaders,
    data,
  });
  const body = (await res.json().catch(() => ({}))) as RoleRow;
  return {
    status: res.status(),
    body,
    name: String(data.ROLE_NAME),
  };
}

/** Hard-delete disposable role; ignore failures so teardown never masks assertion errors. */
async function hardDeleteRole(
  request: APIRequestContext,
  adminHeaders: { Authorization: string },
  roleId: number | undefined,
): Promise<void> {
  if (roleId == null || Number.isNaN(roleId)) return;
  await request
    .delete(`/api/roles/${roleId}`, { headers: adminHeaders })
    .catch(() => undefined);
}

test.describe('Roles API — create', () => {
  // ROLES-I-001
  test('POST /api/roles as admin creates', async ({ request }) => {
    const adminHeaders = await bearer(request, 'admin');
    const name = disposableRoleName('i001');

    const res = await request.post('/api/roles', {
      headers: adminHeaders,
      data: createRoleBody({
        ROLE_NAME: name,
        ROLE_DESCRIPTION: 'ROLES-I-001 create',
      }),
    });

    expect([200, 201]).toContain(res.status());
    const body = (await res.json()) as RoleRow;
    expect(body.ROLE_ID).toEqual(expect.any(Number));
    expect(body.ROLE_NAME).toBe(name);
    expect(body.ROLE_DESCRIPTION).toBe('ROLES-I-001 create');

    // Side effect: appears in list
    const listRes = await request.get('/api/roles', { headers: adminHeaders });
    expect(listRes.status()).toBe(200);
    const list = (await listRes.json()) as RoleRow[];
    expect(list.some((r) => r.ROLE_ID === body.ROLE_ID && r.ROLE_NAME === name)).toBe(
      true,
    );

    await hardDeleteRole(request, adminHeaders, body.ROLE_ID);
  });

  // ROLES-I-002
  test('POST /api/roles invalid body → 400', async ({ request }) => {
    const adminHeaders = await bearer(request, 'admin');
    const cases: Record<string, unknown>[] = [
      { ROLE_NAME: '', ROLE_DESCRIPTION: 'desc' },
      { ROLE_NAME: 'ok', ROLE_DESCRIPTION: '' },
      { ROLE_DESCRIPTION: 'missing name' },
      { ROLE_NAME: 'missing desc' },
      { ROLE_NAME: 123, ROLE_DESCRIPTION: 'desc' },
      {},
    ];

    for (const data of cases) {
      const res = await request.post('/api/roles', {
        headers: adminHeaders,
        data,
      });
      expect(
        res.status(),
        `expected 400 for body=${JSON.stringify(data)}`,
      ).toBe(400);
    }
  });

  // ROLES-I-003
  test('POST /api/roles unknown props → 400 (forbidNonWhitelisted)', async ({
    request,
  }) => {
    const adminHeaders = await bearer(request, 'admin');
    const res = await request.post('/api/roles', {
      headers: adminHeaders,
      data: {
        ROLE_NAME: disposableRoleName('i003'),
        ROLE_DESCRIPTION: 'extra field test',
        EXTRA_UNKNOWN: 'should-be-rejected',
      },
    });
    expect(res.status()).toBe(400);
  });

  // ROLES-I-004
  test('POST /api/roles forbidden non-admin (candidate) → 403', async ({
    request,
  }) => {
    const candidateHeaders = await bearer(request, 'candidate');
    const res = await request.post('/api/roles', {
      headers: candidateHeaders,
      data: createRoleBody({ ROLE_NAME: disposableRoleName('i004') }),
    });
    expect(res.status()).toBe(403);
  });

  // ROLES-I-005
  test('POST /api/roles no JWT → 401', async ({ request }) => {
    const res = await request.post('/api/roles', {
      data: createRoleBody({ ROLE_NAME: disposableRoleName('i005') }),
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Roles API — list & get', () => {
  // ROLES-I-006
  test('GET /api/roles admin list', async ({ request }) => {
    const adminHeaders = await bearer(request, 'admin');
    const res = await request.get('/api/roles', { headers: adminHeaders });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as RoleRow[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toMatchObject({
      ROLE_ID: expect.any(Number),
      ROLE_NAME: expect.any(String),
      ROLE_DESCRIPTION: expect.any(String),
    });
  });

  // ROLES-I-007
  test('GET /api/roles/:id', async ({ request }) => {
    const adminHeaders = await bearer(request, 'admin');
    const created = await adminCreateRole(request, adminHeaders, {
      ROLE_NAME: disposableRoleName('i007'),
      ROLE_DESCRIPTION: 'ROLES-I-007 get by id',
    });
    expect([200, 201]).toContain(created.status);

    const res = await request.get(`/api/roles/${created.body.ROLE_ID}`, {
      headers: adminHeaders,
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as RoleRow | null;
    // Service returns entity or null (no NotFoundException)
    expect(body).not.toBeNull();
    expect(body).toMatchObject({
      ROLE_ID: created.body.ROLE_ID,
      ROLE_NAME: created.name,
    });

    await hardDeleteRole(request, adminHeaders, created.body.ROLE_ID);
  });

  // ROLES-I-008
  test('GET /api/roles/:id non-int → 400 ParseIntPipe', async ({
    request,
  }) => {
    const adminHeaders = await bearer(request, 'admin');
    const res = await request.get('/api/roles/abc', { headers: adminHeaders });
    expect(res.status()).toBe(400);
  });
});

test.describe('Roles API — update & delete', () => {
  // ROLES-I-009
  test('PATCH /api/roles/:id', async ({ request }) => {
    const adminHeaders = await bearer(request, 'admin');
    const created = await adminCreateRole(request, adminHeaders, {
      ROLE_NAME: disposableRoleName('i009'),
      ROLE_DESCRIPTION: 'before patch',
    });
    expect([200, 201]).toContain(created.status);

    const newDesc = `patched-${uniqueSuffix()}`;
    const patchRes = await request.patch(
      `/api/roles/${created.body.ROLE_ID}`,
      {
        headers: adminHeaders,
        data: { ROLE_DESCRIPTION: newDesc },
      },
    );
    expect(patchRes.status()).toBe(200);

    // Side effect via GET
    const getRes = await request.get(`/api/roles/${created.body.ROLE_ID}`, {
      headers: adminHeaders,
    });
    expect(getRes.status()).toBe(200);
    const fetched = (await getRes.json()) as RoleRow;
    expect(fetched.ROLE_DESCRIPTION).toBe(newDesc);
    expect(fetched.ROLE_NAME).toBe(created.name);

    await hardDeleteRole(request, adminHeaders, created.body.ROLE_ID);
  });

  // ROLES-I-010
  test('DELETE /api/roles/:id hard-deletes disposable role', async ({
    request,
  }) => {
    const adminHeaders = await bearer(request, 'admin');
    // Unique disposable role — never delete seeded RoleEnum rows
    const created = await adminCreateRole(request, adminHeaders, {
      ROLE_NAME: disposableRoleName('i010-disposable'),
      ROLE_DESCRIPTION: 'ROLES-I-010 hard delete target',
    });
    expect([200, 201]).toContain(created.status);
    const roleId = created.body.ROLE_ID;

    const delRes = await request.delete(`/api/roles/${roleId}`, {
      headers: adminHeaders,
    });
    expect([200, 204]).toContain(delRes.status());

    // Hard delete: findOne returns null — Nest may emit empty body or JSON null
    const getRes = await request.get(`/api/roles/${roleId}`, {
      headers: adminHeaders,
    });
    expect(getRes.status()).toBe(200);
    const raw = await getRes.text();
    const body = raw.trim() === '' ? null : (JSON.parse(raw) as RoleRow | null);
    expect(body).toBeNull();

    // Not in list
    const listRes = await request.get('/api/roles', { headers: adminHeaders });
    expect(listRes.status()).toBe(200);
    const list = (await listRes.json()) as RoleRow[];
    expect(list.some((r) => r.ROLE_ID === roleId)).toBe(false);
  });
});

test.describe('Roles API — authorization & edge cases', () => {
  // ROLES-I-011
  test('all /api/roles endpoints deny non-admin (staff) → 403', async ({
    request,
  }) => {
    const staffHeaders = await bearer(request, 'staff');
    const adminHeaders = await bearer(request, 'admin');

    // Disposable id for PATCH/DELETE paths (staff must not mutate; admin cleans up)
    const created = await adminCreateRole(request, adminHeaders, {
      ROLE_NAME: disposableRoleName('i011'),
    });
    expect([200, 201]).toContain(created.status);
    const id = created.body.ROLE_ID;

    const postRes = await request.post('/api/roles', {
      headers: staffHeaders,
      data: createRoleBody({ ROLE_NAME: disposableRoleName('i011-post') }),
    });
    expect(postRes.status(), 'POST').toBe(403);

    const listRes = await request.get('/api/roles', { headers: staffHeaders });
    expect(listRes.status(), 'GET list').toBe(403);

    const getRes = await request.get(`/api/roles/${id}`, {
      headers: staffHeaders,
    });
    expect(getRes.status(), 'GET by id').toBe(403);

    const patchRes = await request.patch(`/api/roles/${id}`, {
      headers: staffHeaders,
      data: { ROLE_DESCRIPTION: 'staff should not update' },
    });
    expect(patchRes.status(), 'PATCH').toBe(403);

    const delRes = await request.delete(`/api/roles/${id}`, {
      headers: staffHeaders,
    });
    expect(delRes.status(), 'DELETE').toBe(403);

    await hardDeleteRole(request, adminHeaders, id);
  });

  // ROLES-I-012
  test('findByName via list — seeded candidate ROLE_NAME present', async ({
    request,
  }) => {
    // findByName is service-only (no public HTTP endpoint). Covered indirectly:
    // GET /api/roles must include the seeded RoleEnum.CANDIDATE row.
    const adminHeaders = await bearer(request, 'admin');
    const res = await request.get('/api/roles', { headers: adminHeaders });
    expect(res.status()).toBe(200);
    const list = (await res.json()) as RoleRow[];
    const candidate = list.find((r) => r.ROLE_NAME === 'candidate');
    expect(
      candidate,
      'seeded ROLE_NAME=candidate must exist (RBAC seed / findByName coverage)',
    ).toBeDefined();
    expect(candidate!.ROLE_ID).toEqual(expect.any(Number));
  });

  // ROLES-I-013
  test('duplicate ROLE_NAME allowed (no unique constraint)', async ({
    request,
  }) => {
    const adminHeaders = await bearer(request, 'admin');
    const dupName = disposableRoleName('i013-dup');

    const first = await adminCreateRole(request, adminHeaders, {
      ROLE_NAME: dupName,
      ROLE_DESCRIPTION: 'first duplicate',
    });
    expect(
      [200, 201].includes(first.status),
      `first create failed (${first.status}): ${JSON.stringify(first.body)}`,
    ).toBe(true);

    const second = await adminCreateRole(request, adminHeaders, {
      ROLE_NAME: dupName,
      ROLE_DESCRIPTION: 'second duplicate',
    });

    if (![200, 201].includes(second.status)) {
      // Product risk: if unique constraint was added, document failure
      expect(
        second.status,
        `BUG/PRODUCT RISK: duplicate ROLE_NAME rejected (status ${second.status}). ` +
          `Expected both creates to succeed (no unique on ROLE_NAME). Body: ${JSON.stringify(second.body)}`,
      ).toBe(201);
    }

    expect([200, 201]).toContain(second.status);
    expect(second.body.ROLE_ID).not.toBe(first.body.ROLE_ID);
    expect(second.body.ROLE_NAME).toBe(dupName);

    await hardDeleteRole(request, adminHeaders, first.body.ROLE_ID);
    await hardDeleteRole(request, adminHeaders, second.body.ROLE_ID);
  });

  // ROLES-I-014
  test('soft-deleted roles excluded from list', async () => {
    test.skip(
      true,
      'service uses hard delete (roleRepository.delete); DELETED_AT column unused — soft-delete exclusion not applicable',
    );
  });
});
