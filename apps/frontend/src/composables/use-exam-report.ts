import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  ExamReportFilter,
  ExamReportOption,
  ExamReportStatCard,
  ExamAttendanceChartData,
  ExamRegistrationTrendChartData,
  ExamReportRoundRow,
  ExamScoreSummaryChartData,
  ExamAttemptProportionData,
  ExamYearTableRow,
} from 'src/types/exam-report.types';
import { fetchExamReportSummary, fetchExamReportOptions } from 'src/services/exam-report.service';

/**
 * Composable สำหรับจัดการข้อมูลหน้ารายงานการสอบ
 * ข้อมูลใช้ใน Page เดียว — ไม่ต้องทำ Store (ตาม CLAUDE.md guideline)
 */
export function useExamReport() {
  const { t } = useI18n();

  // 1. State
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const statCards = ref<ExamReportStatCard[]>([]);
  const attendanceChart = ref<ExamAttendanceChartData>({
    categories: [],
    attended: [],
    absent: [],
  });
  const trendChart = ref<ExamRegistrationTrendChartData>({ categories: [], registered: [] });
  const rounds = ref<ExamReportRoundRow[]>([]);
  const scoreSummaryChart = ref<ExamScoreSummaryChartData>({ years: [], series: [] });
  const attemptProportion = ref<ExamAttemptProportionData>({
    firstTime: 0,
    repeat: 0,
  });
  const yearTable = ref<ExamYearTableRow[]>([]);

  const yearOptions = ref<ExamReportOption[]>([]);
  const monthOptions = ref<ExamReportOption[]>([]);
  const roundOptions = ref<ExamReportOption[]>([]);

  const createEmptyFilter = (): ExamReportFilter => ({
    fromYear: '',
    fromMonth: '',
    fromRound: '',
    toYear: '',
    toMonth: '',
    toRound: '',
  });

  const filter = ref<ExamReportFilter>(createEmptyFilter());

  // 2. Methods
  const fetchData = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      const summary = await fetchExamReportSummary(filter.value);
      statCards.value = summary.statCards;
      attendanceChart.value = summary.attendanceChart;
      trendChart.value = summary.trendChart;
      rounds.value = summary.rounds;
      scoreSummaryChart.value = summary.scoreSummaryChart;
      attemptProportion.value = summary.attemptProportion;
      yearTable.value = summary.yearTable;
    } catch {
      error.value = t('admin.examReport.notifications.loadError');
      statCards.value = [];
      rounds.value = [];
      yearTable.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const loadFilterOptions = async (): Promise<void> => {
    try {
      const options = await fetchExamReportOptions();
      yearOptions.value = options.years;
      monthOptions.value = options.months;
      roundOptions.value = options.rounds;
    } catch {
      yearOptions.value = [];
      monthOptions.value = [];
      roundOptions.value = [];
    }
  };

  const applyFilter = (newFilter: ExamReportFilter): void => {
    filter.value = { ...newFilter };
    void fetchData();
  };

  const resetFilter = (): void => {
    filter.value = createEmptyFilter();
    void fetchData();
  };

  // 3. Expose
  return {
    isLoading,
    error,
    statCards,
    attendanceChart,
    trendChart,
    rounds,
    scoreSummaryChart,
    attemptProportion,
    yearTable,
    yearOptions,
    monthOptions,
    roundOptions,
    filter,
    fetchData,
    loadFilterOptions,
    applyFilter,
    resetFilter,
  };
}
