<template>
  <q-card flat bordered class="chart-card">
    <q-card-section>
      <div class="chart-card__title">{{ t('admin.examReport.charts.attendanceTitle') }}</div>
      <VueApexCharts
        type="bar"
        height="320"
        :options="chartOptions"
        :series="series"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useI18n } from 'vue-i18n';
import type { ExamAttendanceChartData } from 'src/types/exam-report.types';
import { getCssVar } from 'src/utils/css-var';

const { t } = useI18n();

interface Props {
  data: ExamAttendanceChartData;
}

const props = defineProps<Props>();

const series = computed(() => [
  { name: t('admin.examReport.charts.attended'), data: props.data.attended },
  { name: t('admin.examReport.charts.absent'), data: props.data.absent },
]);

const chartOptions = computed(
  (): ApexOptions => ({
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    colors: [getCssVar('--exam-report-chart-attend'), getCssVar('--exam-report-chart-absent')],
    plotOptions: {
      bar: { columnWidth: '55%', borderRadius: 4, dataLabels: { position: 'top' } },
    },
    dataLabels: {
      enabled: true,
      offsetY: -18,
      style: { fontSize: '10px', colors: [getCssVar('--text-secondary')] },
    },
    grid: { borderColor: getCssVar('--border-color'), strokeDashArray: 4 },
    xaxis: { categories: props.data.categories },
    yaxis: { max: 500, tickAmount: 5 },
    legend: { position: 'bottom', horizontalAlign: 'center' },
    tooltip: { shared: true, intersect: false },
  }),
);
</script>

<style scoped lang="scss">
.chart-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--exam-report-card-shadow) !important;
  height: 100%;

  &__title {
    font-size: var(--font-size-md);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12px;
  }
}
</style>
