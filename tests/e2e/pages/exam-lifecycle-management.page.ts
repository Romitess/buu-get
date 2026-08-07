import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class ExamLifecycleManagementPage {
  readonly page: Page;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.saveButton = page.getByRole('button', { name: /บันทึกการแก้ไข|บันทึก|Save/i });
  }

  async gotoManagement(): Promise<void> {
    await this.page.goto('/#/admin/exam-management');
    await expect(this.page).toHaveURL(/#\/admin\/exam-management/);
    await expect(this.page.locator('.exam-management-page')).toBeVisible({ timeout: 20_000 });
  }

  async gotoEdit(examId: number): Promise<boolean> {
    await this.page.goto(`/#/admin/edit-exam/${examId}`);
    const onEdit = await this.page
      .waitForURL(new RegExp(`#\\/admin\\/edit-exam\\/${examId}`), { timeout: 8_000 })
      .then(() => true)
      .catch(() => false);
    if (!onEdit) return false;
    await expect(this.page.locator('.edit-exam-page')).toBeVisible({ timeout: 20_000 });
    return true;
  }

  async expectExamVisibleInManagement(examName: string): Promise<void> {
    await this.gotoManagement();
    await expect(this.page.getByText(examName, { exact: false }).first()).toBeVisible({
      timeout: 30_000,
    });
  }

  async removeSecondSessionSlot(): Promise<void> {
    const tabs = this.page.locator('.slot-tab');
    await expect(tabs).toHaveCount(2, { timeout: 20_000 });
    await tabs.nth(1).locator('.slot-tab__close').click();
  }

  async setRoomLocation(slotIndex: number, roomIndex: number): Promise<void> {
    const field = this.page.locator(`[data-field="locationId_${slotIndex}_${roomIndex}"]`);
    await expect(field).toBeVisible({ timeout: 20_000 });
    await field.getByRole('combobox').click({ force: true });
    const menuItem = this.page
      .locator('.q-menu .q-item')
      .filter({ hasText: /\S/ })
      .first();
    await expect(menuItem).toBeVisible({ timeout: 15_000 });
    await menuItem.click();
  }

  async saveExam(): Promise<void> {
    await expect(this.saveButton).toBeEnabled({ timeout: 20_000 });
    await this.saveButton.click();
  }

  async expectSuccessNotification(): Promise<void> {
    await expect(this.page.locator('.q-notification')).toContainText(/สำเร็จ|success|บันทึก/i, {
      timeout: 20_000,
    });
  }

  async expectConflictNotification(): Promise<void> {
    await expect(this.page.locator('.q-notification')).toContainText(
      /ทับซ้อน|overlap|conflict|ไม่ว่าง|ชนกัน/i,
      { timeout: 20_000 },
    );
  }
}
