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
}

export interface PaginationModel {
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
}

export type Role = RolesType['ADMIN'] | RolesType['STAFF'] | RolesType['REGISTRATION_OFFICER'];

export interface ToolButtonConfig {
  icon: string;
  color: string;
  tooltip: string;
  emit: string;
}

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
