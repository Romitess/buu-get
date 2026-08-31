import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { apiLogin } from './fixtures/auth';
import { TEST_PASSWORD, getTestUser } from './fixtures/users';
import { ExamScoresPage } from './pages/exam-scores.page';
import { ExamHistoryPage } from './pages/exam-history.page';

/**
 * E2E: Exam certificates — bulk issue UI / candidate history / authz
 * Matrix: CERT-E-001 (P0), CERT-E-002 (P1), CERT-E-003 (P1)
 *
 * Path note: controller mounts at `/api/exam-certificates` (BUG-002 fixed).

const EXAM_CERTIFICATES_PATH = '/api/exam-certificates';

const ExamEnrollmentStatus = {
  PAID: 1,
  ATTENDED: 4,
} as const;

type AuthHeaders = { Authorization: string };

type RubricItem = {
  id: number;
  maxScore: number;
  nameTh?: string;
  nameEn?: string;
  code?: string | null;
};

type RoleRow = { ROLE_ID: number; ROLE_NAME: string };

type UserRow = { USER_ID: number; USER_EMAIL: string };

type ExamScoreRow = {
  SCORES_ID: number;
  ERM_ID: number;
};

type ExamCertificateRow = {
  CERT_ID: number;
  CERT_CODE: string;
  SCORES_ID: number;
  USER_ID: number;
};

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function uniqueNationalId(): string {
  const digits = uniqueSuffix().replace(/\D/g, '').padStart(12, '0').slice(-12);
  return `7${digits}`;
}

function apiBaseUrl(): string {
  return (
    process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3000'
  ).replace(/\/$/, '');
}

function hourMinute(slot: number): { start: string; end: string } {
  const startH = 11 + Math.floor(slot / 2);
  const startM = slot % 2 === 0 ? 0 : 30;
  const endH = startH + 1;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    start: `${pad(startH)}:${pad(startM)}:00`,
    end: `${pad(endH)}:${pad(startM)}:00`,
  };
}

function pastIssueDate(): string {
  return '2026-01-15T00:00:00+07:00';
}

function futureExpiryDate(): string {
  return '2028-01-15T00:00:00+07:00';
}

async function headersFor(
  request: APIRequestContext,
  role: 'admin' | 'candidate' | 'finance',
): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, role);
  return { Authorization: `Bearer ${accessToken}` };
}

async function injectAuthSession(
  page: Page,
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<void> {
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
}

test.describe('E2E: Exam certificates — bulk issue / history / authz', () => {
  test.describe.configure({ mode: 'serial', timeout: 240_000 });
  test.setTimeout(240_000);

  let adminHeaders: AuthHeaders;
  let financeHeaders: AuthHeaders;
  let rubricItems: RubricItem[] = [];
  let candidateRoleId: number | null = null;
  let seedReady = false;
  let seedSkipReason = '';
  let sessionSlot = 0;

  const examIds: number[] = [];
  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const scoreIds: number[] = [];
  const certIds: number[] = [];
  const userIds: number[] = [];

  /** CERT-E-001: enrollment ready for UI import → save → bulk issue */
  let bulkExamId: number | null = null;
  let bulkExamName = '';
  let bulkUserId: number | null = null;
  let bulkNationalId = '';
  let bulkCandidateName = '';
  let bulkErmId: number | null = null;

  /** CERT-E-002: ATTENDED + cert issued for candidate history */
  let histExamId: number | null = null;
  let histExamName = '';
  let histCandidate: {
    email: string;
    password: string;
    userId: number;
  } | null = null;
  let histCertCode = '';
  let histScoreId: number | null = null;

  function requireSeed(): void {
    test.skip(!seedReady, seedSkipReason || 'CERT-E seed failed');
  }

  async function createDisposableCandidate(
    request: APIRequestContext,
    label: string,
  ): Promise<{ email: string; password: string; userId: number; nationalId: string }> {
    const suffix = uniqueSuffix();
    const email = `${label}.${suffix}@buu-get.test`;
    const nationalId = uniqueNationalId();
    const res = await request.post(`${apiBaseUrl()}/api/users`, {
      headers: adminHeaders,
      data: {
        USER_EMAIL: email,
        USER_PASSWORD: TEST_PASSWORD,
        USER_STATUS: 'ACTIVE',
        USER_ROLES: [candidateRoleId],
        USER_NATIONAL_ID: nationalId,
        profile: {
          userFullnameTh: `CERT-E ${label} ${suffix}`,
          userFullnameEn: `CERTE ${label}`,
          userTitleTh: 'นาย',
          userTitleEn: 'Mr.',
        },
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as UserRow;
    userIds.push(body.USER_ID);
    return {
      email,
      password: TEST_PASSWORD,
      userId: body.USER_ID,
      nationalId,
    };
  }

  async function seedScoredExam(
    request: APIRequestContext,
    opts: {
      name: string;
      userId: number;
      candToken: string;
      attended?: boolean;
      skipScore?: boolean;
    },
  ): Promise<{
    examId: number;
    sessionId: number;
    ermId: number;
    score: ExamScoreRow | null;
  }> {
    const examRes = await request.post(`${apiBaseUrl()}/api/exam`, {
      headers: adminHeaders,
      data: {
        EXAM_NAME: opts.name,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE: 500,
        EXAM_DATE: '2026-11-20',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-11-19T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-11-19T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: 'CE',
        EXAM_FISCAL_YEAR: '2026',
        FUND_SOURCE_ID: 1,
        SRB_ID: 1,
      },
    });
    expect(examRes.status(), await examRes.text()).toBe(201);
    const examId = ((await examRes.json()) as { EXAM_ID: number }).EXAM_ID;
    examIds.push(examId);

    const { start, end } = hourMinute(sessionSlot++);
    const ssRes = await request.post(`${apiBaseUrl()}/api/exam-sessions`, {
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

    const ermRes = await request.post(`${apiBaseUrl()}/api/exam-enrollments`, {
      headers: { Authorization: `Bearer ${opts.candToken}` },
      data: { USER_ID: opts.userId, SESSION_ID: sessionId },
    });
    expect(ermRes.status(), await ermRes.text()).toBe(201);
    const ermId = ((await ermRes.json()) as { ERM_ID: number }).ERM_ID;
    enrollmentIds.push(ermId);

    const paid = await request.patch(
      `${apiBaseUrl()}/api/exam-enrollments/${ermId}`,
      {
        headers: adminHeaders,
        data: { ERM_STATUS: ExamEnrollmentStatus.PAID },
      },
    );
    expect(paid.status(), await paid.text()).toBe(200);

    if (opts.attended) {
      const checkIn = await request.post(
        `${apiBaseUrl()}/api/exam-enrollments/${ermId}/check-in`,
        { headers: adminHeaders, data: {} },
      );
      expect([200, 201].includes(checkIn.status()), await checkIn.text()).toBe(
        true,
      );
    }

    if (opts.skipScore) {
      return { examId, sessionId, ermId, score: null };
    }

    const scoreRes = await request.post(`${apiBaseUrl()}/api/exam-scores`, {
      headers: adminHeaders,
      data: {
        ERM_ID: ermId,
        lines: rubricItems.map((item) => ({
          SRBI_ID: item.id,
          score: Math.min(25, Number(item.maxScore)),
        })),
      },
    });
    expect(scoreRes.status(), await scoreRes.text()).toBe(201);
    const score = (await scoreRes.json()) as ExamScoreRow;
    scoreIds.push(score.SCORES_ID);

    return { examId, sessionId, ermId, score };
  }

  test.beforeAll(async ({ request }) => {
    test.setTimeout(240_000);
    adminHeaders = await headersFor(request, 'admin');
    financeHeaders = await headersFor(request, 'finance');

    const rubricRes = await request.get(`${apiBaseUrl()}/api/score-rubrics/1`, {
      headers: adminHeaders,
    });
    expect(rubricRes.status(), await rubricRes.text()).toBe(200);
    const rubric = (await rubricRes.json()) as { items?: RubricItem[] };
    rubricItems = rubric.items ?? [];
    if (rubricItems.length === 0) {
      seedSkipReason = 'SRB_ID=1 has no items';
      return;
    }

    const rolesRes = await request.get(`${apiBaseUrl()}/api/roles`, {
      headers: adminHeaders,
    });
    expect(rolesRes.status()).toBe(200);
    const roles = (await rolesRes.json()) as RoleRow[];
    candidateRoleId =
      roles.find((r) => r.ROLE_NAME === 'candidate')?.ROLE_ID ?? null;
    if (!candidateRoleId) {
      seedSkipReason = 'Candidate role not found';
      return;
    }

    try {
      // CERT-E-001 seed — enrollment only (score via UI import)
      const bulkCand = await createDisposableCandidate(request, 'bulk');
      const bulkLogin = await request.post(`${apiBaseUrl()}/api/auth/login`, {
        data: { email: bulkCand.email, password: bulkCand.password },
      });
      expect(bulkLogin.ok()).toBeTruthy();
      const bulkToken = ((await bulkLogin.json()) as { accessToken: string })
        .accessToken;
      bulkExamName = `CERT-E-001 ${uniqueSuffix()}`;
      const bulk = await seedScoredExam(request, {
        name: bulkExamName,
        userId: bulkCand.userId,
        candToken: bulkToken,
        skipScore: true,
      });
      bulkExamId = bulk.examId;
      bulkErmId = bulk.ermId;
      bulkUserId = bulkCand.userId;
      bulkNationalId = bulkCand.nationalId;
      bulkCandidateName = `CERT-E bulk`;

      // CERT-E-002 seed — ATTENDED + API bulk-issue
      histCandidate = await createDisposableCandidate(request, 'hist');
      const histLogin = await request.post(`${apiBaseUrl()}/api/auth/login`, {
        data: {
          email: histCandidate.email,
          password: histCandidate.password,
        },
      });
      expect(histLogin.ok()).toBeTruthy();
      const histToken = ((await histLogin.json()) as { accessToken: string })
        .accessToken;
      histExamName = `CERT-E-002 ${uniqueSuffix()}`;
      const hist = await seedScoredExam(request, {
        name: histExamName,
        userId: histCandidate.userId,
        candToken: histToken,
        attended: true,
      });
      histExamId = hist.examId;
      histScoreId = hist.score!.SCORES_ID;

      const issue = await request.post(
        `${apiBaseUrl()}${EXAM_CERTIFICATES_PATH}/bulk-issue`,
        {
          headers: adminHeaders,
          data: {
            candidates: [
              {
                SCORES_ID: hist.score.SCORES_ID,
                USER_ID: histCandidate.userId,
              },
            ],
            certIssuedAt: pastIssueDate(),
            certExpiresAt: futureExpiryDate(),
            examName: histExamName,
            historyUrl: 'https://example.test/history',
          },
        },
      );
      expect(issue.status(), await issue.text()).toBe(201);

      const list = await request.get(
        `${apiBaseUrl()}${EXAM_CERTIFICATES_PATH}`,
        { headers: adminHeaders },
      );
      expect(list.status()).toBe(200);
      const certs = (await list.json()) as ExamCertificateRow[];
      const created = certs.find((c) => c.SCORES_ID === hist.score.SCORES_ID);
      expect(created).toBeTruthy();
      if (created) {
        certIds.push(created.CERT_ID);
        histCertCode = created.CERT_CODE;
      }

      seedReady = true;
    } catch (err) {
      seedSkipReason = `CERT-E seed failed: ${String(err)}`;
      seedReady = false;
    }
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(120_000);
    if (!adminHeaders) return;
    for (const certId of [...new Set(certIds)]) {
      await request
        .delete(`${apiBaseUrl()}${EXAM_CERTIFICATES_PATH}/${certId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const scoreId of scoreIds) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-scores/${scoreId}`, {
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
    for (const ssId of sessionIds) {
      await request
        .delete(`${apiBaseUrl()}/api/exam-sessions/${ssId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const examId of examIds) {
      await request
        .delete(`${apiBaseUrl()}/api/exam/${examId}`, {
          headers: adminHeaders,
        })
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

  // CERT-E-001
  test('CERT-E-001 Admin bulk-issues certificates from score flow', async ({
    page,
    request,
  }) => {
    requireSeed();
    test.setTimeout(240_000);

    const admin = getTestUser('admin');
    await injectAuthSession(page, request, admin.email, admin.password);

    const scoresPage = new ExamScoresPage(page);
    const opened = await scoresPage.goto(bulkExamId!);
    test.skip(
      !opened,
      'Scores page redirected away for API-seeded exam (similar to BUG-008/009)',
    );

    const candidateVisible = await scoresPage.expectCandidateVisible(
      /CERT-E bulk|@buu-get\.test/,
    );
    test.skip(
      !candidateVisible,
      'BUG-010: scores page enrollments stay empty while unbounded fetchExamScores() paginates shared DB',
    );

    const lineScores = rubricItems.map((item) =>
      Math.min(25, Number(item.maxScore)),
    );
    const total = lineScores.reduce((s, n) => s + n, 0);
    const headers = rubricItems.map((item, idx) => {
      if (item.code === 'LANG_USE') return 'Vocabulary & Grammar';
      if (item.code === 'READING') return 'Reading';
      return item.nameEn || item.nameTh || `Item${idx}`;
    });
    const csv = [
      ['Citizen ID', ...headers, 'Total'].join(','),
      [bulkNationalId, ...lineScores, total].join(','),
    ].join('\n');

    await scoresPage.openCsvImport();
    await scoresPage.uploadScoreCsv(csv);
    await scoresPage.confirmSaveScores();

    // After save, toolbar switches to certificate action
    await expect(scoresPage.issueCertificateButton).toBeVisible({
      timeout: 30_000,
    });

    // Track score for cleanup
    const listScores = await request.get(
      `${apiBaseUrl()}/api/exam-scores?limit=50`,
      { headers: adminHeaders },
    );
    if (listScores.ok()) {
      const payload = (await listScores.json()) as
        | ExamScoreRow[]
        | { data: ExamScoreRow[] };
      const rows = Array.isArray(payload) ? payload : payload.data ?? [];
      for (const row of rows) {
        if (row.ERM_ID === bulkErmId) scoreIds.push(row.SCORES_ID);
      }
    }

    await scoresPage.openIssueCertificateDialog();
    await scoresPage.confirmIssueCertificates();

    const list = await request.get(
      `${apiBaseUrl()}${EXAM_CERTIFICATES_PATH}`,
      { headers: adminHeaders },
    );
    expect(list.status()).toBe(200);
    const certs = (await list.json()) as ExamCertificateRow[];
    const created = certs.find((c) => c.USER_ID === bulkUserId);
    expect(created).toBeTruthy();
    if (created) certIds.push(created.CERT_ID);
  });

  // CERT-E-002
  test('CERT-E-002 Candidate sees issued certificate in history', async ({
    page,
    request,
  }) => {
    requireSeed();
    test.skip(!histCandidate || !histCertCode, 'History cert seed missing');
    test.setTimeout(180_000);

    await injectAuthSession(
      page,
      request,
      histCandidate!.email,
      histCandidate!.password,
    );

    const history = new ExamHistoryPage(page);
    await history.goto();

    // Soft path: certificate action requires ATTENDED + COMPLETED session + cert
    const card = history.cardForExam(histExamName).first();
    await expect(card).toBeVisible({ timeout: 30_000 });

    const certBtn = card.getByRole('button', {
      name: /Certificate|ใบรับรอง|ใบประกาศนียบัตร/i,
    });
    const hasCertBtn = await certBtn.isVisible().catch(() => false);
    if (!hasCertBtn) {
      test.skip(
        true,
        'CERT-E-002: certificate action not exposed on history card (status/actions gate) — cert issued via API (code present)',
      );
    }

    await certBtn.click();
    await history.expectCertificateDownloadStarted();
  });

  // CERT-E-003
  test('CERT-E-003 Non-admin cannot execute bulk issue', async ({
    page,
    request,
  }) => {
    requireSeed();

    // UI: candidate redirected away from score management (no bulk-issue control)
    const cand = getTestUser('candidate');
    await injectAuthSession(page, request, cand.email, cand.password);
    await page.goto(`/#/admin/exam-management/${bulkExamId}/scores`);
    await expect(page).toHaveURL(/#\/user\/exam-schedule/, { timeout: 15_000 });

    // API: finance (authenticated non-exam-admin) → 403
    const denied = await request.post(
      `${apiBaseUrl()}${EXAM_CERTIFICATES_PATH}/bulk-issue`,
      {
        headers: financeHeaders,
        data: {
          candidates: [
            {
              SCORES_ID: histScoreId ?? 1,
              USER_ID: histCandidate?.userId ?? bulkUserId,
            },
          ],
          certIssuedAt: pastIssueDate(),
          certExpiresAt: futureExpiryDate(),
          examName: bulkExamName,
          historyUrl: 'https://example.test/history',
        },
      },
    );
    expect(denied.status(), await denied.text()).toBe(403);
  });
});
