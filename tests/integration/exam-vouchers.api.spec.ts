import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import { TEST_PASSWORD, type TestRoleKey } from '../e2e/fixtures/users';

/**
 * Exam vouchers API integration — matrix VOUCH-I-001 … VOUCH-I-010
 *
 * Seed approach (shared-DB, disposable via API):
 * 1. Admin creates open exam + location
 * 2. Disposable candidates enroll → PAID → SEAT_ASSIGNED
 *    - With test-taker: bulk-seat-assignments (assigns ERM_TEST_TAKER)
 *    - Without test-taker: single PATCH seat (no assign call)
 * 3. afterAll soft-deletes vouchers, enrollments, sessions, locations, exams, users
 */

const ExamEnrollmentStatus = {
  UNPAID: 0,
  PAID: 1,
  SEAT_ASSIGNED: 2,
  SEAT_PUBLISHED: 3,
} as const;

const ExamSessionStatus = {
  OPEN: 1,
  SEAT_ALLOCATED: 2,
  VOUCHER_SENT: 3,
} as const;

const EXAM_FEE = 500;

type AuthHeaders = { Authorization: string };

type EnrollmentRow = {
  ERM_ID: number;
  USER_ID: number;
  SESSION_ID: number;
  ERM_STATUS: number;
  SL_ID?: number | null;
  ERM_SEAT_LABEL?: string | null;
  ERM_TEST_TAKER?: string | null;
};

type VoucherRow = {
  VC_ID: number;
  ERM_ID: number;
  VC_CODE: string;
  DELETED_AT?: string | null;
};

type SessionRow = {
  SS_ID: number;
  SS_SESSION_STATUS: number;
};

type UserRow = {
  USER_ID: number;
  USER_EMAIL: string;
};

type RoleRow = { ROLE_ID: number; ROLE_NAME: string };

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function uniqueNationalId(): string {
  const digits = uniqueSuffix().replace(/\D/g, '').padStart(12, '0').slice(-12);
  return `9${digits}`;
}

function hourMinute(slot: number): { start: string; end: string } {
  const startH = 8 + slot;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    start: `${pad(startH)}:00:00`,
    end: `${pad(startH + 1)}:00:00`,
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

test.describe('Exam vouchers API — issue / bulk / RBAC / soft-delete flows', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120_000);

  let adminHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;

  let disposableUserId: number | null = null;
  let disposableEmail = '';
  let disposableHeaders: AuthHeaders | null = null;
  let disposable2UserId: number | null = null;
  let disposable2Email = '';
  let disposable2Headers: AuthHeaders | null = null;
  let candidateRoleId: number | null = null;

  let examId: number | null = null;
  let examName = '';
  let locationId: number | null = null;

  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const sessionLocationIds: number[] = [];
  const voucherIds: number[] = [];
  const userIdsToDelete: number[] = [];

  let sessionSlot = 0;
  let seedReady = false;
  let seedSkipReason = '';

  async function createSession(
    request: APIRequestContext,
    capacity = 30,
  ): Promise<number> {
    const { start, end } = hourMinute(sessionSlot++);
    const res = await request.post('/api/exam-sessions', {
      headers: adminHeaders,
      data: {
        EXAM_ID: examId,
        SS_START_TIME: start,
        SS_END_TIME: end,
        SS_CAPACITY: capacity,
        SS_SESSION_STATUS: ExamSessionStatus.OPEN,
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { SS_ID: number };
    sessionIds.push(body.SS_ID);
    return body.SS_ID;
  }

  async function ensureSessionLocation(
    request: APIRequestContext,
    sessionId: number,
  ): Promise<number> {
    if (!locationId) {
      throw new Error('locationId not seeded');
    }
    const res = await request.post('/api/exam-session-locations', {
      headers: adminHeaders,
      data: {
        LOCATION_ID: locationId,
        SS_ID: sessionId,
        LOCATION_SEAT_CAPACITY: 20,
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { SL_ID: number };
    sessionLocationIds.push(body.SL_ID);
    return body.SL_ID;
  }

  async function createEnrollment(
    request: APIRequestContext,
    opts: {
      sessionId: number;
      userId: number;
      headers: AuthHeaders;
    },
  ): Promise<EnrollmentRow> {
    const res = await request.post('/api/exam-enrollments', {
      headers: opts.headers,
      data: {
        USER_ID: opts.userId,
        SESSION_ID: opts.sessionId,
      },
    });
    const text = await res.text();
    expect(res.status(), text).toBe(201);
    const body = JSON.parse(text) as EnrollmentRow;
    enrollmentIds.push(body.ERM_ID);
    return body;
  }

  async function markPaid(
    request: APIRequestContext,
    ermId: number,
  ): Promise<EnrollmentRow> {
    const res = await request.patch(`/api/exam-enrollments/${ermId}`, {
      headers: adminHeaders,
      data: { ERM_STATUS: ExamEnrollmentStatus.PAID },
    });
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as EnrollmentRow;
  }

  async function getEnrollment(
    request: APIRequestContext,
    ermId: number,
  ): Promise<EnrollmentRow> {
    const res = await request.get(`/api/exam-enrollments/${ermId}`, {
      headers: adminHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as EnrollmentRow;
  }

  async function getSession(
    request: APIRequestContext,
    ssId: number,
  ): Promise<SessionRow> {
    const res = await request.get(`/api/exam-sessions/${ssId}`, {
      headers: adminHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as SessionRow;
  }

  /** SEAT_ASSIGNED + ERM_TEST_TAKER via bulk-seat-assignments */
  async function seedSeatAssignedWithTestTaker(
    request: APIRequestContext,
    opts: {
      userId: number;
      headers: AuthHeaders;
      seatLabel: string;
    },
  ): Promise<{ enrollment: EnrollmentRow; sessionId: number; slId: number }> {
    const sessionId = await createSession(request);
    const slId = await ensureSessionLocation(request, sessionId);
    const enrollment = await createEnrollment(request, {
      sessionId,
      userId: opts.userId,
      headers: opts.headers,
    });
    await markPaid(request, enrollment.ERM_ID);

    const ok = await request.patch(
      '/api/exam-enrollments/bulk-seat-assignments',
      {
        headers: adminHeaders,
        data: {
          sessionIds: [sessionId],
          assignments: [
            {
              ermId: enrollment.ERM_ID,
              seatLabel: opts.seatLabel,
              slId,
              sortOrder: 1,
            },
          ],
        },
      },
    );
    expect(ok.status(), await ok.text()).toBe(200);
    const seated = await getEnrollment(request, enrollment.ERM_ID);
    expect(seated.ERM_STATUS).toBe(ExamEnrollmentStatus.SEAT_ASSIGNED);
    expect(seated.ERM_TEST_TAKER).toBeTruthy();
    return { enrollment: seated, sessionId, slId };
  }

  /**
   * SEAT_ASSIGNED without ERM_TEST_TAKER — single PATCH does not call
   * TestTakerIdService.assign (only bulk-seat-assignments does).
   */
  async function seedSeatAssignedWithoutTestTaker(
    request: APIRequestContext,
    opts: {
      userId: number;
      headers: AuthHeaders;
      seatLabel: string;
    },
  ): Promise<{ enrollment: EnrollmentRow; sessionId: number }> {
    const sessionId = await createSession(request);
    const slId = await ensureSessionLocation(request, sessionId);
    const enrollment = await createEnrollment(request, {
      sessionId,
      userId: opts.userId,
      headers: opts.headers,
    });
    await markPaid(request, enrollment.ERM_ID);

    const seatOk = await request.patch(
      `/api/exam-enrollments/${enrollment.ERM_ID}`,
      {
        headers: adminHeaders,
        data: {
          SL_ID: slId,
          ERM_SEAT_LABEL: opts.seatLabel,
        },
      },
    );
    expect(seatOk.status(), await seatOk.text()).toBe(200);
    const seated = await getEnrollment(request, enrollment.ERM_ID);
    expect(seated.ERM_STATUS).toBe(ExamEnrollmentStatus.SEAT_ASSIGNED);
    expect(seated.ERM_TEST_TAKER == null || seated.ERM_TEST_TAKER === '').toBe(
      true,
    );
    return { enrollment: seated, sessionId };
  }

  async function findVoucherByErm(
    request: APIRequestContext,
    ermId: number,
  ): Promise<VoucherRow | null> {
    const res = await request.get('/api/exam-vouchers', {
      headers: adminHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    const all = (await res.json()) as VoucherRow[];
    const found = all.find((v) => v.ERM_ID === ermId) ?? null;
    if (found) voucherIds.push(found.VC_ID);
    return found;
  }

  test.beforeAll(async ({ request }) => {
    try {
      adminHeaders = await headersFor(request, 'admin');
      candidateHeaders = await headersFor(request, 'candidate');
    } catch (err) {
      seedSkipReason = `Login failed: ${String(err)}`;
      return;
    }

    const rolesRes = await request.get('/api/roles', { headers: adminHeaders });
    if (!rolesRes.ok()) {
      seedSkipReason = `Cannot list roles: ${rolesRes.status()}`;
      return;
    }
    const roles = (await rolesRes.json()) as RoleRow[];
    const candidateRole = roles.find((r) => r.ROLE_NAME === 'candidate');
    if (!candidateRole) {
      seedSkipReason = 'candidate role missing';
      return;
    }
    candidateRoleId = candidateRole.ROLE_ID;

    const suffix = uniqueSuffix();
    disposableEmail = `vouch-i.${suffix}@buu-get.test`;
    disposable2Email = `vouch-i2.${suffix}@buu-get.test`;

    for (const u of [
      {
        email: disposableEmail,
        nationalId: uniqueNationalId(),
        name: `VOUCH-I Disposable ${suffix}`,
      },
      {
        email: disposable2Email,
        nationalId: uniqueNationalId(),
        name: `VOUCH-I Disposable2 ${suffix}`,
      },
    ]) {
      const userRes = await request.post('/api/users', {
        headers: adminHeaders,
        data: {
          USER_EMAIL: u.email,
          USER_PASSWORD: TEST_PASSWORD,
          USER_STATUS: 'ACTIVE',
          USER_NATIONAL_ID: u.nationalId,
          USER_ROLES: [candidateRoleId],
          profile: { userFullnameTh: u.name },
        },
      });
      if (![200, 201].includes(userRes.status())) {
        seedSkipReason = `Cannot create disposable user ${u.email}: ${userRes.status()} ${await userRes.text()}`;
        return;
      }
      const createdUser = (await userRes.json()) as UserRow;
      userIdsToDelete.push(createdUser.USER_ID);
      if (u.email === disposableEmail) {
        disposableUserId = createdUser.USER_ID;
      } else {
        disposable2UserId = createdUser.USER_ID;
      }
    }

    try {
      const logged = await loginEmail(request, disposableEmail, TEST_PASSWORD);
      disposableHeaders = logged.headers;
      if (logged.userId) disposableUserId = logged.userId;
      const logged2 = await loginEmail(
        request,
        disposable2Email,
        TEST_PASSWORD,
      );
      disposable2Headers = logged2.headers;
      if (logged2.userId) disposable2UserId = logged2.userId;
    } catch (err) {
      seedSkipReason = `Disposable user login failed: ${String(err)}`;
      return;
    }

    examName = `VOUCH-I exam ${suffix}`;
    // EXAM_ROUND must start with 1–99 (test-taker ID prefix)
    const roundNum = 40 + (Number(suffix.slice(-2)) % 50);
    const examRes = await request.post('/api/exam', {
      headers: adminHeaders,
      data: {
        EXAM_NAME: examName,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE,
        EXAM_DATE: '2026-12-20',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-19T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-19T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: String(roundNum),
        EXAM_FISCAL_YEAR: '2026',
        FUND_SOURCE_ID: 1,
        SRB_ID: 1,
      },
    });
    if (![200, 201].includes(examRes.status())) {
      seedSkipReason = `Cannot create exam: ${examRes.status()} ${await examRes.text()}`;
      return;
    }
    examId = ((await examRes.json()) as { EXAM_ID: number }).EXAM_ID;

    const locRes = await request.post('/api/exam-locations', {
      headers: adminHeaders,
      data: {
        LOCATION_NAME: `VOUCH-I loc ${suffix}`,
        LOCATION_ROOM_NO: `V${suffix.slice(-4)}`,
        LOCATION_TOTAL_ROWS: 2,
        LOCATION_TOTAL_COLS: 3,
        LOCATION_SEAT_CAPACITY: 6,
      },
    });
    if (![200, 201].includes(locRes.status())) {
      seedSkipReason = `Cannot create location: ${locRes.status()} ${await locRes.text()}`;
      return;
    }
    locationId = ((await locRes.json()) as { LOCATION_ID: number }).LOCATION_ID;

    seedReady = true;
  });

  test.afterAll(async ({ request }) => {
    for (const vcId of [...new Set(voucherIds)]) {
      await request
        .delete(`/api/exam-vouchers/${vcId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    for (const ermId of enrollmentIds) {
      await request
        .delete(`/api/exam-enrollments/${ermId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    for (const slId of sessionLocationIds) {
      await request
        .delete(`/api/exam-session-locations/${slId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const ssId of sessionIds) {
      await request
        .delete(`/api/exam-sessions/${ssId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    if (locationId) {
      await request
        .delete(`/api/exam-locations/${locationId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    if (examId) {
      await request
        .delete(`/api/exam/${examId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    for (const userId of userIdsToDelete) {
      await request
        .delete(`/api/users/${userId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
  });

  function requireSeed(): void {
    test.skip(!seedReady, seedSkipReason || 'Disposable exam seed failed');
  }

  // VOUCH-I-001
  test('POST bulk-issue atomic — published + vouchers + session VOUCHER_SENT', async ({
    request,
  }) => {
    requireSeed();
    expect(disposableUserId).toBeTruthy();
    expect(disposable2UserId).toBeTruthy();

    const a = await seedSeatAssignedWithTestTaker(request, {
      userId: disposableUserId!,
      headers: disposableHeaders!,
      seatLabel: 'A-01',
    });
    const b = await seedSeatAssignedWithTestTaker(request, {
      userId: disposable2UserId!,
      headers: disposable2Headers!,
      seatLabel: 'A-01',
    });

    const sessionBeforeA = await getSession(request, a.sessionId);
    expect(sessionBeforeA.SS_SESSION_STATUS).toBe(
      ExamSessionStatus.SEAT_ALLOCATED,
    );

    const res = await request.post('/api/exam-vouchers/bulk-issue', {
      headers: adminHeaders,
      data: {
        ermIds: [a.enrollment.ERM_ID, b.enrollment.ERM_ID],
        examName,
        historyUrl: 'https://buu-get.test/history',
        sessionIds: [a.sessionId, b.sessionId],
      },
    });
    const text = await res.text();
    expect([200, 201].includes(res.status()), text).toBe(true);
    const body = JSON.parse(text) as {
      success: boolean;
      updatedEnrollmentCount: number;
      updatedSessionIds: number[];
    };
    expect(body.success).toBe(true);
    expect(body.updatedEnrollmentCount).toBe(2);
    expect(body.updatedSessionIds.sort()).toEqual(
      [a.sessionId, b.sessionId].sort(),
    );

    const enrA = await getEnrollment(request, a.enrollment.ERM_ID);
    const enrB = await getEnrollment(request, b.enrollment.ERM_ID);
    expect(enrA.ERM_STATUS).toBe(ExamEnrollmentStatus.SEAT_PUBLISHED);
    expect(enrB.ERM_STATUS).toBe(ExamEnrollmentStatus.SEAT_PUBLISHED);

    const voucherA = await findVoucherByErm(request, a.enrollment.ERM_ID);
    const voucherB = await findVoucherByErm(request, b.enrollment.ERM_ID);
    expect(voucherA).toBeTruthy();
    expect(voucherB).toBeTruthy();
    expect(voucherA!.VC_CODE).toMatch(/^VC-\d{4}-/);
    expect(voucherB!.VC_CODE).toMatch(/^VC-\d{4}-/);

    const sessionA = await getSession(request, a.sessionId);
    const sessionB = await getSession(request, b.sessionId);
    expect(sessionA.SS_SESSION_STATUS).toBe(ExamSessionStatus.VOUCHER_SENT);
    expect(sessionB.SS_SESSION_STATUS).toBe(ExamSessionStatus.VOUCHER_SENT);
  });

  // VOUCH-I-002
  test('POST enrollment/:ermId issue — voucher + seat published', async ({
    request,
  }) => {
    requireSeed();
    const { enrollment } = await seedSeatAssignedWithTestTaker(request, {
      userId: disposableUserId!,
      headers: disposableHeaders!,
      seatLabel: 'B-01',
    });

    const res = await request.post(
      `/api/exam-vouchers/enrollment/${enrollment.ERM_ID}`,
      { headers: adminHeaders },
    );
    const text = await res.text();
    expect([200, 201].includes(res.status()), text).toBe(true);
    const voucher = JSON.parse(text) as VoucherRow;
    expect(voucher.ERM_ID).toBe(enrollment.ERM_ID);
    expect(voucher.VC_CODE).toMatch(/^VC-\d{4}-/);
    voucherIds.push(voucher.VC_ID);

    const seated = await getEnrollment(request, enrollment.ERM_ID);
    expect(seated.ERM_STATUS).toBe(ExamEnrollmentStatus.SEAT_PUBLISHED);

    // Single issue does not bump session to VOUCHER_SENT (bulk-only)
    const session = await getSession(request, enrollment.SESSION_ID);
    expect(session.SS_SESSION_STATUS).toBe(ExamSessionStatus.SEAT_ALLOCATED);
  });

  // VOUCH-I-003
  test('POST enrollment/:ermId idempotent — same code on second call', async ({
    request,
  }) => {
    requireSeed();
    const { enrollment } = await seedSeatAssignedWithTestTaker(request, {
      userId: disposableUserId!,
      headers: disposableHeaders!,
      seatLabel: 'C-01',
    });

    const first = await request.post(
      `/api/exam-vouchers/enrollment/${enrollment.ERM_ID}`,
      { headers: adminHeaders },
    );
    const firstText = await first.text();
    expect([200, 201].includes(first.status()), firstText).toBe(true);
    const v1 = JSON.parse(firstText) as VoucherRow;
    voucherIds.push(v1.VC_ID);

    const second = await request.post(
      `/api/exam-vouchers/enrollment/${enrollment.ERM_ID}`,
      { headers: adminHeaders },
    );
    const secondText = await second.text();
    expect([200, 201].includes(second.status()), secondText).toBe(true);
    const v2 = JSON.parse(secondText) as VoucherRow;

    expect(v2.VC_ID).toBe(v1.VC_ID);
    expect(v2.VC_CODE).toBe(v1.VC_CODE);
  });

  // VOUCH-I-004
  test('POST bulk-issue 400 missing test-taker — no mutation', async ({
    request,
  }) => {
    requireSeed();
    const { enrollment, sessionId } = await seedSeatAssignedWithoutTestTaker(
      request,
      {
        userId: disposableUserId!,
        headers: disposableHeaders!,
        seatLabel: 'D-01',
      },
    );

    const sessionBefore = await getSession(request, sessionId);
    const statusBefore = sessionBefore.SS_SESSION_STATUS;

    const res = await request.post('/api/exam-vouchers/bulk-issue', {
      headers: adminHeaders,
      data: {
        ermIds: [enrollment.ERM_ID],
        examName,
        historyUrl: 'https://buu-get.test/history',
        sessionIds: [sessionId],
      },
    });
    expect(res.status(), await res.text()).toBe(400);

    const after = await getEnrollment(request, enrollment.ERM_ID);
    expect(after.ERM_STATUS).toBe(ExamEnrollmentStatus.SEAT_ASSIGNED);

    const voucher = await findVoucherByErm(request, enrollment.ERM_ID);
    expect(voucher).toBeNull();

    const sessionAfter = await getSession(request, sessionId);
    expect(sessionAfter.SS_SESSION_STATUS).toBe(statusBefore);
  });

  // VOUCH-I-005
  test('DTO validation 400 on bad bodies', async ({ request }) => {
    requireSeed();

    const bulkBad = await request.post('/api/exam-vouchers/bulk-issue', {
      headers: adminHeaders,
      data: {
        ermIds: 'not-an-array',
        examName: '',
      },
    });
    expect(bulkBad.status(), await bulkBad.text()).toBe(400);

    const bulkMissing = await request.post('/api/exam-vouchers/bulk-issue', {
      headers: adminHeaders,
      data: { ermIds: [1] },
    });
    expect(bulkMissing.status(), await bulkMissing.text()).toBe(400);

    const createBad = await request.post('/api/exam-vouchers', {
      headers: adminHeaders,
      data: { ERM_ID: 'x', VC_CODE: '' },
    });
    expect(createBad.status(), await createBad.text()).toBe(400);

    const sendBad = await request.post('/api/exam-vouchers/send-ticket', {
      headers: adminHeaders,
      data: {
        email: 'not-an-email',
        fullName: '',
        examName: '',
        historyUrl: '',
      },
    });
    expect(sendBad.status(), await sendBad.text()).toBe(400);
  });

  // VOUCH-I-006
  test('Unauthenticated requests return 401', async ({ request }) => {
    requireSeed();

    const routes: Array<{
      method: 'get' | 'post' | 'patch' | 'delete';
      path: string;
      data?: Record<string, unknown>;
    }> = [
      { method: 'get', path: '/api/exam-vouchers' },
      { method: 'get', path: '/api/exam-vouchers/1' },
      {
        method: 'post',
        path: '/api/exam-vouchers',
        data: { ERM_ID: 1, VC_CODE: 'VC-X' },
      },
      { method: 'post', path: '/api/exam-vouchers/enrollment/1' },
      {
        method: 'post',
        path: '/api/exam-vouchers/bulk-issue',
        data: {
          ermIds: [1],
          examName: 'x',
          historyUrl: 'https://example.com',
        },
      },
      {
        method: 'post',
        path: '/api/exam-vouchers/send-ticket',
        data: {
          email: 'a@b.co',
          fullName: 'x',
          examName: 'x',
          historyUrl: 'https://example.com',
        },
      },
      { method: 'patch', path: '/api/exam-vouchers/1', data: { VC_CODE: 'Y' } },
      { method: 'delete', path: '/api/exam-vouchers/1' },
    ];

    for (const route of routes) {
      const res = await request[route.method](route.path, {
        data: route.data,
      });
      expect(res.status(), `${route.method.toUpperCase()} ${route.path}`).toBe(
        401,
      );
    }
  });

  // VOUCH-I-007 — controller has no @Roles; any authenticated JWT may mutate
  test('Any authenticated role (candidate) allowed to mutate', async ({
    request,
  }) => {
    requireSeed();
    const { enrollment } = await seedSeatAssignedWithTestTaker(request, {
      userId: disposableUserId!,
      headers: disposableHeaders!,
      seatLabel: 'E-01',
    });

    const res = await request.post(
      `/api/exam-vouchers/enrollment/${enrollment.ERM_ID}`,
      { headers: candidateHeaders },
    );
    const text = await res.text();
    expect([200, 201].includes(res.status()), text).toBe(true);
    const voucher = JSON.parse(text) as VoucherRow;
    expect(voucher.ERM_ID).toBe(enrollment.ERM_ID);
    voucherIds.push(voucher.VC_ID);

    const bulk = await request.post('/api/exam-vouchers/bulk-issue', {
      headers: candidateHeaders,
      data: {
        ermIds: [enrollment.ERM_ID],
        examName,
        historyUrl: 'https://buu-get.test/history',
      },
    });
    const bulkText = await bulk.text();
    expect([200, 201].includes(bulk.status()), bulkText).toBe(true);
    expect((JSON.parse(bulkText) as { success: boolean }).success).toBe(true);
  });

  // VOUCH-I-008
  test('DELETE soft-delete — 404 after remove', async ({ request }) => {
    requireSeed();
    const { enrollment } = await seedSeatAssignedWithTestTaker(request, {
      userId: disposableUserId!,
      headers: disposableHeaders!,
      seatLabel: 'F-01',
    });

    const createRes = await request.post(
      `/api/exam-vouchers/enrollment/${enrollment.ERM_ID}`,
      { headers: adminHeaders },
    );
    const createText = await createRes.text();
    expect([200, 201].includes(createRes.status()), createText).toBe(true);
    const voucher = JSON.parse(createText) as VoucherRow;
    voucherIds.push(voucher.VC_ID);

    const del = await request.delete(`/api/exam-vouchers/${voucher.VC_ID}`, {
      headers: adminHeaders,
    });
    expect([200, 204].includes(del.status()), await del.text()).toBe(true);

    const getAfter = await request.get(`/api/exam-vouchers/${voucher.VC_ID}`, {
      headers: adminHeaders,
    });
    expect(getAfter.status(), await getAfter.text()).toBe(404);
  });

  // VOUCH-I-009
  test('POST send-ticket returns { success: true }', async ({ request }) => {
    requireSeed();

    const res = await request.post('/api/exam-vouchers/send-ticket', {
      headers: adminHeaders,
      data: {
        email: disposableEmail,
        fullName: 'VOUCH-I Tester',
        examName,
        historyUrl: 'https://buu-get.test/history',
      },
    });
    const text = await res.text();
    expect([200, 201].includes(res.status()), text).toBe(true);
    const body = JSON.parse(text) as { success: boolean };
    expect(body.success).toBe(true);
  });

  // VOUCH-I-010
  test('ParseIntPipe rejects non-int :id on GET/PATCH', async ({ request }) => {
    requireSeed();

    const getBad = await request.get('/api/exam-vouchers/abc', {
      headers: adminHeaders,
    });
    expect(getBad.status(), await getBad.text()).toBe(400);

    const patchBad = await request.patch('/api/exam-vouchers/abc', {
      headers: adminHeaders,
      data: { VC_CODE: 'VC-noop' },
    });
    expect(patchBad.status(), await patchBad.text()).toBe(400);

    const delBad = await request.delete('/api/exam-vouchers/abc', {
      headers: adminHeaders,
    });
    expect(delBad.status(), await delBad.text()).toBe(400);

    const enrollBad = await request.post('/api/exam-vouchers/enrollment/abc', {
      headers: adminHeaders,
    });
    expect(enrollBad.status(), await enrollBad.text()).toBe(400);
  });
});
