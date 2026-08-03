import { normalizePeriodEndDate } from './period-date.util';

export type RegistrationWindowStatus =
  'open' | 'not_open' | 'closed' | 'exam_started' | 'invalid';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/;

const toDateOnlyString = (value: string | Date): string | null => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    // Interpret as Bangkok calendar day
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value);
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    if (!year || !month || !day) return null;
    return `${year}-${month}-${day}`;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (DATE_ONLY_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const datePrefix = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  if (datePrefix?.[1]) {
    return datePrefix[1];
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return toDateOnlyString(parsed);
};

const toInstant = (value: string | Date | null | undefined): Date | null => {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** สร้าง instant เวลาเริ่มสอบจาก EXAM_DATE + SS_START_TIME (+07:00) */
export function buildExamStartDateTime(
  examDate: string | Date | null | undefined,
  startTime: string | null | undefined,
): Date | null {
  if (examDate == null || startTime == null) return null;

  const dateOnly = toDateOnlyString(examDate);
  const trimmedTime = startTime.trim();
  if (!dateOnly || !trimmedTime) return null;

  const timeMatch = TIME_PATTERN.exec(trimmedTime);
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
  const parsed = new Date(`${dateOnly}T${hh}:${mm}:${ss}+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function evaluateRegistrationWindow(params: {
  now?: Date;
  regStart?: string | Date | null;
  regEnd?: string | Date | null;
  examDate?: string | Date | null;
  startTime?: string | null;
}): RegistrationWindowStatus {
  const now = params.now ?? new Date();

  if (params.regStart != null && String(params.regStart).trim() !== '') {
    const regStart = toInstant(
      params.regStart instanceof Date
        ? params.regStart
        : params.regStart.trim(),
    );
    if (!regStart) return 'invalid';
    if (now < regStart) return 'not_open';
  }

  if (params.regEnd != null && String(params.regEnd).trim() !== '') {
    const normalizedEnd =
      params.regEnd instanceof Date
        ? params.regEnd
        : normalizePeriodEndDate(params.regEnd);
    const regEnd = toInstant(normalizedEnd ?? null);
    if (!regEnd) return 'invalid';
    if (now > regEnd) return 'closed';
  }

  const examStart = buildExamStartDateTime(params.examDate, params.startTime);
  if (!examStart) {
    return 'invalid';
  }

  if (now >= examStart) {
    return 'exam_started';
  }

  return 'open';
}
