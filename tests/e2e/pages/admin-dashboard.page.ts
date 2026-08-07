import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object — /#/admin/dashboard (exam-report summary)
 */
export class AdminDashboardPage {
  readonly page: Page;
  readonly pageShell: Locator;
  readonly filterCard: Locator;
  readonly applyFilterButton: Locator;
  readonly yearTable: Locator;
  readonly statCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageShell = page.locator('.dashboard-page, .page-container').first();
    this.filterCard = page.locator('.exam-report-filter').first();
    this.applyFilterButton = this.filterCard.locator('.filter-btn');
    this.yearTable = page.locator('.year-table').first();
    this.statCards = page.locator('.stat-card');
  }

  async goto(): Promise<void> {
    const summaryPromise = this.page
      .waitForResponse(
        (res) =>
          res.url().includes('/api/exam-report/summary') &&
          res.request().method() === 'GET',
        { timeout: 45_000 },
      )
      .catch(() => null);
    const optionsPromise = this.page
      .waitForResponse(
        (res) =>
          res.url().includes('/api/exam-report/options') &&
          res.request().method() === 'GET',
        { timeout: 45_000 },
      )
      .catch(() => null);

    await this.page.goto('/#/admin/dashboard');
    await expect(this.page).toHaveURL(/#\/admin\/dashboard/);
    await expect(this.pageShell).toBeVisible({ timeout: 20_000 });
    await Promise.all([summaryPromise, optionsPromise]);
    await this.waitForSettled();
  }

  async waitForSettled(): Promise<void> {
    await expect(this.page.locator('.q-inner-loading')).toHaveCount(0, {
      timeout: 30_000,
    });
    await this.page.waitForTimeout(300);
  }

  async expectReportLoaded(): Promise<void> {
    await this.waitForSettled();
    await expect(this.filterCard).toBeVisible({ timeout: 20_000 });
    await expect(this.statCards.first()).toBeVisible({ timeout: 30_000 });
    await expect(this.yearTable).toBeVisible({ timeout: 20_000 });
    // Charts render as apexcharts / card shells
    await expect(
      this.page.locator('.apexcharts-canvas, .q-circular-progress').first(),
    ).toBeVisible({ timeout: 20_000 });
  }

  /**
   * Select fromYear + toYear and apply (year filter only — month/round known gap).
   */
  async applyYearRange(year: number): Promise<void> {
    const yearLabel = String(year);
    const selects = this.filterCard.locator('.app-select, .q-select');

    await this.selectOption(selects.nth(0), yearLabel);
    // toYear is the 4th select (fromYear, fromMonth, fromRound, toYear, …)
    await this.selectOption(selects.nth(3), yearLabel);

    const summaryPromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('/api/exam-report/summary') &&
        res.request().method() === 'GET' &&
        res.ok(),
      { timeout: 45_000 },
    );
    await this.applyFilterButton.click();
    await summaryPromise;
    await this.waitForSettled();
  }

  async openYearDetail(year: number): Promise<void> {
    const row = this.yearTable
      .locator('tbody tr')
      .filter({ hasText: String(year) })
      .first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    const detailBtn = row.locator('button, .q-btn').first();
    await detailBtn.click();
    await expect(this.page).toHaveURL(
      new RegExp(`#/admin/exam-information/${year}`),
      { timeout: 20_000 },
    );
  }

  private async selectOption(
    select: Locator,
    optionText: string,
  ): Promise<void> {
    await select.click();
    const option = this.page
      .locator('.q-menu .q-item, .q-dialog .q-item')
      .filter({ hasText: new RegExp(`^\\s*${optionText}\\s*$`) })
      .first();
    await expect(option).toBeVisible({ timeout: 10_000 });
    await option.click();
  }
}
