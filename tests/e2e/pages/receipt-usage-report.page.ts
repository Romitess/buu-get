import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object — /#/admin/receipt-usage-report (Finance / Admin)
 */
export class ReceiptUsageReportPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly table: Locator;
  readonly emptyLabel: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('.page-header .page-title-size, .page-header h1').first();
    this.table = page.locator('.receipt-usage-table .q-table, .base-table').first();
    this.emptyLabel = page.getByText(
      /No receipt data found|ไม่พบข้อมูลใบเสร็จ/i,
    );
    this.searchInput = page.locator('.search-bar input, input[type="search"]').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/admin/receipt-usage-report');
    await expect(this.page).toHaveURL(/#\/admin\/receipt-usage-report/);
    // Prefer page shell — sidebar also contains "Receipt Usage Report" (hidden off-canvas)
    await expect(
      this.page.locator('.receipt-usage-report-page, .page-container').first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(this.page.locator('.page-header').first()).toContainText(
      /Receipt Usage Report|รายงานสรุปการใช้ใบเสร็จรับเงิน/i,
      { timeout: 20_000 },
    );
  }

  async waitForTableSettled(): Promise<void> {
    // Loading spinner gone
    await expect(this.page.locator('.q-inner-loading')).toHaveCount(0, {
      timeout: 20_000,
    });
    await this.page.waitForTimeout(500);
  }

  async expectRowContaining(text: string | RegExp): Promise<void> {
    await this.waitForTableSettled();
    const row = this.page.locator('tbody tr').filter({ hasText: text }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });
  }

  async expectHasAnyDataRows(): Promise<void> {
    await this.waitForTableSettled();
    const rows = this.page.locator('tbody tr').filter({
      hasNot: this.page.locator('.base-table-empty-cell'),
    });
    await expect(rows.first()).toBeVisible({ timeout: 20_000 });
  }

  async search(query: string): Promise<void> {
    if (await this.searchInput.isVisible().catch(() => false)) {
      await this.searchInput.fill(query);
    }
  }
}
