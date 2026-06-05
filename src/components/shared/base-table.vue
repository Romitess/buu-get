<template>
  <div class="base-table-wrapper full-width">
    <q-table
      flat
      :rows="displayRows"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      :hide-bottom="hidePagination"
      always-paginated
      @request="onRequest"
      class="base-table"
    >
      <template v-if="$slots.header" v-slot:header="props">
        <slot name="header" v-bind="props" />
      </template>

      <template v-slot:body="props">
        <template v-if="(props.row as any).__empty">
          <q-tr>
            <q-td
              :colspan="columns.length"
              class="text-center text-grey-8"
              style="font-size: 13px; padding: 32px 16px; border-bottom: none"
            >
              {{ emptyLabel || $t('components.baseTable.emptyLabel') }}
            </q-td>
          </q-tr>
        </template>
        <template v-else>
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
      </template>

      <template v-slot:bottom="scope">
        <div
          class="row items-center justify-end full-width q-gutter-x-md text-grey-8"
          style="font-size: 12px"
        >
          <div class="row items-center q-gutter-x-sm">
            <span>{{ $t('components.baseTable.rowsPerPage') }}</span>
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
            {{ $t('components.baseTable.showing') }}
            {{
              (scope.pagination.rowsNumber || 0) === 0
                ? 0
                : scope.pagination.rowsPerPage * (scope.pagination.page - 1) + 1
            }}
            {{ $t('components.baseTable.to') }}
            {{
              Math.min(
                scope.pagination.rowsPerPage * scope.pagination.page,
                scope.pagination.rowsNumber || 0,
              )
            }}
            {{ $t('components.baseTable.ofItems', { total: scope.pagination.rowsNumber || 0 }) }}
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
  </div>
</template>

<script setup lang="ts" generic="T">
import { computed } from 'vue';
import type { QTableColumn } from 'quasar';

import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';

interface Props {
  columns: QTableColumn[];
  rows: T[];
  loading?: boolean | undefined;
  pagination?: PaginationModel | undefined;
  emptyLabel?: string | undefined;
  hidePagination?: boolean | undefined;
}

const props = withDefaults(defineProps<Props>(), {
  emptyLabel: '',
});

const emit = defineEmits<{
  (e: 'request', requestProps: TableRequestProps): void;
}>();

const displayRows = computed<T[]>(() =>
  props.rows && props.rows.length > 0 ? props.rows : ([{ __empty: true }] as T[]),
);

const onRequest = (requestProps: TableRequestProps): void => {
  emit('request', requestProps);
};
</script>

<style scoped lang="scss">
.base-table-wrapper {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.base-table {
  :deep(thead tr th) {
    background-color: var(--primary) !important;
    color: var(--text-on-primary) !important;
    font-weight: 600;
    font-size: var(--font-size-xs);
    padding: 10px 12px;
    text-align: center !important;
  }

  :deep(tbody tr td) {
    font-size: var(--font-size-xs);
    color: var(--text-primary);
    border-color: var(--border-color);
    white-space: normal !important;
    word-break: break-word;
    line-height: 1.4;
    padding: 8px 12px;
  }

  :deep(tr.q-table__bottom-item td) {
    background-color: var(--surface-page) !important;
    padding: 12px !important;
  }

  :deep(tbody tr) {
    height: auto;
  }
}

.pagination-select {
  width: 65px;
  :deep(.q-field__control) {
    height: 28px;
    min-height: 28px;
    padding: 0 8px;
    display: flex !important;
    align-items: center !important;
  }
  :deep(.q-field__native) {
    min-height: 28px !important;
    height: 28px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
  }
  :deep(.q-field__append) {
    min-height: 28px !important;
    height: 28px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
  }
}
</style>
