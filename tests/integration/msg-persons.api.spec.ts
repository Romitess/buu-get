import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import {
  TEST_PERSON_IDS,
  TEST_USERS,
  type TestRoleKey,
} from '../e2e/fixtures/users';

type RoleRow = { ROLE_ID: number; ROLE_NAME: string };

type PersonRow = {
  PSN_ID: string;
  PSN_EMAIL_BUU?: string | null;
  PSN_USERNAME?: string | null;
  ROLES?: Array<{ ROLE_ID: number; ROLE_NAME: string }>;
};

type PaginatedPersons = {
  data: PersonRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

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

test.describe('MsgPersons API', () => {
  test.describe.configure({ mode: 'serial' });

  const staffPsnId = TEST_PERSON_IDS.staff;
  if (!staffPsnId) {
    throw new Error('TEST_PERSON_IDS.staff is required for msg-persons tests');
  }

  // MSG-PERSONS-I-001
  test('GET /api/msg-persons as admin lists persons', async ({ request }) => {
    const adminHeaders = await bearer(request, 'admin');

    const res = await request.get('/api/msg-persons', {
      headers: adminHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);

    const body = (await res.json()) as PaginatedPersons;
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta.total).toBeGreaterThanOrEqual(1);
    expect(body.data.some((p) => p.PSN_ID === staffPsnId)).toBe(true);
  });

  // MSG-PERSONS-I-002
  test('GET /api/msg-persons?role=staff filters by role', async ({
    request,
  }) => {
    const adminHeaders = await bearer(request, 'admin');

    const res = await request.get('/api/msg-persons', {
      headers: adminHeaders,
      params: { role: 'staff' },
    });
    expect(res.status(), await res.text()).toBe(200);

    const body = (await res.json()) as PaginatedPersons;
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    for (const person of body.data) {
      const roleNames = (person.ROLES ?? []).map((r) => r.ROLE_NAME);
      expect(roleNames).toContain('staff');
    }
  });

  // MSG-PERSONS-I-003
  test('GET /api/msg-persons/:psnId returns person with roles', async ({
    request,
  }) => {
    const adminHeaders = await bearer(request, 'admin');

    const res = await request.get(`/api/msg-persons/${staffPsnId}`, {
      headers: adminHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);

    const body = (await res.json()) as PersonRow;
    expect(body.PSN_ID).toBe(staffPsnId);
    expect(body.PSN_EMAIL_BUU).toBe(TEST_USERS.staff.email);
    expect(Array.isArray(body.ROLES)).toBe(true);
  });

  // MSG-PERSONS-I-004
  test('PATCH /api/msg-persons/:psnId/roles as admin replaces roles', async ({
    request,
  }) => {
    const adminHeaders = await bearer(request, 'admin');
    const roles = await fetchRoles(request, adminHeaders);
    const staffRoleId = roleIdByName(roles, 'staff');
    const financeRoleId = roleIdByName(roles, 'finance');

    const patchRes = await request.patch(
      `/api/msg-persons/${staffPsnId}/roles`,
      {
        headers: adminHeaders,
        data: { roleIds: [staffRoleId, financeRoleId] },
      },
    );
    expect(patchRes.status(), await patchRes.text()).toBe(200);

    const patched = (await patchRes.json()) as PersonRow;
    const roleNames = (patched.ROLES ?? []).map((r) => r.ROLE_NAME).sort();
    expect(roleNames).toEqual(['finance', 'staff']);

    // restore staff-only for other tests / seed expectations
    const restore = await request.patch(
      `/api/msg-persons/${staffPsnId}/roles`,
      {
        headers: adminHeaders,
        data: { roleIds: [staffRoleId] },
      },
    );
    expect(restore.status(), await restore.text()).toBe(200);
  });

  // MSG-PERSONS-I-005
  test('candidate cannot list or patch msg-persons', async ({ request }) => {
    const candidateHeaders = await bearer(request, 'candidate');

    const listRes = await request.get('/api/msg-persons', {
      headers: candidateHeaders,
    });
    expect(listRes.status()).toBe(403);

    const patchRes = await request.patch(
      `/api/msg-persons/${staffPsnId}/roles`,
      {
        headers: candidateHeaders,
        data: { roleIds: [1] },
      },
    );
    expect(patchRes.status()).toBe(403);
  });

  // MSG-PERSONS-I-006
  test('GET /api/msg-persons/:psnId returns 404 for unknown id', async ({
    request,
  }) => {
    const adminHeaders = await bearer(request, 'admin');

    const res = await request.get('/api/msg-persons/NOTEXIST99', {
      headers: adminHeaders,
    });
    expect(res.status()).toBe(404);
  });
});
