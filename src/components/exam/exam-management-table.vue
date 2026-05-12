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
      <div class="text-center">{{ EXAM_TYPE_LABELS[row.examType] || row.examType }}</div>
    </template>

    <!-- Date Column -->
    <template v-slot:body-cell-examDate="{ row }">
      <div class="text-center">{{ formatThaiDate(row.examDate) }}</div>
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
          style="width: 80px"
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
        {{ EXAM_STATUS_LABELS[row.status] || row.status }}
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
          @click="handleAction(btn.emit, row.id)"
        />
      </div>
    </template>
  </BaseTable>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';
import { useQuasar } from 'quasar';
import BaseTable from '../shared/BaseTable.vue';
import ActionButton from '../shared/ActionButton.vue';
import { useThaiDate } from 'src/composables/useThaiDate';
import {
  EXAM_TYPE_LABELS,
  EXAM_STATUS_LABELS,
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

defineProps<Props>();

const emit = defineEmits<{
  (e: 'request', req: TableRequestProps): void;
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
  (e: 'manageRegistrants', id: string): void;
  (e: 'printAdmitCard', id: string): void;
  (e: 'viewCandidates', id: string): void;
  (e: 'exportReport', id: string): void;
}>();

const { formatThaiDate } = useThaiDate();
const $q = useQuasar();

const columns: QTableColumn[] = [
  { name: 'examName', label: 'ชื่อการสอบ', field: 'examName', align: 'left' },
  { name: 'examType', label: 'ประเภท', field: 'examType', align: 'center' },
  { name: 'examDate', label: 'วันที่สอบ', field: 'examDate', align: 'center' },
  { name: 'examLocation', label: 'สถานที่สอบ', field: 'examLocation', align: 'left' },
  { name: 'registration', label: 'จำนวนการลงทะเบียน', field: 'registeredCount', align: 'center' },
  { name: 'status', label: 'สถานะ', field: 'status', align: 'center' },
  { name: 'tools', label: 'เครื่องมือ', field: 'tools', align: 'center' },
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

const TOOL_BUTTONS: Record<Role, ToolButtonConfig[]> = {
  staff: [
    { icon: 'edit', color: 'blue-6', tooltip: 'แก้ไข', emit: 'edit' },
    { icon: 'delete', color: 'red-6', tooltip: 'ลบ', emit: 'delete' },
  ],
  exam_operations_officer: [
    { icon: 'group', color: 'blue-6', tooltip: 'จัดการผู้ลงทะเบียน', emit: 'manageRegistrants' },
    { icon: 'event_seat', color: 'blue-6', tooltip: 'พิมพ์บัตรเข้าสอบ', emit: 'printAdmitCard' },
    {
      icon: 'format_list_bulleted',
      color: 'blue-6',
      tooltip: 'รายชื่อผู้สมัคร',
      emit: 'viewCandidates',
    },
    { icon: 'description', color: 'blue-6', tooltip: 'ส่งออกรายงาน', emit: 'exportReport' },
  ],
};

const handleAction = (emitName: string, id: string) => {
  if (emitName === 'delete') {
    $q.dialog({
      title: 'ยืนยันการลบ',
      message: 'คุณแน่ใจหรือไม่ว่าต้องการลบการสอบนี้?',
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
      case 'printAdmitCard':
        emit('printAdmitCard', id);
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
