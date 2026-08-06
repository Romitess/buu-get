import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { apiLogin } from './fixtures/auth';
import { TEST_PASSWORD, getTestUser } from './fixtures/users';
import { ExamSeatCandidatesPage } from './pages/exam-seat-candidates.page';
import { ExamHistoryPage } from './pages/exam-history.page';

/**
 * E2E: Exam vouchers — admin bulk issue + candidate view/print
 * Matrix: VOUCH-E-001 (P0), VOUCH-E-002 (P1). VOUCH-E-003 (P2) intentionally omitted.
 *
 * Seed: disposable candidate → PAID → SEAT_ASSIGNED (with test-taker via bulk seats).
 * Auth: token inject (same pattern as transactions / exam-enrollments).
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
const SEAT_LABEL = 'V-01';
/** Unique calendar day — avoid colliding with enrollments E2E Aug dates. */
const EXAM_DATE = '2026-09-10';

type AuthHeaders = { Authorization: string };

type RoleRow = { ROLE_ID: number; ROLE_NAME: string };

type UserRow = {
  USER_ID: number;
  USER_EMAIL: string;
};

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
};

type SessionRow = {
  SS_ID: number;
  SS_SESSION_STATUS: number;
};

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function uniqueNationalId(): string {
  const digits = uniqueSuffix().replace(/\D/g, '').padStart(12, '0').slice(-12);
  return `9${digits}`;
}

function apiBaseUrl(): string {
  return (process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
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
  role: 'admin' | 'candidate',
): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, role);
  return { Authorization: `Bearer ${accessToken}` };
}

async function injectAuthSession(
  page: Page,
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const login = await request.post(`${apiBaseUrl()}/api/auth/login`, {
    data: { email, password },
  });
  if (!login.ok()) {
    throw new Error(
      `injectAuthSession login failed: ${login.status()} ${await login.text()}`,
    );
  }
  const body = (await login.json()) as {
    accessToken: string;
    user: { id: number };
  };
  await page.goto('/#/login');
  await page.evaluate(
    ({ token, userId }) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user_id', String(userId));
    },
    { token: body.accessToken, userId: body.user.id },
  );
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForURL((url) => !url.hash.includes('/login'), {
    timeout: 30_000,
  });
  return body.accessToken;
}

test.describe('E2E: Exam vouchers — bulk issue UI + candidate print', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });
  test.setTimeout(180_000);

  let adminHeaders: AuthHeaders;
  let candidateRoleId: number | null = null;
  let sessionSlot = 0;

  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const sessionLocationIds: number[] = [];
  const voucherIds: number[] = [];
  const userIds: number[] = [];
  const examIds: number[] = [];

  let seedReady = false;
  let seedSkipReason = '';

  let examId: number | null = null;
  let examName = '';
  let locationId: number | null = null;
  let sessionId: number | null = null;
  let enrollmentId: number | null = null;
  let seatLabel = SEAT_LABEL;
  let issuedVoucherCode = '';
  let issuedTestTakerId = '';

  let candidate: {
    email: string;
    password: string;
    userId: number;
  } | null = null;

  async function createSession(
    request: APIRequestContext,
    capacity = 30,
  ): Promise<number> {
    const { start, end } = hourMinute(sessionSlot++);
    const res = await request.post(`${apiBaseUrl()}/api/exam-sessions`, {
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
    ssId: number,
  ): Promise<number> {
    if (!locationId) throw new Error('locationId not seeded');
    const res = await request.post(
      `${apiBaseUrl()}/api/exam-session-locations`,
      {
        headers: adminHeaders,
        data: {
          LOCATION_ID: locationId,
          SS_ID: ssId,
          LOCATION_SEAT_CAPACITY: 20,
        },
      },
    );
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { SL_ID: number };
    sessionLocationIds.push(body.SL_ID);
    return body.SL_ID;
  }

  async function getEnrollment(
    request: APIRequestContext,
    ermId: number,
  ): Promise<EnrollmentRow> {
    const res = await request.get(
      `${apiBaseUrl()}/api/exam-enrollments/${ermId}`,
      { headers: adminHeaders },
    );
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as EnrollmentRow;
  }

  async function getSession(
    request: APIRequestContext,
    ssId: number,
  ): Promise<SessionRow> {
    const res = await request.get(`${apiBaseUrl()}/api/exam-sessions/${ssId}`, {
      headers: adminHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as SessionRow;
  }

  async function findVoucherByErm(
    request: APIRequestContext,
    ermId: number,
  ): Promise<VoucherRow | null> {
    const res = await request.get(`${apiBaseUrl()}/api/exam-vouchers`, {
      headers: adminHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    const all = (await res.json()) as VoucherRow[];
    const found = all.find((v) => v.ERM_ID === ermId) ?? null;
    if (found) voucherIds.push(found.VC_ID);
    return found;
  }

  async function seedSeatAssignedWithTestTaker(
    request: APIRequestContext,
  ): Promise<void> {
    if (!candidate || !examId) throw new Error('seed incomplete');

    sessionId = await createSession(request);
    const slId = await ensureSessionLocation(request, sessionId);

    const login = await request.post(`${apiBaseUrl()}/api/auth/login`, {
      data: { email: candidate.email, password: candidate.password },
    });
    expect(login.ok(), await login.text()).toBeTruthy();
    const loginBody = (await login.json()) as { accessToken: string };
    const candHeaders: AuthHeaders = {
      Authorization: `Bearer ${loginBody.accessToken}`,
    };

    const enrRes = await request.post(`${apiBaseUrl()}/api/exam-enrollments`, {
      headers: candHeaders,
      data: {
        USER_ID: candidate.userId,
        SESSION_ID: sessionId,
      },
    });
    expect(enrRes.status(), await enrRes.text()).toBe(201);
    const enrollment = (await enrRes.json()) as EnrollmentRow;
    enrollmentId = enrollment.ERM_ID;
    enrollmentIds.push(enrollmentId);

    const paid = await request.patch(
      `${apiBaseUrl()}/api/exam-enrollments/${enrollmentId}`,
      {
        headers: adminHeaders,
        data: { ERM_STATUS: ExamEnrollmentStatus.PAID },
      },
    );
    expect(paid.status(), await paid.text()).toBe(200);

    const seatOk = await request.patch(
      `${apiBaseUrl()}/api/exam-enrollments/bulk-seat-assignments`,
      {
        headers: adminHeaders,
        data: {
          sessionIds: [sessionId],
          assignments: [
            {
              ermId: enrollmentId,
              seatLabel,
              slId,
              sortOrder: 1,
            },
          ],
        },
      },
    );
    expect(seatOk.status(), await seatOk.text()).toBe(200);

    const seated = await getEnrollment(request, enrollmentId);
    expect(seated.ERM_STATUS).toBe(ExamEnrollmentStatus.SEAT_ASSIGNED);
    expect(seated.ERM_TEST_TAKER).toBeTruthy();
    expect(seated.ERM_SEAT_LABEL).toBe(seatLabel);
  }

  test.beforeAll(async ({ request }) => {
    try {
      adminHeaders = await headersFor(request, 'admin');
    } catch (err) {
      seedSkipReason = `Admin login failed: ${String(err)}`;
      return;
    }

    const rolesRes = await request.get(`${apiBaseUrl()}/api/roles`, {
      headers: adminHeaders,
    });
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
    const email = `vouch-e.${suffix}@buu-get.test`;
    const userRes = await request.post(`${apiBaseUrl()}/api/users`, {
      headers: adminHeaders,
      data: {
        USER_EMAIL: email,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_NATIONAL_ID: uniqueNationalId(),
        USER_ROLES: [candidateRoleId],
        profile: {
          userFullnameTh: `VOUCH-E ${suffix}`,
          userFullnameEn: `VOUCHE ${suffix}`,
          userTitleTh: 'นาย',
          userTitleEn: 'Mr.',
        },
      },
    });
    if (![200, 201].includes(userRes.status())) {
      seedSkipReason = `Cannot create candidate: ${userRes.status()} ${await userRes.text()}`;
      return;
    }
    const created = (await userRes.json()) as UserRow;
    userIds.push(created.USER_ID);
    candidate = {
      email,
      password: TEST_PASSWORD,
      userId: created.USER_ID,
    };

    examName = `VOUCH-E exam ${suffix}`;
    const roundNum = 50 + (Number(suffix.slice(-2)) % 40);
    const examRes = await request.post(`${apiBaseUrl()}/api/exam`, {
      headers: adminHeaders,
      data: {
        EXAM_NAME: examName,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE,
        EXAM_DATE,
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-27T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-27T23:59:59.000Z',
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
    examIds.push(examId);

    const locRes = await request.post(`${apiBaseUrl()}/api/exam-locations`, {
      headers: adminHeaders,
      data: {
        LOCATION_NAME: `VOUCH-E loc ${suffix}`,
        LOCATION_ROOM_NO: `E${suffix.slice(-4)}`,
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

    try {
      await seedSeatAssignedWithTestTaker(request);
    } catch (err) {
      seedSkipReason = `Seat seed failed: ${String(err)}`;
      return;
    }

    seedReady = true;
  });

  test.afterAll(async ({ request }) => {
    if (!adminHeaders) return;
    for (const vcId of [...new Set(voucherIds)]) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-vouchers/${vcId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const ermId of enrollmentIds) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-enrollments/${ermId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const slId of sessionLocationIds) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-session-locations/${slId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const ssId of sessionIds) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-sessions/${ssId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    if (locationId) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-locations/${locationId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const id of examIds) {
      await request
        .delete(`${apiBaseUrl()}/api/exam/${id}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    for (const userId of userIds) {
      await request
        .delete(`${apiBaseUrl()}/api/users/${userId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
  });

  function requireSeed(): void {
    test.skip(!seedReady, seedSkipReason || 'Disposable voucher E2E seed failed');
  }

  // VOUCH-E-001 P0
  test('Admin bulk issue tickets UI → published + voucher preview', async ({
    page,
    request,
  }) => {
    requireSeed();
    expect(examId).toBeTruthy();
    expect(sessionId).toBeTruthy();
    expect(enrollmentId).toBeTruthy();

    const admin = getTestUser('admin');
    await injectAuthSession(page, request, admin.email, admin.password);

    const seats = new ExamSeatCandidatesPage(page);
    await seats.gotoCandidates(examId!, sessionId!);

    await seats.openIssueTicketDialog();
    await seats.confirmIssueTicket();
    await seats.expectIssueSuccessNotification();
    await seats.expectIssueDialogClosed();

    const enrollment = await getEnrollment(request, enrollmentId!);
    expect(enrollment.ERM_STATUS).toBe(ExamEnrollmentStatus.SEAT_PUBLISHED);

    const voucher = await findVoucherByErm(request, enrollmentId!);
    expect(voucher).toBeTruthy();
    expect(voucher!.VC_CODE).toMatch(/^VC-\d{4}-/);
    issuedVoucherCode = voucher!.VC_CODE;
    issuedTestTakerId = enrollment.ERM_TEST_TAKER || '';
    expect(issuedTestTakerId).toBeTruthy();

    const session = await getSession(request, sessionId!);
    expect(session.SS_SESSION_STATUS).toBe(ExamSessionStatus.VOUCHER_SENT);

    // Reload candidates so View Voucher action appears
    await seats.gotoCandidates(examId!, sessionId!);
    await seats.openViewVoucherForFirstRow();
    await seats.expectViewVoucherShows({
      seatLabel,
      testTakerId: issuedTestTakerId,
    });
  });

  // VOUCH-E-002 P1
  test('Candidate view/print ticket → code and seat visible', async ({
    page,
    request,
  }) => {
    requireSeed();
    expect(candidate).toBeTruthy();
    expect(examName).toBeTruthy();
    test.skip(
      !issuedVoucherCode || !issuedTestTakerId,
      'VOUCH-E-001 did not issue a voucher — cannot assert candidate print',
    );

    await injectAuthSession(
      page,
      request,
      candidate!.email,
      candidate!.password,
    );

    const history = new ExamHistoryPage(page);
    await history.goto();
    await history.clickDownloadVoucher(examName);
    await history.expectVoucherCodeAndSeatVisible({
      seatLabel,
      testTakerId: issuedTestTakerId,
    });
  });
});
