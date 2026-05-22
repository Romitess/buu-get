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
          class="q-mr-sm registration-progress"
        />
        <span class="text-caption text-weight-medium registration-text">
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
          v-bind="getBtnProps(btn)"
          :tooltip="getActionTooltip(btn, row)"
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
import { ROLES } from 'src/constants/roles';
import { NOTIFY_MSG } from 'src/constants/exam';
import {
  type ExamSchedule,
  type PaginationModel,
  type Role,
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
  (e: 'viewScore', id: string): void;
  (e: 'printAdmitCard', id: string): void;
  (e: 'moodle', id: string): void;
}>();

const TABLE_ACTIONS = {
  MOODLE: 'moodle',
  EDIT: 'edit',
  DELETE: 'delete',
  MANAGE_REGISTRANTS: 'manageRegistrants',
  MANAGE_SEATS: 'manageSeats',
  VIEW_CANDIDATES: 'viewCandidates',
  VEIW_SCORE: 'viewScore',
} as const;

// 🛠️ สร้าง Interface ใหม่เพื่อตัดปัญหา Property คัดค้านกันเอง
interface CustomToolButton {
  icon?: string;
  image?: string;
  color: string;
  tooltip: string;
  emit: string;
}

// Logic to detect duplicate dates in the current table data
const duplicateDates = computed(() => {
  const counts: Record<string, number> = {};
  props.exams.forEach((exam) => {
    if (!exam.examDate) return;
    counts[exam.examDate] = (counts[exam.examDate] || 0) + 1;
  });
  return Object.keys(counts).filter((date) => (counts[date] ?? 0) > 1);
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
  if (ratio >= 0.9) return 'primary';
  if (ratio >= 0.5) return 'secondary';
  return 'blue-3';
};

const TOOL_BUTTONS = computed<Record<Role, CustomToolButton[]>>(() => ({
  [ROLES.STAFF]: [
    {
      image: '/moodle-icon.png',
      color: 'primary',
      tooltip: t('admin.examManagement.table.tooltips.moodle'),
      emit: TABLE_ACTIONS.MOODLE,
    },
    {
      icon: 'edit',
      color: 'secondary',
      tooltip: t('admin.examManagement.table.tooltips.edit'),
      emit: TABLE_ACTIONS.EDIT,
    },
    {
      icon: 'delete',
      color: 'negative',
      tooltip: t('admin.examManagement.table.tooltips.delete'),
      emit: TABLE_ACTIONS.DELETE,
    },
  ],
  [ROLES.REGISTRATION_OFFICER]: [
    {
      icon: 'group',
      color: 'primary',
      tooltip: t('admin.examManagement.table.tooltips.manageRegistrants'),
      emit: TABLE_ACTIONS.MANAGE_REGISTRANTS,
    },
    {
      icon: 'event_seat',
      color: 'primary',
      tooltip: t('admin.examManagement.table.tooltips.manageSeats'),
      emit: TABLE_ACTIONS.MANAGE_SEATS,
    },
    {
      icon: 'format_list_bulleted',
      color: 'primary',
      tooltip: t('admin.examManagement.table.tooltips.viewCandidates'),
      emit: TABLE_ACTIONS.VIEW_CANDIDATES,
    },
    {
      icon: 'description',
      color: 'primary',
      tooltip: t('admin.examManagement.table.tooltips.manageScores'),
      emit: TABLE_ACTIONS.VEIW_SCORE,
    },
  ],
  [ROLES.ADMIN]: [
    {
      icon: 'edit',
      color: 'secondary',
      tooltip: t('admin.examManagement.table.tooltips.edit'),
      emit: TABLE_ACTIONS.EDIT,
    },
    {
      icon: 'delete',
      color: 'negative',
      tooltip: t('admin.examManagement.table.tooltips.delete'),
      emit: TABLE_ACTIONS.DELETE,
    },
    {
      icon: 'group',
      color: 'primary',
      tooltip: t('admin.examManagement.table.tooltips.manageRegistrants'),
      emit: TABLE_ACTIONS.MANAGE_REGISTRANTS,
    },
    {
      icon: 'event_seat',
      color: 'primary',
      tooltip: t('admin.examManagement.table.tooltips.manageSeats'),
      emit: TABLE_ACTIONS.MANAGE_SEATS,
    },
    {
      icon: 'format_list_bulleted',
      color: 'primary',
      tooltip: t('admin.examManagement.table.tooltips.viewCandidates'),
      emit: TABLE_ACTIONS.VIEW_CANDIDATES,
    },
    {
      icon: 'docs',
      color: 'primary',
      tooltip: t('admin.examManagement.table.tooltips.manageScores'),
      emit: TABLE_ACTIONS.VEIW_SCORE,
    },
  ],
}));

const getBtnProps = (btn: CustomToolButton) => {
  const propsObj: Record<string, string> = { color: btn.color };
  if (btn.icon) propsObj.icon = btn.icon;
  if (btn.image) propsObj.image = btn.image;
  return propsObj;
};

const isActionDisabled = (emitName: string, row: ExamSchedule): boolean => {
  if (
    row.status === 'published' &&
    (emitName === TABLE_ACTIONS.EDIT || emitName === TABLE_ACTIONS.DELETE)
  ) {
    return true;
  }

  if (emitName === TABLE_ACTIONS.MANAGE_SEATS) {
    if ('isAllVerifyPassed' in row && row.isAllVerifyPassed === false) {
      return true;
    }
  }

  if (emitName === TABLE_ACTIONS.VIEW_CANDIDATES || emitName === TABLE_ACTIONS.VEIW_SCORE) {
    if (!row.examDate) return true;

    const examDate = new Date(row.examDate);
    const today = new Date();

    examDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return today < examDate;
  }

  return false;
};

const getActionTooltip = (btn: CustomToolButton, row: ExamSchedule): string => {
  if (
    btn.emit === TABLE_ACTIONS.MANAGE_SEATS &&
    'isAllVerifyPassed' in row &&
    row.isAllVerifyPassed === false
  ) {
    return t('admin.examManagement.table.tooltips.manageSeatsDisabled');
  }

  if (btn.emit === TABLE_ACTIONS.VEIW_SCORE || btn.emit === TABLE_ACTIONS.VIEW_CANDIDATES) {
    if (row.examDate) {
      const examDate = new Date(row.examDate);
      const today = new Date();
      examDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (today < examDate) {
        return btn.emit === TABLE_ACTIONS.VEIW_SCORE
          ? t('admin.examManagement.table.tooltips.manageScoresDisabled')
          : t('admin.examManagement.table.tooltips.viewCandidatesDisabled');
      }
    }
  }

  return btn.tooltip;
};

const handleAction = (emitName: string, id: string) => {
  if (emitName === TABLE_ACTIONS.DELETE) {
    $q.dialog({
      title: t('admin.examManagement.dialogs.delete.title'),
      message: t('admin.examManagement.dialogs.delete.message'),
      cancel: true,
      persistent: true,
    }).onOk(() => {
      emit(TABLE_ACTIONS.DELETE, id);
    });
  } else {
    switch (emitName) {
      case TABLE_ACTIONS.MOODLE:
        emit(TABLE_ACTIONS.MOODLE, id);
        break;
      case TABLE_ACTIONS.EDIT:
        emit(TABLE_ACTIONS.EDIT, id);
        break;
      case TABLE_ACTIONS.MANAGE_REGISTRANTS:
        emit(TABLE_ACTIONS.MANAGE_REGISTRANTS, id);
        break;
      case TABLE_ACTIONS.MANAGE_SEATS:
        emit(TABLE_ACTIONS.MANAGE_SEATS, id);
        break;
      case TABLE_ACTIONS.VIEW_CANDIDATES:
        emit(TABLE_ACTIONS.VIEW_CANDIDATES, id);
        break;
      case TABLE_ACTIONS.VEIW_SCORE:
        emit(TABLE_ACTIONS.VEIW_SCORE, id);
        break;
    }
  }
};

const onRequest = (req: TableRequestProps) => {
  emit('request', req);
};
</script>

<style scoped lang="scss">
.registration-progress {
  width: 120px;
}

.registration-text {
  min-width: 50px;
  text-align: left;
}
</style>
