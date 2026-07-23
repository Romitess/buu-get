import { api } from 'src/boot/axios';
import type { DailyRevenueFilter, DailyRevenueSummary } from 'src/types/daily-revenue.types';

/**
 * Fetch daily revenue summary report.
 */
export const fetchDailyRevenueSummary = async (
  filter: DailyRevenueFilter,
): Promise<DailyRevenueSummary> => {
  // Remove empty strings from params
  const cleanParams = Object.fromEntries(
    Object.entries(filter).filter(
      (entry) => entry[1] !== '' && entry[1] !== null && entry[1] !== undefined,
    ),
  );

  const response = await api.get<DailyRevenueSummary>('/fund-sources/daily-revenue', {
    params: cleanParams,
  });
  return response.data;
};
