<template>
  <q-tr
    v-for="rowIndex in rows"
    :key="`skeleton-row-${rowIndex}`"
    class="table-skeleton-row"
  >
    <q-td
      v-for="col in columns"
      :key="`skeleton-cell-${rowIndex}-${col.name}`"
      :props="{ col }"
    >
      <q-skeleton
        type="text"
        :width="getCellWidth(col.name)"
        animation="wave"
      />
    </q-td>
  </q-tr>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';

interface Props {
  columns: QTableColumn[];
  rows?: number;
}

withDefaults(defineProps<Props>(), {
  rows: 5,
});

const narrowColumns = new Set(['actions', 'action', 'tools', 'index', 'id']);

const getCellWidth = (columnName: string): string => {
  if (narrowColumns.has(columnName)) return '40px';
  return '80%';
};
</script>
