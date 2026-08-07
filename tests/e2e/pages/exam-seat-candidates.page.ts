import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object — seat candidates + seat management (bulk assign).
 * Routes:
 *   /#/admin/exam-management/:examId/seats/candidates
 *   /#/admin/exam-management/:examId/seats
 */
export class ExamSeatCandidatesPage {
  readonly page: Page;
  readonly seatTable: Locator;
  readonly confirmSeatBtn: Locator;
  readonly placementDialog: Locator;
  readonly issueVoucherBtn: Locator;
  readonly issueTicketDialog: Locator;
  readonly viewVoucherDialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.seatTable = page.locator('.seat-candidates-table');
    this.confirmSeatBtn = page.locator('.btn-confirm-seat');
    this.placementDialog = page.locator('.q-dialog').filter({
      hasText: /Rearrange|จัดที่นั่ง|placement|ยืนยันการจัดที่นั่ง|Keep existing/i,
    });
    this.issueVoucherBtn = page.getByRole('button', {
      name: /Issue Test Voucher|สร้างบัตรประจำตัวผู้เข้าสอบ|ออกใบเข้าสอบ/i,
    });
    this.issueTicketDialog = page.locator('.issue-ticket-dialog-card');
    this.viewVoucherDialog = page.locator('.view-voucher-dialog-card');
  }

  async gotoCandidates(examId: number, sessionId?: number): Promise<void> {
    const qs = sessionId != null ? `?sessionId=${sessionId}` : '';
    await this.page.goto(
      `/#/admin/exam-management/${examId}/seats/candidates${qs}`,
    );
    await expect(this.page).toHaveURL(
      new RegExp(`#/admin/exam-management/${examId}/seats/candidates`),
    );
    await expect(
      this.page
        .getByText(/Seat Candidates|จัดการที่นั่งสอบ|รายชื่อและที่นั่ง|Manage Exam Seats/i)
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  }

  async gotoSeatManagement(
    examId: number,
    sessionId?: number,
    sessionLocationId?: number,
  ): Promise<void> {
    const params = new URLSearchParams();
    if (sessionId != null) params.set('sessionId', String(sessionId));
    if (sessionLocationId != null) {
      params.set('sessionLocationId', String(sessionLocationId));
    }
    const qs = params.toString() ? `?${params.toString()}` : '';
    await this.page.goto(`/#/admin/exam-management/${examId}/seats${qs}`);
    await expect(this.page).toHaveURL(
      new RegExp(`#/admin/exam-management/${examId}/seats(?!/)`),
    );
    await expect(
      this.page.getByText(/Manage Exam Seats|จัดการที่นั่งสอบ/i).first(),
    ).toBeVisible({ timeout: 20_000 });
  }

  async clickEditSeats(): Promise<void> {
    await this.page
      .getByRole('button', {
        name: /Edit Seat Assignments|แก้ไขที่นั่งสอบ|แก้ไขที่นั่ง|Edit Seats/i,
      })
      .click({ timeout: 15_000 });
    await expect(this.page).toHaveURL(/\/seats(?!\/candidates)/, {
      timeout: 15_000,
    });
  }

  async dismissPlacementChoiceIfOpen(): Promise<void> {
    const dialog = this.page.locator('.q-dialog:visible');
    if (!(await dialog.isVisible().catch(() => false))) return;
    const rearrange = dialog.getByRole('button', {
      name: /Rearrange|จัดที่นั่งใหม่|rearrange/i,
    });
    if (await rearrange.isVisible().catch(() => false)) {
      await rearrange.click();
    }
  }

  async waitForStudentsLoaded(): Promise<void> {
    await expect(
      this.page.locator('.student-list, .seat-management-map-column').first(),
    ).toBeVisible({ timeout: 30_000 });
    await expect(this.confirmSeatBtn).toBeVisible({ timeout: 20_000 });
  }

  async tryEnableConfirmViaRearrange(): Promise<void> {
    const rearrange = this.page.getByRole('button', {
      name: /Rearrange all|จัดที่นั่งใหม่|Rearrange/i,
    });
    if (await rearrange.isVisible().catch(() => false)) {
      await rearrange.click();
      await this.page.waitForTimeout(300);
    }
  }

  async confirmSeatAssignment(): Promise<boolean> {
    await this.dismissPlacementChoiceIfOpen();
    await this.waitForStudentsLoaded();
    await this.tryEnableConfirmViaRearrange();

    const enabled = await this.confirmSeatBtn.isEnabled().catch(() => false);
    if (!enabled) {
      return false;
    }

    const savePromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('/api/exam-enrollments/bulk-seat-assignments') &&
        res.request().method() === 'PATCH',
      { timeout: 45_000 },
    );
    await this.confirmSeatBtn.click();
    const res = await savePromise;
    expect(res.ok(), await res.text()).toBeTruthy();
    return true;
  }

  async expectCandidateSeatLabels(labels: string[]): Promise<void> {
    for (const label of labels) {
      await expect(this.seatTable.getByText(label, { exact: true }).first()).toBeVisible({
        timeout: 20_000,
      });
    }
  }

  async expectSuccessNotification(): Promise<void> {
    const notify = this.page.locator('.q-notification');
    await expect(notify).toBeVisible({ timeout: 20_000 });
    await expect(notify).toContainText(
      /success|สำเร็จ|seat|ที่นั่ง|assigned|บันทึก/i,
    );
  }

  async openIssueTicketDialog(): Promise<void> {
    await expect(this.issueVoucherBtn).toBeEnabled({ timeout: 30_000 });
    await this.issueVoucherBtn.click();
    await expect(this.issueTicketDialog).toBeVisible({ timeout: 20_000 });
    await expect(
      this.issueTicketDialog.locator('.voucher-preview-section'),
    ).toBeVisible({ timeout: 20_000 });
  }

  async confirmIssueTicket(): Promise<void> {
    const bulkPromise = this.page.waitForResponse(
      (res) =>
        res.url().includes('/api/exam-vouchers/bulk-issue') &&
        res.request().method() === 'POST',
      { timeout: 60_000 },
    );
    await this.issueTicketDialog
      .getByRole('button', {
        name: /Confirm Voucher Issuance|ยืนยันการออกใบเข้าสอบ|ยืนยัน/i,
      })
      .click();
    const res = await bulkPromise;
    expect(res.ok(), await res.text()).toBeTruthy();
  }

  async expectIssueSuccessNotification(): Promise<void> {
    const notify = this.page.locator('.q-notification');
    await expect(notify).toBeVisible({ timeout: 30_000 });
    await expect(notify).toContainText(
      /สำเร็จ|success|ออกบัตร|voucher|email|ผู้เข้าสอบ/i,
    );
  }

  async expectIssueDialogClosed(): Promise<void> {
    await expect(this.issueTicketDialog).toBeHidden({ timeout: 30_000 });
  }

  async openViewVoucherForFirstRow(): Promise<void> {
    const toolsCell = this.seatTable
      .locator('tbody tr')
      .first()
      .locator('td')
      .last();
    await expect(toolsCell.locator('button, .q-btn').first()).toBeVisible({
      timeout: 30_000,
    });
    await toolsCell.locator('button, .q-btn').first().click();
    await expect(this.viewVoucherDialog).toBeVisible({ timeout: 20_000 });
  }

  async expectViewVoucherShows(opts: {
    seatLabel: string;
    /** Prefer test-taker ID — front of voucher does not render VC_CODE. */
    testTakerId?: string;
  }): Promise<void> {
    await expect(this.viewVoucherDialog).toBeVisible({ timeout: 20_000 });
    await expect(this.viewVoucherDialog).toContainText(opts.seatLabel, {
      timeout: 15_000,
    });
    if (opts.testTakerId) {
      await expect(this.viewVoucherDialog).toContainText(opts.testTakerId, {
        timeout: 15_000,
      });
    }
  }

  async switchVoucherPreviewSide(side: 'front' | 'back'): Promise<void> {
    const dialog = this.page
      .locator('.issue-ticket-dialog-card, .view-voucher-dialog-card')
      .first();
    const label =
      side === 'front'
        ? /Front Side|ด้านหน้า/i
        : /Back Side|ด้านหลัง/i;
    await dialog.getByRole('tab', { name: label }).click();
  }

  async expectIssuePreviewRegulations(en: string, th: string): Promise<void> {
    await this.switchVoucherPreviewSide('back');
    const preview = this.issueTicketDialog.locator('.voucher-preview');
    await expect(preview).toContainText(en, { timeout: 15_000 });
    await expect(preview).toContainText(th, { timeout: 15_000 });
  }
}
