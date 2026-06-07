<template>
  <BaseTable
    :columns="columns"
    :rows="passcodes"
    :loading="loading"
    :pagination="pagination"
    @request="onRequest"
  >
    <!-- Index Column -->
    <template v-slot:body-cell-index="{ row }">
      <div class="text-center">{{ getIndex(row) }}</div>
    </template>

    <!-- Full Name Column -->
    <template v-slot:body-cell-fullName="{ row }">
      <div class="text-center">{{ row.fullName }}</div>
    </template>

    <!-- Passcode Column -->
    <template v-slot:body-cell-passcode="{ row }">
      <div class="text-center">
        <span class="passcode-chip">{{ row.passcode }}</span>
      </div>
    </template>

    <!-- Used Date Column -->
    <template v-slot:body-cell-usedDate="{ row }">
      <div class="text-center">{{ formatThaiDate(row.usedDate) }}</div>
    </template>

    <!-- Used Time Column -->
    <template v-slot:body-cell-usedTime="{ row }">
      <div class="text-center">{{ row.usedTime }}</div>
    </template>
  </BaseTable>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import BaseTable from 'src/components/shared/base-table.vue';
import { useThaiDate } from 'src/composables/useThaiDate';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import type { PasscodeLog } from 'src/types/common';

interface Props {
  passcodes: PasscodeLog[];
  loading?: boolean;
  pagination?: PaginationModel;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'request', req: TableRequestProps): void;
}>();

const { formatThaiDate } = useThaiDate();
const { t } = useI18n();

const getIndex = (row: PasscodeLog): number => {
  const page = props.pagination?.page ?? 1;
  const rowsPerPage = props.pagination?.rowsPerPage ?? 10;
  const localIndex = props.passcodes.indexOf(row);
  return (page - 1) * rowsPerPage + localIndex + 1;
};

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'index',
    label: t('admin.passcodeHistory.table.columns.index'),
    field: 'index',
    align: 'center',
    style: 'width: 8%',
  },
  {
    name: 'fullName',
    label: t('admin.passcodeHistory.table.columns.fullName'),
    field: 'fullName',
    align: 'center',
    style: 'width: 30%',
  },
  {
    name: 'passcode',
    label: t('admin.passcodeHistory.table.columns.passcode'),
    field: 'passcode',
    align: 'center',
    style: 'width: 22%',
  },
  {
    name: 'usedDate',
    label: t('admin.passcodeHistory.table.columns.usedDate'),
    field: 'usedDate',
    align: 'center',
    style: 'width: 20%',
  },
  {
    name: 'usedTime',
    label: t('admin.passcodeHistory.table.columns.usedTime'),
    field: 'usedTime',
    align: 'center',
    style: 'width: 20%',
  },
]);

const onRequest = (req: TableRequestProps) => {
  emit('request', req);
};
</script>

<style scoped lang="scss">
.passcode-chip {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 600;
  letter-spacing: 0.08em;
}
</style>
