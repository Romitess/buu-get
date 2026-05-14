<template>
  <q-table
    flat
    bordered
    :rows="rows"
    :columns="columns"
    :loading="loading"
    :pagination="pagination"
    :no-data-label="emptyLabel"
    @request="onRequest"
    class="base-table"
  >
    <template v-slot:body="props">
      <slot name="body" v-bind="props">
        <q-tr :props="props">
          <q-td v-for="col in props.cols" :key="col.name" :props="props">
            <slot
              :name="`body-cell-${col.name}`"
              v-bind="{ row: props.row, col, value: col.value }"
            >
              {{ col.value }}
            </slot>
          </q-td>
        </q-tr>
      </slot>
    </template>

    <template v-slot:pagination="scope">
      <div
        class="row items-center justify-end full-width q-gutter-x-md text-grey-8"
        style="font-size: 12px"
      >
        <div class="row items-center q-gutter-x-sm">
          <span>จำนวนต่อหน้า</span>
          <q-select
            v-model="scope.pagination.rowsPerPage"
            :options="[10, 25, 50]"
            dense
            outlined
            options-dense
            class="pagination-select"
            @update:model-value="
              scope.pagination.page = 1;
              scope.pagination.rowsPerPage = $event;
            "
          />
        </div>

        <div>
          แสดงข้อมูล {{ scope.pagination.rowsPerPage * (scope.pagination.page - 1) + 1 }} ถึง
          {{
            Math.min(
              scope.pagination.rowsPerPage * scope.pagination.page,
              scope.pagination.rowsNumber || 0,
            )
          }}
          จาก {{ scope.pagination.rowsNumber || 0 }} รายการ
        </div>

        <div class="row items-center no-wrap">
          <q-btn
            icon="first_page"
            round
            dense
            flat
            :disable="scope.isFirstPage"
            @click="scope.firstPage"
            size="sm"
          />
          <q-btn
            icon="chevron_left"
            round
            dense
            flat
            :disable="scope.isFirstPage"
            @click="scope.prevPage"
            size="sm"
          />
          <q-btn
            icon="chevron_right"
            round
            dense
            flat
            :disable="scope.isLastPage"
            @click="scope.nextPage"
            size="sm"
          />
          <q-btn
            icon="last_page"
            round
            dense
            flat
            :disable="scope.isLastPage"
            @click="scope.lastPage"
            size="sm"
          />
        </div>
      </div>
    </template>

    <template v-slot:loading>
      <q-inner-loading showing color="primary">
        <q-spinner-dots size="50px" color="primary" />
      </q-inner-loading>
    </template>
  </q-table>
</template>

<script setup lang="ts" generic="T">
import type { QTableColumn } from 'quasar';

import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';

interface Props {
  columns: QTableColumn[];
  rows: T[];
  loading?: boolean | undefined;
  pagination?: PaginationModel | undefined;
  emptyLabel?: string | undefined;
}

withDefaults(defineProps<Props>(), {
  emptyLabel: 'ไม่พบข้อมูล',
});

const emit = defineEmits<{
  (e: 'request', requestProps: TableRequestProps): void;
}>();

const onRequest = (props: TableRequestProps) => {
  emit('request', props);
};
</script>

<style scoped lang="scss">
.base-table {
  border-radius: var(--radius-sm);
  overflow: hidden;

  :deep(thead tr th) {
    background-color: var(--primary) !important;
    color: white !important;
    font-weight: 600;
    font-size: var(--font-size-xs); // 13px — compact header
    padding: 10px 12px;
    text-align: center !important;
  }

  :deep(tbody tr td) {
    font-size: var(--font-size-xs); // 13px — compact body
    color: var(--text-primary);
    border-color: var(--border-color);
    white-space: normal !important;
    word-break: break-word;
    line-height: 1.4;
    padding: 8px 12px;
  }

  :deep(tbody tr) {
    height: auto;
  }
}

.pagination-select {
  width: 60px;
  :deep(.q-field__control) {
    height: 28px;
    min-height: 28px;
    padding: 0 8px;
  }
  :deep(.q-field__native),
  :deep(.q-field__append) {
    min-height: 28px;
  }
}
</style>
