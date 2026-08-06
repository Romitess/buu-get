import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object — /#/admin/exam-management/:examId/registrants/:ermId/history
 */
export class ExamRegistrantHistoryPage {
  readonly page: Page;
  readonly pageRoot: Locator;
  readonly historyContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageRoot = page.locator('.history-page');
    this.historyContent = page.locator('.history-content');
  }

  /**
   * Navigate to registrant profile edit history.
   * Returns false if redirected away (BUG-008-style) or page never loads.
   */
  async goto(examId: number, ermId: number): Promise<boolean> {
    const target = `/#/admin/exam-management/${examId}/registrants/${ermId}/history`;
    await this.page.goto(target);
    try {
      await this.page.waitForURL(
        (url) =>
          url.hash.includes(`/exam-management/${examId}/registrants/${ermId}/history`),
        { timeout: 20_000 },
      );
      await expect(
        this.page.getByText(
          /Candidate Profile Edit History|ประวัติการแก้ไขข้อมูลผู้สมัครสอบ/i,
        ).first(),
      ).toBeVisible({ timeout: 20_000 });
      return true;
    } catch {
      return false;
    }
  }

  async expectHistoryRows(minRows = 1): Promise<void> {
    await expect(this.historyContent).toBeVisible({ timeout: 20_000 });
    const rows = this.historyContent.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 20_000 });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(minRows);
  }

  async expectModifiedFieldsContain(snippet: string | RegExp): Promise<void> {
    await expect(this.historyContent).toContainText(snippet, { timeout: 15_000 });
  }
}
