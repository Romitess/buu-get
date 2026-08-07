import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object — /#/admin/create-exam (Exam ops / Admin / Staff)
 * Focused on fund-source dropdown for FUND-E-002.
 */
export class CreateExamPage {
  readonly page: Page;
  readonly pageShell: Locator;
  readonly fundSourceField: Locator;
  readonly rubricField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageShell = page.locator('.create-exam-page, .page-container').first();
    this.fundSourceField = page.locator('[data-field="fundSourceId"]');
    this.rubricField = page.locator('[data-field="srbId"]');
  }

  async goto(): Promise<void> {
    const fundPromise = this.page
      .waitForResponse(
        (res) =>
          res.url().includes('/api/fund-sources') &&
          !res.url().includes('daily-revenue') &&
          res.request().method() === 'GET',
        { timeout: 45_000 },
      )
      .catch(() => null);
    await this.page.goto('/#/admin/create-exam');
    await expect(this.page).toHaveURL(/#\/admin\/create-exam/);
    await expect(this.pageShell).toBeVisible({ timeout: 20_000 });
    await expect(this.page.locator('.page-header').first()).toContainText(
      /สร้างรอบสอบ|Create Exam/i,
      { timeout: 20_000 },
    );
    await fundPromise;
    // Wait for overlay loading to finish (blocks dropdown clicks)
    await this.page
      .getByText(/กำลังโหลดข้อมูล|Loading/i)
      .first()
      .waitFor({ state: 'hidden', timeout: 45_000 })
      .catch(() => undefined);
    await expect(this.page.locator('.q-inner-loading')).toHaveCount(0, {
      timeout: 30_000,
    }).catch(() => undefined);
    // Wait for fund field (general round only)
    await expect(this.fundSourceField).toBeVisible({ timeout: 30_000 });
  }

  async openFundSourceDropdown(): Promise<void> {
    await this.fundSourceField.scrollIntoViewIfNeeded();
    const combo = this.fundSourceField.getByRole('combobox');
    await expect(combo).toBeVisible({ timeout: 10_000 });
    await combo.click({ force: true });
    // Retry via keyboard if menu did not open
    let menu = this.page.locator('.q-menu').filter({ has: this.page.locator('.q-item') }).last();
    if (!(await menu.isVisible().catch(() => false))) {
      await combo.press('ArrowDown');
    }
    menu = this.page.locator('.q-menu').filter({ has: this.page.locator('.q-item') }).last();
    await expect(menu).toBeVisible({ timeout: 15_000 });
  }

  fundOption(text: string | RegExp): Locator {
    return this.page
      .locator('.q-menu .q-item, .app-select-menu .q-item')
      .filter({ hasText: text });
  }

  async expectFundOptionVisible(text: string | RegExp): Promise<void> {
    await this.openFundSourceDropdown();
    await expect(this.fundOption(text).first()).toBeVisible({ timeout: 15_000 });
  }

  async openRubricDropdown(): Promise<void> {
    await this.rubricField.scrollIntoViewIfNeeded();
    const combo = this.rubricField.getByRole('combobox');
    await expect(combo).toBeVisible({ timeout: 10_000 });
    await combo.click({ force: true });
    let menu = this.page
      .locator('.q-menu')
      .filter({ has: this.page.locator('.q-item') })
      .last();
    if (!(await menu.isVisible().catch(() => false))) {
      await combo.press('ArrowDown');
    }
    menu = this.page
      .locator('.q-menu')
      .filter({ has: this.page.locator('.q-item') })
      .last();
    await expect(menu).toBeVisible({ timeout: 15_000 });
  }

  rubricOption(text: string | RegExp): Locator {
    return this.page
      .locator('.q-menu .q-item, .app-select-menu .q-item')
      .filter({ hasText: text });
  }

  async expectRubricOptionVisible(text: string | RegExp): Promise<void> {
    await this.openRubricDropdown();
    await expect(this.rubricOption(text).first()).toBeVisible({
      timeout: 15_000,
    });
  }
}
