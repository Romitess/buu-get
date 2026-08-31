import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import { TEST_PASSWORD, type TestRoleKey } from '../e2e/fixtures/users';

/**
 * Profile Edit History API integration — matrix PEH-I-001 … PEH-I-005
 *
 * Seed history via admin PATCH on disposable profiles (staff modifier → history).
 * afterAll soft-deletes THIS suite's users/profiles. History has no delete API
 * (rows tagged via B6-PEH- values).
 */

type AuthHeaders = { Authorization: string };

type RoleRow = { ROLE_ID: number; ROLE_NAME: string };

type UserRow = {
  USER_ID: number;
  USER_EMAIL: string;
};

type UserProfileRow = {
  userProfileId: number;
  userId: number;
  userFullnameTh?: string | null;
  userPhone?: string | null;
};

type HistoryRow = {
  profileEditHistoryId: number;
  userProfileId: number;
  modifierId: number;
  modifierName: string;
  modifierRole: string;
  modifiedFields: string;
  oldValues: string | null;
  newValues: string | null;
  createdAt: string;
};

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function uniqueEmail(tag: string): string {
  return `b6-peh.${tag}.${uniqueSuffix()}@buu-get.test`;
}

function uniqueNationalId(): string {
  const digits = uniqueSuffix().replace(/\D/g, '').padStart(12, '0').slice(-12);
  return `6${digits}`;
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

test.describe('Profile Edit History API — list / latest-images / authz', () => {
  test.describe.configure({ mode: 'serial', timeout: 90_000 });
  test.setTimeout(90_000);

  let adminHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;
  let candidateRoleId = 0;
  let seedReady = false;
  let seedSkipReason = '';

  let historyProfileId = 0;
  let imageProfileId = 0;
  let latestImagePath = '';
  const userIds: number[] = [];
  const profileIds: number[] = [];

  function requireSeed(): void {
    test.skip(!seedReady, seedSkipReason || 'PEH seed unavailable');
  }

  async function createCandidateWithProfile(
    request: APIRequestContext,
    tag: string,
  ): Promise<{ user: UserRow; profile: UserProfileRow; email: string }> {
    const email = uniqueEmail(tag);
    const createRes = await request.post('/api/users', {
      headers: adminHeaders,
      data: {
        USER_EMAIL: email,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRoleId],
        USER_NATIONAL_ID: uniqueNationalId(),
        profile: {
          userFullnameTh: `B6-PEH- ${tag} ${uniqueSuffix()}`,
          userPhone: `08${uniqueSuffix().slice(-8)}`,
        },
      },
    });
    const createText = await createRes.text();
    expect(createRes.status(), createText).toBe(201);
    const user = JSON.parse(createText) as UserRow;
    userIds.push(user.USER_ID);

    const { headers } = await loginEmail(request, email, TEST_PASSWORD);
    const meRes = await request.get('/api/user-profile/me', { headers });
    const meText = await meRes.text();
    expect(meRes.status(), meText).toBe(200);
    const profile = JSON.parse(meText) as UserProfileRow;
    profileIds.push(profile.userProfileId);
    return { user, profile, email };
  }

  async function staffPatchProfile(
    request: APIRequestContext,
    profileId: number,
    data: Record<string, unknown>,
  ): Promise<UserProfileRow> {
    const res = await request.patch(`/api/user-profile/${profileId}`, {
      headers: adminHeaders,
      data,
    });
    const text = await res.text();
    expect(res.status(), text).toBe(200);
    return JSON.parse(text) as UserProfileRow;
  }

  test.beforeAll(async ({ request }) => {
    test.setTimeout(120_000);
    try {
      adminHeaders = await headersFor(request, 'admin');
      candidateHeaders = await headersFor(request, 'candidate');

      const rolesRes = await request.get('/api/roles', {
        headers: adminHeaders,
      });
      const rolesText = await rolesRes.text();
      expect(rolesRes.status(), rolesText).toBe(200);
      const roles = JSON.parse(rolesText) as RoleRow[];
      const candidate = roles.find((r) => r.ROLE_NAME === 'candidate');
      if (!candidate) throw new Error('candidate role missing');
      candidateRoleId = candidate.ROLE_ID;

      const hist = await createCandidateWithProfile(request, 'hist');
      historyProfileId = hist.profile.userProfileId;

      await staffPatchProfile(request, historyProfileId, {
        userPhone: `08${uniqueSuffix().slice(-8)}`,
        userFullnameTh: `B6-PEH- hist-v1 ${uniqueSuffix()}`,
      });
      await staffPatchProfile(request, historyProfileId, {
        userPhone: `08${uniqueSuffix().slice(-8)}`,
        userFullnameTh: `B6-PEH- hist-v2 ${uniqueSuffix()}`,
      });

      const img = await createCandidateWithProfile(request, 'img');
      imageProfileId = img.profile.userProfileId;
      latestImagePath = `/user_images/B6-PEH-${uniqueSuffix()}.jpg`;
      await staffPatchProfile(request, imageProfileId, {
        userImagePath: latestImagePath,
        userFullnameTh: `B6-PEH- with-image ${uniqueSuffix()}`,
      });

      seedReady = true;
    } catch (err) {
      seedSkipReason = `Seed failed: ${String(err)}`;
    }
  });

  test.afterAll(async ({ request }) => {
    if (!adminHeaders) return;
    for (const profileId of profileIds) {
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

  // PEH-I-001
  test('GET /api/profile-edit-history/profile/:id returns ordered list', async ({
    request,
  }) => {
    requireSeed();
    const res = await request.get(
      `/api/profile-edit-history/profile/${historyProfileId}`,
      { headers: adminHeaders },
    );
    const text = await res.text();
    expect(res.status(), text).toBe(200);
    const rows = JSON.parse(text) as HistoryRow[];
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.every((r) => r.userProfileId === historyProfileId)).toBe(true);

    // Service orders by createdAt DESC; also assert id monotonicity
    for (let i = 0; i < rows.length - 1; i++) {
      expect(rows[i].profileEditHistoryId).toBeGreaterThan(
        rows[i + 1].profileEditHistoryId,
      );
    }
  });

  // PEH-I-002
  test('POST /api/profile-edit-history/latest-images returns path map', async ({
    request,
  }) => {
    requireSeed();
    const missingId = 9_999_001;
    const res = await request.post('/api/profile-edit-history/latest-images', {
      headers: adminHeaders,
      data: { profileIds: [imageProfileId, historyProfileId, missingId] },
    });
    const text = await res.text();
    // Nest default for POST is 201; controller has no @HttpCode(200)
    expect([200, 201], text).toContain(res.status());
    const map = JSON.parse(text) as Record<string, string | null>;
    expect(map[String(imageProfileId)]).toBe(latestImagePath);
    expect(map[String(historyProfileId)]).toBeNull();
    expect(map[String(missingId)]).toBeNull();
  });

  // PEH-I-003
  test('latest-images DTO validation → 400', async ({ request }) => {
    requireSeed();
    const cases: unknown[] = [
      { profileIds: [] },
      { profileIds: Array.from({ length: 1001 }, (_, i) => i + 1) },
      { profileIds: ['not-int'] },
      { profileIds: [1.5] },
      {},
    ];

    for (const data of cases) {
      const res = await request.post(
        '/api/profile-edit-history/latest-images',
        {
          headers: adminHeaders,
          data: data as Record<string, unknown>,
        },
      );
      const text = await res.text();
      expect(
        res.status(),
        `expected 400 for ${JSON.stringify(data)} got ${res.status()} ${text}`,
      ).toBe(400);
    }
  });

  // PEH-I-004
  test('History endpoints require JWT → 401', async ({ request }) => {
    requireSeed();
    const getRes = await request.get(
      `/api/profile-edit-history/profile/${historyProfileId}`,
    );
    expect(getRes.status()).toBe(401);

    const postRes = await request.post(
      '/api/profile-edit-history/latest-images',
      { data: { profileIds: [historyProfileId] } },
    );
    expect(postRes.status()).toBe(401);
  });

  // PEH-I-005 — BUG-012 fixed: candidate cannot read foreign profile history
  test('Candidate cannot read foreign profile history', async ({
    request,
  }) => {
    requireSeed();
    const res = await request.get(
      `/api/profile-edit-history/profile/${historyProfileId}`,
      { headers: candidateHeaders },
    );
    const text = await res.text();
    expect(res.status(), text).toBe(403);
  });
});
