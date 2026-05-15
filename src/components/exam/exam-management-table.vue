<template>
  <BaseTable
    :columns="columns"
    :rows="exams"
    :loading="loading"
    :pagination="pagination"
    @request="onRequest"
  >
    <!-- Type Column -->
    <template v-slot:body-cell-examType="{ row }">
      <div class="text-center">{{ $t(`admin.examManagement.types.${row.examType}`) }}</div>
    </template>

    <!-- Date Column -->
    <template v-slot:body-cell-examDate="{ row }">
      <div class="text-center row items-center justify-center no-wrap">
        <span>{{ formatThaiDate(row.examDate) }}</span>
        <q-icon
          v-if="isDuplicate(row.examDate)"
          name="warning"
          color="negative"
          size="18px"
          class="q-ml-xs cursor-pointer"
        >
          <q-tooltip class="bg-negative text-white text-body2">
            {{ NOTIFY_MSG.DUPLICATE_DATE }}
          </q-tooltip>
        </q-icon>
      </div>
    </template>

    <!-- Registration Progress Column -->
    <template v-slot:body-cell-registration="{ row }">
      <div class="row items-center justify-center no-wrap">
        <q-linear-progress
          rounded
          size="6px"
          :value="getRatio(row)"
          :color="getProgressColor(row)"
          track-color="grey-3"
          style="width: 120px"
          class="q-mr-sm"
        />
        <span class="text-caption text-weight-medium" style="min-width: 50px; text-align: left">
          {{ row.registeredCount }}/{{ row.capacity }}
        </span>
      </div>
    </template>

    <!-- Status Column -->
    <template v-slot:body-cell-status="{ row }">
      <div class="text-center text-body2">
        {{ $t(`admin.examManagement.status.${row.status}`) }}
      </div>
    </template>

    <!-- Tools Column -->
    <template v-slot:body-cell-tools="{ row }">
      <div class="row justify-center q-gutter-x-sm no-wrap">
        <ActionButton
          v-for="btn in TOOL_BUTTONS[role]"
          :key="btn.emit"
          :icon="btn.icon"
          :color="btn.color"
          :tooltip="btn.tooltip"
          :disable="isActionDisabled(btn.emit, row)"
          @click="handleAction(btn.emit, row.id)"
        />
      </div>
    </template>
  </BaseTable>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QTableColumn } from 'quasar';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import BaseTable from '../shared/base-table.vue';
import ActionButton from '../shared/action-button.vue';
import { useThaiDate } from 'src/composables/useThaiDate';
import { NOTIFY_MSG } from 'src/constants/exam';
import {
  type ExamSchedule,
  type PaginationModel,
  type Role,
  type ToolButtonConfig,
  type TableRequestProps,
} from 'src/types/exam.types';

interface Props {
  exams: ExamSchedule[];
  role: Role;
  loading?: boolean;
  pagination?: PaginationModel;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'request', req: TableRequestProps): void;
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
  (e: 'manageRegistrants', id: string): void;
  (e: 'manageSeats', id: string): void;
  (e: 'viewCandidates', id: string): void;
  (e: 'exportReport', id: string): void;
}>();

// Logic to detect duplicate dates in the current table data
const duplicateDates = computed(() => {
  const counts: Record<string, number> = {};
  props.exams.forEach((exam) => {
    if (!exam.examDate) return;
    counts[exam.examDate] = (counts[exam.examDate] || 0) + 1;
  });
  return Object.keys(counts).filter((date) => counts[date] > 1);
});

const isDuplicate = (date: string) => duplicateDates.value.includes(date);

const { formatThaiDate } = useThaiDate();
const { t } = useI18n();
const $q = useQuasar();

const columns: QTableColumn[] = [
  {
    name: 'examName',
    label: t('admin.examManagement.table.columns.examName'),
    field: 'examName',
    align: 'left',
    style: 'width: 20%',
  },
  {
    name: 'examType',
    label: t('admin.examManagement.table.columns.examType'),
    field: 'examType',
    align: 'center',
    style: 'width: 8%',
  },
  {
    name: 'examDate',
    label: t('admin.examManagement.table.columns.examDate'),
    field: 'examDate',
    align: 'center',
    style: 'width: 10%',
  },
  {
    name: 'examLocation',
    label: t('admin.examManagement.table.columns.examLocation'),
    field: 'examLocation',
    align: 'left',
    style: 'width: 22%',
  },
  {
    name: 'registration',
    label: t('admin.examManagement.table.columns.registration'),
    field: 'registeredCount',
    align: 'center',
    style: 'width: 18%',
  },
  {
    name: 'status',
    label: t('admin.examManagement.table.columns.status'),
    field: 'status',
    align: 'center',
    style: 'width: 10%',
  },
  {
    name: 'tools',
    label: t('admin.examManagement.table.columns.tools'),
    field: 'tools',
    align: 'center',
    style: 'width: 12%',
  },
];

const getRatio = (row: ExamSchedule) => {
  if (!row.capacity || row.capacity === 0) return 0;
  return row.registeredCount / row.capacity;
};

const getProgressColor = (row: ExamSchedule) => {
  const ratio = getRatio(row);
  if (ratio >= 0.9) return 'blue-9';
  if (ratio >= 0.5) return 'blue-6';
  return 'blue-3';
};

const TOOL_BUTTONS = computed<Record<Role, ToolButtonConfig[]>>(() => ({
  ['staff']: [
    {
      icon: 'edit',
      color: 'blue-6',
      tooltip: t('admin.examManagement.table.tooltips.edit'),
      emit: 'edit',
    },
    {
      icon: 'delete',
      color: 'red-6',
      tooltip: t('admin.examManagement.table.tooltips.delete'),
      emit: 'delete',
    },
  ],
  ['registration_officer']: [
    {
      icon: 'group',
      color: 'blue-6',
      tooltip: t('admin.examManagement.table.tooltips.manageRegistrants'),
      emit: 'manageRegistrants',
    },
    {
      icon: 'event_seat',
      color: 'blue-6',
      tooltip: t('admin.examManagement.table.tooltips.manageSeats'),
      emit: 'manageSeats',
    },
    {
      icon: 'format_list_bulleted',
      color: 'blue-6',
      tooltip: t('admin.examManagement.table.tooltips.viewCandidates'),
      emit: 'viewCandidates',
    },
    {
      icon: 'description',
      color: 'blue-6',
      tooltip: t('admin.examManagement.table.tooltips.exportReport'),
      emit: 'exportReport',
    },
  ],
  ['admin']: [
    {
      icon: 'edit',
      color: 'blue-6',
      tooltip: t('admin.examManagement.table.tooltips.edit'),
      emit: 'edit',
    },
    {
      icon: 'delete',
      color: 'red-6',
      tooltip: t('admin.examManagement.table.tooltips.delete'),
      emit: 'delete',
    },
    {
      icon: 'group',
      color: 'blue-6',
      tooltip: t('admin.examManagement.table.tooltips.manageRegistrants'),
      emit: 'manageRegistrants',
    },
    {
      icon: 'event_seat',
      color: 'blue-6',
      tooltip: t('admin.examManagement.table.tooltips.manageSeats'),
      emit: 'manageSeats',
    },
    {
      icon: 'format_list_bulleted',
      color: 'blue-6',
      tooltip: t('admin.examManagement.table.tooltips.viewCandidates'),
      emit: 'viewCandidates',
    },
    {
      icon: 'description',
      color: 'blue-6',
      tooltip: t('admin.examManagement.table.tooltips.exportReport'),
      emit: 'exportReport',
    },
  ],
}));

/**
 * Logic to disable specific actions based on business rules
 */
const isActionDisabled = (emitName: string, row: ExamSchedule): boolean => {
  if (emitName === 'viewCandidates') {
    if (!row.examDate) return true;

    // Convert YYYY-MM-DD or ISO to Date object
    const examDate = new Date(row.examDate);
    const today = new Date();

    // Set both to midnight to compare only dates
    examDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Disable if today is before exam date
    return today < examDate;
  }
  return false;
};

const handleAction = (emitName: string, id: string) => {
  if (emitName === 'delete') {
    $q.dialog({
      title: t('admin.examManagement.dialogs.delete.title'),
      message: t('admin.examManagement.dialogs.delete.message'),
      cancel: true,
      persistent: true,
    }).onOk(() => {
      emit('delete', id);
    });
  } else {
    switch (emitName) {
      case 'edit':
        emit('edit', id);
        break;
      case 'manageRegistrants':
        emit('manageRegistrants', id);
        break;
      case 'manageSeats':
        emit('manageSeats', id);
        break;
      case 'viewCandidates':
        emit('viewCandidates', id);
        break;
      case 'exportReport':
        emit('exportReport', id);
        break;
    }
  }
};

const onRequest = (req: TableRequestProps) => {
  emit('request', req);
};
</script>
