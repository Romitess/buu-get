import { BUDDHIST_YEAR_OFFSET } from 'src/constants/exam';
import type { ExamRound } from 'src/types/exam';

export type ExamCalendarAvailability = 'available' | 'full' | null;

export type ExamRegistrationExpiryInput = Pick<
  ExamRound,
  'regEndDate' | 'examDate' | 'timeRange'
> & {
  regEndDate?: string | undefined;
  examDate?: string | undefined;
  timeRange?: string | undefined;
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MIDNIGHT_TIMESTAMP_PATTERN = /^(\d{4}-\d{2}-\d{2})[T ](00:00:00)/;
const TIME_PATTERN = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

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

const toBangkokEndOfDay = (dateOnly: string): Date | null => {
  const parsed = new Date(`${dateOnly}T23:59:59.999+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** แปลงวันที่ปิดรับสมัคร — date-only / เวลา 00:00:00 ถือเป็นสิ้นวัน 23:59:59 (+07:00) */
export const parseRegistrationEndDate = (dateValue?: string): Date | null => {
  const trimmedDate = dateValue?.trim();
  if (!trimmedDate) return null;

  if (DATE_ONLY_PATTERN.test(trimmedDate)) {
    return toBangkokEndOfDay(trimmedDate);
  }

  const midnightMatch = MIDNIGHT_TIMESTAMP_PATTERN.exec(trimmedDate);
  if (midnightMatch?.[1]) {
    return toBangkokEndOfDay(midnightMatch[1]);
  }

  return parseRegistrationDate(trimmedDate);
};

/**
 * สร้าง instant เวลาเริ่มสอบจากวันที่สอบ + ช่วงเวลา (เช่น "09:00 - 12:00")
 * ใช้ Bangkok (+07:00) เพื่อเทียบ absolute time
 */
export const parseExamStartDateTime = (examDate?: string, timeRange?: string): Date | null => {
  const trimmedDate = examDate?.trim();
  const startTimeRaw = timeRange?.split('-')[0]?.trim();
  if (!trimmedDate || !startTimeRaw) return null;

  const timeMatch = TIME_PATTERN.exec(startTimeRaw);
  if (!timeMatch) return null;

  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = Number(timeMatch[3] ?? 0);
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    Number.isNaN(second) ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null;
  }

  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  const ss = String(second).padStart(2, '0');

  if (DATE_ONLY_PATTERN.test(trimmedDate)) {
    const parsed = new Date(`${trimmedDate}T${hh}:${mm}:${ss}+07:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const baseDate = parseRegistrationDate(trimmedDate);
  if (!baseDate) return null;

  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');
  const parsed = new Date(`${year}-${month}-${day}T${hh}:${mm}:${ss}+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** หมดเขตเมื่อเลยวันปิดรับสมัคร หรือถึง/เลยเวลาเริ่มสอบแล้ว */
export const isExamRoundRegistrationExpired = (
  round: ExamRegistrationExpiryInput,
  now: Date,
): boolean => {
  const regEndDate = parseRegistrationEndDate(round.regEndDate);
  if (regEndDate && now > regEndDate) {
    return true;
  }

  const examStart = parseExamStartDateTime(round.examDate, round.timeRange);
  if (examStart) {
    return now >= examStart;
  }

  // มีข้อมูลวัน/เวลาสอบแต่ parse ไม่ได้ → fail closed
  if (round.examDate?.trim() && round.timeRange?.trim()) {
    return true;
  }

  return false;
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
