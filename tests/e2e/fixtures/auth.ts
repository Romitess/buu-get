import type { APIRequestContext, Page } from '@playwright/test';
import { getTestUser, type TestRoleKey } from './users';

export type ApiLoginResult = {
  accessToken: string;
  user: {
    id: number;
    email: string;
    role: string;
    roles: string[];
    remark?: string | null;
  };
};

function apiBaseUrl(): string {
  const raw =
    process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3000';
  return raw.replace(/\/$/, '');
}

/**
 * Login ผ่าน API (ใช้กับ integration tests และเตรียม token)
 */
export async function apiLogin(
  request: APIRequestContext,
  role: TestRoleKey,
): Promise<ApiLoginResult> {
  const user = getTestUser(role);
  const response = await request.post(`${apiBaseUrl()}/api/auth/login`, {
    data: {
      email: user.email,
      password: user.password,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `apiLogin(${role}) failed: ${response.status()} ${body}`,
    );
  }

  return (await response.json()) as ApiLoginResult;
}

/**
 * Login ผ่านหน้า /login ของ Quasar (ใช้ร่วมกันทุก E2E / POM)
 * App uses vueRouterMode: 'hash' → paths are /#/...
 */
export async function loginAs(page: Page, role: TestRoleKey): Promise<void> {
  const user = getTestUser(role);

  await page.goto('/#/login');
  await page.waitForSelector('.login-form', { timeout: 15_000 });

  // ใช้โหมดชาวต่างชาติเพื่อข้าม ThaiID UI (email/password ยังใช้ได้ทุก role)
  const foreignerToggle = page.getByRole('button', {
    name: /Foreigner|ชาวต่างชาติ/i,
  });
  if (await foreignerToggle.isVisible().catch(() => false)) {
    await foreignerToggle.click();
  }

  const emailInput = page.locator('.login-form input').first();
  const passwordInput = page.locator('.login-form input[type="password"]');
  await emailInput.fill(user.email);
  await passwordInput.fill(user.password);
  await page.locator('.login-form button[type="submit"]').click();

  try {
    await page.waitForURL(
      (url) => !url.hash.includes('/login'),
      { timeout: 30_000 },
    );
  } catch (err) {
    const notifyText = await page
      .locator('.q-notification')
      .allTextContents()
      .catch(() => []);
    throw new Error(
      `loginAs(${role}) stayed on /login. notifications=${JSON.stringify(notifyText)}. ${String(err)}`,
    );
  }
}
