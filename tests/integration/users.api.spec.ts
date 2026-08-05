import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import { getTestUser, TEST_USERS, type TestRoleKey } from '../e2e/fixtures/users';

type RoleRow = { ROLE_ID: number; ROLE_NAME: string };

type UserRow = {
  USER_ID: number;
  USER_CODE: string | null;
  USER_EMAIL: string;
  USER_STATUS: string;
  USER_NATIONAL_ID?: string | null;
  USER_PASSWORD?: string;
  ROLES_ID?: Array<{ ROLE_ID: number; ROLE_NAME: string }>;
};

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function uniqueEmail(prefix = 'users-i'): string {
  return `${prefix}.${uniqueSuffix()}@buu-get.test`;
}

/** 13-digit national ID style (checksum not required by API) */
function uniqueNationalId(): string {
  const digits = uniqueSuffix().replace(/\D/g, '').padStart(12, '0').slice(-12);
  return `9${digits}`;
}

async function bearer(
  request: APIRequestContext,
  role: TestRoleKey,
): Promise<{ Authorization: string }> {
  const { accessToken } = await apiLogin(request, role);
  return { Authorization: `Bearer ${accessToken}` };
}

async function fetchRoles(
  request: APIRequestContext,
  adminHeaders: { Authorization: string },
): Promise<RoleRow[]> {
  const res = await request.get('/api/roles', { headers: adminHeaders });
  expect(res.status(), await res.text()).toBe(200);
  return (await res.json()) as RoleRow[];
}

function roleIdByName(roles: RoleRow[], name: string): number {
  const found = roles.find((r) => r.ROLE_NAME === name);
  if (!found) {
    throw new Error(`Role not found: ${name}`);
  }
  return found.ROLE_ID;
}

function createUserBody(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    USER_EMAIL: uniqueEmail('create'),
    USER_PASSWORD: TEST_USERS.candidate.password,
    USER_STATUS: 'ACTIVE',
    USER_ROLES: [],
    ...overrides,
  };
}

async function adminCreateUser(
  request: APIRequestContext,
  adminHeaders: { Authorization: string },
  overrides: Record<string, unknown> = {},
): Promise<{ status: number; body: UserRow; email: string }> {
  const data = createUserBody(overrides);
  const res = await request.post('/api/users', {
    headers: adminHeaders,
    data,
  });
  const body = (await res.json().catch(() => ({}))) as UserRow;
  return {
    status: res.status(),
    body,
    email: String(data.USER_EMAIL),
  };
}

async function softDeleteUser(
  request: APIRequestContext,
  adminHeaders: { Authorization: string },
  userId: number,
): Promise<void> {
  await request.delete(`/api/users/${userId}`, { headers: adminHeaders });
}

test.describe('Users API — create', () => {
  // bcrypt on create is CPU-heavy; serialize to avoid request pile-up under parallel workers
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(60_000);

  // USERS-I-001
  test('POST /api/users ADMIN creates user', async ({ request }) => {
    const adminHeaders = await bearer(request, 'admin');
    const roles = await fetchRoles(request, adminHeaders);
    const candidateRoleId = roleIdByName(roles, 'candidate');
    const email = uniqueEmail('i001');

    const res = await request.post('/api/users', {
      headers: adminHeaders,
      data: createUserBody({
        USER_EMAIL: email,
        USER_ROLES: [candidateRoleId],
        USER_NATIONAL_ID: uniqueNationalId(),
      }),
    });

    expect(res.status()).toBe(201);
    const body = (await res.json()) as UserRow;
    expect(body.USER_ID).toEqual(expect.any(Number));
    expect(body.USER_EMAIL).toBe(email);
    expect(body.USER_CODE).toMatch(/^\d{8}$/);
    expect(body.USER_PASSWORD).toBeUndefined();
    expect(body.USER_STATUS).toBe('ACTIVE');

    // Side effect: credentials work (password was hashed & stored)
    const loginRes = await request.post('/api/auth/login', {
      data: { email, password: TEST_USERS.candidate.password },
    });
    expect([200, 201]).toContain(loginRes.status());

    await softDeleteUser(request, adminHeaders, body.USER_ID);
  });

  // USERS-I-002
  test('POST /api/users Conflict on duplicate email (incl soft-deleted)', async ({
    request,
  }) => {
    const adminHeaders = await bearer(request, 'admin');
    const email = uniqueEmail('i002');

    const first = await adminCreateUser(request, adminHeaders, {
      USER_EMAIL: email,
    });
    expect(first.status).toBe(201);

    const dupActive = await request.post('/api/users', {
      headers: adminHeaders,
      data: createUserBody({ USER_EMAIL: email }),
    });
    expect(dupActive.status()).toBe(409);

    await softDeleteUser(request, adminHeaders, first.body.USER_ID);

    const dupSoftDeleted = await request.post('/api/users', {
      headers: adminHeaders,
      data: createUserBody({ USER_EMAIL: email }),
    });
    expect(dupSoftDeleted.status()).toBe(409);
  });

  // USERS-I-003
  test('POST /api/users DTO validation → 400', async ({ request }) => {
    const adminHeaders = await bearer(request, 'admin');
    const cases: Record<string, unknown>[] = [
      createUserBody({ USER_EMAIL: 'not-an-email' }),
      createUserBody({ USER_PASSWORD: 'short' }),
      createUserBody({ USER_EMAIL: '' }),
      {
        USER_PASSWORD: TEST_USERS.candidate.password,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [],
      },
      createUserBody({ USER_NATIONAL_ID: '123' }), // MinLength 13
      createUserBody({ USER_ROLES: 'not-array' }),
    ];

    for (const data of cases) {
      const res = await request.post('/api/users', {
        headers: adminHeaders,
        data,
      });
      expect(
        res.status(),
        `expected 400 for body=${JSON.stringify(data)}`,
      ).toBe(400);
    }
  });

  // USERS-I-004
  test('POST /api/users forbidden for non-ADMIN (staff) → 403', async ({
    request,
  }) => {
    const staffHeaders = await bearer(request, 'staff');
    const res = await request.post('/api/users', {
      headers: staffHeaders,
      data: createUserBody({ USER_EMAIL: uniqueEmail('i004') }),
    });
    expect(res.status()).toBe(403);
  });

  // USERS-I-021
  test('POST /api/users USER_STATUS persisted when provided', async ({
    request,
  }) => {
    const adminHeaders = await bearer(request, 'admin');
    const email = uniqueEmail('i021');

    const res = await request.post('/api/users', {
      headers: adminHeaders,
      data: createUserBody({
        USER_EMAIL: email,
        USER_STATUS: 'INACTIVE',
      }),
    });

    expect(res.status()).toBe(201);
    const body = (await res.json()) as UserRow;
    expect(body.USER_STATUS).toBe('INACTIVE');

    // Confirm via GET
    const getRes = await request.get(`/api/users/${body.USER_ID}`, {
      headers: adminHeaders,
    });
    expect(getRes.status()).toBe(200);
    const fetched = (await getRes.json()) as UserRow;
    expect(fetched.USER_STATUS).toBe('INACTIVE');

    await softDeleteUser(request, adminHeaders, body.USER_ID);
  });
});

test.describe('Users API — list', () => {
  // USERS-I-005
  test('GET /api/users allowed for LIST roles (admin/staff)', async ({
    request,
  }) => {
    for (const role of ['admin', 'staff'] as TestRoleKey[]) {
      const headers = await bearer(request, role);
      const res = await request.get('/api/users', { headers });
      expect(res.status(), `role=${role}`).toBe(200);
      const body = await res.json();
      expect(body.data).toEqual(expect.any(Array));
      expect(body.meta).toMatchObject({
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
    }
  });

  // USERS-I-006
  test('GET /api/users forbidden for CANDIDATE → 403', async ({ request }) => {
    const headers = await bearer(request, 'candidate');
    const res = await request.get('/api/users', { headers });
    expect(res.status()).toBe(403);
  });

  // USERS-I-007
  test('GET /api/users unauthenticated → 401', async ({ request }) => {
    const res = await request.get('/api/users');
    expect(res.status()).toBe(401);
  });

  // USERS-I-008
  test('GET /api/users pagination + role + search', async ({ request }) => {
    const adminHeaders = await bearer(request, 'admin');
    const roles = await fetchRoles(request, adminHeaders);
    const candidateRoleId = roleIdByName(roles, 'candidate');
    const marker = `searchmark${uniqueSuffix()}`;
    const email = `${marker}@buu-get.test`;

    const created = await adminCreateUser(request, adminHeaders, {
      USER_EMAIL: email,
      USER_ROLES: [candidateRoleId],
      profile: { userFullnameEn: `User ${marker}` },
    });
    expect(created.status).toBe(201);

    // Pagination
    const pageRes = await request.get('/api/users?page=1&limit=2', {
      headers: adminHeaders,
    });
    expect(pageRes.status()).toBe(200);
    const pageBody = await pageRes.json();
    expect(pageBody.data.length).toBeLessThanOrEqual(2);
    expect(pageBody.meta).toMatchObject({ page: 1, limit: 2 });
    expect(pageBody.meta.total).toBeGreaterThanOrEqual(1);

    // Role filter
    const roleRes = await request.get('/api/users?role=candidate&limit=100', {
      headers: adminHeaders,
    });
    expect(roleRes.status()).toBe(200);
    const roleBody = await roleRes.json();
    expect(roleBody.data.length).toBeGreaterThan(0);
    for (const u of roleBody.data as UserRow[]) {
      const names = (u.ROLES_ID ?? []).map((r) => r.ROLE_NAME);
      expect(names).toContain('candidate');
    }

    // Search by email fragment
    const searchRes = await request.get(
      `/api/users?search=${encodeURIComponent(marker)}`,
      { headers: adminHeaders },
    );
    expect(searchRes.status()).toBe(200);
    const searchBody = await searchRes.json();
    expect(
      (searchBody.data as UserRow[]).some((u) => u.USER_EMAIL === email),
    ).toBe(true);

    await softDeleteUser(request, adminHeaders, created.body.USER_ID);
  });
});

test.describe('Users API — check-identifiers', () => {
  // USERS-I-009
  test('POST /api/users/check-identifiers', async ({ request }) => {
    const adminHeaders = await bearer(request, 'admin');
    const nationalId = uniqueNationalId();
    const unknownId = uniqueNationalId();

    const created = await adminCreateUser(request, adminHeaders, {
      USER_EMAIL: uniqueEmail('i009'),
      USER_NATIONAL_ID: nationalId,
    });
    expect(created.status).toBe(201);

    const res = await request.post('/api/users/check-identifiers', {
      headers: adminHeaders,
      data: { identifiers: [nationalId, unknownId] },
    });

    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.results).toEqual(
      expect.arrayContaining([
        { identifier: nationalId, exists: true },
        { identifier: unknownId, exists: false },
      ]),
    );

    // STAFF (LIST role) also allowed
    const staffHeaders = await bearer(request, 'staff');
    const staffRes = await request.post('/api/users/check-identifiers', {
      headers: staffHeaders,
      data: { identifiers: [nationalId] },
    });
    expect([200, 201]).toContain(staffRes.status());

    await softDeleteUser(request, adminHeaders, created.body.USER_ID);
  });

  // USERS-I-010
  test('POST /api/users/check-identifiers validation → 400', async ({
    request,
  }) => {
    const adminHeaders = await bearer(request, 'admin');

    const emptyRes = await request.post('/api/users/check-identifiers', {
      headers: adminHeaders,
      data: { identifiers: [] },
    });
    expect(emptyRes.status()).toBe(400);

    const tooMany = Array.from({ length: 1001 }, (_, i) => `id-${i}`);
    const maxRes = await request.post('/api/users/check-identifiers', {
      headers: adminHeaders,
      data: { identifiers: tooMany },
    });
    expect(maxRes.status()).toBe(400);

    const missingRes = await request.post('/api/users/check-identifiers', {
      headers: adminHeaders,
      data: {},
    });
    expect(missingRes.status()).toBe(400);
  });
});

test.describe('Users API — get by id', () => {
  // USERS-I-011
  test('GET /api/users/:id self access', async ({ request }) => {
    const login = await apiLogin(request, 'candidate');
    const res = await request.get(`/api/users/${login.user.id}`, {
      headers: { Authorization: `Bearer ${login.accessToken}` },
    });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as UserRow;
    expect(body.USER_ID).toBe(login.user.id);
    expect(body.USER_EMAIL).toBe(getTestUser('candidate').email);
  });

  // USERS-I-012
  test('GET /api/users/:id ADMIN can read other', async ({ request }) => {
    const adminLogin = await apiLogin(request, 'admin');
    const candidateLogin = await apiLogin(request, 'candidate');

    const res = await request.get(`/api/users/${candidateLogin.user.id}`, {
      headers: { Authorization: `Bearer ${adminLogin.accessToken}` },
    });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as UserRow;
    expect(body.USER_ID).toBe(candidateLogin.user.id);
    expect(body.USER_EMAIL).toBe(getTestUser('candidate').email);
  });

  // USERS-I-013
  test('GET /api/users/:id non-admin other → 403', async ({ request }) => {
    const staffLogin = await apiLogin(request, 'staff');
    const candidateLogin = await apiLogin(request, 'candidate');

    const res = await request.get(`/api/users/${candidateLogin.user.id}`, {
      headers: { Authorization: `Bearer ${staffLogin.accessToken}` },
    });

    expect(res.status()).toBe(403);
  });

  // USERS-I-014
  test('GET /api/users/:id NotFound', async ({ request }) => {
    const adminHeaders = await bearer(request, 'admin');
    const res = await request.get('/api/users/999999999', {
      headers: adminHeaders,
    });
    expect(res.status()).toBe(404);
  });

  // USERS-I-015
  test('GET /api/users/:id non-int id → 400', async ({ request }) => {
    const adminHeaders = await bearer(request, 'admin');
    const res = await request.get('/api/users/abc', {
      headers: adminHeaders,
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('Users API — update role', () => {
  // USERS-I-016
  test('PATCH /api/users/:id/role ADMIN', async ({ request }) => {
    const adminHeaders = await bearer(request, 'admin');
    const roles = await fetchRoles(request, adminHeaders);
    const candidateRoleId = roleIdByName(roles, 'candidate');
    const staffRoleId = roleIdByName(roles, 'staff');

    const created = await adminCreateUser(request, adminHeaders, {
      USER_EMAIL: uniqueEmail('i016'),
      USER_ROLES: [candidateRoleId],
    });
    expect(created.status).toBe(201);

    const res = await request.patch(
      `/api/users/${created.body.USER_ID}/role`,
      {
        headers: adminHeaders,
        data: { roleIds: [staffRoleId] },
      },
    );

    expect(res.status()).toBe(200);
    const body = (await res.json()) as UserRow;
    const roleNames = (body.ROLES_ID ?? []).map((r) => r.ROLE_NAME);
    expect(roleNames).toContain('staff');
    expect(roleNames).not.toContain('candidate');

    // Side effect via GET
    const getRes = await request.get(`/api/users/${created.body.USER_ID}`, {
      headers: adminHeaders,
    });
    expect(getRes.status()).toBe(200);
    const fetched = (await getRes.json()) as UserRow;
    expect((fetched.ROLES_ID ?? []).map((r) => r.ROLE_NAME)).toContain(
      'staff',
    );

    await softDeleteUser(request, adminHeaders, created.body.USER_ID);
  });

  // USERS-I-017
  test('PATCH /api/users/:id/role forbidden non-ADMIN', async ({
    request,
  }) => {
    const staffHeaders = await bearer(request, 'staff');
    const candidateLogin = await apiLogin(request, 'candidate');

    const res = await request.patch(
      `/api/users/${candidateLogin.user.id}/role`,
      {
        headers: staffHeaders,
        data: { roleIds: [1] },
      },
    );
    expect(res.status()).toBe(403);
  });

  // USERS-I-018
  test('PATCH /api/users/:id/role empty roleIds → 400', async ({
    request,
  }) => {
    const adminHeaders = await bearer(request, 'admin');
    const candidateLogin = await apiLogin(request, 'candidate');

    const res = await request.patch(
      `/api/users/${candidateLogin.user.id}/role`,
      {
        headers: adminHeaders,
        data: { roleIds: [] },
      },
    );
    expect(res.status()).toBe(400);
  });
});

test.describe('Users API — delete', () => {
  // USERS-I-019
  test('DELETE /api/users/:id soft-deletes', async ({ request }) => {
    const adminHeaders = await bearer(request, 'admin');
    const created = await adminCreateUser(request, adminHeaders, {
      USER_EMAIL: uniqueEmail('i019'),
    });
    expect(created.status).toBe(201);

    const delRes = await request.delete(
      `/api/users/${created.body.USER_ID}`,
      { headers: adminHeaders },
    );
    expect([200, 204]).toContain(delRes.status());

    // Soft-deleted: no longer returned by findOne
    const getRes = await request.get(`/api/users/${created.body.USER_ID}`, {
      headers: adminHeaders,
    });
    expect(getRes.status()).toBe(404);

    // Still blocks recreate (withDeleted uniqueness)
    const recreate = await request.post('/api/users', {
      headers: adminHeaders,
      data: createUserBody({ USER_EMAIL: created.email }),
    });
    expect(recreate.status()).toBe(409);
  });

  // USERS-I-020
  test('DELETE forbidden / NotFound', async ({ request }) => {
    const staffHeaders = await bearer(request, 'staff');
    const adminHeaders = await bearer(request, 'admin');
    const candidateLogin = await apiLogin(request, 'candidate');

    const forbidden = await request.delete(
      `/api/users/${candidateLogin.user.id}`,
      { headers: staffHeaders },
    );
    expect(forbidden.status()).toBe(403);

    const missing = await request.delete('/api/users/999999999', {
      headers: adminHeaders,
    });
    expect(missing.status()).toBe(404);
  });
});
