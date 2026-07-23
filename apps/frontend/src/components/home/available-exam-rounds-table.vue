<template>
  <div class="available-exam-rounds-table q-mb-lg">
    <!-- Section Header -->
    <div class="row items-center q-mb-md">
      <div class="section-icon q-mr-sm">
        <q-icon name="event" color="white" size="18px" />
      </div>
      <div class="text-h6 text-weight-bolder text-dark">
        {{ props.title || $t('home.availableRoundsTitle') }}
      </div>
    </div>
    <q-separator color="grey-6" class="q-mb-md" />

    <!-- Table -->
    <BaseTable
      class="custom-border"
      :columns="columns"
      :rows="filteredRounds"
      :loading="isLoading"
      :pagination="pagination"
      :empty-label="
        error
          ? error
          : filteredRounds.length === 0
            ? props.emptyLabel || $t('components.baseTable.emptyLabel')
            : ''
      "
      hide-pagination
      @request="onTableRequest"
    >
      <!-- Round Number Column -->
      <template v-slot:body-cell-roundNumber="{ row }">
        <div class="text-center text-weight-bold">
          {{ row.roundNumber }}
        </div>
      </template>

      <!-- Exam Date Column -->
      <template v-slot:body-cell-examDate="{ row }">
        <div class="text-center">
          {{ formatDateShort(row.examDate) }}
        </div>
      </template>

      <!-- Registration Period Column -->
      <template v-slot:body-cell-regPeriod="{ row }">
        <div class="text-center">
          {{ formatDateRange(row.regStartDate, row.regEndDate) }}
        </div>
      </template>

      <!-- Registration Duration Column -->
      <template v-slot:body-cell-regDuration="{ row }">
        <div class="text-center">
          {{ formatRegDuration(row.regStartDate, row.regEndDate) }}
        </div>
      </template>

      <!-- Action Column -->
      <template v-slot:body-cell-action="{ row }">
        <div class="text-center">
          <q-btn
            flat
            dense
            outline
            color="primary"
            class="text-weight-bold"
            :label="$t('home.availableRounds.table.columns.viewDetails')"
            @click="handleViewDetails(row)"
          />
        </div>
      </template>
    </BaseTable>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import type { QTableColumn } from 'quasar';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import BaseTable from '../shared/base-table.vue';
import {
  useAvailableExamRounds,
  type AvailableExamRound,
} from 'src/composables/use-available-exam-rounds';
import { useAppDate } from 'src/composables/useAppDate';

// Constants
const EXAM_SCHEDULE_PATH = '/user/exam-schedule' as const;
const DEFAULT_PAGE = 1 as const;
const DEFAULT_ROWS_PER_PAGE = 4 as const;
const COLUMN_ROUND_WIDTH = 'width: 12%' as const;
const COLUMN_DATE_WIDTH = 'width: 18%' as const;
const COLUMN_REG_PERIOD_WIDTH = 'width: 24%' as const;
const COLUMN_REG_DURATION_WIDTH = 'width: 16%' as const;
const COLUMN_ACTION_WIDTH = 'width: 16%' as const;

interface Props {
  title?: string;
  emptyLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  emptyLabel: '',
});

const emit = defineEmits<{
  (e: 'select', roundId: string): void;
}>();

const router = useRouter();
const { t } = useI18n();
const { formatDateShort, formatDateRange, calcDaysDiff } = useAppDate();

const formatRegDuration = (regStartDate: string, regEndDate: string): string => {
  if (!regStartDate || !regEndDate) return '-';
  // Inclusive day count: same-day window = 1 day
  const days = calcDaysDiff(regStartDate, regEndDate) + 1;
  return `${days} ${t('common.day', days)}`;
};
const { filteredRounds, isLoading, error, fetchAvailableRounds } = useAvailableExamRounds();

// Pagination state
const pagination = computed(() => ({
  page: DEFAULT_PAGE,
  rowsPerPage: DEFAULT_ROWS_PER_PAGE,
  rowsNumber: filteredRounds.value.length,
}));

// Table columns definition (5 columns)
const columns = computed((): QTableColumn[] => [
  {
    name: 'roundNumber',
    label: t('home.availableRounds.table.columns.round') ?? 'รอบที่',
    field: 'roundNumber',
    align: 'center',
    style: COLUMN_ROUND_WIDTH,
  },
  {
    name: 'examDate',
    label: t('home.availableRounds.table.columns.date') ?? 'วันที่สอบ',
    field: 'examDate',
    align: 'center',
    style: COLUMN_DATE_WIDTH,
  },
  {
    name: 'regPeriod',
    label: t('home.availableRounds.table.columns.regPeriod') ?? 'เปิดรับสมัคร',
    field: 'regStartDate',
    align: 'center',
    style: COLUMN_REG_PERIOD_WIDTH,
  },
  {
    name: 'regDuration',
    label: t('home.availableRounds.table.columns.regDuration') ?? 'ระยะเวลาสมัคร',
    field: 'regEndDate',
    align: 'center',
    style: COLUMN_REG_DURATION_WIDTH,
  },
  {
    name: 'action',
    label: t('home.availableRounds.table.columns.action') ?? '',
    field: 'action',
    align: 'center',
    style: COLUMN_ACTION_WIDTH,
  },
]);

const handleViewDetails = async (row: AvailableExamRound): Promise<void> => {
  emit('select', row.id);
  // Navigate to exam schedule page with date
  await router.push({
    path: EXAM_SCHEDULE_PATH,
    query: { date: row.examDate },
  });
};

const onTableRequest = (): void => {
  // Handle pagination or filtering if needed in the future
};

// Fetch data on mount
onMounted(async () => {
  await fetchAvailableRounds();
});
</script>

<style scoped lang="scss">
.available-exam-rounds-table {
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 10px;
}

.custom-border {
  :deep(.base-table),
  :deep(.q-table__container) {
    border: 2px solid var(--q-primary) !important;
  }
}

.section-icon {
  background: var(--q-primary);
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
