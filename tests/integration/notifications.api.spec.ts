import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';
import type { TestRoleKey } from '../e2e/fixtures/users';

type AuthHeaders = { Authorization: string };

async function headersFor(
  request: APIRequestContext,
  role: TestRoleKey,
): Promise<AuthHeaders> {
  const { accessToken } = await apiLogin(request, role);
  return { Authorization: `Bearer ${accessToken}` };
}

test.describe('Notifications API', () => {
  let financeHeaders: AuthHeaders;
  let candidateHeaders: AuthHeaders;
  let staffHeaders: AuthHeaders;
  let adminHeaders: AuthHeaders;

  test.beforeAll(async ({ request }) => {
    financeHeaders = await headersFor(request, 'finance');
    candidateHeaders = await headersFor(request, 'candidate');
    staffHeaders = await headersFor(request, 'staff');
    adminHeaders = await headersFor(request, 'admin');
  });

  test('candidate cannot list notifications', async ({ request }) => {
    const res = await request.get('/api/notifications', {
      headers: candidateHeaders,
    });
    expect(res.status()).toBe(403);
  });

  test('staff cannot list notifications', async ({ request }) => {
    const res = await request.get('/api/notifications', {
      headers: staffHeaders,
    });
    expect(res.status()).toBe(403);
  });

  test('admin without finance role cannot list notifications', async ({
    request,
  }) => {
    const res = await request.get('/api/notifications', {
      headers: adminHeaders,
    });
    expect(res.status()).toBe(403);
  });

  test('finance can list notifications', async ({ request }) => {
    const res = await request.get('/api/notifications', {
      headers: financeHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as {
      data: unknown[];
      meta: { page: number; limit: number; total: number };
    };
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta.page).toBe(1);
  });

  test('finance can read unread-count', async ({ request }) => {
    const res = await request.get('/api/notifications/unread-count', {
      headers: financeHeaders,
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as { count: number };
    expect(typeof body.count).toBe('number');
    expect(body.count).toBeGreaterThanOrEqual(0);
  });

  test('candidate cannot read unread-count', async ({ request }) => {
    const res = await request.get('/api/notifications/unread-count', {
      headers: candidateHeaders,
    });
    expect(res.status()).toBe(403);
  });
});
