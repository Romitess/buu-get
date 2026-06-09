import { api } from 'src/boot/axios';
import type {
  DailyRevenueFilter,
  DailyRevenueSummary,
  DepartmentOption,
} from 'src/types/daily-revenue.types';

// ── Service Functions ─────────────────────────────────────
/**
 * Fetch daily revenue summary report.
 */
export const fetchDailyRevenueSummary = async (
  filter: DailyRevenueFilter,
): Promise<DailyRevenueSummary> => {
  const response = await api.get<DailyRevenueSummary>('/fund-sources/daily-revenue', {
    params: filter,
  });
  return response.data;
};

/**
 * Fetch department options for the filter dropdown.
 */
export const fetchDepartmentOptions = async (): Promise<DepartmentOption[]> => {
  const response = await api.get<DepartmentOption[]>('/fund-sources/departments');
  return response.data;
};
