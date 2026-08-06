import { test, expect, type APIRequestContext } from '@playwright/test';
import { apiLogin } from '../e2e/fixtures/auth';

/**
 * User Image API integration — matrix IMG-I-001 … IMG-I-004
 *
 * Uses seeded candidate JWT; upserts B6-IMG- URLs; afterAll restores prior URL
 * (no user-image delete endpoint).
 */

type AuthHeaders = { Authorization: string };

type UserImageRow = {
  USER_IMAGE_ID: number;
  USER_ID: number;
  USER_IMAGE_URL: string | null;
};

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

test.describe('User Image API — me GET/PATCH / auth', () => {
  test.describe.configure({ mode: 'serial', timeout: 60_000 });
  test.setTimeout(60_000);

  let candidateHeaders: AuthHeaders;
  let candidateUserId: number;
  let originalImageUrl: string | null = null;
  let seedReady = false;
  let seedSkipReason = '';

  function requireSeed(): void {
    test.skip(!seedReady, seedSkipReason || 'User-image seed unavailable');
  }

  async function readMyImage(
    request: APIRequestContext,
  ): Promise<UserImageRow | null> {
    const res = await request.get('/api/user-image/me', {
      headers: candidateHeaders,
    });
    const text = await res.text();
    expect(res.status(), text).toBe(200);
    if (!text || text === 'null') return null;
    return JSON.parse(text) as UserImageRow;
  }

  test.beforeAll(async ({ request }) => {
    test.setTimeout(60_000);
    try {
      const cand = await apiLogin(request, 'candidate');
      candidateHeaders = { Authorization: `Bearer ${cand.accessToken}` };
      candidateUserId = cand.user.id;
      const current = await readMyImage(request);
      originalImageUrl = current?.USER_IMAGE_URL ?? null;
      seedReady = true;
    } catch (err) {
      seedSkipReason = `Seed failed: ${String(err)}`;
    }
  });

  test.afterAll(async ({ request }) => {
    if (!candidateHeaders) return;
    // Restore prior image URL (or clear to a known B6 placeholder if none)
    const restoreUrl =
      originalImageUrl ?? `/user_images/B6-IMG-restored-${uniqueSuffix()}.jpg`;
    await request
      .patch('/api/user-image/me', {
        headers: candidateHeaders,
        data: { userImageUrl: restoreUrl },
      })
      .catch(() => undefined);
  });

  // IMG-I-001
  test('GET /api/user-image/me returns 200 body or null', async ({
    request,
  }) => {
    requireSeed();
    const body = await readMyImage(request);
    if (body === null) return;
    expect(body.USER_ID).toBe(candidateUserId);
    expect(body).toHaveProperty('USER_IMAGE_URL');
  });

  // IMG-I-002
  test('PATCH /api/user-image/me upserts userImageUrl', async ({ request }) => {
    requireSeed();
    const url = `/user_images/B6-IMG-${uniqueSuffix()}.jpg`;
    const patchRes = await request.patch('/api/user-image/me', {
      headers: candidateHeaders,
      data: { userImageUrl: url },
    });
    expect(patchRes.status(), await patchRes.text()).toBe(200);
    const patched = (await patchRes.json()) as UserImageRow;
    expect(patched.USER_ID).toBe(candidateUserId);
    expect(patched.USER_IMAGE_URL).toBe(url);

    const fetched = await readMyImage(request);
    expect(fetched?.USER_IMAGE_URL).toBe(url);
  });

  // IMG-I-003
  test('PATCH without userImageUrl returns no-op message; no DB overwrite', async ({
    request,
  }) => {
    requireSeed();
    const before = await readMyImage(request);
    const beforeUrl = before?.USER_IMAGE_URL ?? null;

    const noop = await request.patch('/api/user-image/me', {
      headers: candidateHeaders,
      data: {},
    });
    expect(noop.status(), await noop.text()).toBe(200);
    const body = (await noop.json()) as { message: string };
    expect(body.message).toBe('No image URL provided');

    const after = await readMyImage(request);
    expect(after?.USER_IMAGE_URL ?? null).toBe(beforeUrl);
  });

  // IMG-I-004
  test('GET/PATCH /api/user-image/me require JWT → 401', async ({
    request,
  }) => {
    const getRes = await request.get('/api/user-image/me');
    expect(getRes.status()).toBe(401);

    const patchRes = await request.patch('/api/user-image/me', {
      data: { userImageUrl: '/user_images/B6-IMG-noauth.jpg' },
    });
    expect(patchRes.status()).toBe(401);
  });
});
