<template>
  <div class="base-table-wrapper full-width">
    <q-table
      flat
      :rows="displayRows"
      :columns="sortableColumns"
      :row-key="resolveRowKey"
      :loading="showTableLoading"
      v-model:pagination="internalPagination"
      :rows-per-page-options="[]"
      :hide-bottom="hidePagination"
      always-paginated
      @request="onRequest"
      class="base-table"
    >
      <template v-if="$slots.header" v-slot:header="props">
        <slot name="header" v-bind="props" />
      </template>

      <template v-slot:body="props">
        <TableSkeleton
          v-if="(props.row as SkeletonRow).__skeleton"
          :key="props.key"
          :row-props="props"
        />
        <q-tr v-else-if="(props.row as SkeletonRow).__empty" :key="props.key">
          <q-td
            :colspan="sortableColumns.length"
            class="base-table-empty-cell text-center text-grey-8"
          >
            {{ emptyLabel || $t('components.baseTable.emptyLabel') }}
          </q-td>
        </q-tr>
        <template v-else>
          <slot name="body" v-bind="props">
            <q-tr :key="props.key" :props="props">
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

      <template v-slot:bottom>
        <div
          class="base-table-bottom row items-center justify-end full-width q-gutter-x-md text-grey-8"
        >
          <div class="row items-center q-gutter-x-sm">
            <span>{{ $t('components.baseTable.rowsPerPage') }}</span>
            <q-select
              v-model="internalPagination.rowsPerPage"
              :options="rowsPerPageOptions"
              dense
              outlined
              options-dense
              class="pagination-select"
              @update:model-value="
                (val: number) => {
                  internalPagination.rowsPerPage = val;
                  onRequest({ pagination: buildPagination(1) });
                }
              "
            />
          </div>

          <div>
            {{ $t('components.baseTable.showing') }}
            {{
              (internalPagination.rowsNumber || 0) === 0
                ? 0
                : internalPagination.rowsPerPage * (internalPagination.page - 1) + 1
            }}
            {{ $t('components.baseTable.to') }}
            {{
              Math.min(
                internalPagination.rowsPerPage * internalPagination.page,
                internalPagination.rowsNumber || 0,
              )
            }}
            {{ $t('components.baseTable.ofItems', { total: internalPagination.rowsNumber || 0 }) }}
          </div>

          <div class="row items-center no-wrap">
            <q-btn
              icon="first_page"
              round
              dense
              flat
              size="sm"
              :disable="isFirstPage"
              @click="goToFirstPage()"
            />
            <q-btn
              icon="chevron_left"
              round
              dense
              flat
              size="sm"
              :disable="isFirstPage"
              @click="goToPrevPage()"
            />
            <q-btn
              icon="chevron_right"
              round
              dense
              flat
              size="sm"
              :disable="isLastPage"
              @click="goToNextPage()"
            />
            <q-btn
              icon="last_page"
              round
              dense
              flat
              size="sm"
              :disable="isLastPage"
              @click="goToLastPage()"
            />
          </div>
        </div>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts" generic="T extends object">
import { computed, ref, watch } from 'vue';
import type { QTableColumn } from 'quasar';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import { TableSkeleton } from 'src/components/base/skeleton';
import {
  createEmptyRow,
  createSkeletonRows,
  resolveTableRowKey,
  type PlaceholderRow,
} from './base-table-row-keys';

type SkeletonRow = PlaceholderRow;

const resolveRowKey = (row: T): string | number => resolveTableRowKey(row);

interface Props {
  columns: QTableColumn[];
  rows: T[];
  loading?: boolean | undefined;
  pagination?: PaginationModel | undefined;
  rowsPerPageOptions?: number[] | undefined;
  emptyLabel?: string | undefined;
  hidePagination?: boolean | undefined;
  isServerSide?: boolean | undefined;
}

const props = withDefaults(defineProps<Props>(), {
  emptyLabel: '',
  rowsPerPageOptions: () => [10, 25, 50],
  isServerSide: false,
});

const emit = defineEmits<{
  (e: 'request', requestProps: TableRequestProps): void;
}>();

const showTableLoading = computed(() => Boolean(props.loading && (props.rows?.length ?? 0) > 0));

const setPropValue = <K extends keyof PaginationModel>(
  obj: PaginationModel | undefined,
  key: K,
  value: PaginationModel[K],
) => {
  if (obj) {
    obj[key] = value;
  }
};

const getSessionSort = () => {
  try {
    const key = `base-table-sort:${window.location.pathname}:${props.columns.map((c) => c.name).join('_')}`;
    const stored = sessionStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        return {
          sortBy: parsed.sortBy,
          descending: parsed.descending,
        };
      }
    }
  } catch {
    void 0;
  }
  return null;
};

const sessionSort = getSessionSort();

if (props.pagination && sessionSort) {
  setPropValue(props.pagination, 'sortBy', sessionSort.sortBy);
  setPropValue(props.pagination, 'descending', sessionSort.descending);
}

// internalPagination ใช้เป็น v-model ให้ q-table
// เพื่อให้ Quasar รู้ว่าเป็น server-side pagination และ rowsNumber เท่าไหร่
const internalPagination = ref<PaginationModel>({
  page: props.pagination?.page ?? 1,
  rowsPerPage: props.pagination?.rowsPerPage ?? 10,
  sortBy: props.pagination?.sortBy ?? sessionSort?.sortBy ?? null,
  descending: props.pagination?.descending ?? sessionSort?.descending ?? false,
  rowsNumber: props.pagination?.rowsNumber ?? 0,
});

watch(
  () => [internalPagination.value.sortBy, internalPagination.value.descending],
  (newValues) => {
    const sortBy = newValues[0] as string | null | undefined;
    const descending = newValues[1] as boolean | undefined;
    try {
      const key = `base-table-sort:${window.location.pathname}:${props.columns.map((c) => c.name).join('_')}`;
      sessionStorage.setItem(
        key,
        JSON.stringify({
          sortBy,
          descending,
        }),
      );
    } catch {
      void 0;
    }

    if (props.pagination) {
      if (props.pagination.sortBy !== sortBy) {
        setPropValue(props.pagination, 'sortBy', sortBy);
      }
      if (props.pagination.descending !== descending) {
        setPropValue(props.pagination, 'descending', descending);
      }
    }
  },
);

const NON_SORTABLE_COLUMNS = new Set(['tools', 'actions', 'action']);

const autoNumberColumnNames = computed(() => {
  return new Set(
    props.columns
      .filter(
        (column) => (column.name === 'id' || column.name === 'index') && column.sortable !== true,
      )
      .map((column) => column.name),
  );
});

const sortableColumns = computed<QTableColumn[]>(() =>
  props.columns.map((column) => {
    const isIdOrIndex = column.name === 'id' || column.name === 'index';
    const shouldAutoNumber = autoNumberColumnNames.value.has(column.name);
    return {
      ...column,
      sortable: isIdOrIndex
        ? (column.sortable ?? false)
        : (column.sortable ?? !NON_SORTABLE_COLUMNS.has(column.name)),
      field: shouldAutoNumber
        ? (row: T) => {
            const page = internalPagination.value.page || 1;
            const rowsPerPage = internalPagination.value.rowsPerPage || 10;
            const start = (page - 1) * rowsPerPage;
            const rowIndex = displayRows.value.indexOf(row);
            return rowIndex !== -1
              ? start + rowIndex + 1
              : (row as Record<string, unknown>)[column.name];
          }
        : (column.field ?? column.name),
    };
  }),
);

const defaultSortColumn = computed<QTableColumn | undefined>(() => {
  const preferredNames = ['createdAt', 'CREATED_AT', 'updatedAt', 'UPDATED_AT', 'id', 'index'];

  for (const name of preferredNames) {
    const column = sortableColumns.value.find((item) => item.sortable && item.name === name);
    if (column) return column;
  }

  return undefined;
});

watch(
  () => props.pagination,
  (val) => {
    if (val) {
      internalPagination.value = {
        ...internalPagination.value,
        ...val,
        sortBy: val.sortBy ?? internalPagination.value.sortBy ?? null,
        descending: val.descending ?? internalPagination.value.descending ?? false,
        rowsNumber: val.rowsNumber ?? internalPagination.value.rowsNumber ?? 0,
      };
    }
  },
  { deep: true },
);

const getColumnValue = (row: T, column: QTableColumn): unknown => {
  if (typeof column.field === 'function') {
    return column.field(row);
  }

  return (row as Record<string, unknown>)[column.field];
};

const compareValues = (left: unknown, right: unknown): number => {
  if (left === right) return 0;
  if (left === null || left === undefined) return 1;
  if (right === null || right === undefined) return -1;

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime();
  }

  const toComparableText = (value: unknown): string => {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return String(value);
    }

    return JSON.stringify(value) || '';
  };

  return toComparableText(left).localeCompare(toComparableText(right), 'th', {
    numeric: true,
    sensitivity: 'base',
  });
};

const sortedRows = computed<T[]>(() => {
  const sourceRows = props.rows ?? [];
  if (props.isServerSide) return sourceRows;

  const sortBy = internalPagination.value.sortBy ?? defaultSortColumn.value?.name;
  if (!sortBy) return sourceRows;

  const column = sortableColumns.value.find((item) => item.name === sortBy);
  if (!column?.sortable) return sourceRows;

  const isDefaultSort = internalPagination.value.sortBy === null;
  const defaultDescending = column.name !== 'index';
  const direction = (isDefaultSort ? defaultDescending : internalPagination.value.descending)
    ? -1
    : 1;
  return [...sourceRows].sort(
    (left, right) =>
      compareValues(getColumnValue(left, column), getColumnValue(right, column)) * direction,
  );
});

const displayRows = computed<T[]>(() => {
  const sourceRowCount = props.rows?.length ?? 0;

  if (props.loading && sourceRowCount === 0) {
    const skeletonCount = Math.min(internalPagination.value.rowsPerPage || 10, 10);
    const skeletonRows = createSkeletonRows(skeletonCount);
    // Placeholder rows are not real T; cast matches existing __empty row pattern.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- skeleton rows are synthetic placeholders for generic row type T
    return skeletonRows as T[];
  }

  let rows: T[] = [];
  if (props.isServerSide) {
    if (sourceRowCount === 0) {
      return [createEmptyRow()] as T[];
    }
    rows = props.rows;
  } else {
    const sourceRows = sortedRows.value;

    if (sourceRows.length === 0) {
      return [createEmptyRow()] as T[];
    }

    const page = internalPagination.value.page || 1;
    const rowsPerPage = internalPagination.value.rowsPerPage || sourceRows.length;
    const start = (page - 1) * rowsPerPage;

    rows = sourceRows.slice(start, start + rowsPerPage);
  }

  if (autoNumberColumnNames.value.size === 0) {
    return rows;
  }

  const page = internalPagination.value.page || 1;
  const rowsPerPage = internalPagination.value.rowsPerPage || 10;
  const start = (page - 1) * rowsPerPage;

  return rows.map((row, index) => {
    if (row && typeof row === 'object' && ('__empty' in row || '__skeleton' in row)) return row;

    return new Proxy(row, {
      get(target, prop, receiver) {
        if (prop === 'id' || prop === 'index') {
          if (!autoNumberColumnNames.value.has(prop)) {
            return Reflect.get(target, prop, receiver);
          }

          const stack = new Error().stack || '';
          const isRender = /\b(render|patch|update|vnode|q-?td|q-?tr|q-?table)\b/i.test(stack);

          if (isRender) {
            return start + index + 1;
          }
        }
        return Reflect.get(target, prop, receiver);
      },
      has(target, prop) {
        return Reflect.has(target, prop);
      },
      ownKeys(target) {
        return Reflect.ownKeys(target);
      },
      getOwnPropertyDescriptor(target, prop) {
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    });
  });
});

const isFirstPage = computed(() => internalPagination.value.page <= 1);
const isLastPage = computed(() => {
  const total = internalPagination.value.rowsNumber ?? 0;
  const lastPage = Math.ceil(total / internalPagination.value.rowsPerPage) || 1;
  return internalPagination.value.page >= lastPage;
});

const onRequest = (requestProps: TableRequestProps): void => {
  const nextPagination: PaginationModel = {
    ...internalPagination.value,
    ...requestProps.pagination,
    rowsNumber: internalPagination.value.rowsNumber ?? 0,
  };
  internalPagination.value = nextPagination;
  emit('request', { ...requestProps, pagination: buildPagination(nextPagination.page) });
};

const buildPagination = (page: number): TableRequestProps['pagination'] => {
  const { rowsPerPage, sortBy, descending, rowsNumber } = internalPagination.value;
  return {
    page,
    rowsPerPage,
    descending: descending ?? false,
    rowsNumber: rowsNumber ?? 0,
    ...(sortBy ? { sortBy } : {}),
  };
};

const goToFirstPage = (): void => {
  onRequest({ pagination: buildPagination(1) });
};

const goToPrevPage = (): void => {
  onRequest({ pagination: buildPagination(internalPagination.value.page - 1) });
};

const goToNextPage = (): void => {
  onRequest({ pagination: buildPagination(internalPagination.value.page + 1) });
};

const goToLastPage = (): void => {
  const totalRows = internalPagination.value.rowsNumber ?? 0;
  const lastPage = Math.ceil(totalRows / internalPagination.value.rowsPerPage) || 1;
  onRequest({ pagination: buildPagination(lastPage) });
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
    font-size: var(--font-size-md);
    padding: 10px 12px;
    text-align: center !important;
  }

  :deep(th.sortable .q-table__sort-icon) {
    position: absolute !important;
  }

  :deep(tbody tr td) {
    font-size: var(--font-size-md);
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

.base-table-empty-cell {
  border-bottom: none;
  font-size: var(--font-size-md);
  padding: 32px 16px;
}

.base-table-bottom {
  font-size: var(--font-size-md);
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
