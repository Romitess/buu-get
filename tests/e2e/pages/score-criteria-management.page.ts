import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object — /#/admin/score-criteria-management
 * CEFR / band rules editor.
 */
export class ScoreCriteriaManagementPage {
  readonly page: Page;
  readonly pageShell: Locator;
  readonly bandRulesList: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageShell = page
      .locator('.score-criteria-management-page, .page-container')
      .first();
    this.bandRulesList = page.locator('.band-rules-list');
    this.saveButton = page
      .locator('.action-bar')
      .getByRole('button', { name: /บันทึกข้อมูล|Save Changes|Save/i });
    this.cancelButton = page
      .locator('.action-bar')
      .getByRole('button', { name: /ยกเลิก|Cancel/i });
  }

  async goto(): Promise<void> {
    const loadPromise = this.page
      .waitForResponse(
        (res) =>
          res.url().includes('/api/score-criteria/band-rules') &&
          res.request().method() === 'GET',
        { timeout: 30_000 },
      )
      .catch(() => null);
    await this.page.goto('/#/admin/score-criteria-management');
    await expect(this.page).toHaveURL(/#\/admin\/score-criteria-management/);
    await expect(this.pageShell).toBeVisible({ timeout: 20_000 });
    await expect(this.page.locator('.page-header').first()).toContainText(
      /จัดการ Band|Manage Band|Certificate/i,
      { timeout: 20_000 },
    );
    await loadPromise;
  }

  ruleRow(index: number): Locator {
    return this.bandRulesList.locator('.rule-row').nth(index);
  }

  async expectAtLeastOneRule(): Promise<void> {
    await expect(this.bandRulesList.locator('.rule-row').first()).toBeVisible({
      timeout: 15_000,
    });
  }

  async setCefrAt(index: number, cefr: string): Promise<void> {
    const row = this.ruleRow(index);
    await expect(row).toBeVisible({ timeout: 10_000 });
    // Inputs: band, minScore, maxScore, cefr, descriptor
    const cefrInput = row.locator('.q-field input').nth(3);
    await cefrInput.fill(cefr);
  }

  async getCefrAt(index: number): Promise<string> {
    const row = this.ruleRow(index);
    const cefrInput = row.locator('.q-field input').nth(3);
    return (await cefrInput.inputValue()).trim();
  }

  async save(): Promise<void> {
    const putPromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('/api/score-criteria/band-rules') &&
        res.request().method() === 'PUT',
      { timeout: 30_000 },
    );
    await this.saveButton.click();
    const res = await putPromise;
    expect(res.ok(), await res.text()).toBeTruthy();
    await expect(
      this.page
        .getByRole('alert')
        .filter({ hasText: /บันทึก|Successfully saved|success|สำเร็จ/i }),
    ).toBeVisible({ timeout: 20_000 });
  }
}
