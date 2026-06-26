<template>
  <q-page class="page-container exam-candidates-info-page">
    <AppBreadcrumbs />
    <AppPageHeader :title="pageTitle" :subtitle="pageSubtitle" />

    <div class="row items-center q-mb-lg">
      <div class="col-12 col-sm-6 col-md-5">
        <SearchBar
          v-model="searchQuery"
          :placeholder="t('admin.examCandidatesInfo.searchPlaceholder')"
        />
      </div>
    </div>

    <ExamCandidatesInfoTable
      :candidates="filteredCandidates"
      :loading="isLoading"
      :pagination="pagination"
      @request="onRequest"
      @view-history="handleViewHistory"
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
import ExamCandidatesInfoTable from 'src/components/exam-report/exam-candidates-info-table.vue';
import { fetchExamCandidateInfo } from 'src/services/exam-report.service';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import type { ExamCandidateInfoRow } from 'src/types/exam-report.types';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const $q = useQuasar();

const isLoading = ref(false);
const searchQuery = ref('');
const candidates = ref<ExamCandidateInfoRow[]>([]);

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

const examRound = computed(() => getRouteValue(route.query.round));

const pageTitle = computed(() =>
  examRound.value
    ? t('admin.examCandidatesInfo.pageTitle', { round: examRound.value })
    : t('admin.examCandidatesInfo.pageTitleFallback', { year: examYear.value }),
);

const pageSubtitle = computed(() =>
  examRound.value
    ? t('admin.examCandidatesInfo.pageSubtitle', { round: examRound.value })
    : t('admin.examCandidatesInfo.pageSubtitleFallback', { year: examYear.value }),
);

const fetchCandidates = async (): Promise<void> => {
  isLoading.value = true;
  try {
    candidates.value = await fetchExamCandidateInfo(examYear.value, examRound.value);
  } catch {
    candidates.value = [];
    $q.notify({
      type: 'negative',
      message: t('admin.examCandidatesInfo.notifications.loadError'),
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

const filteredCandidates = computed<ExamCandidateInfoRow[]>(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return candidates.value;

  return candidates.value.filter((row) =>
    [
      row.examNumber,
      row.prefix,
      row.fullName,
      row.vocabularyGrammarScore,
      row.readingScore,
      row.totalScore,
      row.level,
      t(`admin.examCandidatesInfo.status.${row.attemptStatus}`),
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

const handleViewHistory = (row: ExamCandidateInfoRow): void => {
  void router.push({
    name: 'admin-executive-exam-history',
    params: {
      year: examYear.value,
      ermId: row.id,
    },
    query: examRound.value ? { round: examRound.value } : {},
  });
};

watch(
  filteredCandidates,
  (rows) => {
    pagination.value.rowsNumber = rows.length;
  },
  { immediate: true },
);

watch(searchQuery, () => {
  pagination.value.page = 1;
});

watch(
  [examYear, examRound],
  () => {
    pagination.value.page = 1;
    void fetchCandidates();
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.exam-candidates-info-page {
  overflow-x: hidden;
}
</style>
