<template>
  <q-table v-bind="$attrs" :rows="rows" :columns="columns" flat bordered class="app-table">
    <!-- Pass all slots to the parent with explicit slot handling -->
    <template v-for="(_, slotName) in slots" v-slot:[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps || {}" />
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { useSlots } from 'vue';
import type { QTableColumn } from 'quasar';

/**
 * AppTable Component
 * A reusable table component that standardizes the look and feel of data tables
 * according to the BUU-GET design system.
 */
interface Props {
  /** The data rows to display in the table */
  rows: Record<string, unknown>[];
  /** The column definitions for the table */
  columns?: QTableColumn[];
}

defineProps<Props>();
const slots = useSlots();
</script>

<style scoped lang="scss">
.app-table {
  border-radius: 16px;
  background: white;
  overflow: hidden;

  // Custom styling for the header
  :deep(.q-table__th) {
    font-weight: 700;
    color: var(--buu-gray-dark);
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
    background: #f8faff; // Light background for headers
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
  }

  // Custom styling for table cells
  :deep(.q-table__td) {
    padding: 16px;
    color: var(--text-primary);
  }

  // Row hover effect
  :deep(.q-table__tbody tr:hover) {
    background-color: rgba(255, 206, 0, 0.03);
  }

  // Pagination styling
  :deep(.q-table__bottom) {
    border-top: 1px solid var(--border-color);
    padding: 12px 16px;
  }
}

// Shadow level 1 matching the app standard
.app-table.shadow-1 {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05) !important;
}
</style>
