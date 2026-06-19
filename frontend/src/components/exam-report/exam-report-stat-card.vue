<template>
  <q-card flat bordered class="stat-card">
    <q-card-section class="stat-card__body row no-wrap items-stretch">
      <!-- ฝั่งซ้าย: ไอคอน + ตัวเลข + แนวโน้ม -->
      <div class="col column justify-between">
        <div class="stat-card__icon-box" :style="iconBoxStyle">
          <q-icon :name="card.icon" size="24px" :style="{ color: iconColor }" />
        </div>

        <div class="stat-card__label">{{ card.label }}</div>
        <div class="stat-card__value">{{ formattedValue }}</div>

        <div class="stat-card__trend row items-center">
          <span class="stat-card__change" :style="{ color: trendColor }">
            {{ trendArrow }} {{ card.changePercent }}%
          </span>
          <span class="stat-card__compare">{{ card.comparePrevious }}</span>
        </div>
      </div>

      <!-- ฝั่งขวา: donut หรือ sparkline -->
      <div
        v-if="card.visual !== 'none'"
        class="col-auto column justify-center items-center stat-card__visual"
      >
        <template v-if="card.visual === 'donut'">
          <q-circular-progress
            :value="card.donutPercent ?? 0"
            size="60px"
            :thickness="0.18"
            :color="donutColorName"
            track-color="grey-3"
            show-value
            class="stat-card__donut"
          >
            <span class="stat-card__donut-value">{{ card.donutPercent ?? 0 }}%</span>
          </q-circular-progress>
          <div v-if="card.donutCaption" class="stat-card__visual-caption">
            {{ card.donutCaption }}
          </div>
        </template>

        <template v-else-if="card.visual === 'sparkline'">
          <VueApexCharts
            type="area"
            height="48"
            width="80"
            :options="sparklineOptions"
            :series="sparklineSeries"
          />
        </template>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { ExamReportStatCard } from 'src/types/exam-report.types';
import { getCssVar } from 'src/utils/css-var';

interface Props {
  card: ExamReportStatCard;
}

const props = defineProps<Props>();

const iconColor = computed((): string => getCssVar(props.card.iconColorVar));

const iconBoxStyle = computed((): Record<string, string> => ({
  backgroundColor: getCssVar(props.card.iconBgVar),
}));

const formattedValue = computed((): string => props.card.value.toLocaleString('en-US'));

const trendColor = computed((): string =>
  getCssVar(props.card.trend === 'down' ? '--exam-report-trend-down' : '--exam-report-trend-up'),
);

const trendArrow = computed((): string => {
  if (props.card.trend === 'up') return '▲';
  if (props.card.trend === 'down') return '▼';
  return '—';
});

// q-circular-progress รับชื่อสี Quasar — ผูกกับโทนของ donut ตามชนิดการ์ด
const donutColorName = computed((): string =>
  props.card.key === 'absent' ? 'negative' : 'positive',
);

const sparklineSeries = computed(() => [
  { name: props.card.label, data: props.card.sparkline ?? [] },
]);

const sparklineOptions = computed(
  (): ApexOptions => ({
    chart: { type: 'area', sparkline: { enabled: true } },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
    colors: [getCssVar('--exam-report-stat-score')],
    tooltip: { enabled: false },
  }),
);
</script>

<style scoped lang="scss">
.stat-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--exam-report-card-shadow) !important;
  height: 100%;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md) !important;
  }

  &__body {
    gap: 12px;
    min-height: 126px;
  }

  &__icon-box {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-weight: 600;
  }

  &__value {
    font-size: 26px;
    font-weight: 700;
    color: var(--neutral-900);
    line-height: 1.2;
  }

  &__trend {
    gap: 6px;
    flex-wrap: wrap;
  }

  &__change {
    font-size: var(--font-size-xs);
    font-weight: 600;
  }

  &__compare {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }

  &__visual {
    min-width: 80px;
  }

  &__donut-value {
    font-size: var(--font-size-xs);
    font-weight: 700;
    color: var(--neutral-900);
  }

  &__visual-caption {
    margin-top: 4px;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    text-align: center;
  }
}
</style>
