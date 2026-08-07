import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import { TEST_PASSWORD, type TestRoleKey } from '../e2e/fixtures/users';

/**
 * User Profile API integration — matrix PROF-I-001 … PROF-I-008
 *
 * Shared-DB seed via API; afterAll soft-deletes THIS suite's rows only
 * (users / profiles / enrollments / sessions / exams tagged B6-PROF-).
 */

type AuthHeaders = { Authorization: string };

type RoleRow = { ROLE_ID: number; ROLE_NAME: string };

type UserRow = {
  USER_ID: number;
  USER_EMAIL: string;
  USER_NATIONAL_ID?: string | null;
};

type UserProfileRow = {
  userProfileId: number;
  userId: number;
  userFullnameTh?: string | null;
  userPhone?: string | null;
  userAddress?: string | null;
  userRemark?: string | null;
  deletedAt?: string | null;
};

type EnrollmentRow = {
  ERM_ID: number;
  USER_ID: number;
  SESSION_ID: number;
  ERM_VERIFY_STATUS: number;
};

type Paginated<T> = { data: T[]; meta?: { total?: number } };

const ExamVerifyStatus = {
  UNCHECKED: 0,
  WAIT_FIXED: 2,
} as const;

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function uniqueEmail(tag: string): string {
  return `b6-prof.${tag}.${uniqueSuffix()}@buu-get.test`;
}

function uniqueNationalId(): string {
  const digits = uniqueSuffix().replace(/\D/g, '').padStart(12, '0').slice(-12);
  return `8${digits}`;
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

async function loginEmail(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<{ headers: AuthHeaders; userId: number }> {
  const res = await request.post('/api/auth/login', {
    data: { email, password },
  });
  const text = await res.text();
  if (![200, 201].includes(res.status())) {
    throw new Error(`loginEmail failed: ${res.status()} ${text}`);
  }
  const body = JSON.parse(text) as {
    accessToken: string;
    user: { id: number };
  };
  return {
    headers: { Authorization: `Bearer ${body.accessToken}` },
    userId: body.user.id,
  };
}

test.describe('User Profile API — me / RBAC / authz / soft-delete', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120_000);

  let adminHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;
  let candidateUserId: number;
  let candidateProfileId: number;
  let seedReady = false;
  let seedSkipReason = '';

  let candidateRoleId = 0;
  let staffRoleId = 0;

  const userIds: number[] = [];
  const profileIds: number[] = [];
  const examIds: number[] = [];
  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  let sessionSlot = 0;

  function requireSeed(): void {
    test.skip(!seedReady, seedSkipReason || 'User-profile seed unavailable');
  }

  async function fetchRoles(request: APIRequestContext): Promise<void> {
    const res = await request.get('/api/roles', { headers: adminHeaders });
    expect(res.status(), await res.text()).toBe(200);
    const roles = (await res.json()) as RoleRow[];
    const candidate = roles.find((r) => r.ROLE_NAME === 'candidate');
    const staff = roles.find((r) => r.ROLE_NAME === 'staff');
    if (!candidate || !staff) {
      throw new Error('candidate/staff roles missing');
    }
    candidateRoleId = candidate.ROLE_ID;
    staffRoleId = staff.ROLE_ID;
  }

  async function createUser(
    request: APIRequestContext,
    overrides: Record<string, unknown> = {},
  ): Promise<UserRow> {
    const email = uniqueEmail('user');
    const res = await request.post('/api/users', {
      headers: adminHeaders,
      data: {
        USER_EMAIL: email,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRoleId],
        USER_NATIONAL_ID: uniqueNationalId(),
        profile: {
          userFullnameTh: `B6-PROF- ${uniqueSuffix()}`,
        },
        ...overrides,
      },
    });
    const text = await res.text();
    expect(res.status(), text).toBe(201);
    const body = JSON.parse(text) as UserRow;
    userIds.push(body.USER_ID);
    return body;
  }

  async function ensureProfile(
    request: APIRequestContext,
    headers: AuthHeaders,
  ): Promise<UserProfileRow> {
    const res = await request.get('/api/user-profile/me', { headers });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as UserProfileRow;
    profileIds.push(body.userProfileId);
    return body;
  }

  async function createExamSessionEnrollment(
    request: APIRequestContext,
    userId: number,
  ): Promise<{ examId: number; sessionId: number; ermId: number }> {
    const suffix = uniqueSuffix();
    const examRes = await request.post('/api/exam', {
      headers: adminHeaders,
      data: {
        EXAM_NAME: `B6-PROF- exam ${suffix}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE: 500,
        EXAM_DATE: '2026-12-28',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: 'B6P',
        EXAM_FISCAL_YEAR: '2026',
        FUND_SOURCE_ID: 1,
        SRB_ID: 1,
      },
    });
    expect(examRes.status(), await examRes.text()).toBe(201);
    const examId = ((await examRes.json()) as { EXAM_ID: number }).EXAM_ID;
    examIds.push(examId);

    const { start, end } = hourMinute(sessionSlot++);
    const ssRes = await request.post('/api/exam-sessions', {
      headers: adminHeaders,
      data: {
        EXAM_ID: examId,
        SS_START_TIME: start,
        SS_END_TIME: end,
        SS_CAPACITY: 30,
        SS_SESSION_STATUS: 1,
      },
    });
    expect(ssRes.status(), await ssRes.text()).toBe(201);
    const sessionId = ((await ssRes.json()) as { SS_ID: number }).SS_ID;
    sessionIds.push(sessionId);

    const ermRes = await request.post('/api/exam-enrollments', {
      headers: adminHeaders,
      data: { USER_ID: userId, SESSION_ID: sessionId },
    });
    expect(ermRes.status(), await ermRes.text()).toBe(201);
    const ermId = ((await ermRes.json()) as { ERM_ID: number }).ERM_ID;
    enrollmentIds.push(ermId);

    return { examId, sessionId, ermId };
  }

  test.beforeAll(async ({ request }) => {
    test.setTimeout(180_000);
    try {
      adminHeaders = await headersFor(request, 'admin');
      const cand = await apiLogin(request, 'candidate');
      candidateHeaders = { Authorization: `Bearer ${cand.accessToken}` };
      candidateUserId = cand.user.id;
      await fetchRoles(request);

      const me = await ensureProfile(request, candidateHeaders);
      candidateProfileId = me.userProfileId;
      seedReady = true;
    } catch (err) {
      seedSkipReason = `Seed failed: ${String(err)}`;
    }
  });

  test.afterAll(async ({ request }) => {
    if (!adminHeaders) return;
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
    for (const examId of examIds) {
      await request
        .delete(`/api/exam/${examId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    // Soft-delete disposable profiles (skip seeded candidate profile)
    for (const profileId of profileIds) {
      if (profileId === candidateProfileId) continue;
      await request
        .delete(`/api/user-profile/${profileId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    for (const userId of userIds) {
      await request
        .delete(`/api/users/${userId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
  });

  // PROF-I-001
  test('GET /api/user-profile/me returns profile (auto-create if needed)', async ({
    request,
  }) => {
    requireSeed();
    const email = uniqueEmail('autocreate');
    const createRes = await request.post('/api/users', {
      headers: adminHeaders,
      data: {
        USER_EMAIL: email,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRoleId],
        USER_NATIONAL_ID: uniqueNationalId(),
      },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const user = (await createRes.json()) as UserRow;
    userIds.push(user.USER_ID);

    const { headers } = await loginEmail(request, email, TEST_PASSWORD);
    const res = await request.get('/api/user-profile/me', { headers });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as UserProfileRow;
    expect(body.userProfileId).toEqual(expect.any(Number));
    expect(body.userId).toBe(user.USER_ID);
    profileIds.push(body.userProfileId);
  });

  // PROF-I-002
  test('PATCH /api/user-profile/me persists fields', async ({ request }) => {
    requireSeed();
    const email = uniqueEmail('patch');
    const createRes = await request.post('/api/users', {
      headers: adminHeaders,
      data: {
        USER_EMAIL: email,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRoleId],
        USER_NATIONAL_ID: uniqueNationalId(),
        profile: { userFullnameTh: `B6-PROF- before ${uniqueSuffix()}` },
      },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const user = (await createRes.json()) as UserRow;
    userIds.push(user.USER_ID);

    const { headers } = await loginEmail(request, email, TEST_PASSWORD);
    const phone = `08${uniqueSuffix().slice(-8)}`;
    const fullname = `B6-PROF- after ${uniqueSuffix()}`;
    const patchRes = await request.patch('/api/user-profile/me', {
      headers,
      data: {
        userFullnameTh: fullname,
        userPhone: phone,
        userAddress: 'B6-PROF- addr Bangsaen',
      },
    });
    expect(patchRes.status(), await patchRes.text()).toBe(200);
    const patched = (await patchRes.json()) as UserProfileRow;
    profileIds.push(patched.userProfileId);
    expect(patched.userFullnameTh).toBe(fullname);
    expect(patched.userPhone).toBe(phone);

    const getRes = await request.get('/api/user-profile/me', { headers });
    expect(getRes.status()).toBe(200);
    const fetched = (await getRes.json()) as UserProfileRow;
    expect(fetched.userFullnameTh).toBe(fullname);
    expect(fetched.userPhone).toBe(phone);
    expect(fetched.userAddress).toBe('B6-PROF- addr Bangsaen');
  });

  // PROF-I-003
  test('Candidate PATCH me clears remark and resets WAIT_FIXED → UNCHECKED', async ({
    request,
  }) => {
    requireSeed();
    const email = uniqueEmail('fix');
    const createRes = await request.post('/api/users', {
      headers: adminHeaders,
      data: {
        USER_EMAIL: email,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRoleId],
        USER_NATIONAL_ID: uniqueNationalId(),
        profile: {
          userFullnameTh: `B6-PROF- fix ${uniqueSuffix()}`,
        },
      },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const user = (await createRes.json()) as UserRow;
    userIds.push(user.USER_ID);

    const { headers, userId } = await loginEmail(
      request,
      email,
      TEST_PASSWORD,
    );
    const me = await ensureProfile(request, headers);
    profileIds.push(me.userProfileId);

    // Inline create-user profile DTO forbids userRemark — set via admin PATCH
    const remarkRes = await request.patch(
      `/api/user-profile/${me.userProfileId}`,
      {
        headers: adminHeaders,
        data: { userRemark: 'B6-PROF- please fix photo' },
      },
    );
    expect(remarkRes.status(), await remarkRes.text()).toBe(200);
    const withRemark = (await remarkRes.json()) as UserProfileRow;
    expect(withRemark.userRemark).toBeTruthy();

    const { ermId } = await createExamSessionEnrollment(request, userId);

    const setVerify = await request.patch(`/api/exam-enrollments/${ermId}`, {
      headers: adminHeaders,
      data: { ERM_VERIFY_STATUS: ExamVerifyStatus.WAIT_FIXED },
    });
    expect(setVerify.status(), await setVerify.text()).toBe(200);
    const before = (await setVerify.json()) as EnrollmentRow;
    expect(Number(before.ERM_VERIFY_STATUS)).toBe(ExamVerifyStatus.WAIT_FIXED);

    const patchRes = await request.patch('/api/user-profile/me', {
      headers,
      data: {
        userPhone: `08${uniqueSuffix().slice(-8)}`,
        userFullnameTh: `B6-PROF- fixed ${uniqueSuffix()}`,
      },
    });
    expect(patchRes.status(), await patchRes.text()).toBe(200);
    const afterProfile = (await patchRes.json()) as UserProfileRow;
    expect(afterProfile.userRemark).toBeNull();

    const ermGet = await request.get(`/api/exam-enrollments/${ermId}`, {
      headers: adminHeaders,
    });
    expect(ermGet.status(), await ermGet.text()).toBe(200);
    const afterErm = (await ermGet.json()) as EnrollmentRow;
    expect(Number(afterErm.ERM_VERIFY_STATUS)).toBe(
      ExamVerifyStatus.UNCHECKED,
    );
  });

  // PROF-I-004
  test('PATCH me with conflicting national ID → 409', async ({ request }) => {
    requireSeed();
    const ownerNid = uniqueNationalId();
    const owner = await createUser(request, {
      USER_EMAIL: uniqueEmail('nid-owner'),
      USER_NATIONAL_ID: ownerNid,
      profile: { userFullnameTh: `B6-PROF- nid owner ${uniqueSuffix()}` },
    });
    void owner;

    const email = uniqueEmail('nid-other');
    const otherRes = await request.post('/api/users', {
      headers: adminHeaders,
      data: {
        USER_EMAIL: email,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRoleId],
        USER_NATIONAL_ID: uniqueNationalId(),
        profile: { userFullnameTh: `B6-PROF- nid other ${uniqueSuffix()}` },
      },
    });
    expect(otherRes.status(), await otherRes.text()).toBe(201);
    const other = (await otherRes.json()) as UserRow;
    userIds.push(other.USER_ID);

    const { headers } = await loginEmail(request, email, TEST_PASSWORD);
    await ensureProfile(request, headers);

    const conflict = await request.patch('/api/user-profile/me', {
      headers,
      data: { userNationalId: ownerNid },
    });
    expect(conflict.status(), await conflict.text()).toBe(409);
  });

  // PROF-I-005
  test('Admin list/get/create/delete RBAC; candidate 403; no JWT 401', async ({
    request,
  }) => {
    requireSeed();

    const listAdmin = await request.get('/api/user-profile', {
      headers: adminHeaders,
    });
    expect(listAdmin.status(), await listAdmin.text()).toBe(200);
    const listBody = (await listAdmin.json()) as Paginated<UserProfileRow>;
    expect(listBody.data).toEqual(expect.any(Array));

    const getAdmin = await request.get(
      `/api/user-profile/${candidateProfileId}`,
      { headers: adminHeaders },
    );
    expect(getAdmin.status(), await getAdmin.text()).toBe(200);

    const bareUserEmail = uniqueEmail('create-target');
    const bareUserRes = await request.post('/api/users', {
      headers: adminHeaders,
      data: {
        USER_EMAIL: bareUserEmail,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRoleId],
        USER_NATIONAL_ID: uniqueNationalId(),
      },
    });
    expect(bareUserRes.status(), await bareUserRes.text()).toBe(201);
    const bareUser = (await bareUserRes.json()) as UserRow;
    userIds.push(bareUser.USER_ID);

    const createRes = await request.post('/api/user-profile', {
      headers: adminHeaders,
      data: {
        userId: bareUser.USER_ID,
        userFullnameTh: `B6-PROF- admin-create ${uniqueSuffix()}`,
      },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const created = (await createRes.json()) as UserProfileRow;
    profileIds.push(created.userProfileId);

    const delRes = await request.delete(
      `/api/user-profile/${created.userProfileId}`,
      { headers: adminHeaders },
    );
    expect([200, 204]).toContain(delRes.status());

    const listCand = await request.get('/api/user-profile', {
      headers: candidateHeaders,
    });
    expect(listCand.status()).toBe(403);

    const createCand = await request.post('/api/user-profile', {
      headers: candidateHeaders,
      data: {
        userId: bareUser.USER_ID,
        userFullnameTh: 'B6-PROF- forbidden',
      },
    });
    expect(createCand.status()).toBe(403);

    const noJwt = await request.get('/api/user-profile');
    expect(noJwt.status()).toBe(401);
  });

  // PROF-I-006 — current behavior: any JWT can PATCH foreign profile (BUG-011)
  test('PATCH /api/user-profile/:id allows candidate to mutate foreign profile (current)', async ({
    request,
  }) => {
    requireSeed();
    const victimEmail = uniqueEmail('victim');
    const victimRes = await request.post('/api/users', {
      headers: adminHeaders,
      data: {
        USER_EMAIL: victimEmail,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRoleId],
        USER_NATIONAL_ID: uniqueNationalId(),
        profile: { userFullnameTh: `B6-PROF- victim ${uniqueSuffix()}` },
      },
    });
    expect(victimRes.status(), await victimRes.text()).toBe(201);
    const victim = (await victimRes.json()) as UserRow;
    userIds.push(victim.USER_ID);

    const { headers: victimHeaders } = await loginEmail(
      request,
      victimEmail,
      TEST_PASSWORD,
    );
    const victimProfile = await ensureProfile(request, victimHeaders);

    const attackerEmail = uniqueEmail('attacker');
    const attackerRes = await request.post('/api/users', {
      headers: adminHeaders,
      data: {
        USER_EMAIL: attackerEmail,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRoleId],
        USER_NATIONAL_ID: uniqueNationalId(),
        profile: { userFullnameTh: `B6-PROF- attacker ${uniqueSuffix()}` },
      },
    });
    expect(attackerRes.status(), await attackerRes.text()).toBe(201);
    const attacker = (await attackerRes.json()) as UserRow;
    userIds.push(attacker.USER_ID);
    const { headers: attackerHeaders } = await loginEmail(
      request,
      attackerEmail,
      TEST_PASSWORD,
    );
    await ensureProfile(request, attackerHeaders);

    const mutatedName = `B6-PROF- mutated-by-attacker ${uniqueSuffix()}`;
    const patchRes = await request.patch(
      `/api/user-profile/${victimProfile.userProfileId}`,
      {
        headers: attackerHeaders,
        data: { userFullnameTh: mutatedName },
      },
    );
    // CURRENT: JWT-only route — foreign mutate allowed (authz risk BUG-011)
    expect(patchRes.status(), await patchRes.text()).toBe(200);
    const body = (await patchRes.json()) as UserProfileRow;
    expect(body.userFullnameTh).toBe(mutatedName);
  });

  // PROF-I-007
  test('Mixed-role user treated as staff — remark not auto-cleared on PATCH me', async ({
    request,
  }) => {
    requireSeed();
    const email = uniqueEmail('mixed');
    const createRes = await request.post('/api/users', {
      headers: adminHeaders,
      data: {
        USER_EMAIL: email,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRoleId, staffRoleId],
        USER_NATIONAL_ID: uniqueNationalId(),
        profile: {
          userFullnameTh: `B6-PROF- mixed ${uniqueSuffix()}`,
        },
      },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const user = (await createRes.json()) as UserRow;
    userIds.push(user.USER_ID);

    const { headers } = await loginEmail(request, email, TEST_PASSWORD);
    const me = await ensureProfile(request, headers);
    profileIds.push(me.userProfileId);

    const remarkRes = await request.patch(
      `/api/user-profile/${me.userProfileId}`,
      {
        headers: adminHeaders,
        data: { userRemark: 'B6-PROF- keep remark' },
      },
    );
    expect(remarkRes.status(), await remarkRes.text()).toBe(200);
    expect(((await remarkRes.json()) as UserProfileRow).userRemark).toBe(
      'B6-PROF- keep remark',
    );

    const patchRes = await request.patch('/api/user-profile/me', {
      headers,
      data: { userPhone: `08${uniqueSuffix().slice(-8)}` },
    });
    expect(patchRes.status(), await patchRes.text()).toBe(200);
    const after = (await patchRes.json()) as UserProfileRow;
    expect(after.userRemark).toBe('B6-PROF- keep remark');
  });

  // PROF-I-008
  test('Soft-delete then findOne hidden (404)', async ({ request }) => {
    requireSeed();
    const email = uniqueEmail('softdel');
    const createUserRes = await request.post('/api/users', {
      headers: adminHeaders,
      data: {
        USER_EMAIL: email,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRoleId],
        USER_NATIONAL_ID: uniqueNationalId(),
      },
    });
    expect(createUserRes.status(), await createUserRes.text()).toBe(201);
    const user = (await createUserRes.json()) as UserRow;
    userIds.push(user.USER_ID);

    const createProf = await request.post('/api/user-profile', {
      headers: adminHeaders,
      data: {
        userId: user.USER_ID,
        userFullnameTh: `B6-PROF- soft-del ${uniqueSuffix()}`,
      },
    });
    expect(createProf.status(), await createProf.text()).toBe(201);
    const profile = (await createProf.json()) as UserProfileRow;
    // Will be deleted in test — still track for afterAll safety
    profileIds.push(profile.userProfileId);

    const del = await request.delete(
      `/api/user-profile/${profile.userProfileId}`,
      { headers: adminHeaders },
    );
    expect([200, 204]).toContain(del.status());

    const getAfter = await request.get(
      `/api/user-profile/${profile.userProfileId}`,
      { headers: adminHeaders },
    );
    expect(getAfter.status(), await getAfter.text()).toBe(404);
  });
});
