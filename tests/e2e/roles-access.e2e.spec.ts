import { test, expect } from '@playwright/test';
import { loginAs } from './fixtures/auth';

const hashHas = (fragment: string) => (url: URL) =>
  url.hash.includes(fragment);

test.describe('E2E: Role-based route access', () => {
  test.setTimeout(60_000);

  // ROLES-E-002
  test('Candidate blocked from admin surface → redirected to role home', async ({
    page,
  }) => {
    await loginAs(page, 'candidate');
    await expect(page).toHaveURL(hashHas('/user/exam-schedule'));

    await page.goto('/#/admin/exam-management');

    // Router guard: candidate lacks admin roles → getDefaultRouteForRole → exam-schedule
    await expect(page).toHaveURL(hashHas('/user/exam-schedule'), {
      timeout: 15_000,
    });
    await expect(page).not.toHaveURL(hashHas('/admin/'));
  });

  // ROLES-E-002 (extra admin surface)
  test('Candidate blocked from admin payment-import', async ({ page }) => {
    await loginAs(page, 'candidate');
    await page.goto('/#/admin/payment-import');
    await expect(page).toHaveURL(hashHas('/user/exam-schedule'), {
      timeout: 15_000,
    });
    await expect(page).not.toHaveURL(hashHas('/admin/payment-import'));
  });
});
