import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiGet } = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock('src/boot/axios', () => ({
  api: {
    get: apiGet,
  },
}));

import {
  fetchAllExamsRaw,
  invalidateExamCache,
  isRequestCanceled,
  retryAsync,
} from './exam.service';

describe('exam.service navigation resilience', () => {
  beforeEach(() => {
    invalidateExamCache();
    vi.clearAllMocks();
  });

  it('isRequestCanceled detects axios cancel and abort errors', () => {
    expect(isRequestCanceled({ code: 'ERR_CANCELED', name: 'CanceledError' })).toBe(true);
    expect(isRequestCanceled({ name: 'AbortError', message: 'Aborted' })).toBe(true);
    expect(isRequestCanceled(new Error('network down'))).toBe(false);
  });

  it('retryAsync does not retry canceled requests', async () => {
    const fn = vi.fn().mockRejectedValue({ code: 'ERR_CANCELED', name: 'CanceledError' });

    await expect(retryAsync(fn, 3, 1)).rejects.toMatchObject({ code: 'ERR_CANCELED' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('fetchAllExamsRaw single-flights concurrent callers', async () => {
    let resolveGet: ((value: { data: unknown[] }) => void) | null = null;
    apiGet.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
    );

    const p1 = fetchAllExamsRaw(true);
    const p2 = fetchAllExamsRaw();

    expect(apiGet).toHaveBeenCalledTimes(1);

    resolveGet?.({ data: [{ EXAM_ID: 1 }] });
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toEqual([{ EXAM_ID: 1 }]);
    expect(r2).toEqual([{ EXAM_ID: 1 }]);
    expect(apiGet).toHaveBeenCalledTimes(1);
  });
});
