import { BUDDHIST_YEAR_OFFSET } from 'src/constants/exam';
import type { ExamRound } from 'src/types/exam';

export type ExamCalendarAvailability = 'available' | 'full' | null;

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

export const isExamRoundRegistrationExpired = (round: ExamRound, now: Date): boolean => {
  const regEndDate = parseRegistrationDate(round.regEndDate);
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
