import { normalizePeriodEndDate } from './period-date.util';

describe('normalizePeriodEndDate', () => {
  it('appends 23:59:59+07:00 to date-only values', () => {
    expect(normalizePeriodEndDate('2026-07-20')).toBe(
      '2026-07-20T23:59:59+07:00',
    );
  });

  it('converts midnight timestamps to end of day', () => {
    expect(normalizePeriodEndDate('2026-07-20T00:00:00+07:00')).toBe(
      '2026-07-20T23:59:59+07:00',
    );
    expect(normalizePeriodEndDate('2026-07-20 00:00:00')).toBe(
      '2026-07-20T23:59:59+07:00',
    );
  });

  it('preserves explicit non-midnight timestamps', () => {
    expect(normalizePeriodEndDate('2026-07-20T16:00:00+07:00')).toBe(
      '2026-07-20T16:00:00+07:00',
    );
  });

  it('returns undefined for empty values', () => {
    expect(normalizePeriodEndDate(undefined)).toBeUndefined();
    expect(normalizePeriodEndDate('')).toBeUndefined();
    expect(normalizePeriodEndDate('   ')).toBeUndefined();
  });
});
