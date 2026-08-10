import { describe, expect, it } from 'vitest';
import { formatCountdownRemaining } from './use-countdown';

describe('formatCountdownRemaining', () => {
  const deadline = '2026-07-30T10:30:00.000Z';

  it('returns MM:SS for a QR session expiry deadline', () => {
    const nowMs = Date.parse('2026-07-30T10:00:11.400Z');
    expect(formatCountdownRemaining(deadline, nowMs)).toBe('29:48');
  });

  it('floors partial seconds consistently', () => {
    const nowMs = Date.parse('2026-07-30T10:00:11.999Z');
    expect(formatCountdownRemaining(deadline, nowMs)).toBe('29:48');
  });

  it('returns 00:00 when expired', () => {
    const nowMs = Date.parse('2026-07-30T10:30:00.000Z');
    expect(formatCountdownRemaining(deadline, nowMs)).toBe('00:00');
  });

  it('returns undefined when deadline is missing', () => {
    expect(formatCountdownRemaining(undefined)).toBeUndefined();
    expect(formatCountdownRemaining('')).toBeUndefined();
  });

  it('uses session TRANX_EXPIRES_AT independently from exam pay-by date', () => {
    const nowMs = Date.parse('2026-07-30T10:00:11.400Z');
    const qrSessionExpiry = '2026-07-30T10:30:00.000Z';
    const laterSessionExpiry = '2026-07-30T10:30:06.000Z';

    expect(formatCountdownRemaining(qrSessionExpiry, nowMs)).toBe('29:48');
    expect(formatCountdownRemaining(laterSessionExpiry, nowMs)).toBe('29:54');
  });
});
