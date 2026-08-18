<template>
  <div class="home-section">
    <div class="home-section__intro">
      <HomeSectionHeader
        :icon="'event'"
        :title="props.title || $t('home.availableRoundsTitle')"
      />
      <q-separator color="grey-6" class="home-section-separator" />
    </div>

    <div class="home-section__body">
    <!-- Desktop table -->
    <BaseTable
      v-if="!$q.screen.lt.md"
      class="custom-border"
      :columns="columns"
      :rows="filteredRounds"
      :loading="isLoading"
      :pagination="pagination"
      :empty-label="emptyLabel"
      hide-pagination
      @request="onTableRequest"
    >
      <template v-slot:body-cell-roundNumber="{ row }">
        <div class="exam-name-cell text-weight-bold">
          <span class="exam-name-text">{{ row.roundNumber }}</span>
          <q-tooltip v-if="row.roundNumber" :delay="400">
            {{ row.roundNumber }}
          </q-tooltip>
        </div>
      </template>

      <template v-slot:body-cell-examDate="{ row }">
        <div class="text-center">
          {{ formatDateShort(row.examDate) }}
        </div>
      </template>

      <template v-slot:body-cell-regPeriod="{ row }">
        <div class="text-center">
          {{ formatDateRange(row.regStartDate, row.regEndDate) }}
        </div>
      </template>

      <template v-slot:body-cell-regDuration="{ row }">
        <div class="text-center">
          {{ formatRegDuration(row.regStartDate, row.regEndDate) }}
        </div>
      </template>

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

    <!-- Mobile card list -->
    <div v-else class="rounds-mobile-list">
      <div v-if="isLoading" class="rounds-mobile-list__loading">
        <q-skeleton v-for="n in 3" :key="n" type="rect" height="160px" class="rounds-mobile-skeleton" />
      </div>

      <div v-else-if="filteredRounds.length === 0" class="rounds-mobile-empty text-center q-pa-lg">
        <q-icon name="event_busy" size="40px" color="grey-5" />
        <p class="text-grey-7 q-mt-sm q-mb-none">{{ emptyLabel }}</p>
      </div>

      <AvailableExamRoundCard
        v-for="(round, index) in filteredRounds"
        v-else
        :key="round.id"
        :round="round"
        :style="{ '--stagger-index': index }"
        @select="handleViewDetails"
      />
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import type { QTableColumn } from 'quasar';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import BaseTable from '../shared/base-table.vue';
import HomeSectionHeader from './home-section-header.vue';
import AvailableExamRoundCard from './available-exam-round-card.vue';
import {
  useAvailableExamRounds,
  type AvailableExamRound,
} from 'src/composables/use-available-exam-rounds';
import { useAppDate } from 'src/composables/useAppDate';

const EXAM_SCHEDULE_PATH = '/user/exam-schedule' as const;
const DEFAULT_PAGE = 1 as const;
const DEFAULT_ROWS_PER_PAGE = 4 as const;
const COLUMN_ROUND_WIDTH = 'width: 24%' as const;
const COLUMN_DATE_WIDTH = 'width: 16%' as const;
const COLUMN_REG_PERIOD_WIDTH = 'width: 22%' as const;
const COLUMN_REG_DURATION_WIDTH = 'width: 14%' as const;
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

const $q = useQuasar();
const router = useRouter();
const { t, locale } = useI18n();
const { formatDateShort, formatDateRange, calcDaysDiff } = useAppDate();

const formatRegDuration = (regStartDate: string, regEndDate: string): string => {
  if (!regStartDate || !regEndDate) return '-';
  const days = calcDaysDiff(regStartDate, regEndDate) + 1;
  return `${days} ${t('common.day', days)}`;
};

const { filteredRounds, isLoading, error, fetchAvailableRounds } = useAvailableExamRounds();

const emptyLabel = computed((): string => {
  void locale.value;
  if (error.value) return error.value;
  if (filteredRounds.value.length === 0 && !isLoading.value) {
    return props.emptyLabel || t('home.availableRounds.noData');
  }
  return t('components.baseTable.emptyLabel');
});

const pagination = computed(() => ({
  page: DEFAULT_PAGE,
  rowsPerPage: DEFAULT_ROWS_PER_PAGE,
  rowsNumber: filteredRounds.value.length,
}));

const columns = computed((): QTableColumn[] => {
  void locale.value;
  return [
  {
    name: 'roundNumber',
    label: t('home.availableRounds.table.columns.round'),
    field: 'roundNumber',
    align: 'left',
    style: COLUMN_ROUND_WIDTH,
  },
  {
    name: 'examDate',
    label: t('home.availableRounds.table.columns.date'),
    field: 'examDate',
    align: 'center',
    style: COLUMN_DATE_WIDTH,
  },
  {
    name: 'regPeriod',
    label: t('home.availableRounds.table.columns.regPeriod'),
    field: 'regStartDate',
    align: 'center',
    style: COLUMN_REG_PERIOD_WIDTH,
  },
  {
    name: 'regDuration',
    label: t('home.availableRounds.table.columns.regDuration'),
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
  ];
});

const handleViewDetails = async (row: AvailableExamRound): Promise<void> => {
  emit('select', row.id);
  await router.push({
    path: EXAM_SCHEDULE_PATH,
    query: { date: row.examDate },
  });
};

const onTableRequest = (): void => {
  // Handle pagination or filtering if needed in the future
};

onMounted(async () => {
  await fetchAvailableRounds();
});
</script>

<style scoped lang="scss">
.custom-border {
  :deep(.base-table),
  :deep(.q-table__container) {
    border: 2px solid var(--q-primary) !important;
  }
}

.exam-name-cell {
  min-width: 0;
  padding: 0 4px;
}

.exam-name-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rounds-mobile-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rounds-mobile-list__loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rounds-mobile-skeleton {
  border-radius: 12px;
}

.rounds-mobile-empty {
  border: 1px dashed rgba(13, 71, 161, 0.2);
  border-radius: 12px;
  background: rgba(13, 71, 161, 0.03);
}
</style>
