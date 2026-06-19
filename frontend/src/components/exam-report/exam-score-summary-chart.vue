<template>
  <q-card flat bordered class="chart-card">
    <q-card-section>
      <!-- title + legend อยู่แถวเดียวกัน (legend ชิดขวา) ตาม Figma -->
      <div class="chart-card__header">
        <div class="chart-card__title">{{ t('admin.examReport.charts.scoreSummaryTitle') }}</div>
        <div class="chart-card__legend">
          <span
            v-for="item in legendItems"
            :key="item.name"
            class="legend-item"
            :class="{ 'legend-item--hidden': hiddenSeries.has(item.name) }"
            @click="toggleSeries(item.name)"
          >
            <span class="legend-dot" :style="{ backgroundColor: item.color }" />
            {{ item.name }}
          </span>
        </div>
      </div>
      <VueApexCharts
        ref="chartRef"
        type="bar"
        height="320"
        :options="chartOptions"
        :series="series"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useI18n } from 'vue-i18n';
import type { ExamScoreSummaryChartData } from 'src/types/exam-report.types';
import { getCssVar } from 'src/utils/css-var';

const { t } = useI18n();

interface Props {
  data: ExamScoreSummaryChartData;
}

const props = defineProps<Props>();

const series = computed(() => props.data.series.map((s) => ({ name: s.name, data: s.data })));

// legend แบบ custom เพื่อให้อยู่แถวเดียวกับ title ของการ์ด
const legendItems = computed(() =>
  props.data.series.map((s) => ({ name: s.name, color: getCssVar(s.colorVar) })),
);

// คลิก legend เพื่อ toggle series (show/hide) เหมือน legend ปกติ
const chartRef = ref<InstanceType<typeof VueApexCharts>>();
const hiddenSeries = ref<Set<string>>(new Set());

const toggleSeries = (name: string): void => {
  chartRef.value?.toggleSeries(name);
  const next = new Set(hiddenSeries.value);
  if (next.has(name)) {
    next.delete(name);
  } else {
    next.add(name);
  }
  hiddenSeries.value = next;
};

const chartOptions = computed(
  (): ApexOptions => ({
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    colors: props.data.series.map((s) => getCssVar(s.colorVar)),
    plotOptions: {
      bar: { horizontal: true, barHeight: '60%', borderRadius: 2 },
    },
    dataLabels: {
      enabled: true,
      style: { fontSize: '10px', colors: [getCssVar('--text-on-primary')] },
    },
    grid: { borderColor: getCssVar('--border-color'), strokeDashArray: 4 },
    xaxis: {
      categories: props.data.years,
      title: { text: t('admin.examReport.charts.peopleUnit') },
    },
    // ปิด legend ในตัวกราฟ — ใช้ legend custom ในแถว title แทน
    legend: { show: false },
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

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  &__title {
    font-size: var(--font-size-md);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__legend {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 12px;
  }
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: opacity var(--transition-fast);

  &--hidden {
    opacity: 0.4;
  }
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}
</style>
