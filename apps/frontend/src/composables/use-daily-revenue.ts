import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DailyRevenueRow, DailyRevenueFilter } from 'src/types/daily-revenue.types';
import { fetchDailyRevenueSummary } from 'src/services/daily-revenue.service';

/**
 * Composable สำหรับจัดการข้อมูลรายงานสรุปการรับเงินประจำวัน
 * ข้อมูลนี้ใช้ใน Page เดียว — ไม่ต้องทำ Store (ตาม claude.md guideline)
 */
export function useDailyRevenue() {
  const { t } = useI18n();

  // 1. State
  const rows = ref<DailyRevenueRow[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const totalAmount = ref(0);

  const filter = ref<DailyRevenueFilter>({
    startDate: '',
    endDate: '',
    examName: '',
  });

  // 2. Computed
  const formattedTotal = computed((): string => {
    return totalAmount.value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  });

  // 3. Methods
  const fetchData = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      const summary = await fetchDailyRevenueSummary(filter.value);
      rows.value = summary.rows;
      totalAmount.value = summary.totalAmount;
    } catch {
      error.value = t('admin.dailyRevenueReport.notifications.loadError');
      rows.value = [];
      totalAmount.value = 0;
    } finally {
      isLoading.value = false;
    }
  };

  const applyFilter = (newFilter: DailyRevenueFilter): void => {
    filter.value = { ...newFilter };
    void fetchData();
  };

  const resetFilter = (): void => {
    filter.value = {
      startDate: '',
      endDate: '',
      examName: '',
    };
    void fetchData();
  };

  // 4. Expose
  return {
    rows,
    isLoading,
    error,
    filter,
    totalAmount,
    formattedTotal,
    fetchData,
    applyFilter,
    resetFilter,
  };
}
