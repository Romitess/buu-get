import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { apiLogin } from './fixtures/auth';
import { TEST_PASSWORD, getTestUser } from './fixtures/users';
import { TestVoucherManagementPage } from './pages/test-voucher-management.page';
import { ExamSeatCandidatesPage } from './pages/exam-seat-candidates.page';

/**
 * E2E: Exam rule vouchers — admin regulations UI + RBAC + preview
 * Matrix: ERV-E-001 (P0), ERV-E-002 (P1), ERV-E-003 (P1)
 *
 * Regulations are a shared singleton — afterAll restores the original snapshot.
 * Auth: token inject (same pattern as transactions / exam-enrollments).
 */

const REGULATIONS_PATH = '/api/exam-rule-vouchers/regulations';

const ExamEnrollmentStatus = {
  PAID: 1,
  SEAT_ASSIGNED: 2,
} as const;

const ExamSessionStatus = {
  OPEN: 1,
} as const;

const EXAM_FEE = 500;
const EXAM_DATE = '2026-09-11';
const SEAT_LABEL = 'R-01';

type AuthHeaders = { Authorization: string };

type RegulationsBody = {
  regulationsEn: string;
  regulationsTh: string;
};

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
  ERM_TEST_TAKER?: string | null;
  ERM_SEAT_LABEL?: string | null;
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
  const startH = 10 + slot;
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

const hashHas = (fragment: string) => (url: URL) =>
  url.hash.includes(fragment);

test.describe('E2E: Exam rule vouchers — regulations UI / RBAC / preview', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });
  test.setTimeout(180_000);

  let adminHeaders: AuthHeaders;
  let original: RegulationsBody = { regulationsEn: '', regulationsTh: '' };

  let seedReady = false;
  let seedSkipReason = '';
  let previewSeedReady = false;
  let previewSkipReason = '';

  let candidateRoleId: number | null = null;
  let sessionSlot = 0;

  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const sessionLocationIds: number[] = [];
  const userIds: number[] = [];
  const examIds: number[] = [];

  let examId: number | null = null;
  let locationId: number | null = null;
  let sessionId: number | null = null;

  let candidate: {
    email: string;
    password: string;
    userId: number;
  } | null = null;

  const suffix = uniqueSuffix();
  const savedEn = `ERV-E EN regulations ${suffix}`;
  const savedTh = `ERV-E TH ข้อปฏิบัติ ${suffix}`;

  test.beforeAll(async ({ request }) => {
    try {
      adminHeaders = await headersFor(request, 'admin');
    } catch (err) {
      seedSkipReason = `Admin login failed: ${String(err)}`;
      return;
    }

    const getRes = await request.get(`${apiBaseUrl()}${REGULATIONS_PATH}`, {
      headers: adminHeaders,
    });
    if (!getRes.ok()) {
      seedSkipReason = `Cannot GET regulations: ${getRes.status()}`;
      return;
    }
    original = (await getRes.json()) as RegulationsBody;
    seedReady = true;

    // Disposable seat-assigned enrollment for ERV-E-003 issue-dialog preview
    const rolesRes = await request.get(`${apiBaseUrl()}/api/roles`, {
      headers: adminHeaders,
    });
    if (!rolesRes.ok()) {
      previewSkipReason = `Cannot list roles: ${rolesRes.status()}`;
      return;
    }
    const roles = (await rolesRes.json()) as RoleRow[];
    const candidateRole = roles.find((r) => r.ROLE_NAME === 'candidate');
    if (!candidateRole) {
      previewSkipReason = 'candidate role missing';
      return;
    }
    candidateRoleId = candidateRole.ROLE_ID;

    const email = `erv-e.${suffix}@buu-get.test`;
    const userRes = await request.post(`${apiBaseUrl()}/api/users`, {
      headers: adminHeaders,
      data: {
        USER_EMAIL: email,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_NATIONAL_ID: uniqueNationalId(),
        USER_ROLES: [candidateRoleId],
        profile: {
          userFullnameTh: `ERV-E ${suffix}`,
          userFullnameEn: `ERVE ${suffix}`,
          userTitleTh: 'นาย',
          userTitleEn: 'Mr.',
        },
      },
    });
    if (![200, 201].includes(userRes.status())) {
      previewSkipReason = `Cannot create candidate: ${userRes.status()} ${await userRes.text()}`;
      return;
    }
    const created = (await userRes.json()) as UserRow;
    userIds.push(created.USER_ID);
    candidate = {
      email,
      password: TEST_PASSWORD,
      userId: created.USER_ID,
    };

    const roundNum = 60 + (Number(suffix.slice(-2)) % 30);
    const examRes = await request.post(`${apiBaseUrl()}/api/exam`, {
      headers: adminHeaders,
      data: {
        EXAM_NAME: `ERV-E exam ${suffix}`,
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
      previewSkipReason = `Cannot create exam: ${examRes.status()} ${await examRes.text()}`;
      return;
    }
    examId = ((await examRes.json()) as { EXAM_ID: number }).EXAM_ID;
    examIds.push(examId);

    const locRes = await request.post(`${apiBaseUrl()}/api/exam-locations`, {
      headers: adminHeaders,
      data: {
        LOCATION_NAME: `ERV-E loc ${suffix}`,
        LOCATION_ROOM_NO: `R${suffix.slice(-4)}`,
        LOCATION_TOTAL_ROWS: 2,
        LOCATION_TOTAL_COLS: 3,
        LOCATION_SEAT_CAPACITY: 6,
      },
    });
    if (![200, 201].includes(locRes.status())) {
      previewSkipReason = `Cannot create location: ${locRes.status()} ${await locRes.text()}`;
      return;
    }
    locationId = ((await locRes.json()) as { LOCATION_ID: number }).LOCATION_ID;

    const { start, end } = hourMinute(sessionSlot++);
    const ssRes = await request.post(`${apiBaseUrl()}/api/exam-sessions`, {
      headers: adminHeaders,
      data: {
        EXAM_ID: examId,
        SS_START_TIME: start,
        SS_END_TIME: end,
        SS_CAPACITY: 30,
        SS_SESSION_STATUS: ExamSessionStatus.OPEN,
      },
    });
    if (ssRes.status() !== 201) {
      previewSkipReason = `Cannot create session: ${ssRes.status()} ${await ssRes.text()}`;
      return;
    }
    sessionId = ((await ssRes.json()) as { SS_ID: number }).SS_ID;
    sessionIds.push(sessionId);

    const slRes = await request.post(
      `${apiBaseUrl()}/api/exam-session-locations`,
      {
        headers: adminHeaders,
        data: {
          LOCATION_ID: locationId,
          SS_ID: sessionId,
          LOCATION_SEAT_CAPACITY: 20,
        },
      },
    );
    if (slRes.status() !== 201) {
      previewSkipReason = `Cannot create session location: ${slRes.status()} ${await slRes.text()}`;
      return;
    }
    const slId = ((await slRes.json()) as { SL_ID: number }).SL_ID;
    sessionLocationIds.push(slId);

    const candLogin = await request.post(`${apiBaseUrl()}/api/auth/login`, {
      data: { email: candidate.email, password: candidate.password },
    });
    if (!candLogin.ok()) {
      previewSkipReason = `Candidate login failed: ${candLogin.status()}`;
      return;
    }
    const candToken = ((await candLogin.json()) as { accessToken: string })
      .accessToken;
    const candHeaders: AuthHeaders = {
      Authorization: `Bearer ${candToken}`,
    };

    const enrRes = await request.post(`${apiBaseUrl()}/api/exam-enrollments`, {
      headers: candHeaders,
      data: {
        USER_ID: candidate.userId,
        SESSION_ID: sessionId,
      },
    });
    if (enrRes.status() !== 201) {
      previewSkipReason = `Cannot enroll: ${enrRes.status()} ${await enrRes.text()}`;
      return;
    }
    const enrollment = (await enrRes.json()) as EnrollmentRow;
    enrollmentIds.push(enrollment.ERM_ID);

    const paid = await request.patch(
      `${apiBaseUrl()}/api/exam-enrollments/${enrollment.ERM_ID}`,
      {
        headers: adminHeaders,
        data: { ERM_STATUS: ExamEnrollmentStatus.PAID },
      },
    );
    if (paid.status() !== 200) {
      previewSkipReason = `Cannot mark paid: ${paid.status()}`;
      return;
    }

    const seatOk = await request.patch(
      `${apiBaseUrl()}/api/exam-enrollments/bulk-seat-assignments`,
      {
        headers: adminHeaders,
        data: {
          sessionIds: [sessionId],
          assignments: [
            {
              ermId: enrollment.ERM_ID,
              seatLabel: SEAT_LABEL,
              slId,
              sortOrder: 1,
            },
          ],
        },
      },
    );
    if (seatOk.status() !== 200) {
      previewSkipReason = `Cannot assign seat: ${seatOk.status()} ${await seatOk.text()}`;
      return;
    }

    previewSeedReady = true;
  });

  test.afterAll(async ({ request }) => {
    if (adminHeaders) {
      await request
        .put(`${apiBaseUrl()}${REGULATIONS_PATH}`, {
          headers: adminHeaders,
          data: {
            regulationsEn: original.regulationsEn ?? '',
            regulationsTh: original.regulationsTh ?? '',
          },
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
    test.skip(!seedReady, seedSkipReason || 'Regulations E2E seed failed');
  }

  // ERV-E-001 P0
  test('Admin save regulations UI → persisted on reload', async ({
    page,
    request,
  }) => {
    requireSeed();

    const admin = getTestUser('admin');
    await injectAuthSession(page, request, admin.email, admin.password);

    const mgmt = new TestVoucherManagementPage(page);
    await mgmt.goto();
    await mgmt.fillRegulations(savedEn, savedTh);
    await mgmt.save();
    await mgmt.expectSaveSuccess();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('.test-voucher-management-page')).toBeVisible({
      timeout: 20_000,
    });
    await mgmt.expectInputsEqual(savedEn, savedTh);

    // Live preview on same page should also reflect saved text
    await mgmt.expectPreviewContains(savedEn, savedTh);
  });

  // ERV-E-002 P1
  test('Non-allowed role blocked from test-voucher-management page', async ({
    page,
    request,
  }) => {
    requireSeed();

    const cand = getTestUser('candidate');
    await injectAuthSession(page, request, cand.email, cand.password);

    await page.goto('/#/admin/test-voucher-management');

    // Router guard: candidate lacks admin/staff/exam-ops → role home
    await expect(page).toHaveURL(hashHas('/user/'), { timeout: 15_000 });
    await expect(page).not.toHaveURL(
      hashHas('/admin/test-voucher-management'),
    );
    await expect(
      page.locator('.test-voucher-management-page'),
    ).toHaveCount(0);
  });

  // ERV-E-003 P1
  test('Saved regulations appear on voucher preview (issue dialog)', async ({
    page,
    request,
  }) => {
    requireSeed();
    test.skip(
      !previewSeedReady,
      previewSkipReason || 'Seat-assigned preview seed failed',
    );
    expect(examId).toBeTruthy();
    expect(sessionId).toBeTruthy();

    // Ensure regulations are the ones from ERV-E-001 (or re-PUT if run alone)
    await request.put(`${apiBaseUrl()}${REGULATIONS_PATH}`, {
      headers: adminHeaders,
      data: { regulationsEn: savedEn, regulationsTh: savedTh },
    });

    const admin = getTestUser('admin');
    await injectAuthSession(page, request, admin.email, admin.password);

    const seats = new ExamSeatCandidatesPage(page);
    await seats.gotoCandidates(examId!, sessionId!);
    await seats.openIssueTicketDialog();
    await seats.expectIssuePreviewRegulations(savedEn, savedTh);
  });
});
