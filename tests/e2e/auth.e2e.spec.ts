import { test, expect } from '@playwright/test';
import { loginAs } from './fixtures/auth';
import { LoginPage } from './pages/login.page';

/** Hash-router URL helpers (vueRouterMode: 'hash') */
const hashHas = (fragment: string) => (url: URL) =>
  url.hash.includes(fragment);

test.describe('E2E: Auth role redirects & failed login', () => {
  // Avoid login rate-limit flakes when many role logins run in parallel
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(60_000);

  // AUTH-E-002
  test('Candidate login → exam-schedule', async ({ page }) => {
    await loginAs(page, 'candidate');
    await expect(page).toHaveURL(hashHas('/user/exam-schedule'));
    await expect(
      page.getByText(/Exam Registration|การสมัครสอบ/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  // AUTH-E-003
  test('Admin login → admin-exam-management', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(hashHas('/admin/exam-management'));
    await expect(page.locator('.page-header .page-title-size')).toContainText(
      /Manage Exams|จัดการรอบสอบ/i,
      { timeout: 15_000 },
    );
  });

  // AUTH-E-003 (staff variant)
  test('Staff login → admin-exam-management', async ({ page }) => {
    await loginAs(page, 'staff');
    await expect(page).toHaveURL(hashHas('/admin/exam-management'));
    await expect(page.locator('.page-header .page-title-size')).toContainText(
      /Manage Exams|จัดการรอบสอบ/i,
      { timeout: 15_000 },
    );
  });

  // AUTH-E-004
  test('Finance login → admin-payment-import', async ({ page }) => {
    await loginAs(page, 'finance');
    await expect(page).toHaveURL(hashHas('/admin/payment-import'));
    // Title may be Thai or missing EN key — assert URL + page shell
    await expect(page.locator('.page-header, .q-page').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  // AUTH-E-005
  test('Failed login stays on /login', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    // Wrong password via LoginPage + getTestUser (no hardcoded email)
    await login.attemptLoginAs('candidate', 'WrongPassword!999');
    await login.expectStillOnLogin();
    await login.expectLoginErrorNotification();
    await expect(login.submitButton).toBeVisible();
  });

  // AUTH-E-006
  test('Already logged-in visit /login → role home', async ({ page }) => {
    await loginAs(page, 'candidate');
    await expect(page).toHaveURL(hashHas('/user/exam-schedule'));

    await page.goto('/#/login');
    await expect(page).toHaveURL(hashHas('/user/exam-schedule'), {
      timeout: 15_000,
    });
  });
});
