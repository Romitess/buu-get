import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';

/**
 * Page Object — /#/admin/exam-management/:examId/scores
 * Score import / save / bulk certificate issue.
 */
export class ExamScoresPage {
  readonly page: Page;
  readonly pageShell: Locator;
  readonly importButton: Locator;
  readonly saveButton: Locator;
  readonly issueCertificateButton: Locator;
  readonly scoresTable: Locator;
  readonly importDialog: Locator;
  readonly uploadDialog: Locator;
  readonly certificateDialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageShell = page.locator('.scores-page, .page-container').first();
    this.importButton = page.getByRole('button', { name: /^IMPORT$/i });
    this.saveButton = page.locator('.save-score-btn');
    this.issueCertificateButton = page.getByRole('button', {
      name: /ออกใบ Certificate|Issue Certificate/i,
    });
    this.scoresTable = page.locator('.scores-table, table').first();
    this.importDialog = page.locator('.import-dialog-card');
    this.uploadDialog = page.locator('.dialog-csv-card');
    this.certificateDialog = page.locator('.certificate-dialog-card');
  }

  async goto(examId: number): Promise<boolean> {
    const loadPromise = this.page
      .waitForResponse(
        (res) =>
          res.url().includes(`/api/exam/${examId}`) &&
          res.request().method() === 'GET' &&
          res.ok(),
        { timeout: 45_000 },
      )
      .catch(() => null);

    await this.page.goto(`/#/admin/exam-management/${examId}/scores`);

    const stayed = await this.page
      .waitForURL(new RegExp(`#/admin/exam-management/${examId}/scores`), {
        timeout: 10_000,
      })
      .then(() => true)
      .catch(() => false);

    if (!stayed) return false;

    await loadPromise;
    await expect(this.pageShell).toBeVisible({ timeout: 20_000 });
    await expect(this.page.locator('.page-header').first()).toContainText(
      /จัดการคะแนนสอบ|Manage Test Scores|Score/i,
      { timeout: 20_000 },
    );
    await this.page
      .locator('.q-inner-loading')
      .first()
      .waitFor({ state: 'hidden', timeout: 60_000 })
      .catch(() => undefined);
    // Wait for enrollments list (scores pagination can be slow on shared DB)
    await this.page
      .waitForResponse(
        (res) =>
          res.url().includes(`/api/exam-enrollments/exam/${examId}`) &&
          res.request().method() === 'GET',
        { timeout: 90_000 },
      )
      .catch(() => null);
    await this.page.waitForTimeout(500);
    return true;
  }

  async expectCandidateVisible(text: string | RegExp): Promise<boolean> {
    const ok = await this.scoresTable
      .getByText(text)
      .first()
      .waitFor({ state: 'visible', timeout: 45_000 })
      .then(() => true)
      .catch(() => false);
    return ok;
  }

  async openCsvImport(): Promise<void> {
    await expect(this.importButton).toBeVisible({ timeout: 20_000 });
    await this.importButton.click();
    await expect(this.importDialog).toBeVisible({ timeout: 10_000 });
    await this.importDialog
      .locator('.import-option-card')
      .filter({ hasText: /CSV|csv/i })
      .first()
      .click();
    await expect(this.uploadDialog).toBeVisible({ timeout: 10_000 });
  }

  async uploadScoreCsv(csvContent: string, fileName = 'scores.csv'): Promise<void> {
    const tmp = path.join(os.tmpdir(), `buu-get-${Date.now()}-${fileName}`);
    fs.writeFileSync(tmp, csvContent, 'utf8');
    try {
      const fileInput = this.uploadDialog.locator('input[type="file"]');
      await fileInput.setInputFiles(tmp);
    } finally {
      fs.unlinkSync(tmp);
    }
    await expect(
      this.page.getByRole('alert').filter({
        hasText: /นำเข้าคะแนนสำเร็จ|ไม่พบข้อมูลผู้สมัคร|import|สำเร็จ|warning/i,
      }),
    ).toBeVisible({ timeout: 20_000 });
    // Fail clearly if import matched nobody
    const warn = this.page.getByRole('alert').filter({
      hasText: /ไม่พบข้อมูลผู้สมัคร/i,
    });
    if (await warn.isVisible().catch(() => false)) {
      throw new Error('Score CSV import matched 0 enrollments in current session');
    }
  }

  async confirmSaveScores(): Promise<void> {
    await expect(this.saveButton).toBeEnabled({ timeout: 15_000 });
    await this.saveButton.click();
    const confirm = this.page.locator('.q-dialog').filter({
      hasText: /ยืนยันการบันทึก|Confirm/i,
    });
    await expect(confirm).toBeVisible({ timeout: 10_000 });
    await confirm.getByRole('button', { name: /ยืนยัน|Confirm/i }).click();
    await expect(
      this.page.getByRole('alert').filter({ hasText: /บันทึกคะแนนสำเร็จ|saved/i }),
    ).toBeVisible({ timeout: 30_000 });
  }

  async expectBandVisible(bandOrCefr: string | RegExp): Promise<void> {
    await expect(this.scoresTable).toContainText(bandOrCefr, {
      timeout: 20_000,
    });
  }

  async expectTotalVisible(total: string | RegExp): Promise<void> {
    await expect(this.scoresTable).toContainText(total, { timeout: 20_000 });
  }

  async openIssueCertificateDialog(): Promise<void> {
    await expect(this.issueCertificateButton).toBeVisible({ timeout: 20_000 });
    await this.issueCertificateButton.click();
    await expect(this.certificateDialog).toBeVisible({ timeout: 15_000 });
  }

  async confirmIssueCertificates(): Promise<void> {
    const confirmBtn = this.certificateDialog.getByRole('button', {
      name: /ยืนยันการออกใบคะแนน|Confirm/i,
    });
    await expect(confirmBtn).toBeVisible({ timeout: 10_000 });
    const bulkPromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('exam-certificates') &&
        res.url().includes('bulk-issue') &&
        res.request().method() === 'POST',
      { timeout: 60_000 },
    );
    await confirmBtn.click();
    const bulkRes = await bulkPromise;
    expect([200, 201].includes(bulkRes.status()), await bulkRes.text()).toBe(
      true,
    );
    await expect(
      this.page
        .getByRole('alert')
        .filter({ hasText: /ออกใบ Certificate/i })
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  }
}
