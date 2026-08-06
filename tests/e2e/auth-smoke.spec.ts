import { test, expect } from '@playwright/test';

test.describe('Public auth surfaces', () => {
  // AUTH-E-001
  test('login page renders brand and form', async ({ page }) => {
    // Hash router (vueRouterMode: 'hash')
    await page.goto('/#/login');
    await expect(page).toHaveURL(/#\/login/);
    await expect(page.locator('img[alt="BUU-GET Logo"]')).toBeVisible();
    await expect(page.locator('.login-form')).toBeVisible({ timeout: 15_000 });
  });
});
