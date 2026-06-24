<template>
  <q-card flat bordered class="rounds-card">
    <q-card-section>
      <div class="rounds-card__title">{{ t('admin.examReport.table.title') }}</div>
      <q-table
        flat
        :rows="rows"
        :columns="columns"
        row-key="round"
        :loading="loading"
        :pagination="pagination"
        :rows-per-page-options="[6, 10, 20]"
        class="rounds-table"
      >
        <template v-slot:body-cell-registered="props">
          <q-td :props="props">{{ formatNumber(props.row.registered) }}</q-td>
        </template>
        <template v-slot:body-cell-attended="props">
          <q-td :props="props">{{ formatNumber(props.row.attended) }}</q-td>
        </template>
        <template v-slot:body-cell-absent="props">
          <q-td :props="props">{{ formatNumber(props.row.absent) }}</q-td>
        </template>
        <template v-slot:body-cell-tools="props">
          <q-td :props="props">
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="people_outline"
              :disable="props.row.registered === null"
              @click="emit('view-registrants', props.row)"
            >
              <q-tooltip>{{ t('admin.examReport.table.viewRegistrants') }}</q-tooltip>
            </q-btn>
          </q-td>
        </template>
        <template v-slot:no-data>
          <div class="full-width text-center text-grey-6 q-pa-md">
            {{ t('admin.examReport.table.emptyLabel') }}
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
import type { ExamReportRoundRow } from 'src/types/exam-report.types';

const { t } = useI18n();

interface Props {
  rows: ExamReportRoundRow[];
  loading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'view-registrants', row: ExamReportRoundRow): void;
}>();

const pagination = { rowsPerPage: 6 };

const formatNumber = (value: number | null): string =>
  value === null ? '-' : value.toLocaleString('en-US');

const columns = computed((): QTableColumn<ExamReportRoundRow>[] => [
  {
    name: 'round',
    label: t('admin.examReport.table.columns.round'),
    field: 'round',
    align: 'left',
  },
  {
    name: 'date',
    label: t('admin.examReport.table.columns.date'),
    field: 'date',
    align: 'left',
  },
  {
    name: 'registered',
    label: t('admin.examReport.table.columns.registered'),
    field: 'registered',
    align: 'center',
  },
  {
    name: 'attended',
    label: t('admin.examReport.table.columns.attended'),
    field: 'attended',
    align: 'center',
  },
  {
    name: 'absent',
    label: t('admin.examReport.table.columns.absent'),
    field: 'absent',
    align: 'center',
  },
  {
    name: 'tools',
    label: t('admin.examReport.table.columns.tools'),
    field: 'round',
    align: 'center',
  },
]);
</script>

<style scoped lang="scss">
.rounds-card {
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

.rounds-table {
  // จำกัดความสูงของส่วน body ให้ scroll เมื่อแถวเพิ่ม (header ค้างบน, pagination อยู่ล่าง)
  :deep(.q-table__middle) {
    max-height: 300px;
  }

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
