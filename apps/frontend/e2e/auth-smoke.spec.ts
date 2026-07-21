import { test, expect } from '@playwright/test';

test.describe('Public auth surfaces', () => {
  test('login page renders brand and form', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('img[alt="BUU-GET Logo"]')).toBeVisible();
  });
});
