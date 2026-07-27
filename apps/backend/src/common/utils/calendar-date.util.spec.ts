import {
  getBangkokDateOnly,
  isFutureBangkokDate,
  toBangkokDateOnly,
} from './calendar-date.util';

describe('calendar-date.util', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('formats Bangkok calendar date', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-27T10:00:00+07:00'));

    expect(getBangkokDateOnly()).toBe('2026-07-27');
  });

  it('normalizes ISO strings to Bangkok calendar date', () => {
    expect(toBangkokDateOnly('2026-07-27T00:00:00+07:00')).toBe('2026-07-27');
    expect(toBangkokDateOnly('2026-07-26T17:00:00.000Z')).toBe('2026-07-27');
  });

  it('detects future Bangkok dates', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-27T10:00:00+07:00'));

    expect(isFutureBangkokDate('2026-07-27T00:00:00+07:00')).toBe(false);
    expect(isFutureBangkokDate('2026-07-28')).toBe(true);
    expect(isFutureBangkokDate('2026-07-26')).toBe(false);
  });
});
