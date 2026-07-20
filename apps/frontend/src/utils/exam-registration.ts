import { BUDDHIST_YEAR_OFFSET } from 'src/constants/exam';
import type { ExamRound } from 'src/types/exam';

export type ExamCalendarAvailability = 'available' | 'full' | null;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MIDNIGHT_TIMESTAMP_PATTERN = /^(\d{4}-\d{2}-\d{2})[T ](00:00:00)/;

const parseSlashDate = (dateValue: string): Date | null => {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(
    dateValue,
  );
  if (!match) return null;

  const [, rawDay, rawMonth, rawYear, rawHour, rawMinute, rawSecond] = match;
  const day = Number(rawDay);
  const month = Number(rawMonth);
  const year = Number(rawYear);
  const hour = rawHour ? Number(rawHour) : 0;
  const minute = rawMinute ? Number(rawMinute) : 0;
  const second = rawSecond ? Number(rawSecond) : 0;

  if (!day || !month || !year) return null;

  const gregorianYear = year >= 2400 ? year - BUDDHIST_YEAR_OFFSET : year;
  const parsedDate = new Date(gregorianYear, month - 1, day, hour, minute, second);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const parseRegistrationDate = (dateValue?: string): Date | null => {
  const trimmedDate = dateValue?.trim();
  if (!trimmedDate) return null;

  const parsedDate = new Date(trimmedDate);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  return parseSlashDate(trimmedDate);
};

const toLocalEndOfDay = (year: number, month: number, day: number): Date =>
  new Date(year, month - 1, day, 23, 59, 59, 999);

/** แปลงวันที่ปิดรับสมัคร — date-only / เวลา 00:00:00 ถือเป็นสิ้นวัน 23:59:59 */
export const parseRegistrationEndDate = (dateValue?: string): Date | null => {
  const trimmedDate = dateValue?.trim();
  if (!trimmedDate) return null;

  if (DATE_ONLY_PATTERN.test(trimmedDate)) {
    const [yearStr, monthStr, dayStr] = trimmedDate.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!year || !month || !day) return null;
    return toLocalEndOfDay(year, month, day);
  }

  const midnightMatch = MIDNIGHT_TIMESTAMP_PATTERN.exec(trimmedDate);
  if (midnightMatch?.[1]) {
    const [yearStr, monthStr, dayStr] = midnightMatch[1].split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!year || !month || !day) return null;
    return toLocalEndOfDay(year, month, day);
  }

  return parseRegistrationDate(trimmedDate);
};

export const isExamRoundRegistrationExpired = (round: ExamRound, now: Date): boolean => {
  const regEndDate = parseRegistrationEndDate(round.regEndDate);
  if (!regEndDate) return false;

  return now > regEndDate;
};

export const getExamRoundsCalendarAvailability = (
  rounds: readonly ExamRound[],
  now: Date,
): ExamCalendarAvailability => {
  if (rounds.length === 0) return null;

  const isAllRegistrationExpired = rounds.every((round) =>
    isExamRoundRegistrationExpired(round, now),
  );
  const hasAvailableSeats = rounds.some((round) => round.availableSeats > 0);

  return isAllRegistrationExpired || !hasAvailableSeats ? 'full' : 'available';
};
