import { api } from 'src/boot/axios';
import type {
  ApplicationFeeReport,
  DailyRevenueReport,
  FinanceReportFilter,
  ReceiptUsageReport,
} from 'src/types/finance-report.types';

const cleanParams = (filter: Partial<FinanceReportFilter>): Record<string, string | number> =>
  Object.fromEntries(
    Object.entries(filter).filter(
      (entry): entry is [string, string | number] =>
        entry[1] !== '' && entry[1] !== null && entry[1] !== undefined,
    ),
  );

export const fetchDailyRevenueReport = async (
  filter: Pick<FinanceReportFilter, 'startDate' | 'endDate' | 'examName' | 'fundSourceId'>,
): Promise<DailyRevenueReport> => {
  const response = await api.get<DailyRevenueReport>('/finance-reports/daily-revenue', {
    params: cleanParams(filter),
  });
  return response.data;
};

export const fetchApplicationFeeReport = async (
  filter: Pick<FinanceReportFilter, 'receiptDate' | 'paidDate' | 'examName' | 'fundSourceId'>,
): Promise<ApplicationFeeReport> => {
  const response = await api.get<ApplicationFeeReport>('/finance-reports/application-fees', {
    params: cleanParams(filter),
  });
  return response.data;
};

export const fetchReceiptUsageReport = async (
  filter: Pick<
    FinanceReportFilter,
    | 'fiscalYear'
    | 'startDate'
    | 'endDate'
    | 'fundSourceId'
    | 'examName'
    | 'payerName'
    | 'collectorName'
    | 'receiptNo'
    | 'status'
  >,
): Promise<ReceiptUsageReport> => {
  const response = await api.get<ReceiptUsageReport>('/finance-reports/receipt-usage', {
    params: cleanParams(filter),
  });
  return response.data;
};
