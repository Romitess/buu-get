import { describe, expect, it } from 'vitest';
import {
  getExamRoundsCalendarAvailability,
  isExamRoundRegistrationExpired,
  parseExamStartDateTime,
} from './exam-registration';
import type { ExamRound } from 'src/types/exam';

const baseRound = (overrides: Partial<ExamRound> = {}): ExamRound => ({
  id: 1,
  examId: 10,
  fee: 'ค่าธรรมเนียม 500 บาท',
  location: 'อาคารเรียนรวม (101)',
  timeRange: '09:00 - 12:00',
  title: 'รอบเช้า',
  roundTypeLabel: 'ทั่วไป',
  availableSeats: 10,
  totalSeats: 20,
  regStartDate: '2026-07-01',
  regEndDate: '2026-07-23',
  examDate: '2026-07-23',
  ...overrides,
});

describe('parseExamStartDateTime', () => {
  it('builds Bangkok instant from date-only and timeRange', () => {
    const start = parseExamStartDateTime('2026-07-23', '09:00 - 12:00');
    expect(start?.toISOString()).toBe('2026-07-23T02:00:00.000Z');
  });

  it('returns null when date or time is missing', () => {
    expect(parseExamStartDateTime(undefined, '09:00 - 12:00')).toBeNull();
    expect(parseExamStartDateTime('2026-07-23', undefined)).toBeNull();
  });
});

describe('isExamRoundRegistrationExpired', () => {
  it('is open before exam start within registration window', () => {
    const now = new Date('2026-07-23T01:59:00.000Z'); // 08:59 +07
    expect(isExamRoundRegistrationExpired(baseRound(), now)).toBe(false);
  });

  it('expires at exam start even when regEnd is same day end', () => {
    const now = new Date('2026-07-23T02:00:00.000Z'); // 09:00 +07
    expect(isExamRoundRegistrationExpired(baseRound(), now)).toBe(true);
  });

  it('expires after registration end date', () => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    expect(
      isExamRoundRegistrationExpired(
        baseRound({ examDate: '2026-07-25', timeRange: '09:00 - 12:00' }),
        now,
      ),
    ).toBe(true);
  });

  it('keeps afternoon open while morning is expired', () => {
    const now = new Date('2026-07-23T03:00:00.000Z'); // 10:00 +07
    expect(isExamRoundRegistrationExpired(baseRound({ timeRange: '09:00 - 12:00' }), now)).toBe(
      true,
    );
    expect(isExamRoundRegistrationExpired(baseRound({ timeRange: '14:00 - 17:00' }), now)).toBe(
      false,
    );
  });
});

describe('getExamRoundsCalendarAvailability', () => {
  it('marks day available when any round is still open', () => {
    const now = new Date('2026-07-23T03:00:00.000Z'); // 10:00 +07
    const availability = getExamRoundsCalendarAvailability(
      [
        baseRound({ id: 1, timeRange: '09:00 - 12:00', availableSeats: 5 }),
        baseRound({ id: 2, timeRange: '14:00 - 17:00', availableSeats: 5 }),
      ],
      now,
    );
    expect(availability).toBe('available');
  });

  it('marks day full when all rounds are expired', () => {
    const now = new Date('2026-07-23T10:00:00.000Z'); // 17:00 +07
    const availability = getExamRoundsCalendarAvailability(
      [
        baseRound({ id: 1, timeRange: '09:00 - 12:00', availableSeats: 5 }),
        baseRound({ id: 2, timeRange: '14:00 - 17:00', availableSeats: 5 }),
      ],
      now,
    );
    expect(availability).toBe('full');
  });
});
