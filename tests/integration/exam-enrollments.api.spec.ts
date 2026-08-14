import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import { TEST_PASSWORD, type TestRoleKey } from '../e2e/fixtures/users';

/**
 * Exam enrollments API integration — matrix ENR-I-001 … ENR-I-012
 *
 * Seed approach (shared-DB, disposable via API):
 * 1. Admin creates open / closed / SPECIAL exams + sessions
 * 2. Disposable candidate (national ID) for SPECIAL / capacity / self-or-roles
 * 3. Location + session-location for seat assignment
 * 4. afterAll soft-deletes enrollments, sessions, locations, exams, users
 */

const ExamEnrollmentStatus = {
  UNPAID: 0,
  PAID: 1,
  SEAT_ASSIGNED: 2,
  SEAT_PUBLISHED: 3,
  ATTENDED: 4,
  CANCELLED: 5,
} as const;

const ExamVerifyStatus = {
  UNCHECKED: 0,
  PASS: 1,
  WAIT_FIXED: 2,
  CANCELLED: 3,
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
  ERM_ATTEND_CHECK_IN_TIME?: string | null;
};

type UserRow = {
  USER_ID: number;
  USER_EMAIL: string;
  USER_NATIONAL_ID?: string | null;
};

type RoleRow = { ROLE_ID: number; ROLE_NAME: string };

type Paginated<T> = { data: T[]; meta?: { total?: number } };

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function uniqueNationalId(): string {
  const digits = uniqueSuffix().replace(/\D/g, '').padStart(12, '0').slice(-12);
  return `9${digits}`;
}

function hourMinute(slot: number): { start: string; end: string } {
  // Non-overlapping 1h windows (shared location forbids overlapping times)
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

test.describe('Exam enrollments API — create / seats / RBAC / match flows', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120_000);

  let adminHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;
  let financeHeaders: AuthHeaders;
  let proctorHeaders: AuthHeaders;
  let executiveHeaders: AuthHeaders;

  let candidateUserId: number;
  let disposableUserId: number | null = null;
  let disposableEmail = '';
  let disposableNationalId = '';
  let disposableHeaders: AuthHeaders | null = null;
  let disposable2UserId: number | null = null;
  let disposable2Email = '';
  let disposable2Headers: AuthHeaders | null = null;
  let candidateRoleId: number | null = null;

  let openExamId: number | null = null;
  let closedExamId: number | null = null;
  let specialExamId: number | null = null;
  let locationId: number | null = null;

  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const sessionLocationIds: number[] = [];
  const userIdsToDelete: number[] = [];

  let sessionSlot = 0;
  let seedReady = false;
  let seedSkipReason = '';

  async function createSession(
    request: APIRequestContext,
    examId: number,
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
    opts: {
      sessionId: number;
      userId: number;
      headers?: AuthHeaders;
      passcode?: string;
      status?: number;
    },
  ): Promise<EnrollmentRow> {
    const data: Record<string, unknown> = {
      USER_ID: opts.userId,
      SESSION_ID: opts.sessionId,
    };
    if (opts.passcode !== undefined) data.PASSCODE = opts.passcode;
    if (opts.status !== undefined) data.ERM_STATUS = opts.status;

    const res = await request.post('/api/exam-enrollments', {
      headers: opts.headers ?? candidateHeaders,
      data,
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

  async function markVerified(
    request: APIRequestContext,
    ermId: number,
  ): Promise<EnrollmentRow> {
    const res = await request.patch(`/api/exam-enrollments/${ermId}`, {
      headers: adminHeaders,
      data: { ERM_VERIFY_STATUS: ExamVerifyStatus.PASS },
    });
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as EnrollmentRow;
  }

  async function getEnrollment(
    request: APIRequestContext,
    ermId: number,
    headers: AuthHeaders = adminHeaders,
  ): Promise<{ status: number; body: EnrollmentRow | Record<string, unknown> }> {
    const res = await request.get(`/api/exam-enrollments/${ermId}`, {
      headers,
    });
    const body = (await res.json().catch(() => ({}))) as EnrollmentRow;
    return { status: res.status(), body };
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

  test.beforeAll(async ({ request }) => {
    try {
      adminHeaders = await headersFor(request, 'admin');
      candidateHeaders = await headersFor(request, 'candidate');
      financeHeaders = await headersFor(request, 'finance');
      proctorHeaders = await headersFor(request, 'proctor');
      executiveHeaders = await headersFor(request, 'executive');
    } catch (err) {
      seedSkipReason = `Login failed: ${String(err)}`;
      return;
    }

    const meCand = await request.get('/api/auth/me', {
      headers: candidateHeaders,
    });
    expect(meCand.status()).toBe(200);
    candidateUserId = ((await meCand.json()) as { id: number }).id;

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
    disposableNationalId = uniqueNationalId();
    disposableEmail = `enr-i.${suffix}@buu-get.test`;
    const disposable2NationalId = uniqueNationalId();
    disposable2Email = `enr-i2.${suffix}@buu-get.test`;

    for (const u of [
      {
        email: disposableEmail,
        nationalId: disposableNationalId,
        name: `ENR-I Disposable ${suffix}`,
      },
      {
        email: disposable2Email,
        nationalId: disposable2NationalId,
        name: `ENR-I Disposable2 ${suffix}`,
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

    const openExamRes = await request.post('/api/exam', {
      headers: adminHeaders,
      data: {
        EXAM_NAME: `ENR-I open ${suffix}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE,
        EXAM_DATE: '2026-12-28',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        // EXAM_ROUND must start with 1–99 (test-taker ID prefix)
        EXAM_ROUND: '11',
        EXAM_FISCAL_YEAR: '2026',
        FUND_SOURCE_ID: 1,
        SRB_ID: 1,
      },
    });
    if (![200, 201].includes(openExamRes.status())) {
      seedSkipReason = `Cannot create open exam: ${openExamRes.status()} ${await openExamRes.text()}`;
      return;
    }
    openExamId = ((await openExamRes.json()) as { EXAM_ID: number }).EXAM_ID;

    const closedExamRes = await request.post('/api/exam', {
      headers: adminHeaders,
      data: {
        EXAM_NAME: `ENR-I closed ${suffix}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE,
        EXAM_DATE: '2025-06-15',
        EXAM_REG_START_DATE: '2025-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2025-05-01T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2025-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2025-05-01T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: '12',
        EXAM_FISCAL_YEAR: '2025',
        FUND_SOURCE_ID: 1,
        SRB_ID: 1,
      },
    });
    if (![200, 201].includes(closedExamRes.status())) {
      seedSkipReason = `Cannot create closed exam: ${closedExamRes.status()} ${await closedExamRes.text()}`;
      return;
    }
    closedExamId = ((await closedExamRes.json()) as { EXAM_ID: number })
      .EXAM_ID;

    const specialExamRes = await request.post('/api/exam', {
      headers: adminHeaders,
      data: {
        EXAM_NAME: `ENR-I special ${suffix}`,
        EXAM_TYPE: 'รอบพิเศษ',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE: 0,
        EXAM_DATE: '2026-12-28',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: '13',
        EXAM_FISCAL_YEAR: '2026',
        FUND_SOURCE_ID: 1,
        SRB_ID: 1,
      },
    });
    if (![200, 201].includes(specialExamRes.status())) {
      seedSkipReason = `Cannot create SPECIAL exam: ${specialExamRes.status()} ${await specialExamRes.text()}`;
      return;
    }
    specialExamId = ((await specialExamRes.json()) as { EXAM_ID: number })
      .EXAM_ID;

    const passcodeRes = await request.post(
      `/api/exam/${specialExamId}/passcodes`,
      {
        headers: adminHeaders,
        data: {
          passcodes: [
            {
              nationalId: disposableNationalId,
              fullName: `ENR-I Disposable ${suffix}`,
              passcode: 'ENRSPC01',
            },
          ],
        },
      },
    );
    if (![200, 201].includes(passcodeRes.status())) {
      seedSkipReason = `Cannot create passcodes: ${passcodeRes.status()} ${await passcodeRes.text()}`;
      return;
    }

    const locRes = await request.post('/api/exam-locations', {
      headers: adminHeaders,
      data: {
        LOCATION_NAME: `ENR-I loc ${suffix}`,
        LOCATION_ROOM_NO: `R${suffix.slice(-4)}`,
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
    for (const examId of [openExamId, closedExamId, specialExamId]) {
      if (examId) {
        await request
          .delete(`/api/exam/${examId}`, { headers: adminHeaders })
          .catch(() => undefined);
      }
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

  // ENR-I-001
  test('POST create persists rules (201 / capacity / window / dup)', async ({
    request,
  }) => {
    requireSeed();
    expect(openExamId).toBeTruthy();
    expect(closedExamId).toBeTruthy();

    const openSessionId = await createSession(request, openExamId!, 30);
    const ok = await createEnrollment(request, {
      sessionId: openSessionId,
      userId: candidateUserId,
    });
    expect(ok.ERM_STATUS).toBe(ExamEnrollmentStatus.UNPAID);
    expect(ok.USER_ID).toBe(candidateUserId);
    expect(ok.SESSION_ID).toBe(openSessionId);

    const dup = await request.post('/api/exam-enrollments', {
      headers: candidateHeaders,
      data: { USER_ID: candidateUserId, SESSION_ID: openSessionId },
    });
    expect(dup.status(), await dup.text()).toBe(409);

    const fullSessionId = await createSession(request, openExamId!, 1);
    await createEnrollment(request, {
      sessionId: fullSessionId,
      userId: candidateUserId,
      // distinct time slot from openSessionId — no sister conflict
    });
    // Fill capacity with disposable user first seat already taken by candidate
    // Capacity 1 → second enrollee gets FULL
    const fullRes = await request.post('/api/exam-enrollments', {
      headers: adminHeaders,
      data: {
        USER_ID: disposableUserId,
        SESSION_ID: fullSessionId,
      },
    });
    expect(fullRes.status(), await fullRes.text()).toBe(400);
    const fullBody = (await fullRes.json()) as { message?: string };
    expect(String(fullBody.message)).toContain('FULL');

    const closedSessionId = await createSession(request, closedExamId!, 10);
    const closedRes = await request.post('/api/exam-enrollments', {
      headers: candidateHeaders,
      data: { USER_ID: candidateUserId, SESSION_ID: closedSessionId },
    });
    expect(closedRes.status(), await closedRes.text()).toBe(400);
    const closedBody = (await closedRes.json()) as { message?: string };
    const closedMsg = String(closedBody.message);
    expect(
      closedMsg.includes('REGISTRATION_CLOSED') ||
        closedMsg.includes('EXAM_STARTED') ||
        closedMsg.includes('REGISTRATION_NOT_OPEN'),
    ).toBe(true);
  });

  // ENR-I-002
  test('POST validate-passcode SPECIAL valid/400', async ({ request }) => {
    requireSeed();
    expect(specialExamId).toBeTruthy();
    expect(disposableHeaders).toBeTruthy();

    const specialSessionId = await createSession(request, specialExamId!, 20);

    const valid = await request.post('/api/exam-enrollments/validate-passcode', {
      headers: disposableHeaders!,
      data: { SESSION_ID: specialSessionId, PASSCODE: 'ENRSPC01' },
    });
    const validText = await valid.text();
    expect([200, 201].includes(valid.status()), validText).toBe(true);
    const validBody = JSON.parse(validText) as { valid: boolean };
    expect(validBody.valid).toBe(true);

    const invalid = await request.post(
      '/api/exam-enrollments/validate-passcode',
      {
        headers: disposableHeaders!,
        data: { SESSION_ID: specialSessionId, PASSCODE: 'WRONGCODE' },
      },
    );
    expect(invalid.status(), await invalid.text()).toBe(400);

    // Side-effect: SPECIAL create with passcode → PAID
    const enrolled = await createEnrollment(request, {
      sessionId: specialSessionId,
      userId: disposableUserId!,
      headers: disposableHeaders!,
      passcode: 'ENRSPC01',
    });
    expect(enrolled.ERM_STATUS).toBe(ExamEnrollmentStatus.PAID);
  });

  // ENR-I-003
  test('POST check-in ENROLLMENT_ADMIN only → ATTENDED', async ({
    request,
  }) => {
    requireSeed();
    const sessionId = await createSession(request, openExamId!);
    const enrollment = await createEnrollment(request, {
      sessionId,
      userId: candidateUserId,
    });
    await markPaid(request, enrollment.ERM_ID);

    const forbidden = await request.post(
      `/api/exam-enrollments/${enrollment.ERM_ID}/check-in`,
      {
        headers: candidateHeaders,
        data: {},
      },
    );
    expect(forbidden.status(), await forbidden.text()).toBe(403);

    const financeDenied = await request.post(
      `/api/exam-enrollments/${enrollment.ERM_ID}/check-in`,
      {
        headers: financeHeaders,
        data: {},
      },
    );
    expect(financeDenied.status(), await financeDenied.text()).toBe(403);

    const proctorDenied = await request.post(
      `/api/exam-enrollments/${enrollment.ERM_ID}/check-in`,
      {
        headers: proctorHeaders,
        data: {},
      },
    );
    expect(proctorDenied.status(), await proctorDenied.text()).toBe(403);

    const ok = await request.post(
      `/api/exam-enrollments/${enrollment.ERM_ID}/check-in`,
      {
        headers: adminHeaders,
        data: {},
      },
    );
    const okText = await ok.text();
    expect([200, 201].includes(ok.status()), okText).toBe(true);
    const body = JSON.parse(okText) as EnrollmentRow;
    expect(body.ERM_STATUS).toBe(ExamEnrollmentStatus.ATTENDED);
    expect(body.ERM_ATTEND_CHECK_IN_TIME).toBeTruthy();
  });

  // ENR-I-004
  test('PATCH bulk-seat-assignments TX + unique seat', async ({ request }) => {
    requireSeed();
    const sessionId = await createSession(request, openExamId!);
    const slId = await ensureSessionLocation(request, sessionId);

    const e1 = await createEnrollment(request, {
      sessionId,
      userId: disposableUserId!,
      headers: disposableHeaders!,
    });
    await markPaid(request, e1.ERM_ID);
    await markVerified(request, e1.ERM_ID);

    const e2 = await createEnrollment(request, {
      sessionId,
      userId: disposable2UserId!,
      headers: disposable2Headers!,
    });
    await markPaid(request, e2.ERM_ID);
    await markVerified(request, e2.ERM_ID);

    const forbidden = await request.patch(
      '/api/exam-enrollments/bulk-seat-assignments',
      {
        headers: candidateHeaders,
        data: {
          sessionIds: [sessionId],
          assignments: [
            {
              ermId: e1.ERM_ID,
              seatLabel: 'A-01',
              slId,
              sortOrder: 1,
            },
          ],
        },
      },
    );
    expect(forbidden.status(), await forbidden.text()).toBe(403);

    const dupSeat = await request.patch(
      '/api/exam-enrollments/bulk-seat-assignments',
      {
        headers: adminHeaders,
        data: {
          sessionIds: [sessionId],
          assignments: [
            {
              ermId: e1.ERM_ID,
              seatLabel: 'A-01',
              slId,
              sortOrder: 1,
            },
            {
              ermId: e2.ERM_ID,
              seatLabel: 'A-01',
              slId,
              sortOrder: 2,
            },
          ],
        },
      },
    );
    expect(dupSeat.status(), await dupSeat.text()).toBe(409);

    const ok = await request.patch(
      '/api/exam-enrollments/bulk-seat-assignments',
      {
        headers: adminHeaders,
        data: {
          sessionIds: [sessionId],
          assignments: [
            {
              ermId: e1.ERM_ID,
              seatLabel: 'A-01',
              slId,
              sortOrder: 1,
            },
            {
              ermId: e2.ERM_ID,
              seatLabel: 'A-02',
              slId,
              sortOrder: 2,
            },
          ],
        },
      },
    );
    const okText = await ok.text();
    expect(ok.status(), okText).toBe(200);
    const rows = JSON.parse(okText) as EnrollmentRow[];
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.ERM_STATUS).toBe(ExamEnrollmentStatus.SEAT_ASSIGNED);
      expect(row.SL_ID).toBe(slId);
      expect(row.ERM_SEAT_LABEL).toMatch(/^A-0[12]$/);
    }

    const verify1 = await getEnrollment(request, e1.ERM_ID);
    expect(verify1.status).toBe(200);
    expect((verify1.body as EnrollmentRow).ERM_SEAT_LABEL).toBe('A-01');
  });

  test('PATCH bulk-seat-assignments 409 when verify status is incomplete', async ({
    request,
  }) => {
    requireSeed();
    const sessionId = await createSession(request, openExamId!);
    const slId = await ensureSessionLocation(request, sessionId);

    const enrollment = await createEnrollment(request, {
      sessionId,
      userId: disposableUserId!,
      headers: disposableHeaders!,
    });
    await markPaid(request, enrollment.ERM_ID);

    const res = await request.patch(
      '/api/exam-enrollments/bulk-seat-assignments',
      {
        headers: adminHeaders,
        data: {
          sessionIds: [sessionId],
          assignments: [
            {
              ermId: enrollment.ERM_ID,
              seatLabel: 'A-01',
              slId,
              sortOrder: 1,
            },
          ],
        },
      },
    );
    const text = await res.text();
    expect(res.status(), text).toBe(409);
    const body = JSON.parse(text) as { error?: string; message?: string };
    expect(body.error).toBe('ENROLLMENTS_NOT_VERIFIED');
  });

  // ENR-I-005
  test('GET user/:id assertSelfOrRoles 403/200', async ({ request }) => {
    requireSeed();
    expect(disposableUserId).toBeTruthy();

    const selfOk = await request.get(
      `/api/exam-enrollments/user/${candidateUserId}`,
      { headers: candidateHeaders },
    );
    expect(selfOk.status(), await selfOk.text()).toBe(200);
    expect(Array.isArray(await selfOk.json())).toBe(true);

    const otherDenied = await request.get(
      `/api/exam-enrollments/user/${disposableUserId}`,
      { headers: candidateHeaders },
    );
    expect(otherDenied.status(), await otherDenied.text()).toBe(403);

    const adminOk = await request.get(
      `/api/exam-enrollments/user/${disposableUserId}`,
      { headers: adminHeaders },
    );
    expect(adminOk.status(), await adminOk.text()).toBe(200);
  });

  // ENR-I-006
  test('GET findAll admin only — candidate 403', async ({ request }) => {
    requireSeed();

    const denied = await request.get('/api/exam-enrollments', {
      headers: candidateHeaders,
    });
    expect(denied.status(), await denied.text()).toBe(403);

    const financeDenied = await request.get('/api/exam-enrollments', {
      headers: financeHeaders,
    });
    expect(financeDenied.status(), await financeDenied.text()).toBe(403);

    const ok = await request.get('/api/exam-enrollments?page=1&limit=5', {
      headers: adminHeaders,
    });
    expect(ok.status(), await ok.text()).toBe(200);
    const body = (await ok.json()) as Paginated<EnrollmentRow>;
    expect(Array.isArray(body.data)).toBe(true);
  });

  // ENR-I-007
  test('GET executive EXECUTIVE only — non-exec 403', async ({ request }) => {
    requireSeed();

    const denied = await request.get(
      '/api/exam-enrollments/executive/test-takers',
      { headers: candidateHeaders },
    );
    expect(denied.status(), await denied.text()).toBe(403);

    const financeDenied = await request.get(
      '/api/exam-enrollments/executive/test-takers',
      { headers: financeHeaders },
    );
    expect(financeDenied.status(), await financeDenied.text()).toBe(403);

    const ok = await request.get(
      '/api/exam-enrollments/executive/test-takers?page=1&limit=5',
      { headers: executiveHeaders },
    );
    expect(ok.status(), await ok.text()).toBe(200);
  });

  // ENR-I-008
  test('PATCH candidate cancel vs admin seat paths', async ({ request }) => {
    requireSeed();
    const sessionId = await createSession(request, openExamId!);
    const slId = await ensureSessionLocation(request, sessionId);

    const unpaid = await createEnrollment(request, {
      sessionId,
      userId: candidateUserId,
    });

    const cancelOk = await request.patch(
      `/api/exam-enrollments/${unpaid.ERM_ID}`,
      {
        headers: candidateHeaders,
        data: { ERM_STATUS: ExamEnrollmentStatus.CANCELLED },
      },
    );
    expect(cancelOk.status(), await cancelOk.text()).toBe(200);
    expect(((await cancelOk.json()) as EnrollmentRow).ERM_STATUS).toBe(
      ExamEnrollmentStatus.CANCELLED,
    );

    // Fresh UNPAID for admin seat path
    const forSeat = await createEnrollment(request, {
      sessionId,
      userId: disposableUserId!,
      headers: disposableHeaders!,
    });
    await markPaid(request, forSeat.ERM_ID);

    const seatOk = await request.patch(
      `/api/exam-enrollments/${forSeat.ERM_ID}`,
      {
        headers: adminHeaders,
        data: {
          SL_ID: slId,
          ERM_SEAT_LABEL: 'B-01',
        },
      },
    );
    expect(seatOk.status(), await seatOk.text()).toBe(200);
    const seated = (await seatOk.json()) as EnrollmentRow;
    expect(seated.ERM_STATUS).toBe(ExamEnrollmentStatus.SEAT_ASSIGNED);
    expect(seated.ERM_SEAT_LABEL).toBe('B-01');
    expect(seated.SL_ID).toBe(slId);

    // Candidate cannot cancel non-UNPAID / cannot patch seat fields
    const seatForbidden = await request.patch(
      `/api/exam-enrollments/${forSeat.ERM_ID}`,
      {
        headers: disposableHeaders!,
        data: { ERM_STATUS: ExamEnrollmentStatus.CANCELLED },
      },
    );
    expect(seatForbidden.status(), await seatForbidden.text()).toBe(400);
  });

  // ENR-I-009
  test('DELETE softRemove — subsequent GET 404', async ({ request }) => {
    requireSeed();
    const sessionId = await createSession(request, openExamId!);
    const enrollment = await createEnrollment(request, {
      sessionId,
      userId: candidateUserId,
    });

    const denied = await request.delete(
      `/api/exam-enrollments/${enrollment.ERM_ID}`,
      { headers: candidateHeaders },
    );
    expect(denied.status(), await denied.text()).toBe(403);

    const removed = await request.delete(
      `/api/exam-enrollments/${enrollment.ERM_ID}`,
      { headers: adminHeaders },
    );
    expect([200, 204].includes(removed.status()), await removed.text()).toBe(
      true,
    );

    const after = await getEnrollment(request, enrollment.ERM_ID);
    expect(after.status).toBe(404);
  });

  // ENR-I-010
  test('POST match-import returns matched array', async ({ request }) => {
    requireSeed();
    const sessionId = await createSession(request, openExamId!);
    const enrollment = await createEnrollment(request, {
      sessionId,
      userId: disposableUserId!,
      headers: disposableHeaders!,
    });

    const denied = await request.post('/api/exam-enrollments/match-import', {
      headers: candidateHeaders,
      data: { refs: [String(enrollment.ERM_ID)] },
    });
    expect(denied.status(), await denied.text()).toBe(403);

    const byErm = await request.post('/api/exam-enrollments/match-import', {
      headers: adminHeaders,
      data: { refs: [String(enrollment.ERM_ID)] },
    });
    const byErmText = await byErm.text();
    expect([200, 201].includes(byErm.status()), byErmText).toBe(true);
    const byErmRows = JSON.parse(byErmText) as EnrollmentRow[];
    expect(byErmRows.some((r) => r.ERM_ID === enrollment.ERM_ID)).toBe(true);

    const byNat = await request.post('/api/exam-enrollments/match-import', {
      headers: adminHeaders,
      data: { refs: [disposableNationalId] },
    });
    const byNatText = await byNat.text();
    expect([200, 201].includes(byNat.status()), byNatText).toBe(true);
    const byNatRows = JSON.parse(byNatText) as EnrollmentRow[];
    expect(byNatRows.some((r) => r.ERM_ID === enrollment.ERM_ID)).toBe(true);
  });

  // ENR-I-011
  test('GET exam/:id filters CANCELLED + totalPaid', async ({ request }) => {
    requireSeed();
    const sessionId = await createSession(request, openExamId!);

    const unpaid = await createEnrollment(request, {
      sessionId,
      userId: candidateUserId,
    });
    const paid = await createEnrollment(request, {
      sessionId,
      userId: disposableUserId!,
      headers: disposableHeaders!,
    });
    await markPaid(request, paid.ERM_ID);

    // Need a third user for CANCELLED row without conflicting same-slot active rules
    // Cancel the unpaid enrollment owned by candidate
    const cancelRes = await request.patch(
      `/api/exam-enrollments/${unpaid.ERM_ID}`,
      {
        headers: candidateHeaders,
        data: { ERM_STATUS: ExamEnrollmentStatus.CANCELLED },
      },
    );
    expect(cancelRes.status(), await cancelRes.text()).toBe(200);

    // Re-enroll candidate as UNPAID (slot free after cancel)
    const unpaid2 = await createEnrollment(request, {
      sessionId,
      userId: candidateUserId,
    });

    const list = await request.get(
      `/api/exam-enrollments/exam/${openExamId}?sessionId=${sessionId}&page=1&limit=50`,
      { headers: adminHeaders },
    );
    expect(list.status(), await list.text()).toBe(200);
    const body = (await list.json()) as {
      data: EnrollmentRow[];
      total: number;
      totalPaid: number;
    };

    const ids = body.data.map((r) => r.ERM_ID);
    expect(ids).toContain(paid.ERM_ID);
    expect(ids).toContain(unpaid2.ERM_ID);
    expect(ids).not.toContain(unpaid.ERM_ID);
    expect(body.totalPaid).toBeGreaterThanOrEqual(1);

    const candidateDenied = await request.get(
      `/api/exam-enrollments/exam/${openExamId}?sessionId=${sessionId}&page=1&limit=50`,
      { headers: candidateHeaders },
    );
    expect(candidateDenied.status(), await candidateDenied.text()).toBe(403);
  });

  // ENR-I-012
  test('Create DTO validation → 400', async ({ request }) => {
    requireSeed();

    const missing = await request.post('/api/exam-enrollments', {
      headers: candidateHeaders,
      data: { USER_ID: candidateUserId },
    });
    expect(missing.status(), await missing.text()).toBe(400);

    const badTypes = await request.post('/api/exam-enrollments', {
      headers: candidateHeaders,
      data: { USER_ID: 'not-a-number', SESSION_ID: 'x' },
    });
    expect(badTypes.status(), await badTypes.text()).toBe(400);

    const unknownField = await request.post('/api/exam-enrollments', {
      headers: candidateHeaders,
      data: {
        USER_ID: candidateUserId,
        SESSION_ID: 1,
        HACKER_FIELD: true,
      },
    });
    expect(unknownField.status(), await unknownField.text()).toBe(400);
  });
});
