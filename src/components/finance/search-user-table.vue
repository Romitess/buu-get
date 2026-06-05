<template>
  <div class="search-user-table-wrapper">
    <base-table
      :rows="rows"
      :columns="columns"
      :loading="loading"
      empty-label="No data available in table"
      row-key="id"
      class="custom-bordered-table"
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
import type { SearchRow } from 'src/types/exam.types';

interface Props {
  rows: SearchRow[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

const { t } = useI18n();

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'id',
    field: 'id',
    label: t('admin.searchUser.table.index'),
    align: 'center',
    style: 'width: 5%',
    headerStyle: 'width: 5%',
  },
  {
    name: 'ref1',
    field: 'ref1',
    label: t('admin.searchUser.table.applicantId'),
    align: 'center',
    style: 'width: 13%; white-space: normal !important;',
    headerStyle: 'width: 13%; white-space: normal !important; line-height: 1.3;',
  },
  {
    name: 'ref2',
    field: 'ref2',
    label: t('admin.searchUser.table.referenceNo'),
    align: 'center',
    style: 'width: 13%; white-space: normal !important;',
    headerStyle: 'width: 13%; white-space: normal !important; line-height: 1.3;',
  },
  {
    name: 'name',
    field: 'name',
    label: t('admin.searchUser.table.fullName'),
    align: 'left',
    style: 'width: 28%; white-space: normal !important;',
    headerStyle: 'width: 28%; white-space: normal !important;',
  },
  {
    name: 'amount',
    field: 'amount',
    label: t('admin.searchUser.table.amount'),
    align: 'center',
    style: 'width: 8%',
    headerStyle: 'width: 8%',
  },
  {
    name: 'exam_name',
    field: 'exam_name',
    label: t('admin.searchUser.table.examName'),
    align: 'left',
    style: 'width: 20%; white-space: normal !important;',
    headerStyle: 'width: 20%; white-space: normal !important;',
  },
  {
    name: 'payment_status',
    field: 'payment_status',
    label: t('admin.searchUser.table.status'),
    align: 'center',
    style: 'width: 13%',
    headerStyle: 'width: 13%',
  },
]);

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

  :deep(.q-table thead tr th) {
    background-color: var(--primary) !important;
    color: var(--text-on-primary) !important;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    padding: 12px 8px;
    border-right: 1px solid var(--white-alpha-20);
  }

  :deep(.q-table thead tr th:last-child) {
    border-right: none;
  }

  :deep(.q-table tbody tr td) {
    border-right: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    font-size: var(--font-size-xs);
    padding: 10px 8px;
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
    font-size: var(--font-size-sm);
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
