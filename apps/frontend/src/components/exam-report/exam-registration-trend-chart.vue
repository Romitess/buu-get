<template>
  <q-card flat bordered class="chart-card">
    <q-card-section>
      <div class="chart-card__title">{{ t('admin.examReport.charts.trendTitle') }}</div>
      <VueApexCharts type="line" height="320" :options="chartOptions" :series="series" />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useI18n } from 'vue-i18n';
import type { ExamRegistrationTrendChartData } from 'src/types/exam-report.types';
import { getNiceYAxisMax } from 'src/utils/chart-axis';
import { getCssVar } from 'src/utils/css-var';

const { t } = useI18n();

interface Props {
  data: ExamRegistrationTrendChartData;
}

const props = defineProps<Props>();

const Y_TICK_AMOUNT = 6;

const series = computed(() => [
  { name: t('admin.examReport.charts.registered'), data: props.data.registered },
]);

const yAxisMax = computed(() => getNiceYAxisMax(props.data.registered, Y_TICK_AMOUNT));

const chartOptions = computed(
  (): ApexOptions => ({
    chart: {
      type: 'line',
      toolbar: { show: false },
      fontFamily: 'inherit',
      dropShadow: {
        enabled: true,
        top: 6,
        left: 0,
        blur: 6,
        opacity: 0.25,
        color: getCssVar('--exam-report-chart-line'),
      },
    },
    colors: [getCssVar('--exam-report-chart-line')],
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 4 },
    dataLabels: {
      enabled: true,
      style: { fontSize: '10px', colors: [getCssVar('--text-secondary')] },
      background: { enabled: false },
      offsetY: -6,
    },
    grid: { borderColor: getCssVar('--border-color'), strokeDashArray: 4 },
    xaxis: { categories: props.data.categories },
    yaxis: { max: yAxisMax.value, tickAmount: Y_TICK_AMOUNT, min: 0 },
    legend: { position: 'bottom', horizontalAlign: 'center' },
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
