import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import path from 'node:path';

/**
 * Page Object — /#/user/profile (candidate self-edit)
 */
export class UserProfilePage {
  readonly page: Page;
  readonly pageRoot: Locator;
  readonly fixAlert: Locator;
  readonly saveButton: Locator;
  readonly avatarImg: Locator;
  readonly avatarEditBtn: Locator;
  readonly cropDialog: Locator;
  readonly cropSaveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageRoot = page.locator('.profile-page');
    this.fixAlert = page.locator('.fix-alert-banner');
    this.saveButton = page
      .locator('.row.justify-end.q-gutter-md')
      .getByRole('button', { name: /Save|บันทึก/i });
    this.avatarImg = page.locator('.profile-avatar img, .profile-avatar-img').first();
    this.avatarEditBtn = page.locator('.avatar-edit-btn');
    this.cropDialog = page.locator('.cropper-card');
    this.cropSaveButton = this.cropDialog.getByRole('button', {
      name: /Save|บันทึก/i,
    });
  }

  async goto(): Promise<boolean> {
    await this.page.goto('/#/user/profile');
    try {
      await this.page.waitForURL((url) => url.hash.includes('/user/profile'), {
        timeout: 20_000,
      });
      await expect(this.pageRoot).toBeVisible({ timeout: 20_000 });
      return true;
    } catch {
      return false;
    }
  }

  private fieldInput(label: RegExp): Locator {
    return this.page
      .locator('.user-profile-card .relative-position, .user-profile-card .q-mb-md')
      .filter({ has: this.page.locator('label', { hasText: label }) })
      .locator('input, textarea')
      .first();
  }

  async waitForFormHydrated(): Promise<void> {
    await expect
      .poll(
        async () => {
          const name = await this.fieldInput(/Full Name|ชื่อ/).inputValue().catch(() => '');
          const phone = await this.fieldInput(/Phone|เบอร์โทร/).inputValue().catch(() => '');
          return Boolean(name?.trim() || phone?.replace(/\D/g, ''));
        },
        { timeout: 30_000 },
      )
      .toBe(true);
  }

  async fillPhone(digits: string): Promise<void> {
    const input = this.fieldInput(/Phone|เบอร์โทร/);
    await input.click();
    await input.fill(digits);
  }

  async fillAddress(value: string): Promise<void> {
    const input = this.fieldInput(/Address|ที่อยู่/);
    await input.click();
    await input.fill(value);
  }

  async fillFullNameTh(value: string): Promise<void> {
    // Prefer Thai full name label; avoid EN sibling
    const th = this.page
      .locator('.user-profile-card .relative-position')
      .filter({
        has: this.page.locator('label', {
          hasText: /^(Full Name|ชื่อ - นามสกุล|ชื่อ-นามสกุล)/,
        }),
      })
      .locator('input')
      .first();
    if ((await th.count()) > 0) {
      await th.fill(value);
      return;
    }
    await this.fieldInput(/Full Name|ชื่อ/).fill(value);
  }

  async fillFaculty(value: string): Promise<void> {
    await this.fieldInput(/Faculty|คณะ/).fill(value);
  }

  async readPhone(): Promise<string> {
    return this.fieldInput(/Phone|เบอร์โทร/).inputValue();
  }

  async readAddress(): Promise<string> {
    return this.fieldInput(/Address|ที่อยู่/).inputValue();
  }

  async readFullNameTh(): Promise<string> {
    const th = this.page
      .locator('.user-profile-card .relative-position')
      .filter({
        has: this.page.locator('label', {
          hasText: /^(Full Name|ชื่อ - นามสกุล|ชื่อ-นามสกุล)/,
        }),
      })
      .locator('input')
      .first();
    if ((await th.count()) > 0) {
      return th.inputValue();
    }
    return this.fieldInput(/Full Name|ชื่อ/).inputValue();
  }

  async clickSave(): Promise<void> {
    await expect(this.saveButton).toBeEnabled({ timeout: 10_000 });
    await this.saveButton.click();
  }

  async expectSaveSuccess(): Promise<void> {
    await expect(
      this.page
        .locator('.q-notification')
        .filter({
          hasText: /updated successfully|อัปเดตข้อมูลส่วนตัวเรียบร้อย/i,
        })
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  }

  async expectFixAlertVisible(remarkSnippet?: string): Promise<void> {
    await expect(this.fixAlert).toBeVisible({ timeout: 15_000 });
    if (remarkSnippet) {
      await expect(this.fixAlert).toContainText(remarkSnippet);
    }
  }

  async expectFixAlertHidden(): Promise<void> {
    await expect(this.fixAlert).toBeHidden({ timeout: 15_000 });
  }

  /**
   * Upload via avatar picker + crop. Returns false when crop/upload fails
   * (e.g. platform-gateway unavailable).
   */
  async uploadProfilePhoto(absoluteImagePath: string): Promise<boolean> {
    await this.avatarEditBtn.click();
    const input = this.page.locator('input[type="file"]').first();
    await input.setInputFiles(absoluteImagePath);

    try {
      await expect(this.cropDialog).toBeVisible({ timeout: 10_000 });
      await this.cropSaveButton.click();
    } catch {
      return false;
    }

    const notify = this.page.locator('.q-notification');
    try {
      await expect(notify).toBeVisible({ timeout: 45_000 });
      const text = (await notify.allTextContents()).join(' ');
      if (/Failed to upload|uploadError|ล้มเหลว|ไม่สำเร็จ/i.test(text)) {
        return false;
      }
      return true;
    } catch {
      const src = await this.avatarImg.getAttribute('src').catch(() => null);
      return Boolean(src && !/user-image\.jpg/i.test(src));
    }
  }

  async avatarSrc(): Promise<string | null> {
    return this.avatarImg.getAttribute('src');
  }

  static fixtureImagePath(): string {
    return path.resolve(__dirname, '../fixtures/b6-profile-photo.png');
  }
}
