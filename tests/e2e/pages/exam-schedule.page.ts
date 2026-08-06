import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object — /#/user/exam-schedule
 * Candidate exam registration (regular + special passcode).
 */
export class ExamSchedulePage {
  readonly page: Page;
  readonly confirmDialog: Locator;
  readonly passcodeDialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.confirmDialog = page.locator('.dialog-confirm-card');
    this.passcodeDialog = page.locator('.passcode-card');
  }

  async goto(examDate?: string): Promise<void> {
    const qs = examDate ? `?date=${encodeURIComponent(examDate)}` : '';
    await this.page.goto(`/#/user/exam-schedule${qs}`);
    await expect(this.page).toHaveURL(/#\/user\/exam-schedule/);
    await expect(
      this.page
        .getByText(
          /Exam Registration|การสมัครสอบ|Complete your exam registration|ดำเนินการสมัครสอบ/i,
        )
        .first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      this.page
        .locator(
          '.round-exam, .exam-schedule__rounds-empty, .exam-schedule__rounds-list, .exam-schedule__content',
        )
        .first(),
    ).toBeVisible({ timeout: 30_000 });

    if (examDate) {
      await this.selectExamDate(examDate);
    }
  }

  /**
   * Ensure calendar lands on YYYY-MM-DD. Query param is best-effort;
   * click the day cell when still on the wrong month/day.
   */
  async selectExamDate(examDate: string): Promise<void> {
    const dayBtn = this.page.getByRole('button', {
      name: new RegExp(`Select date ${examDate}`, 'i'),
    });
    if (await dayBtn.isVisible().catch(() => false)) {
      await dayBtn.click();
      return;
    }

    for (let i = 0; i < 14; i++) {
      if (await dayBtn.isVisible().catch(() => false)) {
        await dayBtn.click();
        return;
      }
      const navNext = this.page
        .locator('button')
        .filter({
          has: this.page
            .locator('.q-icon')
            .filter({ hasText: /chevron_right|arrow_forward/ }),
        })
        .first();
      if (await navNext.isVisible().catch(() => false)) {
        await navNext.click();
        await this.page.waitForTimeout(200);
        continue;
      }
      // Fallback re-goto with query
      await this.page.goto(
        `/#/user/exam-schedule?date=${encodeURIComponent(examDate)}`,
      );
      await this.page.waitForTimeout(500);
      if (await dayBtn.isVisible().catch(() => false)) {
        await dayBtn.click();
      }
      return;
    }
  }

  roundCardForExam(examTitle: string): Locator {
    return this.page.locator('.round-exam').filter({ hasText: examTitle });
  }

  async expectRoundVisible(examTitle: string): Promise<Locator> {
    const card = this.roundCardForExam(examTitle).first();
    await expect(card).toBeVisible({ timeout: 30_000 });
    return card;
  }

  async clickRegister(examTitle: string): Promise<void> {
    const card = await this.expectRoundVisible(examTitle);
    await card
      .getByRole('button', { name: /Register|ลงทะเบียนสอบ/i })
      .click();
  }

  /** Convenience step (accessibility) → confirm step */
  async completeConfirmDialog(): Promise<void> {
    await expect(this.confirmDialog).toBeVisible({ timeout: 15_000 });
    const nextBtn = this.confirmDialog.getByRole('button', {
      name: /Next|ถัดไป/i,
    });
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
    }
    await this.confirmDialog
      .getByRole('button', {
        name: /Confirm Registration|Confirm|ยืนยันการสมัคร|ยืนยัน/i,
      })
      .click();
  }

  async enterPasscode(passcode: string): Promise<void> {
    await expect(this.passcodeDialog).toBeVisible({ timeout: 15_000 });
    await this.passcodeDialog.locator('.passcode-input input').fill(passcode);
    await this.passcodeDialog
      .getByRole('button', { name: /Confirm|ยืนยัน/i })
      .click();
  }

  async registerRegular(examTitle: string): Promise<void> {
    await this.clickRegister(examTitle);
    await this.completeConfirmDialog();
  }

  async registerSpecialWithPasscode(
    examTitle: string,
    passcode: string,
  ): Promise<void> {
    await this.clickRegister(examTitle);
    await this.enterPasscode(passcode);
    await this.completeConfirmDialog();
  }

  async expectRedirectToHistory(): Promise<void> {
    await expect(this.page).toHaveURL(/#\/user\/exam-history/, {
      timeout: 30_000,
    });
  }
}
