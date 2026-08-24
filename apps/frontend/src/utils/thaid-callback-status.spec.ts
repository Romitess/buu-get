import { describe, expect, it } from 'vitest';
import { parseThaidCallbackStatus } from 'src/utils/thaid-callback-status';

describe('parseThaidCallbackStatus', () => {
  it('accepts known statuses', () => {
    expect(parseThaidCallbackStatus('success')).toBe('success');
    expect(parseThaidCallbackStatus('denied')).toBe('denied');
    expect(parseThaidCallbackStatus('error')).toBe('error');
  });

  it('uses the first array value', () => {
    expect(parseThaidCallbackStatus(['denied', 'success'])).toBe('denied');
  });

  it('falls back to unknown', () => {
    expect(parseThaidCallbackStatus(undefined)).toBe('unknown');
    expect(parseThaidCallbackStatus('nope')).toBe('unknown');
    expect(parseThaidCallbackStatus(['nope'])).toBe('unknown');
  });
});
