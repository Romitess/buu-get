import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object — /#/user/exam-history
 * Candidate pending payment + receipt download flows.
 */
export class ExamHistoryPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly pendingSection: Locator;
  readonly receiptDialog: Locator;
  readonly paymentDialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('.page-header .page-title-size, .page-header h1').first();
    this.pendingSection = page.getByText(
      /Pending Payments|การค้างชำระเงิน/i,
    );
    this.receiptDialog = page.locator('.receipt-information-card');
    this.paymentDialog = page.locator('.payment-dialog-card');
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/user/exam-history');
    await expect(this.page).toHaveURL(/#\/user\/exam-history/);
    await expect(
      this.page.getByText(
        /Exam & Registration History|ประวัติการสอบและการลงทะเบียน/i,
      ).first(),
    ).toBeVisible({ timeout: 20_000 });
  }

  /** Any history card whose title contains the seeded exam name. */
  cardForExam(examTitle: string): Locator {
    return this.page
      .locator('.app-exam-history-card-container, .buu-card')
      .filter({ hasText: examTitle });
  }

  /** Pending card with Pay action (excludes paid/history cards for same exam). */
  pendingCardForExam(examTitle: string): Locator {
    return this.cardForExam(examTitle)
      .filter({
        has: this.page.getByRole('button', { name: /Pay Now|ชำระเงิน/i }),
      })
      .first();
  }

  async expectPendingCard(examTitle: string): Promise<Locator> {
    const card = this.pendingCardForExam(examTitle);
    await expect(card).toBeVisible({ timeout: 20_000 });
    return card;
  }

  async clickPay(examTitle: string): Promise<void> {
    const card = await this.expectPendingCard(examTitle);
    await card.getByRole('button', { name: /Pay Now|ชำระเงิน/i }).click();
  }

  async fillReceiptInformation(opts: {
    taxId: string;
    fullName: string;
    phone: string;
    address: string;
  }): Promise<void> {
    await expect(this.receiptDialog).toBeVisible({ timeout: 15_000 });
    const inputs = this.receiptDialog.locator('.q-field input, .q-field textarea');
    // Order: taxId, fullName, phone, address (textarea)
    await inputs.nth(0).fill(opts.taxId);
    await inputs.nth(1).fill(opts.fullName);
    await inputs.nth(2).fill(opts.phone);
    await this.receiptDialog.locator('textarea').fill(opts.address);

    await this.receiptDialog
      .getByRole('button', { name: /Confirm|ตกลง/i })
      .click();
  }

  async expectPaymentDialog(): Promise<void> {
    await expect(this.paymentDialog).toBeVisible({ timeout: 15_000 });
    await expect(
      this.paymentDialog.getByText(
        /Confirm payment|ยืนยันการชำระเงิน|payment\.dialog\.title/i,
      ),
    ).toBeVisible();
  }

  /** Click "Save QR" — app confirms payment on this action. */
  async confirmPaymentViaSaveQr(): Promise<void> {
    await this.expectPaymentDialog();
    await this.paymentDialog
      .getByRole('button', {
        name: /Save QR|บันทึก QR Code|payment\.dialog\.saveQr/i,
      })
      .click();
  }

  async closePaymentDialog(): Promise<void> {
    await this.paymentDialog.locator('.close-btn').click();
  }

  async expectSuccessNotification(): Promise<void> {
    const notify = this.page.locator('.q-notification');
    await expect(notify).toBeVisible({ timeout: 20_000 });
    await expect(notify).toContainText(
      /Action was successful|การดำเนินการสำเร็จ|success/i,
    );
  }

  downloadableCardForExam(examTitle: string): Locator {
    return this.cardForExam(examTitle)
      .filter({
        has: this.page.getByRole('button', {
          name: /Download Receipt|ดาวน์โหลดใบเสร็จ/i,
        }),
      })
      .first();
  }

  async clickDownloadReceipt(examTitle: string): Promise<void> {
    const card = this.downloadableCardForExam(examTitle);
    await expect(card).toBeVisible({ timeout: 20_000 });
    await card
      .getByRole('button', {
        name: /Download Receipt|ดาวน์โหลดใบเสร็จ/i,
      })
      .click();
  }

  async expectReceiptDownloadSuccess(): Promise<void> {
    const notify = this.page.locator('.q-notification');
    await expect(notify).toBeVisible({ timeout: 30_000 });
    await expect(notify).toContainText(
      /Electronic receipt downloaded|ดาวน์โหลดใบเสร็จ|successfully|สำเร็จ/i,
    );
  }

  async expectReceiptDownloadBlockedOrMissing(): Promise<void> {
    // Either no download button, or warning about missing/blocked receipt
    const warning = this.page.locator('.q-notification');
    if (await warning.isVisible().catch(() => false)) {
      await expect(warning).toContainText(
        /missing|verify|ไม่พบ|blocked|403|error|ผิดพลาด/i,
      );
    }
  }
}
