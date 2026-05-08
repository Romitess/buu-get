export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export interface AppCalendarProps {
  modelValue: string;
}

export interface ExamCalendarProps {
  modelValue: string;
  availability?: Record<string, 'available' | 'full' | null>;
}
