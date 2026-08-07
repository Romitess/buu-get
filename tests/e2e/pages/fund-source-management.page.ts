import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object — /#/admin/fund-source-management (Finance / Admin)
 */
export class FundSourceManagementPage {
  readonly page: Page;
  readonly pageShell: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly dialog: Locator;
  readonly nameInput: Locator;
  readonly accountCodeInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageShell = page
      .locator('.fund-source-management-page, .page-container')
      .first();
    this.createButton = page.locator('.create-fund-source-btn');
    this.searchInput = page.locator('.search-bar input').first();
    this.dialog = page.locator('.form-dialog-card');
    this.nameInput = this.dialog.locator('.dialog-input input').nth(0);
    this.accountCodeInput = this.dialog.locator('.dialog-input input').nth(1);
    this.saveButton = this.dialog.locator('.dialog-btn-save');
    this.cancelButton = this.dialog.locator('.dialog-btn-cancel');
  }

  async goto(): Promise<void> {
    const listPromise = this.page
      .waitForResponse(
        (res) =>
          res.url().includes('/api/fund-sources') &&
          !res.url().includes('daily-revenue') &&
          res.request().method() === 'GET' &&
          res.ok(),
        { timeout: 30_000 },
      )
      .catch(() => null);
    await this.page.goto('/#/admin/fund-source-management');
    await expect(this.page).toHaveURL(/#\/admin\/fund-source-management/);
    await expect(this.pageShell).toBeVisible({ timeout: 20_000 });
    await expect(this.page.locator('.page-header').first()).toContainText(
      /Manage Fund Sources|จัดการผังแหล่งเงิน/i,
      { timeout: 20_000 },
    );
    await listPromise;
    await this.waitForTableSettled();
  }

  async waitForTableSettled(): Promise<void> {
    await expect(this.page.locator('.q-inner-loading')).toHaveCount(0, {
      timeout: 20_000,
    });
    await this.page.waitForTimeout(300);
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
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

  async expectNoRowContaining(text: string | RegExp): Promise<void> {
    await this.waitForTableSettled();
    await expect(this.rowContaining(text)).toHaveCount(0);
  }

  async openCreateDialog(): Promise<void> {
    await this.createButton.click();
    await expect(this.dialog).toBeVisible({ timeout: 10_000 });
    await expect(this.dialog.locator('.dialog-title')).toContainText(
      /Create Fund Source|สร้างผังแหล่งเงิน/i,
    );
  }

  async fillForm(name: string, accountCode: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.accountCodeInput.fill(accountCode);
  }

  async save(): Promise<void> {
    const mutatePromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('/api/fund-sources') &&
        ['POST', 'PATCH'].includes(res.request().method()) &&
        res.ok(),
      { timeout: 30_000 },
    );
    await this.saveButton.click();
    await mutatePromise;
    await expect(this.dialog).toBeHidden({ timeout: 15_000 });
    await this.waitForTableSettled();
  }

  /** Click the edit (blue) action button in a table row. */
  async editRow(row: Locator): Promise<void> {
    await row.locator('button').nth(0).click();
    await expect(this.dialog).toBeVisible({ timeout: 10_000 });
    await expect(this.dialog.locator('.dialog-title')).toContainText(
      /Edit Fund Source|แก้ไขผังแหล่งเงิน/i,
    );
  }

  /** Click delete, confirm Quasar dialog. */
  async deleteRow(row: Locator): Promise<void> {
    const deletePromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('/api/fund-sources/') &&
        res.request().method() === 'DELETE' &&
        res.ok(),
      { timeout: 30_000 },
    );
    await row.locator('button').nth(1).click();
    const confirm = this.page.locator('.q-dialog').filter({
      hasText: /Confirm Deletion|Confirm|ยืนยัน|ลบผังแหล่งเงิน/i,
    });
    await expect(confirm).toBeVisible({ timeout: 10_000 });
    await confirm
      .getByRole('button', { name: /OK|Ok|ตกลง|Yes|ยืนยัน/i })
      .click();
    await deletePromise;
    await this.waitForTableSettled();
  }

  async expectSuccessNotification(pattern: RegExp): Promise<void> {
    await expect(
      this.page.locator('.q-notification').filter({ hasText: pattern }),
    ).toBeVisible({ timeout: 15_000 });
  }
}
