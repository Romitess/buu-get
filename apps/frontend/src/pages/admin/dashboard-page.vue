<template>
  <q-page class="page-container dashboard-page">
    <!-- Filter (ช่วงปี/เดือน/รอบ) -->
    <ExamReportFilter
      :filter="filter"
      :year-options="yearOptions"
      :month-options="monthOptions"
      :round-options="roundOptions"
      @filter-change="applyFilter"
    />

    <template v-if="isLoading">
      <!-- การ์ดสถิติ skeleton -->
      <div class="row q-col-gutter-md q-mb-md">
        <div v-for="n in 4" :key="`stat-skeleton-${n}`" class="col-12 col-sm-6 col-lg-3">
          <CardSkeleton height="140px" :lines="3" />
        </div>
      </div>

      <!-- แถวกราฟ skeleton -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-lg-6">
          <ChartPanelSkeleton />
        </div>
        <div class="col-12 col-lg-6">
          <ChartPanelSkeleton />
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-lg-7">
          <ChartPanelSkeleton />
        </div>
        <div class="col-12 col-lg-5">
          <ChartPanelSkeleton height="280px" />
        </div>
      </div>

      <TableSkeleton :columns="tableSkeletonColumns" :rows="5" />
    </template>

    <template v-else>
      <div class="dashboard-page__content">
        <q-inner-loading :showing="isRefreshing" color="primary" />

        <div class="dashboard-page__stats-hint text-caption text-grey-7 q-mb-sm">
          {{ t('admin.examReport.stats.scopeHint') }}
        </div>
        <!-- การ์ดสถิติ -->
        <div class="row q-col-gutter-md q-mb-md">
          <div v-for="card in statCards" :key="card.key" class="col-12 col-sm-6 col-lg-3">
            <ExamReportStatCard :card="card" />
          </div>
        </div>

        <!-- แถวกราฟ: แนวโน้มผู้สมัคร + เข้า/ขาดสอบ -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-lg-6">
            <ExamRegistrationTrendChart :data="trendChart" />
          </div>
          <div class="col-12 col-lg-6">
            <ExamAttendanceBarChart :data="attendanceChart" />
          </div>
        </div>

        <!-- แถวกราฟ: ช่วงคะแนนรายปี + สัดส่วนสอบครั้งเดียว/ซ้ำ -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-lg-7">
            <ExamScoreSummaryChart :data="scoreSummaryChart" />
          </div>
          <div class="col-12 col-lg-5">
            <ExamAttemptProportionChart :data="attemptProportion" />
          </div>
        </div>

        <!-- ตารางสรุปรายปี -->
        <ExamYearSummaryTable :rows="yearTable" :loading="false" />
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import type { QTableColumn } from 'quasar';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import ExamReportFilter from 'src/components/exam-report/exam-report-filter.vue';
import ExamReportStatCard from 'src/components/exam-report/exam-report-stat-card.vue';
import ExamAttendanceBarChart from 'src/components/exam-report/exam-attendance-bar-chart.vue';
import ExamRegistrationTrendChart from 'src/components/exam-report/exam-registration-trend-chart.vue';
import ExamScoreSummaryChart from 'src/components/exam-report/exam-score-summary-chart.vue';
import ExamAttemptProportionChart from 'src/components/exam-report/exam-attempt-proportion-chart.vue';
import ExamYearSummaryTable from 'src/components/exam-report/exam-year-summary-table.vue';
import { useExamReport } from 'src/composables/use-exam-report';
import { CardSkeleton, ChartPanelSkeleton, TableSkeleton } from 'src/components/base/skeleton';

const $q = useQuasar();
const { t } = useI18n();

const tableSkeletonColumns: QTableColumn[] = [
  { name: 'year', label: '', field: 'year' },
  { name: 'registered', label: '', field: 'registered' },
  { name: 'paid', label: '', field: 'paid' },
  { name: 'attended', label: '', field: 'attended' },
];

const {
  isLoading,
  isRefreshing,
  error,
  statCards,
  attendanceChart,
  trendChart,
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
} = useExamReport();

watch(error, (newVal) => {
  if (newVal) {
    $q.notify({ type: 'negative', message: newVal, position: 'top' });
  }
});

onMounted(() => {
  void loadFilterOptions();
  void fetchData();
});
</script>

<style scoped lang="scss">
.dashboard-page {
  overflow-x: hidden;
}

.dashboard-page__content {
  position: relative;
}
</style>
