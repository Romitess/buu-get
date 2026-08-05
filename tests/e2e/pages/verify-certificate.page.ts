import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object — public certificate verification UI
 * (/verify form → /verify/certificate/:code result)
 */
export class VerifyCertificatePage {
  readonly page: Page;
  readonly heroTitle: Locator;
  readonly verificationCodeInput: Locator;
  readonly submitButton: Locator;
  readonly statusBadge: Locator;
  readonly codeValue: Locator;
  readonly notFoundTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroTitle = page.locator('h1.verify-title');
    // Prefer native text field — not the q-select combobox
    this.verificationCodeInput = page.locator(
      '.verify-form-card .q-field:not(.q-select) input',
    );
    this.submitButton = page.locator('.verify-form-card button[type="submit"]');
    this.statusBadge = page.locator('.verify-status-badge');
    this.codeValue = page.locator('.verify-code-row .field-value.mono');
    this.notFoundTitle = page.getByText(
      /Document not found|ไม่พบเอกสาร/i,
    );
  }

  async gotoManualForm(): Promise<void> {
    await this.page.goto('/#/verify');
    await expect(this.heroTitle).toBeVisible({ timeout: 15_000 });
  }

  async gotoResult(code: string): Promise<void> {
    await this.page.goto(
      `/#/verify/certificate/${encodeURIComponent(code)}`,
    );
  }

  /**
   * On /verify: ensure certificate type is selected, enter code, submit.
   */
  async submitCertificateCode(code: string): Promise<void> {
    // Default is certificate; re-select for clarity across locales
    const typeSelect = this.page.locator('.verify-form-card .q-select').first();
    await typeSelect.click();
    await this.page
      .locator('.q-menu .q-item')
      .filter({ hasText: /Score certificate|ใบรับรองผลสอบ/i })
      .first()
      .click();

    await this.verificationCodeInput.fill(code);
    await this.submitButton.click();
    await this.page.waitForURL(
      (url) => url.hash.includes('/verify/certificate/'),
      { timeout: 15_000 },
    );
  }

  async expectValidResult(code: string): Promise<void> {
    await expect(this.heroTitle).toContainText(
      /Score Certificate|ใบรับรองผลสอบ|Certificate/i,
    );
    await expect(this.statusBadge).toBeVisible({ timeout: 20_000 });
    await expect(this.statusBadge).toContainText(
      /Valid document|เอกสารถูกต้อง|Certificate expired|ใบรับรองหมดอายุ/i,
    );
    await expect(this.codeValue).toHaveText(code);
  }
}
