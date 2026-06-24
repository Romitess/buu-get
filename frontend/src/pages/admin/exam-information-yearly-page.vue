<template>
  <q-page class="page-container exam-information-page">
    <AppBreadcrumbs />
    <AppPageHeader :title="pageTitle" :subtitle="pageSubtitle" />

    <div class="row items-center q-mb-lg">
      <div class="col-12 col-sm-6 col-md-5">
        <SearchBar
          v-model="searchQuery"
          :placeholder="t('admin.examInformation.searchPlaceholder')"
        />
      </div>
    </div>

    <ExamInformationTable
      :rounds="filteredRounds"
      :loading="isLoading"
      :pagination="pagination"
      @request="onRequest"
      @view-detail="handleViewDetail"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import ExamInformationTable from 'src/components/exam-report/exam-information-table.vue';
import { fetchExamInformationRounds } from 'src/services/exam-report.service';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import type { ExamInformationRoundRow } from 'src/types/exam-report.types';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const $q = useQuasar();

const isLoading = ref(false);
const searchQuery = ref('');
const examRounds = ref<ExamInformationRoundRow[]>([]);

const getRouteValue = (
  value: string | null | Array<string | null> | undefined,
): string | undefined => {
  const routeValue = Array.isArray(value) ? value[0] : value;
  return routeValue ?? undefined;
};

const defaultYear = computed(() => String(new Date().getFullYear()));

const examYear = computed(() => {
  const routeYear = getRouteValue(route.params.year);
  const queryYear = getRouteValue(route.query.year);
  const candidateYear = routeYear ?? queryYear ?? defaultYear.value;
  const yearNumber = Number.parseInt(candidateYear, 10);

  return Number.isFinite(yearNumber) ? String(yearNumber) : defaultYear.value;
});

const pageTitle = computed(() => t('admin.examInformation.pageTitle', { year: examYear.value }));

const pageSubtitle = computed(() =>
  t('admin.examInformation.pageSubtitle', { year: examYear.value }),
);

const fetchRounds = async (): Promise<void> => {
  isLoading.value = true;
  try {
    examRounds.value = await fetchExamInformationRounds(examYear.value);
  } catch {
    examRounds.value = [];
    $q.notify({
      type: 'negative',
      message: t('admin.examInformation.notifications.loadError'),
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
};

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: null,
  descending: false,
});

const filteredRounds = computed<ExamInformationRoundRow[]>(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return examRounds.value;

  return examRounds.value.filter((row) =>
    [
      row.round,
      row.applicants,
      row.attended,
      row.absent,
      row.repeatTakers,
      row.minScore,
      row.maxScore,
      row.averageScore,
    ]
      .join(' ')
      .toLowerCase()
      .includes(query),
  );
});

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage, sortBy, descending } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.sortBy = sortBy ?? null;
  pagination.value.descending = descending ?? false;
};

const handleViewDetail = (row: ExamInformationRoundRow): void => {
  void router.push({
    name: 'admin-exam-candidates-info',
    params: { year: examYear.value },
    query: { round: row.round },
  });
};

watch(
  filteredRounds,
  (rows) => {
    pagination.value.rowsNumber = rows.length;
  },
  { immediate: true },
);

watch(searchQuery, () => {
  pagination.value.page = 1;
});

watch(
  examYear,
  () => {
    pagination.value.page = 1;
    void fetchRounds();
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.exam-information-page {
  overflow-x: hidden;
}
</style>
