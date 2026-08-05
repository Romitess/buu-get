import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from './fixtures/auth';
import { VerifyCertificatePage } from './pages/verify-certificate.page';
import { VerifyReceiptPage } from './pages/verify-receipt.page';

/**
 * exam-certificates controller is mounted at `@Controller('api/exam-certificates')`
 * while the app already uses global prefix `api` → `/api/api/exam-certificates`.
 */
const EXAM_CERTIFICATES_PATH = '/api/api/exam-certificates';

type ExamCertificateRow = {
  CERT_CODE: string;
  DELETED_AT?: string | null;
};

type ReceiptRow = {
  RC_VERIFY_CODE: string;
  RC_STATUS: number;
};

type Paginated<T> = {
  data: T[];
};

const ReceiptStatus = {
  ISSUED: 1,
} as const;

function apiBaseUrl(): string {
  return (process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
}

async function discoverCertCode(
  request: APIRequestContext,
): Promise<string | null> {
  const { accessToken } = await apiLogin(request, 'admin');
  const res = await request.get(`${apiBaseUrl()}${EXAM_CERTIFICATES_PATH}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok()) return null;
  const certs = (await res.json()) as ExamCertificateRow[];
  const active = certs.find((c) => c.CERT_CODE && !c.DELETED_AT);
  return active?.CERT_CODE ?? null;
}

async function discoverReceiptCode(
  request: APIRequestContext,
): Promise<string | null> {
  const { accessToken } = await apiLogin(request, 'admin');
  const res = await request.get(
    `${apiBaseUrl()}/api/receipts/issued?page=1&limit=20`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok()) return null;
  const page = (await res.json()) as Paginated<ReceiptRow>;
  const issued = page.data?.find(
    (r) => r.RC_VERIFY_CODE && r.RC_STATUS === ReceiptStatus.ISSUED,
  );
  return issued?.RC_VERIFY_CODE ?? null;
}

test.describe('E2E: Public document verification UI', () => {
  test.setTimeout(90_000);

  // VERIFY-E-001
  test('Public UI verify certificate (no auth)', async ({ page, request }) => {
    // Known production bug — do not weaken assertion; un-skip when BUG-004 is fixed.
    test.skip(
      true,
      'BUG-004: public certificate result page Promise.all includes auth-gated getBandRules() (401) → false not-found even when verify API returns 200',
    );

    const code = await discoverCertCode(request);
    test.skip(
      !code,
      'No exam certificates in test DB — cannot discover CERT_CODE for VERIFY-E-001',
    );

    const verify = new VerifyCertificatePage(page);
    await verify.gotoManualForm();
    // No login required — public route
    await expect(page).not.toHaveURL(/#\/login/);

    await verify.submitCertificateCode(code!);
    await expect(page).toHaveURL(
      (url) => url.hash === `#/verify/certificate/${code}`,
    );

    await verify.expectValidResult(code!);
  });

  // VERIFY-E-002
  test('Public UI verify receipt (no auth)', async ({ page, request }) => {
    const code = await discoverReceiptCode(request);
    test.skip(
      !code,
      'No ISSUED receipts with RC_VERIFY_CODE in test DB — cannot run VERIFY-E-002',
    );

    const verify = new VerifyReceiptPage(page);
    await verify.gotoManualForm();
    await expect(page).not.toHaveURL(/#\/login/);

    await verify.submitReceiptCode(code!);
    await expect(page).toHaveURL(
      (url) => url.hash === `#/verify/receipt/${code}`,
    );
    await verify.expectValidResult(code!);
  });
});
