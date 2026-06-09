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
    <DailyRevenueTable :rows="rows" :loading="isLoading" :formatted-total="formattedTotal" />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import DailyRevenueFilter from 'src/components/report/daily-revenue-filter.vue';
import DailyRevenueTable from 'src/components/report/daily-revenue-table.vue';
import { useDailyRevenue } from 'src/composables/use-daily-revenue';

const $q = useQuasar();

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
</style>
