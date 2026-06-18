<template>
  <AppButton :icon="icon" :label="label" v-bind="$attrs" @click="exportTable" />
</template>

<script setup lang="ts" generic="T extends object">
import { exportFile, date, useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppButton from 'src/components/base/app-button.vue';

interface Props {
  columns: QTableColumn[];
  rows: T[];
  fileNamePrefix?: string;
  label?: string;
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  fileNamePrefix: 'export',
  label: 'EXPORT TO CSV',
  icon: 'download',
});

const $q = useQuasar();
const { t } = useI18n();

const wrapCsvValue = (val: unknown, forceText = false): string => {
  if (val === null || val === undefined) return '""';

  let formatted = '';
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    formatted = String(val);
  } else {
    formatted = JSON.stringify(val);
  }

  if (forceText && /^\d+$/.test(formatted)) {
    formatted = `\t${formatted}`;
  }

  return `"${formatted.replace(/"/g, '""')}"`;
};

const exportTable = (): void => {
  if (!props.rows || props.rows.length === 0) {
    $q.notify({
      message: t('components.exportCsv.noData'),
      color: 'warning',
    });
    return;
  }

  const exportableColumns = props.columns.filter(
    (col) => col.name !== 'tools' && col.name !== 'actions',
  );

  const headerRow = exportableColumns.map((col) => wrapCsvValue(col.label)).join(',');

  const dataRows = props.rows.map((row) => {
    return exportableColumns
      .map((col) => {
        let val: unknown;

        if (typeof col.field === 'function') {
          val = col.field(row);
        } else if (typeof col.field === 'string') {
          val = (row as Record<string, unknown>)[col.field];
        }

        if (col.format) {
          val = col.format(val, row);
        }

        const shouldForceText =
          col.name.toLowerCase().includes('id') ||
          col.name.toLowerCase().includes('code') ||
          (typeof val === 'string' && val.length > 10 && /^\d+$/.test(val));

        return wrapCsvValue(val, shouldForceText);
      })
      .join(',');
  });

  const content = [headerRow, ...dataRows].join('\r\n');
  const timestamp = date.formatDate(Date.now(), 'YYYY-MM-DD');
  const fileName = `${props.fileNamePrefix}_${timestamp}.csv`;

  const status = exportFile(fileName, '\ufeff' + content, 'text/csv');

  if (status !== true) {
    $q.notify({
      message: t('components.exportCsv.blocked'),
      color: 'negative',
      icon: 'warning',
    });
  }
};
</script>
