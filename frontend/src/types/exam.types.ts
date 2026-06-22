import type { UserRole } from 'src/types/user';

export interface ExamSchedule {
  id: string;
  examName: string;
  examType: 'general' | 'special';
  examDate: string;
  examLocation: string;
  registeredCount: number;
  capacity: number;
  status: 'published' | 'unpublished';
  isAllVerifyPassed?: boolean;
  regStartDate?: string;
  regEndDate?: string;
}

export interface PaginationModel {
  sortBy?: string | null;
  descending?: boolean;
  page: number;
  rowsPerPage: number;
  rowsNumber?: number;
}

export type Role = UserRole;

export interface ToolButtonConfig {
  icon?: string;
  image?: string;
  color: string;
  tooltip: string;
  emit: string;
}

export type ToolButtonExtended = Omit<ToolButtonConfig, 'icon'> & {
  icon?: string;
  image?: string;
};

export const TABLE_ACTIONS = {
  PASSCODE_HISTORY: 'passcodeHistory',
  EDIT: 'edit',
  DELETE: 'delete',
  MANAGE_REGISTRANTS: 'manageRegistrants',
  MANAGE_SEATS: 'manageSeats',
  VIEW_CANDIDATES: 'viewCandidates',
  VIEW_SCORE: 'viewScore',
} as const;

export type TableAction = (typeof TABLE_ACTIONS)[keyof typeof TABLE_ACTIONS];

export const EXAM_TYPE_LABELS: Record<string, string> = {
  general: 'ทั่วไป',
  special: 'พิเศษ',
};

export const EXAM_STATUS_LABELS: Record<string, string> = {
  published: 'เผยแพร่แล้ว',
  unpublished: 'ยังไม่เผยแพร่',
};

export interface TableRequestProps {
  pagination: {
    page: number;
    rowsPerPage: number;
    sortBy?: string;
    descending?: boolean;
    rowsNumber?: number;
  };
  filter?: string | Record<string, unknown> | null | undefined;
}

export interface PaymentRow {
  id: number;
  file_payment_date: string;
  file_payment_time: string;
  file_ref: string;
  file_ref2: string;
  file_payer: string;
  file_amount: string;
  db_ref: string;
  db_ref2: string;
  db_bank_ref: string;
  db_partner_ref: string;
}

export interface SearchRow {
  id: number;
  ref1: string;
  ref2: string;
  name: string;
  amount: string;
  exam_name: string;
  payment_status: string;
}
