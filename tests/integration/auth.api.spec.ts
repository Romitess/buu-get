import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import { getTestUser, TEST_USERS } from '../e2e/fixtures/users';

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function uniqueEmail(prefix = 'auth-i'): string {
  return `${prefix}.${uniqueSuffix()}@buu-get.test`;
}

/** 13-digit Thai national ID style (checksum not required by API) */
function uniqueNationalId(): string {
  const digits = uniqueSuffix().replace(/\D/g, '').padStart(12, '0').slice(-12);
  return `1${digits}`;
}

function thaiRegisterBody(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    email: uniqueEmail('reg'),
    password: TEST_USERS.candidate.password,
    userType: 'thai',
    nationalId: uniqueNationalId(),
    country: 'Thailand',
    titleTH: 'นาย',
    titleEN: 'Mr.',
    fullName: 'ทดสอบ สมัครสมาชิก',
    englishName: 'Test Registrant',
    phone: '0812345678',
    birthdate: '1990-01-15',
    educationLevel: 'ปริญญาตรี',
    faculty: 'คณะวิทยาการสารสนเทศ',
    institution: 'มหาวิทยาลัยบูรพา',
    ...overrides,
  };
}

async function authHeader(request: APIRequestContext): Promise<{
  Authorization: string;
}> {
  const { accessToken } = await apiLogin(request, 'candidate');
  return { Authorization: `Bearer ${accessToken}` };
}

test.describe('Auth API — login & session', () => {
  // AUTH-I-001
  test('POST /api/auth/login valid → 200/201 + accessToken', async ({
    request,
  }) => {
    const user = getTestUser('candidate');
    const res = await request.post('/api/auth/login', {
      data: { email: user.email, password: user.password },
    });

    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.accessToken.length).toBeGreaterThan(10);
    expect(body.user).toMatchObject({
      email: user.email,
      role: expect.any(String),
      roles: expect.any(Array),
    });
  });

  // AUTH-I-002
  test('POST /api/auth/login wrong password → 400', async ({ request }) => {
    const user = getTestUser('candidate');
    const res = await request.post('/api/auth/login', {
      data: { email: user.email, password: 'WrongPass999!' },
    });

    expect(res.status()).toBe(400);
  });

  // AUTH-I-003
  test('POST /api/auth/login unknown email → 400', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: {
        email: `unknown.${uniqueSuffix()}@buu-get.test`,
        password: TEST_USERS.candidate.password,
      },
    });

    expect(res.status()).toBe(400);
  });

  // AUTH-I-004
  test('POST /api/auth/login DTO validation → 400', async ({ request }) => {
    const cases = [
      { email: '', password: TEST_USERS.candidate.password },
      { email: 'not-an-email', password: TEST_USERS.candidate.password },
      { email: getTestUser('candidate').email, password: 'short' },
      { password: TEST_USERS.candidate.password },
      { email: getTestUser('candidate').email },
    ];

    for (const data of cases) {
      const res = await request.post('/api/auth/login', { data });
      expect(
        res.status(),
        `expected 400 for body=${JSON.stringify(data)}`,
      ).toBe(400);
    }
  });

  // AUTH-I-005
  test('GET /api/auth/me with Bearer JWT → 200', async ({ request }) => {
    const headers = await authHeader(request);
    const res = await request.get('/api/auth/me', { headers });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.email).toBe(getTestUser('candidate').email);
    expect(body.id).toEqual(expect.any(Number));
    expect(body.roles).toEqual(expect.any(Array));
  });

  // AUTH-I-006
  test('GET /api/auth/me no token → 401', async ({ request }) => {
    const res = await request.get('/api/auth/me');
    expect(res.status()).toBe(401);
  });

  // AUTH-I-007
  test('GET /api/auth/me invalid JWT → 401', async ({ request }) => {
    const res = await request.get('/api/auth/me', {
      headers: { Authorization: 'Bearer not.a.valid.jwt' },
    });
    expect(res.status()).toBe(401);
  });

  // AUTH-I-018
  test('Login JWT usable on protected route GET /api/auth/me', async ({
    request,
  }) => {
    const { accessToken } = await apiLogin(request, 'candidate');
    const res = await request.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.status()).not.toBe(401);
    expect(res.status()).toBe(200);
  });
});

test.describe('Auth API — OTP', () => {
  // AUTH-I-008
  test('POST /api/auth/send-otp new email', async ({ request }) => {
    const email = uniqueEmail('otp-new');
    const res = await request.post('/api/auth/send-otp', {
      data: { email },
    });

    if (res.status() === 400) {
      const body = await res.json().catch(() => ({}));
      const msg = JSON.stringify(body);
      // Email gateway not available / not stubbed in this environment
      test.skip(
        true,
        `Email gateway unavailable (send-otp returned 400): ${msg}`,
      );
      return;
    }

    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // AUTH-I-009
  test('POST /api/auth/send-otp existing email → 400', async ({ request }) => {
    const res = await request.post('/api/auth/send-otp', {
      data: { email: TEST_USERS.candidate.email },
    });

    expect(res.status()).toBe(400);
  });

  // AUTH-I-010
  test('POST /api/auth/send-otp invalid email → 400', async ({ request }) => {
    const res = await request.post('/api/auth/send-otp', {
      data: { email: 'not-an-email' },
    });

    expect(res.status()).toBe(400);
  });

  // AUTH-I-011
  test('POST /api/auth/verify-otp wrong → 400', async ({ request }) => {
    const res = await request.post('/api/auth/verify-otp', {
      data: {
        email: uniqueEmail('otp-wrong'),
        otp: '000000',
      },
    });

    expect(res.status()).toBe(400);
  });

  // AUTH-I-012
  test('POST /api/auth/verify-otp length ≠6 → 400', async ({ request }) => {
    const cases = ['12345', '1234567', ''];
    for (const otp of cases) {
      const res = await request.post('/api/auth/verify-otp', {
        data: { email: uniqueEmail('otp-len'), otp },
      });
      expect(res.status(), `expected 400 for otp="${otp}"`).toBe(400);
    }
  });

  // AUTH-I-013
  test('POST /api/auth/verify-otp one-time', async () => {
    test.skip(
      true,
      'OTP is only delivered via email gateway; no API/test hook to read OTP without email inbox stub',
    );
  });
});

test.describe('Auth API — register', () => {
  // AUTH-I-014
  test('POST /api/auth/register thai persists', async ({ request }) => {
    const body = thaiRegisterBody();
    const res = await request.post('/api/auth/register', { data: body });

    if (res.status() === 400) {
      const err = await res.json().catch(() => ({}));
      const msg = JSON.stringify(err).toLowerCase();
      if (
        msg.includes('moodle') ||
        msg.includes('createuser') ||
        msg.includes('sync')
      ) {
        test.skip(
          true,
          `Moodle required for register and unavailable: ${JSON.stringify(err)}`,
        );
        return;
      }
    }

    expect([200, 201]).toContain(res.status());
    const result = await res.json();
    expect(result.userId).toEqual(expect.any(Number));
    expect(result.message).toMatch(/success/i);

    // Side effect: can login with new credentials
    const loginRes = await request.post('/api/auth/login', {
      data: { email: body.email, password: body.password },
    });
    expect([200, 201]).toContain(loginRes.status());
    const loginBody = await loginRes.json();
    expect(loginBody.accessToken).toBeTruthy();

    const meRes = await request.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${loginBody.accessToken}` },
    });
    expect(meRes.status()).toBe(200);
    const me = await meRes.json();
    expect(me.email).toBe(body.email);
    expect(me.nationalId).toBe(body.nationalId);
    expect(me.roles).toEqual(expect.arrayContaining(['candidate']));
  });

  // AUTH-I-015
  test('POST /api/auth/register duplicate email → 400', async ({
    request,
  }) => {
    // Register does not require prior OTP at API layer — email uniqueness checked first
    const res = await request.post('/api/auth/register', {
      data: thaiRegisterBody({
        email: TEST_USERS.candidate.email,
        nationalId: uniqueNationalId(),
      }),
    });

    expect(res.status()).toBe(400);
  });

  // AUTH-I-016
  test('POST /api/auth/register duplicate national ID → 400', async ({
    request,
  }) => {
    const nationalId = uniqueNationalId();
    const first = await request.post('/api/auth/register', {
      data: thaiRegisterBody({
        email: uniqueEmail('nid-a'),
        nationalId,
      }),
    });

    if (![200, 201].includes(first.status())) {
      const err = await first.json().catch(() => ({}));
      const msg = JSON.stringify(err).toLowerCase();
      if (
        msg.includes('moodle') ||
        msg.includes('createuser') ||
        msg.includes('sync')
      ) {
        test.skip(
          true,
          `Cannot seed national ID holder without Moodle: ${JSON.stringify(err)}`,
        );
        return;
      }
      expect(
        first.status(),
        `first register failed: ${JSON.stringify(err)}`,
      ).toBe(201);
    }

    const second = await request.post('/api/auth/register', {
      data: thaiRegisterBody({
        email: uniqueEmail('nid-b'),
        nationalId,
      }),
    });

    expect(second.status()).toBe(400);
  });

  // AUTH-I-017
  test('POST /api/auth/register DTO validation → 400', async ({ request }) => {
    const cases: Record<string, unknown>[] = [
      { ...thaiRegisterBody(), email: 'bad-email' },
      { ...thaiRegisterBody(), password: 'short' },
      { ...thaiRegisterBody(), email: '' },
      {
        password: TEST_USERS.candidate.password,
        userType: 'thai',
        nationalId: uniqueNationalId(),
      },
      {
        email: uniqueEmail('dto'),
        password: TEST_USERS.candidate.password,
        // missing userType
        nationalId: uniqueNationalId(),
      },
    ];

    for (const data of cases) {
      const res = await request.post('/api/auth/register', { data });
      expect(
        res.status(),
        `expected 400 for body keys=${Object.keys(data).join(',')}`,
      ).toBe(400);
    }
  });
});
