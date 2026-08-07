import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object — /#/admin/exam-management/:examId/attendance
 * Admin check-in dialog → ATTENDED.
 */
export class ExamAttendancePage {
  readonly page: Page;
  readonly table: Locator;
  readonly checkInDialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.locator('.attendance-table');
    this.checkInDialog = page.locator('.checkin-dialog-card');
  }

  async goto(examId: number, sessionId?: number): Promise<void> {
    const qs = sessionId != null ? `?sessionId=${sessionId}` : '';
    await this.page.goto(
      `/#/admin/exam-management/${examId}/attendance${qs}`,
    );
    await expect(this.page).toHaveURL(
      new RegExp(`#/admin/exam-management/${examId}/attendance`),
    );
    await expect(
      this.page
        .getByText(/Attendance|เช็กอิน|เข้าสอบ|Exam Attendance/i)
        .first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(this.table).toBeVisible({ timeout: 20_000 });
  }

  async openCheckInDialog(): Promise<void> {
    await this.page
      .getByRole('button', { name: /เช็กอินเข้าห้องสอบ|Check.?in/i })
      .click();
    await expect(this.checkInDialog).toBeVisible({ timeout: 15_000 });
  }

  async searchCandidate(idOrCode: string): Promise<void> {
    await expect(this.checkInDialog).toBeVisible();
    const input = this.checkInDialog.locator('input').first();
    await input.click();
    // Dialog captures keydown by event.code (scan-friendly). Prefer pressSequentially.
    await input.fill('');
    await input.pressSequentially(idOrCode, { delay: 20 });
    await this.checkInDialog
      .getByRole('button', { name: /^ค้นหา$|^Search$/i })
      .click();
    // Wait until confirm enables (candidate resolved) or notify appears
    await expect(this.checkInDialog.locator('.checkin-confirm-btn')).toBeEnabled({
      timeout: 10_000,
    });
  }

  async confirmCheckIn(): Promise<void> {
    const confirmBtn = this.checkInDialog.locator('.checkin-confirm-btn');
    await expect(confirmBtn).toBeEnabled({ timeout: 15_000 });

    const checkInPromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('/check-in') &&
        res.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await confirmBtn.click();
    const res = await checkInPromise;
    expect(res.ok(), await res.text()).toBeTruthy();
  }

  async checkInByNationalId(nationalId: string): Promise<void> {
    await this.openCheckInDialog();
    try {
      await this.searchCandidate(nationalId);
    } catch {
      // Fallback: set Vue-friendly value via input event if scan capture blocks fill
      const input = this.checkInDialog.locator('input').first();
      await input.evaluate((el, value) => {
        const inputEl = el as HTMLInputElement;
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )?.set;
        setter?.call(inputEl, value);
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      }, nationalId);
      await this.checkInDialog
        .getByRole('button', { name: /^ค้นหา$|^Search$/i })
        .click();
      await expect(this.checkInDialog.locator('.checkin-confirm-btn')).toBeEnabled({
        timeout: 10_000,
      });
    }
    await this.confirmCheckIn();
  }

  rowForNationalId(nationalId: string): Locator {
    return this.table.locator('tr, .q-tr').filter({ hasText: nationalId });
  }

  async expectAttendedInTable(nationalId: string): Promise<void> {
    const row = this.rowForNationalId(nationalId);
    await expect(row).toBeVisible({ timeout: 20_000 });
    await expect(row).toContainText(/เข้าสอบแล้ว|Attended|Checked.?in|INTIME/i);
  }
}
