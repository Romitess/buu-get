import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchDailyRevenueReport } from 'src/services/finance-report.service';
import {
  emptyFinanceReportFilter,
  type DailyRevenueReportRow,
  type FinanceReportFilter,
} from 'src/types/finance-report.types';

export function useDailyRevenue() {
  const { t } = useI18n();

  const rows = ref<DailyRevenueReportRow[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const totalAmount = ref(0);
  const effectiveDates = ref<string[]>([]);
  const filter = ref<FinanceReportFilter>(emptyFinanceReportFilter());

  const formattedTotal = computed((): string =>
    totalAmount.value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  );

  const fetchData = async (): Promise<void> => {
    if (!filter.value.startDate || !filter.value.endDate) {
      rows.value = [];
      totalAmount.value = 0;
      effectiveDates.value = [];
      return;
    }

    isLoading.value = true;
    error.value = null;
    try {
      const summary = await fetchDailyRevenueReport({
        startDate: filter.value.startDate,
        endDate: filter.value.endDate,
        examName: filter.value.examName,
        fundSourceId: filter.value.fundSourceId,
      });
      rows.value = summary.rows;
      totalAmount.value = summary.totalAmount;
      effectiveDates.value = summary.effectiveDates;
    } catch {
      error.value = t('admin.dailyRevenueReport.notifications.loadError');
      rows.value = [];
      totalAmount.value = 0;
      effectiveDates.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const applyFilter = (newFilter: FinanceReportFilter): void => {
    filter.value = { ...newFilter };
    void fetchData();
  };

  return {
    rows,
    isLoading,
    error,
    filter,
    totalAmount,
    effectiveDates,
    formattedTotal,
    fetchData,
    applyFilter,
  };
}
