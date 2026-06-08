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
  minDate?: string;
}

export interface ExamCalendarProps {
  modelValue: string;
  availability?: Record<string, 'available' | 'full' | null>;
}

export interface PasscodeLog {
  logId: number;
  fullName: string;
  passcode: string;
  usedDate: string;
  usedTime: string;
}
