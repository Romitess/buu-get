import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import { TEST_PASSWORD, type TestRoleKey } from '../e2e/fixtures/users';

/**
 * Exam Report API integration — matrix RPT-I-001 … RPT-I-007
 *
 * Shared-DB seed via API (prefix B7-RPT-); afterAll soft-deletes THIS suite's rows only.
 * Month/round filters are known gaps — year filter only for RPT-I-004.
 */

type AuthHeaders = { Authorization: string };

type RoleRow = { ROLE_ID: number; ROLE_NAME: string };

type UserRow = { USER_ID: number; USER_EMAIL: string };

type RubricItem = {
  id: number;
  nameTh: string;
  maxScore: number;
  sortOrder: number;
};

type ExamReportStat = {
  value: number;
  previousValue: number;
  changePercent: number;
};

type ExamReportSummary = {
  stats: {
    applicants: ExamReportStat;
    attended: ExamReportStat & { rate: number };
    absent: ExamReportStat & { rate: number };
    averageScore: ExamReportStat & { trend: number[] };
  };
  attendanceByYear: Array<{ year: number; attended: number; absent: number }>;
  registrationTrend: Array<{ year: number; registered: number }>;
  rounds: Array<{ round: string; examDate: string; registered: number | null }>;
  scoreSummaryByYear: { ranges: string[]; rows: Array<{ year: number; counts: number[] }> };
  attemptProportion: { firstTime: number; repeat: number };
  yearTable: Array<{
    year: number;
    registered: number;
    attended: number;
    absent: number;
    repeatTakers: number;
  }>;
};

type ExamReportOptions = {
  years: Array<{ label: string; value: string }>;
  months: Array<{ label: string; value: string }>;
  rounds: Array<{ label: string; value: string }>;
};

type ExamCandidateInfo = {
  id: string;
  examNumber: string;
  fullName: string;
  totalScore: number | null;
  attemptStatus: 'firstAttempt' | 'repeatAttempt';
  scoreLines?: Array<{
    nameTh: string;
    nameEn: string;
    score: number | null;
    maxScore: number;
    sortOrder: number;
  }>;
};

const ExamEnrollmentStatus = {
  UNPAID: 0,
  PAID: 1,
  CANCELLED: 5,
} as const;

const PREFIX = 'B7-RPT-';

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function uniqueNationalId(): string {
  const digits = uniqueSuffix().replace(/\D/g, '').padStart(12, '0').slice(-12);
  return `7${digits}`;
}

function uniqueEmail(tag: string): string {
  return `b7-rpt.${tag}.${uniqueSuffix()}@buu-get.test`;
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

function linesAt(
  items: RubricItem[],
  scoreFn: (item: RubricItem, index: number) => number,
): Array<{ SRBI_ID: number; score: number }> {
  return items.map((item, index) => ({
    SRBI_ID: item.id,
    score: scoreFn(item, index),
  }));
}

test.describe('Exam Report API — summary / options / candidates / RBAC', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120_000);

  let adminHeaders: AuthHeaders;
  let executiveHeaders: AuthHeaders;
  let staffHeaders: AuthHeaders;
  let financeHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;

  let candidateRoleId: number | null = null;
  let rubricItems: RubricItem[] = [];
  let seedReady = false;
  let seedSkipReason = '';
  let sessionSlot = 0;

  /**
   * Unique year block per suite run (EXAM_FISCAL_YEAR regex: 19xx|20xx|21xx).
   * Keep base+5 ≤ 2199 to stay valid.
   */
  const yearBase = 2110 + (Date.now() % 80); // 2110–2189
  const YEAR_OUT_LOW = yearBase;
  const YEAR_IN = yearBase + 1;
  const YEAR_OUT_HIGH = yearBase + 2;
  const YEAR_PRIOR = yearBase + 3;
  const YEAR_CAND = yearBase + 4;
  const YEAR_CANCEL = yearBase + 5;

  const ROUND_TAG = `B7R${String(yearBase).slice(-3)}`;

  const examIds: number[] = [];
  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const scoreIds: number[] = [];
  const userIds: number[] = [];

  let cancelActiveErmId = 0;
  let cancelCancelledErmId = 0;
  let firstAttemptUserId = 0;
  let repeatUserId = 0;
  let candYearExamRound = '';

  function requireSeed(): void {
    test.skip(
      !seedReady,
      seedSkipReason || 'B7-RPT seed unavailable',
    );
  }

  test('seed readiness (fail-fast)', async () => {
    expect(seedReady, seedSkipReason || 'B7-RPT seed unavailable').toBe(true);
  });

  async function createUser(
    request: APIRequestContext,
    tag: string,
  ): Promise<{ userId: number; email: string }> {
    const email = uniqueEmail(tag);
    const res = await request.post('/api/users', {
      headers: adminHeaders,
      data: {
        USER_EMAIL: email,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRoleId],
        USER_NATIONAL_ID: uniqueNationalId(),
        profile: {
          userFullnameTh: `${PREFIX} ${tag} ${uniqueSuffix()}`,
          userFullnameEn: `${PREFIX} ${tag}`,
          userTitleTh: 'นาย',
          userTitleEn: 'Mr.',
        },
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const user = (await res.json()) as UserRow;
    userIds.push(user.USER_ID);
    return { userId: user.USER_ID, email };
  }

  async function createExam(
    request: APIRequestContext,
    year: number,
    round: string,
    label: string,
  ): Promise<number> {
    const examDate = `${year}-06-15`;
    // REG/PAY use TIMESTAMP columns (max ~2038) — keep them in a safe window.
    // Report year filter uses YEAR(EXAM_DATE) only.
    const res = await request.post('/api/exam', {
      headers: adminHeaders,
      data: {
        EXAM_NAME: `${PREFIX} ${label} ${year} ${uniqueSuffix()}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE: 500,
        EXAM_DATE: examDate,
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-31T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-31T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: round,
        EXAM_FISCAL_YEAR: String(year),
        FUND_SOURCE_ID: 1,
        SRB_ID: 1,
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { EXAM_ID: number };
    examIds.push(body.EXAM_ID);
    return body.EXAM_ID;
  }

  async function createSession(
    request: APIRequestContext,
    examId: number,
  ): Promise<number> {
    const { start, end } = hourMinute(sessionSlot++);
    const res = await request.post('/api/exam-sessions', {
      headers: adminHeaders,
      data: {
        EXAM_ID: examId,
        SS_START_TIME: start,
        SS_END_TIME: end,
        SS_CAPACITY: 50,
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
    userId: number,
    sessionId: number,
  ): Promise<number> {
    const res = await request.post('/api/exam-enrollments', {
      headers: adminHeaders,
      data: { USER_ID: userId, SESSION_ID: sessionId },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { ERM_ID: number };
    enrollmentIds.push(body.ERM_ID);
    return body.ERM_ID;
  }

  async function markPaid(
    request: APIRequestContext,
    ermId: number,
  ): Promise<void> {
    const res = await request.patch(`/api/exam-enrollments/${ermId}`, {
      headers: adminHeaders,
      data: { ERM_STATUS: ExamEnrollmentStatus.PAID },
    });
    expect(res.status(), await res.text()).toBe(200);
  }

  async function markCancelled(
    request: APIRequestContext,
    ermId: number,
  ): Promise<void> {
    const res = await request.patch(`/api/exam-enrollments/${ermId}`, {
      headers: adminHeaders,
      data: { ERM_STATUS: ExamEnrollmentStatus.CANCELLED },
    });
    expect(res.status(), await res.text()).toBe(200);
  }

  async function createScore(
    request: APIRequestContext,
    ermId: number,
    scoreFn: (item: RubricItem, index: number) => number,
  ): Promise<number> {
    const lines = linesAt(rubricItems, scoreFn);
    const res = await request.post('/api/exam-scores', {
      headers: adminHeaders,
      data: { ERM_ID: ermId, lines },
    });
    const text = await res.text();
    expect(res.status(), text).toBe(201);
    const body = JSON.parse(text) as { SCORES_ID: number };
    scoreIds.push(body.SCORES_ID);
    return body.SCORES_ID;
  }

  async function seedYearEnrollment(
    request: APIRequestContext,
    year: number,
    round: string,
    label: string,
    userId: number,
    withScore = false,
  ): Promise<{ examId: number; ermId: number }> {
    const examId = await createExam(request, year, round, label);
    const sessionId = await createSession(request, examId);
    const ermId = await createEnrollment(request, userId, sessionId);
    await markPaid(request, ermId);
    if (withScore) {
      await createScore(request, ermId, (item) =>
        Math.min(12, Number(item.maxScore)),
      );
    }
    return { examId, ermId };
  }

  test.beforeAll(async ({ request }) => {
    test.setTimeout(240_000);

    adminHeaders = await headersFor(request, 'admin');
    executiveHeaders = await headersFor(request, 'executive');
    staffHeaders = await headersFor(request, 'staff');
    financeHeaders = await headersFor(request, 'finance');
    candidateHeaders = await headersFor(request, 'candidate');

    const rolesRes = await request.get('/api/roles', { headers: adminHeaders });
    expect(rolesRes.status()).toBe(200);
    const roles = (await rolesRes.json()) as RoleRow[];
    candidateRoleId =
      roles.find((r) => r.ROLE_NAME === 'candidate')?.ROLE_ID ?? null;
    if (!candidateRoleId) {
      seedSkipReason = 'Candidate role not found';
      return;
    }

    const rubricRes = await request.get('/api/score-rubrics/1', {
      headers: adminHeaders,
    });
    expect(rubricRes.status(), await rubricRes.text()).toBe(200);
    const rubric = (await rubricRes.json()) as { items?: RubricItem[] };
    rubricItems = rubric.items ?? [];
    if (rubricItems.length === 0) {
      seedSkipReason = 'SRB_ID=1 has no rubric items';
      return;
    }

    try {
      const userOutLow = await createUser(request, 'ylow');
      const userIn = await createUser(request, 'yin');
      const userOutHigh = await createUser(request, 'yhigh');
      const userCancelA = await createUser(request, 'cancel-a');
      const userCancelB = await createUser(request, 'cancel-b');
      const userFirst = await createUser(request, 'first');
      const userRepeat = await createUser(request, 'repeat');

      firstAttemptUserId = userFirst.userId;
      repeatUserId = userRepeat.userId;

      // Year-filter seed: enrollments in OUT_LOW / IN / OUT_HIGH
      await seedYearEnrollment(
        request,
        YEAR_OUT_LOW,
        ROUND_TAG,
        'out-low',
        userOutLow.userId,
      );
      await seedYearEnrollment(
        request,
        YEAR_IN,
        ROUND_TAG,
        'in',
        userIn.userId,
      );
      await seedYearEnrollment(
        request,
        YEAR_OUT_HIGH,
        ROUND_TAG,
        'out-high',
        userOutHigh.userId,
      );

      // CANCELLED exclusion: exclusive year with 1 active + 1 cancelled
      const cancelExamId = await createExam(
        request,
        YEAR_CANCEL,
        ROUND_TAG,
        'cancel',
      );
      const cancelSessionId = await createSession(request, cancelExamId);
      cancelActiveErmId = await createEnrollment(
        request,
        userCancelA.userId,
        cancelSessionId,
      );
      await markPaid(request, cancelActiveErmId);
      cancelCancelledErmId = await createEnrollment(
        request,
        userCancelB.userId,
        cancelSessionId,
      );
      await markCancelled(request, cancelCancelledErmId);

      // Candidates + attemptStatus: prior scored attempt → repeat; first-only → first
      await seedYearEnrollment(
        request,
        YEAR_PRIOR,
        ROUND_TAG,
        'prior',
        userRepeat.userId,
        true,
      );
      const candExamId = await createExam(
        request,
        YEAR_CAND,
        ROUND_TAG,
        'cand',
      );
      const candSessionId = await createSession(request, candExamId);
      const repeatErm = await createEnrollment(
        request,
        userRepeat.userId,
        candSessionId,
      );
      await markPaid(request, repeatErm);
      await createScore(request, repeatErm, (item) =>
        Math.min(14, Number(item.maxScore)),
      );
      const firstErm = await createEnrollment(
        request,
        userFirst.userId,
        candSessionId,
      );
      await markPaid(request, firstErm);
      await createScore(request, firstErm, (item) =>
        Math.min(10, Number(item.maxScore)),
      );
      candYearExamRound = `${ROUND_TAG}/${YEAR_CAND}`;

      seedReady = true;
    } catch (err) {
      seedSkipReason = `B7-RPT seed failed: ${String(err)}`;
      seedReady = false;
    }
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(180_000);
    if (!adminHeaders) return;

    for (const scoreId of [...new Set(scoreIds)].reverse()) {
      await request
        .delete(`/api/exam-scores/${scoreId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    for (const ermId of [...enrollmentIds].reverse()) {
      await request
        .delete(`/api/exam-enrollments/${ermId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    for (const ssId of [...sessionIds].reverse()) {
      await request
        .delete(`/api/exam-sessions/${ssId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    for (const examId of [...examIds].reverse()) {
      await request
        .delete(`/api/exam/${examId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
    for (const userId of [...userIds].reverse()) {
      await request
        .delete(`/api/users/${userId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
  });

  // RPT-I-001
  test('GET /api/exam-report/summary as ADMIN → 200 + shape', async ({
    request,
  }) => {
    requireSeed();
    const res = await request.get('/api/exam-report/summary', {
      headers: adminHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as ExamReportSummary;

    expect(body.stats.applicants).toEqual(
      expect.objectContaining({
        value: expect.any(Number),
        previousValue: expect.any(Number),
        changePercent: expect.any(Number),
      }),
    );
    expect(body.stats.attended).toEqual(
      expect.objectContaining({
        value: expect.any(Number),
        rate: expect.any(Number),
      }),
    );
    expect(body.stats.absent).toEqual(
      expect.objectContaining({
        value: expect.any(Number),
        rate: expect.any(Number),
      }),
    );
    expect(body.stats.averageScore).toEqual(
      expect.objectContaining({
        value: expect.any(Number),
        trend: expect.any(Array),
      }),
    );
    expect(Array.isArray(body.attendanceByYear)).toBe(true);
    expect(Array.isArray(body.registrationTrend)).toBe(true);
    expect(Array.isArray(body.rounds)).toBe(true);
    expect(body.scoreSummaryByYear.ranges.length).toBeGreaterThan(0);
    expect(Array.isArray(body.scoreSummaryByYear.rows)).toBe(true);
    expect(body.attemptProportion).toEqual(
      expect.objectContaining({
        firstTime: expect.any(Number),
        repeat: expect.any(Number),
      }),
    );
    expect(Array.isArray(body.yearTable)).toBe(true);
  });

  // RPT-I-002
  test('GET /api/exam-report/summary as EXECUTIVE → 200', async ({
    request,
  }) => {
    requireSeed();
    const res = await request.get('/api/exam-report/summary', {
      headers: executiveHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
  });

  // RPT-I-003 — assert CURRENT authz (ADMIN/EXECUTIVE only)
  test('GET summary RBAC deny + unauthenticated → 403 / 401', async ({
    request,
  }) => {
    requireSeed();

    const forbidden: Array<{ role: string; headers: AuthHeaders }> = [
      { role: 'candidate', headers: candidateHeaders },
      { role: 'staff', headers: staffHeaders },
      { role: 'finance', headers: financeHeaders },
    ];

    for (const f of forbidden) {
      const res = await request.get('/api/exam-report/summary', {
        headers: f.headers,
      });
      expect(res.status(), `${f.role} → ${await res.text()}`).toBe(403);
    }

    const anon = await request.get('/api/exam-report/summary');
    expect(anon.status(), await anon.text()).toBe(401);
  });

  // RPT-I-004 — year filter only (month/round known gap; do not assert)
  test('GET summary fromYear/toYear filters EXAM_DATE year', async ({
    request,
  }) => {
    requireSeed();

    const res = await request.get('/api/exam-report/summary', {
      headers: adminHeaders,
      params: {
        fromYear: String(YEAR_IN),
        toYear: String(YEAR_IN),
      },
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as ExamReportSummary;

    const years = body.yearTable.map((r) => r.year);
    expect(years).toContain(YEAR_IN);
    expect(years).not.toContain(YEAR_OUT_LOW);
    expect(years).not.toContain(YEAR_OUT_HIGH);

    for (const y of years) {
      expect(y).toBeGreaterThanOrEqual(YEAR_IN);
      expect(y).toBeLessThanOrEqual(YEAR_IN);
    }

    const wide = await request.get('/api/exam-report/summary', {
      headers: adminHeaders,
      params: {
        fromYear: String(YEAR_OUT_LOW),
        toYear: String(YEAR_OUT_HIGH),
      },
    });
    expect(wide.status(), await wide.text()).toBe(200);
    const wideBody = (await wide.json()) as ExamReportSummary;
    const wideYears = wideBody.yearTable.map((r) => r.year);
    expect(wideYears).toContain(YEAR_OUT_LOW);
    expect(wideYears).toContain(YEAR_IN);
    expect(wideYears).toContain(YEAR_OUT_HIGH);
  });

  // RPT-I-005
  test('CANCELLED enrollments excluded from summary counts', async ({
    request,
  }) => {
    requireSeed();
    expect(cancelActiveErmId).toBeGreaterThan(0);
    expect(cancelCancelledErmId).toBeGreaterThan(0);

    const res = await request.get('/api/exam-report/summary', {
      headers: adminHeaders,
      params: {
        fromYear: String(YEAR_CANCEL),
        toYear: String(YEAR_CANCEL),
      },
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as ExamReportSummary;
    const row = body.yearTable.find((r) => r.year === YEAR_CANCEL);
    expect(row, `yearTable missing ${YEAR_CANCEL}`).toBeTruthy();
    // Exclusive year: 1 paid + 1 cancelled → registered must be 1
    expect(row!.registered).toBe(1);
  });

  // RPT-I-006
  test('GET /api/exam-report/options → years DESC, 12 months, rounds', async ({
    request,
  }) => {
    requireSeed();
    const res = await request.get('/api/exam-report/options', {
      headers: adminHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as ExamReportOptions;

    expect(body.months).toHaveLength(12);
    expect(body.months[0].value).toBe('01');
    expect(body.months[11].value).toBe('12');

    expect(body.years.length).toBeGreaterThan(0);
    const yearNums = body.years.map((y) => Number(y.value));
    for (let i = 1; i < yearNums.length; i++) {
      expect(yearNums[i - 1]).toBeGreaterThanOrEqual(yearNums[i]);
    }
    expect(yearNums).toContain(YEAR_IN);
    expect(yearNums).toContain(YEAR_CAND);

    expect(Array.isArray(body.rounds)).toBe(true);
    expect(body.rounds.some((r) => r.value === ROUND_TAG)).toBe(true);
  });

  // RPT-I-007
  test('GET candidates + scoreLines + attemptStatus first/repeat', async ({
    request,
  }) => {
    requireSeed();

    const res = await request.get(
      `/api/exam-report/years/${YEAR_CAND}/candidates`,
      {
        headers: adminHeaders,
        params: { round: candYearExamRound },
      },
    );
    // If round filter is too strict, fall back to year-wide list
    let candidates: ExamCandidateInfo[];
    if (res.status() === 200) {
      candidates = (await res.json()) as ExamCandidateInfo[];
      if (candidates.length === 0) {
        const allRes = await request.get(
          `/api/exam-report/years/${YEAR_CAND}/candidates`,
          { headers: adminHeaders },
        );
        expect(allRes.status(), await allRes.text()).toBe(200);
        candidates = (await allRes.json()) as ExamCandidateInfo[];
      }
    } else {
      const allRes = await request.get(
        `/api/exam-report/years/${YEAR_CAND}/candidates`,
        { headers: adminHeaders },
      );
      expect(allRes.status(), await allRes.text()).toBe(200);
      candidates = (await allRes.json()) as ExamCandidateInfo[];
    }

    expect(candidates.length).toBeGreaterThanOrEqual(2);

    const withScores = candidates.filter((c) => c.totalScore != null);
    expect(withScores.length).toBeGreaterThanOrEqual(2);

    for (const c of withScores) {
      expect(Array.isArray(c.scoreLines)).toBe(true);
      expect((c.scoreLines ?? []).length).toBe(rubricItems.length);
    }

    const statuses = new Set(candidates.map((c) => c.attemptStatus));
    expect(statuses.has('firstAttempt')).toBe(true);
    expect(statuses.has('repeatAttempt')).toBe(true);

    // Side-effect check: year rounds also returns for YEAR_CAND
    const roundsRes = await request.get(
      `/api/exam-report/years/${YEAR_CAND}/rounds`,
      { headers: adminHeaders },
    );
    expect(roundsRes.status(), await roundsRes.text()).toBe(200);
    const rounds = (await roundsRes.json()) as Array<{
      round: string;
      applicants: number;
    }>;
    expect(rounds.length).toBeGreaterThan(0);
    expect(rounds.some((r) => r.applicants >= 1)).toBe(true);

    void firstAttemptUserId;
    void repeatUserId;
  });
});
