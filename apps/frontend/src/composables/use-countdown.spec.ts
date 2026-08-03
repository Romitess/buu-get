import { describe, expect, it } from 'vitest';
import { formatCountdownRemaining } from './use-countdown';

describe('formatCountdownRemaining', () => {
  const deadline = '2026-07-30T10:30:00.000Z';

  it('returns the same MM:SS for the same deadline and now (card/dialog sync)', () => {
    const nowMs = Date.parse('2026-07-30T10:00:11.400Z');
    const cardDisplay = formatCountdownRemaining(deadline, nowMs);
    const dialogDisplay = formatCountdownRemaining(deadline, nowMs);

    expect(cardDisplay).toBe('29:48');
    expect(dialogDisplay).toBe(cardDisplay);
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

  it('diverges when deadlines differ (regression for reset-on-pay bug)', () => {
    const nowMs = Date.parse('2026-07-30T10:00:11.400Z');
    const enrollmentDeadline = '2026-07-30T10:30:00.000Z';
    const resetOnPayDeadline = '2026-07-30T10:30:06.000Z';

    expect(formatCountdownRemaining(enrollmentDeadline, nowMs)).toBe('29:48');
    expect(formatCountdownRemaining(resetOnPayDeadline, nowMs)).toBe('29:54');
  });
});
