import { fetchDailyRevenueReport } from 'src/services/finance-report.service';
import type { DailyRevenueReport, FinanceReportFilter } from 'src/types/finance-report.types';

/** @deprecated Use fetchDailyRevenueReport from finance-report.service */
export const fetchDailyRevenueSummary = async (
  filter: Pick<FinanceReportFilter, 'startDate' | 'endDate' | 'examName' | 'fundSourceId'>,
): Promise<DailyRevenueReport> => fetchDailyRevenueReport(filter);
