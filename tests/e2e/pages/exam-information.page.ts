import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object — /#/admin/exam-information/:year and candidates drill-down
 */
export class ExamInformationPage {
  readonly page: Page;
  readonly pageShell: Locator;
  readonly roundsTable: Locator;
  readonly candidatesTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageShell = page
      .locator(
        '.exam-information-page, .exam-candidates-info-page, .page-container',
      )
      .first();
    this.roundsTable = page.locator('.exam-information-table').first();
    this.candidatesTable = page.locator('.exam-candidates-info-table').first();
  }

  async waitForRoundsLoaded(year: number): Promise<void> {
    await expect(this.page).toHaveURL(
      new RegExp(`#/admin/exam-information/${year}`),
      { timeout: 20_000 },
    );
    await expect(this.pageShell).toBeVisible({ timeout: 20_000 });
    await expect(this.roundsTable).toBeVisible({ timeout: 30_000 });
    await expect(this.page.locator('.q-inner-loading')).toHaveCount(0, {
      timeout: 30_000,
    });
  }

  async openFirstRoundCandidates(year: number): Promise<void> {
    const row = this.roundsTable.locator('tbody tr').first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    const detailBtn = row.locator('button, .q-btn').first();
    await expect(detailBtn).toBeEnabled({ timeout: 10_000 });
    await detailBtn.click();
    await expect(this.page).toHaveURL(
      new RegExp(`#/admin/exam-information/${year}/candidates`),
      { timeout: 20_000 },
    );
    await expect(this.candidatesTable).toBeVisible({ timeout: 30_000 });
    await expect(this.page.locator('.q-inner-loading')).toHaveCount(0, {
      timeout: 30_000,
    });
  }

  async expectCandidateRowsWithScores(): Promise<void> {
    const rows = this.candidatesTable.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 20_000 });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    // Score cells should show a numeric total (not only dashes)
    const bodyText = await this.candidatesTable.innerText();
    expect(bodyText).toMatch(/\d/);
  }
}
