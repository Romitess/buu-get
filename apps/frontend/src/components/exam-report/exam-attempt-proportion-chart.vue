<template>
  <q-card flat bordered class="chart-card">
    <q-card-section>
      <div class="chart-card__title">{{ t('admin.examReport.charts.attemptProportionTitle') }}</div>
      <div class="chart-card__hint">{{ t('admin.examReport.charts.attemptProportionHint') }}</div>

      <div class="attempt-proportion__body">
        <div class="attempt-proportion__chart">
          <VueApexCharts
            v-if="hasData"
            type="donut"
            height="240"
            :options="chartOptions"
            :series="series"
          />
          <div v-else class="attempt-proportion__empty">
            {{ t('admin.examReport.charts.attemptProportionEmpty') }}
          </div>
        </div>

        <div class="attempt-proportion__cards">
          <div
            v-for="item in summaryCards"
            :key="item.key"
            class="summary-card"
            :style="{ backgroundColor: item.bg, borderColor: item.color }"
          >
            <div class="summary-card__label">{{ item.label }}</div>
            <div class="summary-card__value">
              {{ formatNumber(item.value) }}
              <span class="summary-card__unit">{{
                t('admin.examReport.charts.peopleUnitShort')
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useI18n } from 'vue-i18n';
import type { ExamAttemptProportionData } from 'src/types/exam-report.types';
import { getCssVar } from 'src/utils/css-var';

const { t } = useI18n();

interface Props {
  data: ExamAttemptProportionData;
}

const props = defineProps<Props>();

const formatNumber = (value: number): string => value.toLocaleString('en-US');

const series = computed((): number[] => [props.data.firstTime, props.data.repeat]);

const hasData = computed((): boolean => series.value.some((v) => v > 0));

const chartOptions = computed(
  (): ApexOptions => ({
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: [t('admin.examReport.charts.firstTime'), t('admin.examReport.charts.repeatTakers')],
    colors: [getCssVar('--exam-report-attempt-first'), getCssVar('--exam-report-attempt-repeat')],
    legend: { position: 'bottom', horizontalAlign: 'center' },
    dataLabels: {
      enabled: true,
      formatter: (val: number): string => `${Math.round(val)}%`,
    },
    plotOptions: { pie: { donut: { size: '55%' } } },
    stroke: { width: 1, colors: [getCssVar('--surface', '#ffffff')] },
    tooltip: {
      y: {
        formatter: (val: number): string =>
          `${formatNumber(val)} ${t('admin.examReport.charts.peopleUnitShort')}`,
      },
    },
  }),
);

interface SummaryCard {
  key: string;
  label: string;
  value: number;
  color: string;
  bg: string;
}

const summaryCards = computed((): SummaryCard[] => [
  {
    key: 'firstTime',
    label: t('admin.examReport.charts.firstTime'),
    value: props.data.firstTime,
    color: getCssVar('--exam-report-attempt-first'),
    bg: getCssVar('--exam-report-attempt-first-bg'),
  },
  {
    key: 'repeat',
    label: t('admin.examReport.charts.repeatTakers'),
    value: props.data.repeat,
    color: getCssVar('--exam-report-attempt-repeat'),
    bg: getCssVar('--exam-report-attempt-repeat-bg'),
  },
]);
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
    margin-bottom: 4px;
  }

  &__hint {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    margin-bottom: 12px;
  }
}

.attempt-proportion__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.attempt-proportion__chart {
  min-height: 240px;
}

.attempt-proportion__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.attempt-proportion__cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.summary-card {
  border: 1px solid;
  border-radius: var(--radius-sm);
  padding: 10px 12px;

  &__label {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  &__value {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__unit {
    font-size: var(--font-size-xs);
    font-weight: 400;
    color: var(--text-secondary);
    margin-left: 2px;
  }
}
</style>
