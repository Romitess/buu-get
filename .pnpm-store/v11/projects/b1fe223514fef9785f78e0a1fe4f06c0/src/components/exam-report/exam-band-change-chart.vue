<template>
  <q-card flat bordered class="chart-card">
    <q-card-section>
      <div class="chart-card__title">{{ t('admin.examReport.bandChange.title') }}</div>

      <div class="band-change__body">
        <!-- กราฟวงกลม + legend -->
        <div class="band-change__chart">
          <VueApexCharts
            v-if="hasData"
            type="donut"
            height="240"
            :options="chartOptions"
            :series="series"
          />
          <div v-else class="band-change__empty">
            {{ t('admin.examReport.bandChange.empty') }}
          </div>
        </div>

        <!-- การ์ดสรุป 4 ใบ -->
        <div class="band-change__cards">
          <div
            v-for="item in summaryCards"
            :key="item.key"
            class="summary-card"
            :style="{ backgroundColor: item.bg, borderColor: item.color }"
          >
            <div class="summary-card__label">{{ item.label }}</div>
            <div class="summary-card__value">
              {{ formatNumber(item.value) }}
              <span class="summary-card__unit">{{ t('admin.examReport.bandChange.unit') }}</span>
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
import type { ExamBandChangeData } from 'src/types/exam-report.types';
import { getCssVar } from 'src/utils/css-var';

const { t } = useI18n();

interface Props {
  data: ExamBandChangeData;
}

const props = defineProps<Props>();

const formatNumber = (value: number): string => value.toLocaleString('en-US');

const series = computed((): number[] => [
  props.data.increased,
  props.data.same,
  props.data.decreased,
]);

const hasData = computed((): boolean => series.value.some((v) => v > 0));

const chartOptions = computed(
  (): ApexOptions => ({
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: [
      t('admin.examReport.bandChange.increased'),
      t('admin.examReport.bandChange.same'),
      t('admin.examReport.bandChange.decreased'),
    ],
    colors: [
      getCssVar('--exam-report-band-increase'),
      getCssVar('--exam-report-band-same'),
      getCssVar('--exam-report-band-decrease'),
    ],
    legend: { position: 'bottom', horizontalAlign: 'center' },
    dataLabels: {
      enabled: true,
      formatter: (val: number): string => `${Math.round(val)}%`,
    },
    plotOptions: { pie: { donut: { size: '55%' } } },
    stroke: { width: 1, colors: [getCssVar('--surface', '#ffffff')] },
    tooltip: { y: { formatter: (val: number): string => `${formatNumber(val)} คน` } },
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
    key: 'repeat',
    label: t('admin.examReport.bandChange.repeatTakers'),
    value: props.data.repeatTakers,
    color: getCssVar('--exam-report-band-repeat'),
    bg: getCssVar('--exam-report-band-repeat-bg'),
  },
  {
    key: 'increased',
    label: t('admin.examReport.bandChange.increasedCount'),
    value: props.data.increased,
    color: getCssVar('--exam-report-band-increase'),
    bg: getCssVar('--exam-report-band-increase-bg'),
  },
  {
    key: 'same',
    label: t('admin.examReport.bandChange.sameCount'),
    value: props.data.same,
    color: getCssVar('--exam-report-band-same'),
    bg: getCssVar('--exam-report-band-same-bg'),
  },
  {
    key: 'decreased',
    label: t('admin.examReport.bandChange.decreasedCount'),
    value: props.data.decreased,
    color: getCssVar('--exam-report-band-decrease'),
    bg: getCssVar('--exam-report-band-decrease-bg'),
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
    margin-bottom: 12px;
  }
}

.band-change {
  &__body {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
  }

  &__chart {
    flex: 1 1 240px;
    min-width: 220px;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 240px;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  &__cards {
    flex: 1 1 200px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.summary-card {
  border: 1px solid;
  border-radius: var(--radius-md);
  padding: 10px 14px;

  &__label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  &__value {
    font-size: 22px;
    font-weight: 700;
    color: var(--neutral-900);
    line-height: 1.2;
  }

  &__unit {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-secondary);
    margin-left: 4px;
  }
}
</style>
