import type { DayData } from './exam';

export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export interface AppCalendarProps {
  modelValue: string;
  showLegend?: boolean;
  disablePastDates?: boolean;
  minDate?: string | undefined;
  maxDate?: string | undefined;
}

export interface ExamCalendarProps {
  modelValue: string;
  availability?: Record<string, 'available' | 'full' | null>;
  scheduleData?: Record<string, DayData>;
  currentTime?: Date;
}

export interface PasscodeLog {
  logId: number;
  fullName: string;
  passcode: string;
  usedDate: string;
  usedTime: string;
}
