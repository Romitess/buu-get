<template>
  <div
    v-if="standalone"
    class="table-skeleton table-skeleton--standalone skeleton-root"
    :aria-busy="true"
    :aria-label="ariaLabel"
  >
    <div v-for="rowIndex in rows" :key="`skeleton-row-${rowIndex}`" class="table-skeleton-row">
      <div
        v-for="(col, colIndex) in columns"
        :key="`skeleton-cell-${rowIndex}-${col.name}`"
        class="table-skeleton-cell"
      >
        <q-skeleton type="text" :width="getCellWidth(col.name, colIndex)" animation="wave" />
      </div>
    </div>
  </div>

  <q-tr v-else-if="rowProps" :key="rowProps.key" :props="rowProps" class="skeleton-root">
    <q-td v-for="(col, colIndex) in rowProps.cols" :key="col.name" :props="rowProps">
      <q-skeleton type="text" :width="getCellWidth(col.name, colIndex)" animation="wave" />
    </q-td>
  </q-tr>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QTableColumn } from 'quasar';

interface TableBodyProps {
  key: string | number;
  cols: QTableColumn[];
  [key: string]: unknown;
}

interface Props {
  columns?: QTableColumn[];
  rows?: number;
  rowProps?: TableBodyProps;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 5,
  columns: () => [],
});

const { t } = useI18n();

const standalone = computed(() => props.rowProps === undefined);
const ariaLabel = computed(() => t('components.skeleton.loading'));

const narrowColumns = new Set(['actions', 'action', 'tools', 'index', 'id']);
const widthPattern = ['70%', '55%', '80%', '45%', '65%'];

const getCellWidth = (columnName: string, colIndex: number): string => {
  if (narrowColumns.has(columnName)) return '40px';
  return widthPattern[colIndex % widthPattern.length] ?? '70%';
};
</script>

<style scoped lang="scss">
.table-skeleton--standalone {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--surface-card);
}

.table-skeleton-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
}

.table-skeleton-cell {
  flex: 1;
  min-width: 0;
}
</style>
