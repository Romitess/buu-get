import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { getTestUser, type TestRoleKey } from '../fixtures/users';

/**
 * Page Object — /login (Quasar LoginCard)
 */
export class LoginPage {
  readonly page: Page;
  readonly logo: Locator;
  readonly foreignerToggle: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator('img[alt="BUU-GET Logo"]');
    this.foreignerToggle = page.getByRole('button', {
      name: /Foreigner|ชาวต่างชาติ/i,
    });
    this.emailInput = page.locator('.login-form input').first();
    this.passwordInput = page.locator('.login-form input[type="password"]');
    this.submitButton = page.locator('.login-form button[type="submit"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/login');
    await this.page.waitForSelector('.login-form', { timeout: 15_000 });
    await expect(this.page).toHaveURL(/#\/login/);
  }

  /** Switch to foreigner mode so email/password fields are ready (skips ThaID UI). */
  async ensureForeignerMode(): Promise<void> {
    if (await this.foreignerToggle.isVisible().catch(() => false)) {
      await this.foreignerToggle.click();
    }
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Fill seeded test user credentials and submit (does not wait for redirect).
   */
  async attemptLoginAs(role: TestRoleKey, passwordOverride?: string): Promise<void> {
    const user = getTestUser(role);
    await this.ensureForeignerMode();
    await this.fillCredentials(user.email, passwordOverride ?? user.password);
    await this.submit();
  }

  async expectStillOnLogin(): Promise<void> {
    await expect(this.page).toHaveURL(/#\/login/);
  }

  async expectLoginErrorNotification(): Promise<void> {
    const notify = this.page.locator('.q-notification');
    await expect(notify).toBeVisible({ timeout: 15_000 });
    await expect(notify).toContainText(
      /Incorrect email or password|อีเมลหรือรหัสผ่านไม่ถูกต้อง/i,
    );
  }
}
