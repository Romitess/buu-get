import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object — /#/admin/receipt-void-refund (Finance / Admin)
 */
export class ReceiptVoidRefundPage {
  readonly page: Page;
  readonly pageShell: Locator;
  readonly searchCard: Locator;
  readonly ref1Input: Locator;
  readonly ref2Input: Locator;
  readonly nameInput: Locator;
  readonly examNameInput: Locator;
  readonly table: Locator;
  readonly voidDialog: Locator;
  readonly voidReasonInput: Locator;
  readonly voidConfirmButton: Locator;
  readonly voidCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageShell = page.locator('.receipt-void-refund-page, .page-container').first();
    this.searchCard = page.locator('.search-card').first();
    this.ref1Input = this.searchCard.locator('.q-field').nth(0).locator('input');
    this.ref2Input = this.searchCard.locator('.q-field').nth(1).locator('input');
    this.nameInput = this.searchCard.locator('.q-field').nth(2).locator('input');
    this.examNameInput = this.searchCard.locator('.q-field').nth(3).locator('input');
    this.table = page.locator('.q-table, .base-table').first();
    this.voidDialog = page.locator('.void-dialog-card');
    this.voidReasonInput = this.voidDialog.locator('textarea');
    this.voidConfirmButton = this.voidDialog.getByRole('button', {
      name: /Void Receipt|ยกเลิกใบเสร็จ/i,
    });
    this.voidCancelButton = this.voidDialog.getByRole('button', {
      name: /Cancel|ยกเลิก$/i,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/admin/receipt-void-refund');
    await expect(this.page).toHaveURL(/#\/admin\/receipt-void-refund/);
    await expect(this.pageShell).toBeVisible({ timeout: 20_000 });
    await expect(this.page.locator('.page-header').first()).toContainText(
      /Refund \/ Void Receipt|คืนเงิน \/ ยกเลิกใบเสร็จ/i,
      { timeout: 20_000 },
    );
  }

  async waitForTableSettled(): Promise<void> {
    await expect(this.page.locator('.q-inner-loading')).toHaveCount(0, {
      timeout: 20_000,
    });
    await this.page.waitForTimeout(400);
  }

  /** Debounced search (~400ms) — wait for transaction-refs/search after fill. */
  async searchByRef1(ref1: string): Promise<void> {
    const searchPromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('/api/transaction-refs/search') &&
        res.request().method() === 'GET' &&
        res.ok(),
      { timeout: 30_000 },
    );
    await this.ref1Input.fill(ref1);
    await searchPromise;
    await this.waitForTableSettled();
  }

  async searchByExamName(examName: string): Promise<void> {
    const searchPromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('/api/transaction-refs/search') &&
        res.request().method() === 'GET' &&
        res.ok(),
      { timeout: 30_000 },
    );
    await this.examNameInput.fill(examName);
    await searchPromise;
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

  voidButtonInRow(row: Locator): Locator {
    return row.getByRole('button', { name: /Void Receipt|ยกเลิกใบเสร็จ/i });
  }

  refundButtonInRow(row: Locator): Locator {
    return row.getByRole('button', { name: /Refund|คืนเงิน/i });
  }

  async openVoidDialogForRow(row: Locator): Promise<void> {
    await this.voidButtonInRow(row).click();
    await expect(this.voidDialog).toBeVisible({ timeout: 10_000 });
  }

  async fillVoidReason(reason: string): Promise<void> {
    await this.voidReasonInput.fill(reason);
  }

  async confirmVoid(): Promise<void> {
    await this.voidConfirmButton.click();
  }

  async expectVoidReasonRequiredError(): Promise<void> {
    await expect(
      this.voidDialog.locator('[role="alert"]').filter({
        hasText: /Void reason is required|กรุณาระบุเหตุผลการยกเลิก/i,
      }),
    ).toBeVisible({ timeout: 5_000 });
  }

  async expectVoidSuccessNotification(): Promise<void> {
    await expect(
      this.page.locator('.q-notification').filter({
        hasText: /Receipt voided|ยกเลิกใบเสร็จเรียบร้อยแล้ว/i,
      }),
    ).toBeVisible({ timeout: 15_000 });
  }

  /** After void: canVoid/canRefund false → actions column shows "-" */
  async expectActionsNoneForRow(row: Locator): Promise<void> {
    await expect(this.voidButtonInRow(row)).toHaveCount(0);
    await expect(this.refundButtonInRow(row)).toHaveCount(0);
    // i18n actions.none is "-"
    await expect(row.locator('td').last()).toContainText('-', {
      timeout: 10_000,
    });
  }
}
