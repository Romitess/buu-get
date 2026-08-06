import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object — /#/admin/score-rubric-management
 */
export class ScoreRubricManagementPage {
  readonly page: Page;
  readonly pageShell: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageShell = page
      .locator('.score-rubric-management-page, .page-container')
      .first();
    this.createButton = page.locator('.create-rubric-btn');
    this.searchInput = page.locator('.search-bar input').first();
    this.dialog = page.locator('.rubric-dialog-card');
  }

  async goto(): Promise<void> {
    const listPromise = this.page
      .waitForResponse(
        (res) =>
          res.url().includes('/api/score-rubrics') &&
          res.request().method() === 'GET' &&
          res.ok(),
        { timeout: 30_000 },
      )
      .catch(() => null);
    await this.page.goto('/#/admin/score-rubric-management');
    await expect(this.page).toHaveURL(/#\/admin\/score-rubric-management/);
    await expect(this.pageShell).toBeVisible({ timeout: 20_000 });
    await expect(this.page.locator('.page-header').first()).toContainText(
      /จัดการชุดเกณฑ์คะแนน|Manage Score Rubrics/i,
      { timeout: 20_000 },
    );
    await listPromise;
    await expect(this.page.locator('.q-inner-loading')).toHaveCount(0, {
      timeout: 20_000,
    });
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(400);
  }

  rowContaining(text: string | RegExp): Locator {
    return this.page.locator('tbody tr').filter({ hasText: text }).first();
  }

  async expectRowContaining(text: string | RegExp): Promise<Locator> {
    const row = this.rowContaining(text);
    await expect(row).toBeVisible({ timeout: 20_000 });
    return row;
  }

  async openCreateDialog(): Promise<void> {
    await this.createButton.click();
    await expect(this.dialog).toBeVisible({ timeout: 10_000 });
    await expect(this.dialog).toContainText(
      /สร้างชุดเกณฑ์คะแนน|Create Score Rubric/i,
    );
  }

  async openEditFor(name: string | RegExp): Promise<void> {
    const row = await this.expectRowContaining(name);
    // First ActionButton is edit (edit icon before delete)
    await row.locator('button').first().click();
    await expect(this.dialog).toBeVisible({ timeout: 10_000 });
    await expect(this.dialog).toContainText(
      /แก้ไขชุดเกณฑ์คะแนน|Edit Score Rubric/i,
    );
  }

  async fillRubricForm(opts: {
    nameTh: string;
    nameEn: string;
    itemNameTh?: string;
    itemNameEn?: string;
    maxScore?: number;
  }): Promise<void> {
    await expect(this.dialog).toBeVisible();
    const inputs = this.dialog.locator('.dialog-body .q-field input');
    // Order: nameTh, nameEn, then per item: nameTh, nameEn, maxScore, sortOrder
    await inputs.nth(0).fill(opts.nameTh);
    await inputs.nth(1).fill(opts.nameEn);
    if (opts.itemNameTh) {
      await inputs.nth(2).fill(opts.itemNameTh);
    }
    if (opts.itemNameEn) {
      await inputs.nth(3).fill(opts.itemNameEn);
    }
    if (opts.maxScore !== undefined) {
      await inputs.nth(4).fill(String(opts.maxScore));
    }
  }

  async bumpFirstItemMaxScore(delta = 1): Promise<number> {
    const inputs = this.dialog.locator('.dialog-body .q-field input');
    // First item maxScore is index 4 (after 2 names + item nameTh/nameEn)
    const max = inputs.nth(4);
    const current = Number(await max.inputValue()) || 50;
    const next = current + delta;
    await max.fill(String(next));
    return next;
  }

  async save(expectOk = true): Promise<number | null> {
    const mutatePromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('/api/score-rubrics') &&
        ['POST', 'PATCH'].includes(res.request().method()),
      { timeout: 30_000 },
    );
    await this.dialog.locator('.action-btn').filter({ hasText: /บันทึก|Save/i }).last().click();
    const res = await mutatePromise;
    if (expectOk) {
      expect(res.ok(), await res.text()).toBeTruthy();
      await expect(
        this.page.getByRole('alert').filter({
          hasText: /บันทึกชุดเกณฑ์คะแนนสำเร็จ|saved|success|สำเร็จ/i,
        }),
      ).toBeVisible({ timeout: 20_000 });
    }
    return res.status();
  }

  async expectSaveErrorNotification(): Promise<void> {
    await expect(
      this.page.getByRole('alert').filter({
        hasText:
          /บันทึกชุดเกณฑ์คะแนนไม่สำเร็จ|saveError|ไม่สำเร็จ|error|failed|conflict/i,
      }),
    ).toBeVisible({ timeout: 20_000 });
  }
}
