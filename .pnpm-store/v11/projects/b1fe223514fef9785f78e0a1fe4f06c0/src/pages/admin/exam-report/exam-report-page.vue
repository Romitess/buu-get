<template>
  <q-page class="page-container exam-report-page">
    <!-- Breadcrumbs -->
    <AppBreadcrumbs />

    <!-- Page Header -->
    <AppPageHeader
      :title="$t('admin.examReport.pageTitle')"
      :subtitle="$t('admin.examReport.pageSubtitle')"
    />

    <!-- Filter -->
    <ExamReportFilter
      :filter="filter"
      :year-options="yearOptions"
      :month-options="monthOptions"
      :round-options="roundOptions"
      @filter-change="applyFilter"
    />

    <!-- Stat Cards -->
    <div class="row q-col-gutter-md q-mb-md">
      <div v-for="card in statCards" :key="card.key" class="col-12 col-sm-6 col-lg-3">
        <ExamReportStatCard :card="card" />
      </div>
    </div>

    <!-- Charts Row 1 -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-lg-6">
        <ExamAttendanceBarChart :data="attendanceChart" />
      </div>
      <div class="col-12 col-lg-6">
        <ExamRoundsTable
          :rows="rounds"
          :loading="isLoading"
          @view-registrants="onViewRegistrants"
        />
      </div>
    </div>

    <!-- Charts Row 2 -->
    <div class="row q-col-gutter-md">
      <div class="col-12 col-lg-6">
        <ExamRegistrationTrendChart :data="trendChart" />
      </div>
      <div class="col-12 col-lg-6">
        <ExamScoreSummaryChart :data="scoreSummaryChart" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import ExamReportFilter from 'src/components/exam-report/exam-report-filter.vue';
import ExamReportStatCard from 'src/components/exam-report/exam-report-stat-card.vue';
import ExamAttendanceBarChart from 'src/components/exam-report/exam-attendance-bar-chart.vue';
import ExamRegistrationTrendChart from 'src/components/exam-report/exam-registration-trend-chart.vue';
import ExamScoreSummaryChart from 'src/components/exam-report/exam-score-summary-chart.vue';
import ExamRoundsTable from 'src/components/exam-report/exam-rounds-table.vue';
import { useExamReport } from 'src/composables/use-exam-report';
import type { ExamReportRoundRow } from 'src/types/exam-report.types';

const $q = useQuasar();

const {
  isLoading,
  error,
  statCards,
  attendanceChart,
  trendChart,
  rounds,
  scoreSummaryChart,
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

const onViewRegistrants = (row: ExamReportRoundRow): void => {
  $q.notify({
    type: 'info',
    message: `${row.round} — ${row.date}`,
    position: 'top',
  });
};

onMounted(() => {
  void loadFilterOptions();
  void fetchData();
});
</script>

<style scoped lang="scss">
.exam-report-page {
  overflow-x: hidden;
}
</style>
