import {
  formatSessionCode,
  formatUserCode,
  getThaiFiscalYearAd,
  getThaiFiscalYearBe,
  normalizeFiscalYearAd,
  resolveExamTypeCode,
  resolvePersonTypeCode,
} from './member-session-codes.util';

describe('member-session-codes.util', () => {
  describe('getThaiFiscalYearAd / Be', () => {
    it('uses calendar year before October', () => {
      // 9 Sep 2026 → FY AD 2026 → BE 2569
      const d = new Date(2026, 8, 9);
      expect(getThaiFiscalYearAd(d)).toBe(2026);
      expect(getThaiFiscalYearBe(d)).toBe(2569);
    });

    it('rolls to next year from October', () => {
      // 1 Oct 2026 → FY AD 2027 → BE 2570
      const d = new Date(2026, 9, 1);
      expect(getThaiFiscalYearAd(d)).toBe(2027);
      expect(getThaiFiscalYearBe(d)).toBe(2570);
    });
  });

  describe('resolvePersonTypeCode', () => {
    it('returns 1 for Thai national id', () => {
      expect(resolvePersonTypeCode('1234567890123', null)).toBe('1');
    });

    it('returns 2 for passport-only', () => {
      expect(resolvePersonTypeCode(null, 'A1234567')).toBe('2');
    });
  });

  describe('resolveExamTypeCode', () => {
    it('returns 2 for special exam', () => {
      expect(resolveExamTypeCode('รอบพิเศษ')).toBe('2');
    });

    it('returns 1 for general exam', () => {
      expect(resolveExamTypeCode('รอบทั่วไป')).toBe('1');
    });
  });

  describe('normalizeFiscalYearAd', () => {
    it('passes through AD year', () => {
      expect(normalizeFiscalYearAd('2026')).toBe('2026');
    });

    it('converts BE year to AD', () => {
      expect(normalizeFiscalYearAd('2569')).toBe('2026');
    });
  });

  describe('format codes', () => {
    it('formats USER_CODE example 2569200001', () => {
      expect(formatUserCode(2569, '2', 1)).toBe('2569200001');
    });

    it('formats SESSION_CODE example 22026001', () => {
      expect(formatSessionCode('2', 2026, 1)).toBe('22026001');
    });
  });
});
