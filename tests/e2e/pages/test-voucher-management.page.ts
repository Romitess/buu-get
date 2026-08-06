import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object — /#/admin/test-voucher-management
 * Admin regulations editor + live voucher preview.
 */
export class TestVoucherManagementPage {
  readonly page: Page;
  readonly pageRoot: Locator;
  readonly regulationsEnInput: Locator;
  readonly regulationsThInput: Locator;
  readonly saveBtn: Locator;
  readonly cancelBtn: Locator;
  readonly preview: Locator;
  readonly previewRegulationsTexts: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageRoot = page.locator('.test-voucher-management-page');
    this.regulationsEnInput = page
      .locator('.regulations-block')
      .filter({ hasText: /Test Regulations/i })
      .locator('textarea')
      .first();
    this.regulationsThInput = page
      .locator('.regulations-block')
      .filter({ hasText: /ข้อปฏิบัติสำหรับผู้เข้าสอบ/i })
      .locator('textarea')
      .first();
    this.saveBtn = page.getByRole('button', {
      name: /Save Changes|บันทึกข้อมูล|Save/i,
    });
    this.cancelBtn = page.getByRole('button', {
      name: /Cancel|ยกเลิก/i,
    });
    this.preview = page.locator('.admin-voucher-preview');
    this.previewRegulationsTexts = this.preview.locator(
      '.regulations-text-content',
    );
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/admin/test-voucher-management');
    await expect(this.page).toHaveURL(
      /#\/admin\/test-voucher-management/,
    );
    await expect(this.pageRoot).toBeVisible({ timeout: 20_000 });
    await expect(this.saveBtn).toBeVisible({ timeout: 20_000 });
    await expect(this.regulationsEnInput).toBeVisible({ timeout: 15_000 });
  }

  async fillRegulations(en: string, th: string): Promise<void> {
    await expect(this.regulationsEnInput).toBeVisible({ timeout: 15_000 });
    await this.regulationsEnInput.fill(en);
    await this.regulationsThInput.fill(th);
  }

  async save(): Promise<void> {
    const savePromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('/api/exam-rule-vouchers/regulations') &&
        res.request().method() === 'PUT',
      { timeout: 30_000 },
    );
    await this.saveBtn.click();
    const res = await savePromise;
    expect(res.ok(), await res.text()).toBeTruthy();
  }

  async expectSaveSuccess(): Promise<void> {
    const notify = this.page.locator('.q-notification');
    await expect(notify).toBeVisible({ timeout: 20_000 });
    await expect(notify).toContainText(
      /Successfully saved|บันทึก.*สำเร็จ|Test Voucher/i,
    );
  }

  async expectInputsEqual(en: string, th: string): Promise<void> {
    await expect(this.regulationsEnInput).toHaveValue(en, {
      timeout: 15_000,
    });
    await expect(this.regulationsThInput).toHaveValue(th, {
      timeout: 15_000,
    });
  }

  async expectPreviewContains(en: string, th: string): Promise<void> {
    await expect(this.preview).toBeVisible({ timeout: 15_000 });
    await expect(this.previewRegulationsTexts.first()).toContainText(en, {
      timeout: 15_000,
    });
    await expect(this.previewRegulationsTexts.nth(1)).toContainText(th, {
      timeout: 15_000,
    });
  }
}
