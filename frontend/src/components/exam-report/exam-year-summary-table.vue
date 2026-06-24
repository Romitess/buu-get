<template>
  <q-card flat bordered class="year-table-card">
    <q-card-section>
      <div class="year-table-card__title">{{ t('admin.examReport.yearTable.title') }}</div>
      <q-table
        flat
        :rows="rows"
        :columns="columns"
        row-key="year"
        :loading="loading"
        :pagination="pagination"
        :rows-per-page-options="[5, 10, 20]"
        class="year-table"
      >
        <template v-slot:body-cell-detail="props">
          <q-td :props="props">
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="people_outline"
              @click="emit('view-detail', props.row)"
            >
              <q-tooltip>{{ t('admin.examReport.yearTable.viewDetail') }}</q-tooltip>
            </q-btn>
          </q-td>
        </template>
        <template v-slot:no-data>
          <div class="full-width text-center text-grey-6 q-pa-md">
            {{ t('admin.examReport.yearTable.empty') }}
          </div>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { ExamYearTableRow } from 'src/types/exam-report.types';

const { t } = useI18n();

interface Props {
  rows: ExamYearTableRow[];
  loading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'view-detail', row: ExamYearTableRow): void;
}>();

const pagination = { rowsPerPage: 5 };

const intText = (value: number): string => value.toLocaleString('en-US');
const numText = (value: number | null): string =>
  value === null ? '-' : value.toLocaleString('en-US', { maximumFractionDigits: 2 });

const columns = computed((): QTableColumn<ExamYearTableRow>[] => [
  {
    name: 'year',
    label: t('admin.examReport.yearTable.columns.year'),
    field: 'year',
    align: 'left',
  },
  {
    name: 'registered',
    label: t('admin.examReport.yearTable.columns.registered'),
    field: 'registered',
    align: 'center',
    format: intText,
  },
  {
    name: 'attended',
    label: t('admin.examReport.yearTable.columns.attended'),
    field: 'attended',
    align: 'center',
    format: intText,
  },
  {
    name: 'absent',
    label: t('admin.examReport.yearTable.columns.absent'),
    field: 'absent',
    align: 'center',
    format: intText,
  },
  {
    name: 'repeatTakers',
    label: t('admin.examReport.yearTable.columns.repeatTakers'),
    field: 'repeatTakers',
    align: 'center',
    format: intText,
  },
  {
    name: 'minScore',
    label: t('admin.examReport.yearTable.columns.minScore'),
    field: 'minScore',
    align: 'center',
    format: numText,
  },
  {
    name: 'maxScore',
    label: t('admin.examReport.yearTable.columns.maxScore'),
    field: 'maxScore',
    align: 'center',
    format: numText,
  },
  {
    name: 'averageScore',
    label: t('admin.examReport.yearTable.columns.averageScore'),
    field: 'averageScore',
    align: 'center',
    format: numText,
  },
  {
    name: 'detail',
    label: t('admin.examReport.yearTable.columns.detail'),
    field: 'year',
    align: 'center',
  },
]);
</script>

<style scoped lang="scss">
.year-table-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--exam-report-card-shadow) !important;

  &__title {
    font-size: var(--font-size-md);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12px;
  }
}

.year-table {
  :deep(thead tr th) {
    background-color: var(--primary);
    color: var(--text-on-primary);
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 1;
  }
}
</style>
