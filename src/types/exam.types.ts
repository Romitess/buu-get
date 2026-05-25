import type { RolesType } from 'src/constants/roles';

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
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
}

export type Role = RolesType['ADMIN'] | RolesType['STAFF'] | RolesType['REGISTRATION_OFFICER'];

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
  db_name: string;
  db_amount: string;
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
