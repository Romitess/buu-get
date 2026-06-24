<template>
  <q-page class="page-container daily-revenue-report-page">
    <!-- Breadcrumbs -->
    <AppBreadcrumbs />

    <!-- Page Header -->
    <AppPageHeader
      :title="$t('admin.dailyRevenueReport.pageTitle')"
      :subtitle="$t('admin.dailyRevenueReport.pageSubtitle')"
    />

    <!-- Filter Bar Component -->
    <DailyRevenueFilter
      :filter="filter"
      :department-options="departmentOptions"
      mode="compact"
      @filter-change="applyFilter"
    />

    <!-- Revenue Table -->
    <div class="daily-revenue-table-wrapper">
      <BaseTable
        :columns="columns"
        :rows="rows"
        :loading="isLoading"
        :pagination="pagination"
        :empty-label="$t('admin.dailyRevenueReport.table.emptyLabel')"
        hide-pagination
      />

      <!-- Total Row — value right-aligned to match the amount column -->
      <div class="total-row row items-center justify-end no-wrap">
        <span class="total-label">
          {{ $t('admin.dailyRevenueReport.table.totalLabel') }}
        </span>
        <span class="total-value">{{ formattedTotal }}</span>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, watch, computed } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import DailyRevenueFilter from 'src/components/report/daily-revenue-filter.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import { useDailyRevenue } from 'src/composables/use-daily-revenue';
import type { PaginationModel } from 'src/types/exam.types';

const $q = useQuasar();
const { t } = useI18n();

const {
  rows,
  isLoading,
  error,
  filter,
  formattedTotal,
  departmentOptions,
  fetchData,
  loadDepartmentOptions,
  applyFilter,
} = useDailyRevenue();

const formatAmount = (value: unknown): string => {
  const amount = Number(value);
  return (Number.isNaN(amount) ? 0 : amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Report shows the full result set together with the total, so disable paging.
const pagination = computed<PaginationModel>(() => ({
  page: 1,
  rowsPerPage: rows.value.length || 10,
  rowsNumber: rows.value.length,
}));

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'index',
    label: t('admin.dailyRevenueReport.table.columns.index'),
    field: 'index',
    align: 'center',
    style: 'width: 80px',
  },
  {
    name: 'department',
    label: t('admin.dailyRevenueReport.table.columns.department'),
    field: 'department',
    align: 'left',
    style: 'width: 220px',
  },
  {
    name: 'examName',
    label: t('admin.dailyRevenueReport.table.columns.examName'),
    field: 'examName',
    align: 'left',
  },
  {
    name: 'amount',
    label: t('admin.dailyRevenueReport.table.columns.amount'),
    field: 'amount',
    align: 'right',
    style: 'width: 180px',
    format: formatAmount,
    headerClasses: 'amount-header',
  },
]);

// Show error notification when error changes
watch(error, (newVal) => {
  if (newVal) {
    $q.notify({
      type: 'negative',
      message: newVal,
      position: 'top',
    });
  }
});

// Initial load
onMounted(() => {
  void loadDepartmentOptions();
  void fetchData();
});
</script>

<style scoped lang="scss">
.daily-revenue-report-page {
  overflow-x: hidden;
}

.daily-revenue-table-wrapper {
  :deep(.base-table-wrapper) {
    border-bottom: none;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  // Use q-table's default inline sort icon (beside the column label) instead
  // of base-table's absolute positioning, which overlapped the header text.
  :deep(thead th.sortable .q-table__sort-icon) {
    position: static !important;
    margin-left: 4px;
  }

  // For the right-aligned amount column, Quasar prepends the sort icon in the DOM,
  // which makes it appear on the left. We reverse the rendering direction of the inline children
  // using CSS direction: rtl so the icon renders on the right of the text.
  :deep(thead th.amount-header.sortable) {
    direction: rtl;
  }
}

.total-row {
  background: var(--surface-card);
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  padding: 14px 12px;
  gap: 12px;
}

.total-label {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.total-value {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}
</style>
