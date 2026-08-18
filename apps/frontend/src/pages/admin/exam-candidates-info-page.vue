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

    <q-banner v-if="error" class="bg-red-1 text-red-9 q-mb-md rounded-borders shadow-1">
      <template v-slot:avatar>
        <q-icon name="warning" color="negative" />
      </template>
      {{ error }}
      <template v-slot:action>
        <q-btn flat color="negative" :label="t('examSchedule.retry')" @click="fetchCandidates" />
      </template>
    </q-banner>

    <ExamCandidatesInfoTable
      :candidates="candidates"
      :loading="isLoading"
      :pagination="pagination"
      is-server-side
      @request="onRequest"
      @view-history="handleViewHistory"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { debounce } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import ExamCandidatesInfoTable from 'src/components/exam-report/exam-candidates-info-table.vue';
import { fetchExamCandidateInfo } from 'src/services/exam-report.service';
import { isRequestCanceled } from 'src/services/exam.service';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import type { ExamCandidateInfoRow } from 'src/types/exam-report.types';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const isLoading = ref(false);
const searchQuery = ref('');
const candidates = ref<ExamCandidateInfoRow[]>([]);
const error = ref<string | null>(null);
const scoreSummary = ref<{ minScore: number | null; maxScore: number | null; averageScore: number | null }>({
  minScore: null,
  maxScore: null,
  averageScore: null,
});
let abortController: AbortController | null = null;

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

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: null,
  descending: false,
});

const fetchCandidates = async (): Promise<void> => {
  abortController?.abort();
  abortController = new AbortController();
  const { signal } = abortController;
  isLoading.value = true;
  error.value = null;
  try {
    const result = await fetchExamCandidateInfo(examYear.value, {
      ...(examRound.value ? { round: examRound.value } : {}),
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,
      search: searchQuery.value,
      signal,
    });
    candidates.value = result.data;
    pagination.value.rowsNumber = result.total;
    scoreSummary.value = {
      minScore: result.minScore,
      maxScore: result.maxScore,
      averageScore: result.averageScore,
    };
  } catch (err) {
    if (isRequestCanceled(err) || signal.aborted) return;
    candidates.value = [];
    error.value = t('admin.examCandidatesInfo.notifications.loadError');
  } finally {
    if (!signal.aborted) {
      isLoading.value = false;
    }
  }
};

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage, sortBy, descending } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.sortBy = sortBy ?? null;
  pagination.value.descending = descending ?? false;
  void fetchCandidates();
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

const debouncedSearch = debounce(() => {
  pagination.value.page = 1;
  void fetchCandidates();
}, 400);

watch(searchQuery, () => {
  void debouncedSearch();
});

watch(
  [examYear, examRound],
  () => {
    pagination.value.page = 1;
    void fetchCandidates();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  abortController?.abort();
});
</script>

<style scoped lang="scss">
.exam-candidates-info-page {
  overflow-x: hidden;
}
</style>
