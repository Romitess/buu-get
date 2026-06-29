<template>
  <div class="search-user-table-wrapper">
    <base-table
      :rows="rows"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      is-server-side
      empty-label="No data available in table"
      row-key="id"
      class="custom-bordered-table"
      @request="onRequest"
    >
      <!-- Custom rendering for payment status -->
      <template #body-cell-payment_status="props">
        <q-td :props="props" class="text-center">
          <span :class="getStatusColorClass(props.value)">
            {{ props.value }}
          </span>
        </q-td>
      </template>
    </base-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QTableColumn } from 'quasar';
import BaseTable from 'src/components/shared/base-table.vue';
import type { PaginationModel, SearchRow, TableRequestProps } from 'src/types/exam.types';

interface Props {
  rows: SearchRow[];
  pagination: PaginationModel;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'request', requestProps: TableRequestProps): void;
}>();

const { t } = useI18n();

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'id',
    field: 'id',
    label: t('admin.searchUser.table.index'),
    align: 'center',
    style: 'width: 6%',
    headerStyle: 'width: 6%',
    sortable: false,
  },
  {
    name: 'ref1',
    field: 'ref1',
    label: t('admin.searchUser.table.applicantId'),
    align: 'center',
    style: 'width: 17%; white-space: normal !important;',
    headerStyle: 'width: 17%; white-space: normal !important; line-height: 1.25;',
    sortable: false,
  },
  {
    name: 'ref2',
    field: 'ref2',
    label: t('admin.searchUser.table.referenceNo'),
    align: 'center',
    style: 'width: 17%; white-space: normal !important;',
    headerStyle: 'width: 17%; white-space: normal !important; line-height: 1.25;',
    sortable: false,
  },
  {
    name: 'name',
    field: 'name',
    label: t('admin.searchUser.table.fullName'),
    align: 'left',
    style: 'width: 16%; white-space: normal !important;',
    headerStyle: 'width: 16%; white-space: normal !important;',
    sortable: false,
  },
  {
    name: 'amount',
    field: 'amount',
    label: t('admin.searchUser.table.amount'),
    align: 'center',
    style: 'width: 10%',
    headerStyle: 'width: 10%',
    sortable: false,
  },
  {
    name: 'exam_name',
    field: 'exam_name',
    label: t('admin.searchUser.table.examName'),
    align: 'left',
    style: 'width: 20%; white-space: normal !important;',
    headerStyle: 'width: 20%; white-space: normal !important;',
    sortable: false,
  },
  {
    name: 'payment_status',
    field: 'payment_status',
    label: t('admin.searchUser.table.status'),
    align: 'center',
    style: 'width: 14%',
    headerStyle: 'width: 14%',
    sortable: false,
  },
]);

const onRequest = (requestProps: TableRequestProps): void => {
  emit('request', requestProps);
};

const getStatusColorClass = (status: string): string => {
  if (status === 'ชำระเงินแล้ว' || status === 'สำเร็จ') {
    return 'text-positive';
  }
  return 'text-dark';
};
</script>

<style scoped lang="scss">
.search-user-table-wrapper {
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-color);

  :deep(.q-table) {
    width: 100%;
    table-layout: fixed;
  }

  :deep(.q-table thead tr th) {
    background-color: var(--primary) !important;
    color: var(--text-on-primary) !important;
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    line-height: 1.25;
    padding: 8px 6px;
    border-right: 1px solid var(--white-alpha-20);
    vertical-align: middle;
    white-space: normal !important;
    word-break: keep-all;
  }

  :deep(.q-table thead tr th:last-child) {
    border-right: none;
  }

  :deep(.q-table tbody tr td) {
    border-right: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    font-size: var(--font-size-md);
    padding: 10px 6px;
    white-space: normal !important;
    word-break: break-word;
  }

  :deep(.q-table thead tr th:nth-child(1)),
  :deep(.q-table tbody tr td:nth-child(1)) {
    width: 6%;
  }

  :deep(.q-table thead tr th:nth-child(2)),
  :deep(.q-table tbody tr td:nth-child(2)) {
    width: 17%;
  }

  :deep(.q-table thead tr th:nth-child(3)),
  :deep(.q-table tbody tr td:nth-child(3)) {
    width: 17%;
  }

  :deep(.q-table thead tr th:nth-child(4)),
  :deep(.q-table tbody tr td:nth-child(4)) {
    width: 16%;
  }

  :deep(.q-table thead tr th:nth-child(5)),
  :deep(.q-table tbody tr td:nth-child(5)) {
    width: 10%;
  }

  :deep(.q-table thead tr th:nth-child(6)),
  :deep(.q-table tbody tr td:nth-child(6)) {
    width: 20%;
  }

  :deep(.q-table thead tr th:nth-child(7)),
  :deep(.q-table tbody tr td:nth-child(7)) {
    width: 14%;
  }

  :deep(.q-table tbody tr td:last-child) {
    border-right: none;
  }

  :deep(.q-table tbody tr:last-child td) {
    border-bottom: none;
  }

  :deep(.q-table__empty) {
    background-color: var(--surface-page) !important;
    color: var(--text-secondary) !important;
    padding: 16px !important;
    font-size: var(--font-size-md);
  }

  :deep(.custom-empty-bottom) {
    border-top: 1px solid var(--border-color);
    border-bottom-left-radius: var(--radius-md);
    border-bottom-right-radius: var(--radius-md);
  }

  :deep(.q-table__bottom) {
    border-top: 1px solid var(--border-color);
    border-bottom-left-radius: var(--radius-md);
    border-bottom-right-radius: var(--radius-md);
    background-color: var(--surface-card);
  }
}
</style>
