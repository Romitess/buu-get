import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object — /#/admin/daily-revenue-report (Finance / Admin)
 */
export class DailyRevenueReportPage {
  readonly page: Page;
  readonly pageShell: Locator;
  readonly filterCard: Locator;
  readonly examNameInput: Locator;
  readonly totalRow: Locator;
  readonly totalValue: Locator;
  readonly emptyLabel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageShell = page
      .locator('.daily-revenue-report-page, .page-container')
      .first();
    this.filterCard = page.locator('.filter-card').first();
    this.examNameInput = this.filterCard.getByPlaceholder(/BUU-GET 1\/2026/);
    this.totalRow = page.locator('.total-row');
    this.totalValue = page.locator('.total-value');
    this.emptyLabel = page.getByText(
      /No revenue data found|ไม่พบข้อมูลรายงาน/i,
    );
  }

  async goto(query?: { startDate?: string; endDate?: string }): Promise<void> {
    const params = new URLSearchParams();
    if (query?.startDate) params.set('startDate', query.startDate);
    if (query?.endDate) params.set('endDate', query.endDate);
    const search = params.toString();
    const loadPromise = search
      ? this.page.waitForResponse(
          (res) =>
            res.url().includes('/api/finance-reports/daily-revenue') &&
            res.request().method() === 'GET' &&
            res.ok(),
          { timeout: 30_000 },
        )
      : Promise.resolve(null);
    await this.page.goto(
      `/#/admin/daily-revenue-report${search ? `?${search}` : ''}`,
    );
    await expect(this.page).toHaveURL(/#\/admin\/daily-revenue-report/);
    await expect(this.pageShell).toBeVisible({ timeout: 20_000 });
    await expect(this.page.locator('.page-header').first()).toContainText(
      /Daily Revenue Summary Report|รายงานสรุปการรับเงินประจำวัน/i,
      { timeout: 20_000 },
    );
    await loadPromise;
    await this.waitForTableSettled();
  }

  async waitForTableSettled(): Promise<void> {
    await expect(this.page.locator('.q-inner-loading')).toHaveCount(0, {
      timeout: 20_000,
    });
    await this.page.waitForTimeout(400);
  }

  async filterByExamName(examName: string): Promise<void> {
    const filterPromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('/api/finance-reports/daily-revenue') &&
        res.request().method() === 'GET' &&
        res.ok(),
      { timeout: 30_000 },
    );
    await this.examNameInput.fill(examName);
    await filterPromise;
    await this.waitForTableSettled();
  }

  rowContaining(text: string | RegExp): Locator {
    return this.page.locator('tbody tr').filter({ hasText: text }).first();
  }

  async expectRowContaining(text: string | RegExp): Promise<Locator> {
    await this.waitForTableSettled();
    const row = this.rowContaining(text);
    await expect(row).toBeVisible({ timeout: 20_000 });
    return row;
  }

  async expectTotalContains(amountText: string | RegExp): Promise<void> {
    await expect(this.totalRow).toBeVisible({ timeout: 10_000 });
    await expect(this.totalValue).toContainText(amountText);
  }
}
