import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * Page Object — /#/admin/payment-import (Finance / Admin)
 */
export class PaymentImportPage {
  readonly page: Page;
  readonly pageShell: Locator;
  readonly uploadZone: Locator;
  readonly fileInput: Locator;
  readonly verifyButton: Locator;
  readonly clearAllButton: Locator;
  readonly table: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageShell = page.locator('.payment-import-page, .page-container').first();
    this.uploadZone = page.locator('.upload-zone').first();
    this.fileInput = this.uploadZone.locator('input[type="file"]');
    this.verifyButton = page.getByRole('button', {
      name: /Verify Data|ตรวจสอบข้อมูล/i,
    });
    this.clearAllButton = page.getByRole('button', {
      name: /Clear All|ลบข้อมูลไฟล์ทั้งหมด/i,
    });
    this.table = page.locator('.payment-import-table .q-table, .base-table').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/admin/payment-import');
    await expect(this.page).toHaveURL(/#\/admin\/payment-import/);
    await expect(this.pageShell).toBeVisible({ timeout: 20_000 });
    await expect(this.page.locator('.page-header').first()).toContainText(
      /Payment Import|นำเข้าไฟล์การชำระเงิน/i,
      { timeout: 20_000 },
    );
  }

  async waitForTableSettled(): Promise<void> {
    const loader = this.page.locator('.q-inner-loading');
    // Prefer hidden over strict count — avoids hang when spinner never unmounts
    await loader
      .first()
      .waitFor({ state: 'hidden', timeout: 30_000 })
      .catch(() => undefined);
    await this.page.waitForTimeout(300);
  }

  /**
   * Upload a CSV via the hidden file input.
   * Writes a temp file so Playwright setInputFiles works reliably.
   */
  async uploadCsv(csvContent: string, filename = 'br-e-payments.csv'): Promise<void> {
    const tmpPath = path.join(os.tmpdir(), `${Date.now()}-${filename}`);
    fs.writeFileSync(tmpPath, csvContent, 'utf8');

    const importPromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('/api/bank-reconciles/import') &&
        res.request().method() === 'POST',
      { timeout: 60_000 },
    );

    await this.fileInput.setInputFiles(tmpPath);
    const importRes = await importPromise;
    expect(importRes.ok(), await importRes.text()).toBeTruthy();
    await this.waitForTableSettled();

    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // ignore temp cleanup
    }
  }

  async expectRowContaining(text: string | RegExp): Promise<void> {
    await this.waitForTableSettled();
    const row = this.page.locator('tbody tr').filter({ hasText: text }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });
  }

  /** Click Verify → navigates to fin-check-transcript on success. */
  async clickVerifyAndWaitForTranscript(): Promise<void> {
    const verifyPromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('/api/bank-reconciles/verify') &&
        res.request().method() === 'POST',
      { timeout: 60_000 },
    );
    await this.verifyButton.click();
    const verifyRes = await verifyPromise;
    expect(verifyRes.ok(), await verifyRes.text()).toBeTruthy();
    await expect(this.page).toHaveURL(/#\/admin\/fin-check-transcript/, {
      timeout: 20_000,
    });
  }
}

/**
 * Page Object — /#/admin/fin-check-transcript (after payment-import verify)
 */
export class FinCheckTranscriptPage {
  readonly page: Page;
  readonly pageShell: Locator;
  readonly saveButton: Locator;
  readonly confirmDialog: Locator;
  readonly successDialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageShell = page
      .locator('.fin-check-transcript-page, .page-container')
      .first();
    this.saveButton = page.getByRole('button', {
      name: /Save Registration Payment Data|บันทึกข้อมูลการชำระเงินลงทะเบียน/i,
    });
    this.confirmDialog = page.locator('.confirm-dialog-card');
    this.successDialog = page.locator('.success-dialog-card');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/#\/admin\/fin-check-transcript/);
    await expect(this.pageShell).toBeVisible({ timeout: 20_000 });
    await expect(this.page.locator('.page-header').first()).toContainText(
      /Verify Payment Transcripts|ตรวจสอบข้อมูลการชำระเงิน/i,
      { timeout: 20_000 },
    );
  }

  async waitForMatchSettled(): Promise<void> {
    // matchBankReconciles runs on mount — may already have finished before we attach
    await this.page
      .waitForResponse(
        (res) =>
          res.url().includes('/api/bank-reconciles/match') &&
          res.request().method() === 'POST',
        { timeout: 45_000 },
      )
      .catch(() => undefined);
    const loader = this.page.locator('.q-inner-loading');
    await loader
      .first()
      .waitFor({ state: 'hidden', timeout: 45_000 })
      .catch(() => undefined);
    await this.page.waitForTimeout(400);
  }

  rowContaining(text: string | RegExp): Locator {
    return this.page.locator('tbody tr').filter({ hasText: text }).first();
  }

  /**
   * MATCH: DB columns filled (applicant name / refs present).
   * MISSING (unmatched amount or no ref hit): DB cells show "-".
   */
  async expectMatchedRow(payerOrRef: string | RegExp): Promise<void> {
    await this.waitForMatchSettled();
    const row = this.rowContaining(payerOrRef);
    await expect(row).toBeVisible({ timeout: 20_000 });
    // Matched rows hide the edit action and show "-" in tools; DB ref cells are non-dash
    const editBtn = row.locator('button, .action-button, .q-btn').filter({
      has: this.page.locator('.q-icon'),
    });
    // Prefer: row should not be all "-" in DB section — check applicant name cell has content
    // Structure: index | file cols (6) | db_ref | db_ref2 | db_name | db_amount | tools
    const cells = row.locator('td');
    const dbRefCell = cells.nth(7); // 0=index, 1-6=file, 7=db_ref
    await expect(dbRefCell).not.toHaveText(/^\s*-\s*$/, { timeout: 10_000 });
    await expect(editBtn).toHaveCount(0);
  }

  async expectMissingRow(payerOrRef: string | RegExp): Promise<void> {
    await this.waitForMatchSettled();
    const row = this.rowContaining(payerOrRef);
    await expect(row).toBeVisible({ timeout: 20_000 });
    const cells = row.locator('td');
    const dbRefCell = cells.nth(7);
    await expect(dbRefCell).toHaveText(/^\s*-\s*$/, { timeout: 10_000 });
  }

  async confirmSavePayments(): Promise<void> {
    await expect(this.saveButton).toBeEnabled({ timeout: 15_000 });
    await this.saveButton.click();
    await expect(this.confirmDialog).toBeVisible({ timeout: 10_000 });

    const confirmPromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('/api/bank-reconciles/confirm-payment') &&
        res.request().method() === 'POST',
      { timeout: 60_000 },
    );

    await this.confirmDialog
      .getByRole('button', { name: /Confirm|ยืนยัน/i })
      .click();
    const confirmRes = await confirmPromise;
    expect(confirmRes.ok(), await confirmRes.text()).toBeTruthy();

    await expect(this.successDialog).toBeVisible({ timeout: 15_000 });
    await this.successDialog
      .getByRole('button', { name: /OK|ตกลง/i })
      .click();
  }
}
