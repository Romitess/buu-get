import type { ROLES } from 'src/constants/roles';

export type Role =
  | (typeof ROLES)['STAFF']
  | (typeof ROLES)['REGISTRATION_OFFICER']
  | (typeof ROLES)['ADMIN'];

export interface ExamSchedule {
  id: string;
  examName: string;
  examType: 'general' | 'special';
  examDate: string;
  examLocation: string;
  registeredCount: number;
  capacity: number;
  status: 'published' | 'unpublished';
}

export interface PaginationModel {
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
}

export interface ToolButtonConfig {
  icon: string;
  color: string;
  tooltip: string;
  emit: string;
}

export interface TableRequestProps {
  pagination: {
    page: number;
    rowsPerPage: number;
    sortBy?: string;
    descending?: boolean;
    rowsNumber?: number;
  };
}
