import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import type { TestRoleKey } from '../e2e/fixtures/users';

/**
 * Exam Certificates API integration — matrix CERT-I-001 … CERT-I-008
 *
 * Path: `@Controller('exam-certificates')` + global `api` → `/api/exam-certificates`
 * (BUG-002 fixed).
 *
 * Seed approach (shared-DB, disposable via API):
 * 1. Create disposable exam/session/enrollment/score rows as needed
 * 2. Bulk-issue / CRUD against those scores
 * 3. afterAll soft-deletes certs → scores → enrollments → sessions → exams
 */

const EXAM_CERTIFICATES_PATH = '/api/exam-certificates';

const ExamSessionStatus = {
  DRAFT: 0,
  OPEN: 1,
  COMPLETED: 4,
} as const;

type AuthHeaders = { Authorization: string };

type RubricItem = {
  id: number;
  maxScore: number;
};

type ExamScoreRow = {
  SCORES_ID: number;
  ERM_ID: number;
};

type ExamCertificateRow = {
  CERT_ID: number;
  CERT_CODE: string;
  SCORES_ID: number;
  USER_ID: number;
  CERT_ISSUED_AT?: string | null;
  CERT_EXPIRES_AT?: string | null;
  DELETED_AT?: string | null;
};

type BulkIssueResult = {
  success: boolean;
  createdCount: number;
  skippedCount: number;
};

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

function uniqueCertCode(prefix = 'CI'): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const seed = `${prefix}${Date.now()}${Math.floor(Math.random() * 1_000_000)}`
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  let code = seed.slice(0, 16);
  while (code.length < 16) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code.slice(0, 16);
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

function pastIssueDate(): string {
  return '2026-01-15T00:00:00+07:00';
}

function futureExpiryDate(): string {
  return '2028-01-15T00:00:00+07:00';
}

async function headersFor(
  request: APIRequestContext,
  role: TestRoleKey,
): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, role);
  return { Authorization: `Bearer ${accessToken}` };
}

test.describe('Exam Certificates API — bulk-issue / CRUD / authz', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120_000);

  let adminHeaders: AuthHeaders;
  let staffHeaders: AuthHeaders;
  let registrationHeaders: AuthHeaders;
  let examOpsHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;
  let financeHeaders: AuthHeaders;
  let proctorHeaders: AuthHeaders;

  let candidateUserId: number;
  let rubricItems: RubricItem[] = [];
  let seedReady = false;
  let seedSkipReason = '';

  const examIds: number[] = [];
  const sessionIds: number[] = [];
  const enrollmentIds: number[] = [];
  const scoreIds: number[] = [];
  const certIds: number[] = [];
  let sessionSlot = 0;

  function requireSeed(): void {
    test.skip(!seedReady, seedSkipReason || 'Certificate seed unavailable');
  }

  async function createExam(
    request: APIRequestContext,
    suffix: string,
  ): Promise<number> {
    const res = await request.post('/api/exam', {
      headers: adminHeaders,
      data: {
        EXAM_NAME: `CERT-I ${suffix}`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: 'คอมพิวเตอร์',
        EXAM_FEE: 500,
        EXAM_DATE: '2026-12-25',
        EXAM_REG_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_REG_END_DATE: '2026-12-24T23:59:59.000Z',
        EXAM_PAY_START_DATE: '2026-01-01T00:00:00.000Z',
        EXAM_PAY_END_DATE: '2026-12-24T23:59:59.000Z',
        EXAM_PUBLISHED: true,
        EXAM_ROUND: 'CERT',
        EXAM_FISCAL_YEAR: '2026',
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
    status: number = ExamSessionStatus.OPEN,
  ): Promise<number> {
    const { start, end } = hourMinute(sessionSlot++);
    const res = await request.post('/api/exam-sessions', {
      headers: adminHeaders,
      data: {
        EXAM_ID: examId,
        SS_START_TIME: start,
        SS_END_TIME: end,
        SS_CAPACITY: 30,
        SS_SESSION_STATUS: status,
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { SS_ID: number };
    sessionIds.push(body.SS_ID);
    return body.SS_ID;
  }

  async function createEnrollment(
    request: APIRequestContext,
    sessionId: number,
  ): Promise<number> {
    const res = await request.post('/api/exam-enrollments', {
      headers: candidateHeaders,
      data: { USER_ID: candidateUserId, SESSION_ID: sessionId },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { ERM_ID: number };
    enrollmentIds.push(body.ERM_ID);
    return body.ERM_ID;
  }

  async function createScore(
    request: APIRequestContext,
    ermId: number,
  ): Promise<ExamScoreRow> {
    const res = await request.post('/api/exam-scores', {
      headers: adminHeaders,
      data: {
        ERM_ID: ermId,
        lines: rubricItems.map((item) => ({
          SRBI_ID: item.id,
          score: Math.min(10, Number(item.maxScore)),
        })),
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as ExamScoreRow;
    scoreIds.push(body.SCORES_ID);
    return body;
  }

  async function seedScoredEnrollment(
    request: APIRequestContext,
  ): Promise<{
    examId: number;
    sessionId: number;
    ermId: number;
    score: ExamScoreRow;
  }> {
    const examId = await createExam(request, uniqueSuffix());
    const sessionId = await createSession(request, examId);
    const ermId = await createEnrollment(request, sessionId);
    const score = await createScore(request, ermId);
    return { examId, sessionId, ermId, score };
  }

  async function createCertificate(
    request: APIRequestContext,
    headers: AuthHeaders,
    data: Record<string, unknown>,
  ): Promise<{ status: number; body: ExamCertificateRow; text: string }> {
    const res = await request.post(EXAM_CERTIFICATES_PATH, {
      headers,
      data,
    });
    const text = await res.text();
    let body = {} as ExamCertificateRow;
    try {
      body = JSON.parse(text) as ExamCertificateRow;
    } catch {
      /* empty */
    }
    if (res.status() === 201 && body.CERT_ID) {
      certIds.push(body.CERT_ID);
    }
    return { status: res.status(), body, text };
  }

  async function listCertificates(
    request: APIRequestContext,
    headers: AuthHeaders,
  ): Promise<ExamCertificateRow[]> {
    const res = await request.get(EXAM_CERTIFICATES_PATH, { headers });
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as ExamCertificateRow[];
  }

  test.beforeAll(async ({ request }) => {
    test.setTimeout(180_000);

    adminHeaders = await headersFor(request, 'admin');
    staffHeaders = await headersFor(request, 'staff');
    registrationHeaders = await headersFor(request, 'registration_officer');
    examOpsHeaders = await headersFor(request, 'exam_operations_officer');
    candidateHeaders = await headersFor(request, 'candidate');
    financeHeaders = await headersFor(request, 'finance');
    proctorHeaders = await headersFor(request, 'proctor');

    const me = await request.get('/api/auth/me', { headers: candidateHeaders });
    expect(me.status()).toBe(200);
    candidateUserId = ((await me.json()) as { id: number }).id;

    const rubricRes = await request.get('/api/score-rubrics/1', {
      headers: adminHeaders,
    });
    expect(rubricRes.status(), await rubricRes.text()).toBe(200);
    const rubric = (await rubricRes.json()) as { items?: RubricItem[] };
    rubricItems = rubric.items ?? [];
    if (rubricItems.length === 0) {
      seedReady = false;
      seedSkipReason =
        'SRB_ID=1 has no rubric items; cannot create scores for cert flows';
      return;
    }
    seedReady = true;
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(120_000);
    for (const certId of [...new Set(certIds)]) {
      await request
        .delete(`${EXAM_CERTIFICATES_PATH}/${certId}`, {
          headers: adminHeaders,
        })
        .catch(() => undefined);
    }
    for (const scoreId of scoreIds) {
      await request
        .delete(`/api/exam-scores/${scoreId}`, { headers: adminHeaders })
        .catch(() => undefined);
    }
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
  });

  // CERT-I-001
  test('POST bulk-issue mixed create/skip', async ({ request }) => {
    requireSeed();
    const fresh = await seedScoredEnrollment(request);
    const already = await seedScoredEnrollment(request);

    // Pre-issue cert for "already" score so bulk-issue skips it
    const pre = await createCertificate(request, adminHeaders, {
      SCORES_ID: already.score.SCORES_ID,
      USER_ID: candidateUserId,
      CERT_ISSUED_AT: pastIssueDate(),
      CERT_EXPIRES_AT: futureExpiryDate(),
      CERT_CODE: uniqueCertCode('PRE'),
    });
    expect(pre.status, pre.text).toBe(201);

    const beforeList = await listCertificates(request, adminHeaders);
    const beforeCount = beforeList.length;

    const res = await request.post(`${EXAM_CERTIFICATES_PATH}/bulk-issue`, {
      headers: adminHeaders,
      data: {
        candidates: [
          { SCORES_ID: fresh.score.SCORES_ID, USER_ID: candidateUserId },
          { SCORES_ID: already.score.SCORES_ID, USER_ID: candidateUserId },
        ],
        certIssuedAt: pastIssueDate(),
        certExpiresAt: futureExpiryDate(),
        examName: 'CERT-I Mixed',
        historyUrl: 'https://example.test/history',
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as BulkIssueResult;
    expect(body.success).toBe(true);
    expect(body.createdCount).toBe(1);
    expect(body.skippedCount).toBe(1);

    const afterList = await listCertificates(request, adminHeaders);
    expect(afterList.length).toBe(beforeCount + 1);

    const created = afterList.find(
      (c) => c.SCORES_ID === fresh.score.SCORES_ID && !c.DELETED_AT,
    );
    expect(created).toBeTruthy();
    if (created) certIds.push(created.CERT_ID);

    const alreadyCerts = afterList.filter(
      (c) => c.SCORES_ID === already.score.SCORES_ID && !c.DELETED_AT,
    );
    expect(alreadyCerts.length).toBe(1);
  });

  // CERT-I-002
  test('bulk-issue fails atomically on invalid batch member', async ({
    request,
  }) => {
    requireSeed();
    const valid = await seedScoredEnrollment(request);
    const mismatched = await seedScoredEnrollment(request);
    const invalidUserId = candidateUserId + 9_999_001;

    const beforeList = await listCertificates(request, adminHeaders);
    const beforeIds = new Set(
      beforeList
        .filter(
          (c) =>
            (c.SCORES_ID === valid.score.SCORES_ID ||
              c.SCORES_ID === mismatched.score.SCORES_ID) &&
            !c.DELETED_AT,
        )
        .map((c) => c.CERT_ID),
    );

    const res = await request.post(`${EXAM_CERTIFICATES_PATH}/bulk-issue`, {
      headers: adminHeaders,
      data: {
        candidates: [
          { SCORES_ID: valid.score.SCORES_ID, USER_ID: candidateUserId },
          {
            SCORES_ID: mismatched.score.SCORES_ID,
            USER_ID: invalidUserId,
          },
        ],
        certIssuedAt: pastIssueDate(),
        certExpiresAt: futureExpiryDate(),
        examName: 'CERT-I Atomic',
        historyUrl: 'https://example.test/history',
      },
    });
    // USER_ID mismatch against enrollment → BadRequest; transaction rolls back
    expect(res.status(), await res.text()).toBe(400);

    const afterList = await listCertificates(request, adminHeaders);
    const afterForBatch = afterList.filter(
      (c) =>
        (c.SCORES_ID === valid.score.SCORES_ID ||
          c.SCORES_ID === mismatched.score.SCORES_ID) &&
        !c.DELETED_AT,
    );
    // No partial writes for either member of the failed batch
    expect(afterForBatch.every((c) => beforeIds.has(c.CERT_ID))).toBe(true);
    expect(afterForBatch.length).toBe(beforeIds.size);
  });
  // CERT-I-003
  test('bulk-issue date validation → 400', async ({ request }) => {
    requireSeed();
    const seeded = await seedScoredEnrollment(request);
    const base = {
      candidates: [
        { SCORES_ID: seeded.score.SCORES_ID, USER_ID: candidateUserId },
      ],
      examName: 'CERT-I Dates',
      historyUrl: 'https://example.test/history',
    };

    const futureIssue = await request.post(
      `${EXAM_CERTIFICATES_PATH}/bulk-issue`,
      {
        headers: adminHeaders,
        data: {
          ...base,
          certIssuedAt: '2099-01-01T00:00:00+07:00',
          certExpiresAt: '2099-12-31T00:00:00+07:00',
        },
      },
    );
    expect(futureIssue.status(), await futureIssue.text()).toBe(400);

    const expiryBeforeIssue = await request.post(
      `${EXAM_CERTIFICATES_PATH}/bulk-issue`,
      {
        headers: adminHeaders,
        data: {
          ...base,
          certIssuedAt: '2026-06-01T00:00:00+07:00',
          certExpiresAt: '2026-01-01T00:00:00+07:00',
        },
      },
    );
    expect(expiryBeforeIssue.status(), await expiryBeforeIssue.text()).toBe(
      400,
    );
  });

  // CERT-I-004
  test('bulk-issue role restriction enforced', async ({ request }) => {
    requireSeed();
    const seeded = await seedScoredEnrollment(request);
    const payload = {
      candidates: [
        { SCORES_ID: seeded.score.SCORES_ID, USER_ID: candidateUserId },
      ],
      certIssuedAt: pastIssueDate(),
      certExpiresAt: futureExpiryDate(),
      examName: 'CERT-I RBAC',
      historyUrl: 'https://example.test/history',
    };

    // EXAM_ADMIN_ROLES allowed
    for (const [role, headers] of [
      ['admin', adminHeaders],
      ['staff', staffHeaders],
      ['registration_officer', registrationHeaders],
      ['exam_operations_officer', examOpsHeaders],
    ] as const) {
      // Use a fresh score for allowed roles that would actually create
      // (except we only need status check — first allowed role creates/skips)
      const res = await request.post(`${EXAM_CERTIFICATES_PATH}/bulk-issue`, {
        headers,
        data: payload,
      });
      // First call creates; subsequent may skip — both are 201 under EXAM_ADMIN
      expect(res.status(), `${role} bulk-issue`).toBe(201);
      const body = (await res.json()) as BulkIssueResult;
      expect(body.success).toBe(true);
      if (body.createdCount > 0) {
        const list = await listCertificates(request, adminHeaders);
        const created = list.find(
          (c) => c.SCORES_ID === seeded.score.SCORES_ID && !c.DELETED_AT,
        );
        if (created) certIds.push(created.CERT_ID);
      }
    }

    for (const [role, headers] of [
      ['candidate', candidateHeaders],
      ['finance', financeHeaders],
      ['proctor', proctorHeaders],
    ] as const) {
      const res = await request.post(`${EXAM_CERTIFICATES_PATH}/bulk-issue`, {
        headers,
        data: payload,
      });
      expect(res.status(), `${role} bulk-issue`).toBe(403);
    }

    const unauth = await request.post(`${EXAM_CERTIFICATES_PATH}/bulk-issue`, {
      data: payload,
    });
    expect(unauth.status()).toBe(401);
  });

  // CERT-I-005
  // Current product: non-bulk CRUD has no @Roles → any authenticated JWT.
  // Authz risk flagged in MASTER_TEST_PLAN; assert current behavior.
  // Note: GET :id is shadowed by platform-gateway `@Controller('api')`
  // `GET /:folder/:fileName` under `/api/...` —
  // do not call GET :id here (hits slow external getPublicFile).
  test('Non-bulk certificate CRUD authz behavior (current)', async ({
    request,
  }) => {
    requireSeed();
    const seeded = await seedScoredEnrollment(request);
    const code = uniqueCertCode('CND');

    const candidateCreate = await createCertificate(
      request,
      candidateHeaders,
      {
        SCORES_ID: seeded.score.SCORES_ID,
        USER_ID: candidateUserId,
        CERT_CODE: code,
      },
    );
    // Current behavior: JWT-only (no role restriction) → 201
    expect(candidateCreate.status, candidateCreate.text).toBe(201);

    const listAsFinance = await listCertificates(request, financeHeaders);
    expect(
      listAsFinance.some((c) => c.CERT_ID === candidateCreate.body.CERT_ID),
    ).toBe(true);

    const patchedCode = uniqueCertCode('PCT');
    const patchAsProctor = await request.patch(
      `${EXAM_CERTIFICATES_PATH}/${candidateCreate.body.CERT_ID}`,
      {
        headers: proctorHeaders,
        data: { CERT_CODE: patchedCode },
      },
    );
    expect(patchAsProctor.status(), await patchAsProctor.text()).toBe(200);
    const patched = (await patchAsProctor.json()) as ExamCertificateRow;
    expect(patched.CERT_CODE).toBe(patchedCode);

    const unauthGet = await request.get(EXAM_CERTIFICATES_PATH);
    expect(unauthGet.status()).toBe(401);
  });
  // CERT-I-006
  test('CERT_CODE uniqueness behavior', async ({ request }) => {
    requireSeed();
    const a = await seedScoredEnrollment(request);
    const b = await seedScoredEnrollment(request);
    const code = uniqueCertCode('DUP');

    const first = await createCertificate(request, adminHeaders, {
      SCORES_ID: a.score.SCORES_ID,
      USER_ID: candidateUserId,
      CERT_CODE: code,
    });
    expect(first.status, first.text).toBe(201);
    expect(first.body.CERT_CODE).toBe(code);

    const second = await createCertificate(request, adminHeaders, {
      SCORES_ID: b.score.SCORES_ID,
      USER_ID: candidateUserId,
      CERT_CODE: code,
    });
    // Current product: unique DB constraint, no ConflictException mapper → 500
    // (matrix allows conflict/DB error as designed)
    expect([409, 500]).toContain(second.status);
    if (second.status === 201 && second.body.CERT_ID) {
      // Unexpected success would mean uniqueness not enforced — fail loudly
      expect(second.status, 'duplicate CERT_CODE must not succeed').not.toBe(
        201,
      );
    }
  });

  // CERT-I-007
  test('Certificate soft-delete excluded from GET/list', async ({
    request,
  }) => {
    requireSeed();
    const seeded = await seedScoredEnrollment(request);
    const created = await createCertificate(request, adminHeaders, {
      SCORES_ID: seeded.score.SCORES_ID,
      USER_ID: candidateUserId,
      CERT_CODE: uniqueCertCode('DEL'),
    });
    expect(created.status, created.text).toBe(201);

    const beforeList = await listCertificates(request, adminHeaders);
    expect(
      beforeList.some((c) => c.CERT_ID === created.body.CERT_ID),
    ).toBe(true);

    const del = await request.delete(
      `${EXAM_CERTIFICATES_PATH}/${created.body.CERT_ID}`,
      { headers: adminHeaders },
    );
    expect([200, 204]).toContain(del.status());

    // Soft-delete visibility: list excludes (GET :id is shadowed by file gateway)
    const list = await listCertificates(request, adminHeaders);
    expect(list.some((c) => c.CERT_ID === created.body.CERT_ID)).toBe(false);
  });

  // CERT-I-008
  test('Create endpoint updates linked session to COMPLETED', async ({
    request,
  }) => {
    requireSeed();
    const examId = await createExam(request, `sess-${uniqueSuffix()}`);
    const sessionId = await createSession(
      request,
      examId,
      ExamSessionStatus.OPEN,
    );
    const ermId = await createEnrollment(request, sessionId);
    const score = await createScore(request, ermId);

    const before = await request.get(`/api/exam-sessions/${sessionId}`, {
      headers: adminHeaders,
    });
    expect(before.status(), await before.text()).toBe(200);
    const beforeBody = (await before.json()) as {
      SS_SESSION_STATUS: number;
    };
    expect(beforeBody.SS_SESSION_STATUS).not.toBe(ExamSessionStatus.COMPLETED);

    const created = await createCertificate(request, adminHeaders, {
      SCORES_ID: score.SCORES_ID,
      USER_ID: candidateUserId,
      CERT_ISSUED_AT: pastIssueDate(),
      CERT_EXPIRES_AT: futureExpiryDate(),
      CERT_CODE: uniqueCertCode('SES'),
    });
    expect(created.status, created.text).toBe(201);

    const after = await request.get(`/api/exam-sessions/${sessionId}`, {
      headers: adminHeaders,
    });
    expect(after.status(), await after.text()).toBe(200);
    const afterBody = (await after.json()) as { SS_SESSION_STATUS: number };
    expect(afterBody.SS_SESSION_STATUS).toBe(ExamSessionStatus.COMPLETED);
  });
});
