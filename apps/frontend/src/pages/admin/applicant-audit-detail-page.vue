<template>
  <q-page class="page-container applicant-audit-detail-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.applicantAudit.detailTitle')"
      :subtitle="$t('admin.applicantAudit.detailSubtitle')"
    />

    <q-banner v-if="error" class="bg-red-1 text-red-9 q-mb-md rounded-borders">
      {{ error }}
    </q-banner>

    <q-card v-if="applicantName || enrollments.length > 0" flat bordered class="q-mb-md q-pa-md">
      <div class="text-h6 text-weight-bold">
        {{ summary?.fullnameTh || applicantName || '—' }}
      </div>
      <div class="row q-gutter-md q-mt-sm text-body2 items-center">
        <div>
          {{ $t('admin.applicantAudit.columns.nationalId') }}:
          {{ summary?.nationalId || applicantNationalId || '—' }}
        </div>
        <div class="col-grow" style="min-width: 220px; max-width: 420px">
          <q-select
            v-model="selectedErmId"
            dense
            outlined
            emit-value
            map-options
            :options="enrollmentOptions"
            :label="$t('admin.applicantAudit.selectEnrollment')"
            :disable="enrollments.length === 0"
            :loading="isLoadingEnrollments"
            @update:model-value="onEnrollmentSelected"
          />
        </div>
      </div>

      <template v-if="summary">
        <div class="text-body2 text-grey-7 q-mt-sm">
          {{ summary.examName || '—' }}
          <span v-if="summary.examRound"> · {{ summary.examRound }}</span>
          <span v-if="summary.examFiscalYear"> · {{ summary.examFiscalYear }}</span>
        </div>
        <div class="row q-gutter-md q-mt-xs text-body2">
          <div>
            {{ $t('admin.applicantAudit.columns.testTakerCode') }}:
            {{ summary.testTakerCode || '—' }}
          </div>
          <div>
            {{ $t('admin.applicantAudit.columns.status') }}: {{ statusLabel(summary.ermStatus) }}
          </div>
        </div>
        <div class="row q-gutter-md q-mt-xs text-body2 text-grey-8">
          <div v-if="summary.examDate">
            {{ $t('admin.applicantAudit.detail.examDate') }}: {{ summary.examDate }}
          </div>
          <div v-if="sessionTimeLabel">
            {{ $t('admin.applicantAudit.detail.sessionTime') }}: {{ sessionTimeLabel }}
          </div>
          <div v-if="examFeeLabel">
            {{ $t('admin.applicantAudit.detail.examFee') }}: {{ examFeeLabel }}
          </div>
          <div v-if="paidAmountLabel">
            {{ $t('admin.applicantAudit.detail.paidAmount') }}: {{ paidAmountLabel }}
          </div>
          <div v-else-if="latestAmountLabel">
            {{ $t('admin.applicantAudit.detail.latestAmount') }}: {{ latestAmountLabel }}
          </div>
          <div v-if="summary.seatLabel">
            {{ $t('admin.applicantAudit.detail.seatLabel') }}: {{ summary.seatLabel }}
          </div>
        </div>
      </template>
    </q-card>

    <EnrollmentAuditTimeline
      :events="events"
      :loading="isLoading"
      :hint="$t('admin.applicantAudit.forwardOnlyHint')"
      :empty-label="$t('admin.applicantAudit.noEvents')"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import EnrollmentAuditTimeline from 'src/components/enrollment/enrollment-audit-timeline.vue';
import {
  fetchApplicantEnrollments,
  fetchEnrollmentAuditEvents,
  fetchEnrollmentAuditSummary,
} from 'src/services/enrollment-audit.service';
import type {
  EnrollmentAuditApplicantEnrollment,
  EnrollmentAuditEvent,
  EnrollmentAuditSummary,
} from 'src/types/enrollment-audit.types';
import { EnrollmentStatus } from 'src/types/enrollment.types';
import { formatAuditAmount } from 'src/utils/enrollment-audit-labels';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const isLoading = ref(false);
const isLoadingEnrollments = ref(false);
const error = ref<string | null>(null);
const summary = ref<EnrollmentAuditSummary | null>(null);
const events = ref<EnrollmentAuditEvent[]>([]);
const enrollments = ref<EnrollmentAuditApplicantEnrollment[]>([]);
const selectedErmId = ref<number | null>(null);
const applicantName = ref<string | null>(null);
const applicantNationalId = ref<string | null>(null);

let loadToken = 0;

const sessionTimeLabel = computed(() => {
  const start = summary.value?.sessionStart;
  const end = summary.value?.sessionEnd;
  if (start && end) return `${start}–${end}`;
  return start || end || '';
});

const examFeeLabel = computed(() => formatAuditAmount(summary.value?.examFee));
const paidAmountLabel = computed(() => formatAuditAmount(summary.value?.paidAmount));
const latestAmountLabel = computed(() =>
  formatAuditAmount(summary.value?.latestTranxAmount),
);

const enrollmentOptions = computed(() =>
  enrollments.value.map((item) => {
    const examPart = [item.examName, item.examRound].filter(Boolean).join(' · ') || '—';
    const status = statusLabel(item.ermStatus);
    return {
      label: `${examPart} (${status})`,
      value: item.ermId,
    };
  }),
);

const statusLabel = (status: number): string => {
  switch (status) {
    case Number(EnrollmentStatus.UNPAID):
      return t('admin.applicantAudit.status.unpaid');
    case Number(EnrollmentStatus.PAID):
      return t('admin.applicantAudit.status.paid');
    case Number(EnrollmentStatus.SEAT_ASSIGNED):
      return t('admin.applicantAudit.status.seatAssigned');
    case Number(EnrollmentStatus.SEAT_PUBLISHED):
      return t('admin.applicantAudit.status.seatPublished');
    case Number(EnrollmentStatus.ATTENDED):
      return t('admin.applicantAudit.status.attended');
    case Number(EnrollmentStatus.CANCELLED):
      return t('admin.applicantAudit.status.cancelled');
    case Number(EnrollmentStatus.MISSING):
      return t('admin.applicantAudit.status.missing');
    default:
      return String(status);
  }
};

const syncErmQuery = (ermId: number): void => {
  const current = route.query.ermId != null ? Number(route.query.ermId) : null;
  if (current === ermId) return;
  void router.replace({
    name: 'admin-applicant-audit-detail',
    params: { userId: String(route.params.userId) },
    query: { ...route.query, ermId: String(ermId) },
  });
};

const loadTimeline = async (ermId: number): Promise<void> => {
  const token = ++loadToken;
  isLoading.value = true;
  error.value = null;
  try {
    const [summaryResult, eventsResult] = await Promise.all([
      fetchEnrollmentAuditSummary(ermId),
      fetchEnrollmentAuditEvents(ermId),
    ]);
    if (token !== loadToken) return;
    summary.value = summaryResult;
    events.value = eventsResult;
    applicantName.value = summaryResult.fullnameTh;
    applicantNationalId.value = summaryResult.nationalId;
  } catch (err) {
    if (token !== loadToken) return;
    console.error('Failed to load applicant audit timeline:', err);
    error.value = t('admin.applicantAudit.loadError');
    summary.value = null;
    events.value = [];
  } finally {
    if (token === loadToken) {
      isLoading.value = false;
    }
  }
};

const resolveLegacyErmRoute = async (maybeErmId: number): Promise<boolean> => {
  try {
    const legacySummary = await fetchEnrollmentAuditSummary(maybeErmId);
    await router.replace({
      name: 'admin-applicant-audit-detail',
      params: { userId: String(legacySummary.userId) },
      query: { ermId: String(maybeErmId) },
    });
    return true;
  } catch {
    return false;
  }
};

const loadApplicant = async (): Promise<void> => {
  const userId = Number(route.params.userId);
  if (isNaN(userId) || userId <= 0) {
    error.value = t('admin.applicantAudit.loadError');
    return;
  }

  isLoadingEnrollments.value = true;
  error.value = null;
  try {
    const list = await fetchApplicantEnrollments(userId);
    enrollments.value = list;

    const queryErmId =
      route.query.ermId != null && !isNaN(Number(route.query.ermId))
        ? Number(route.query.ermId)
        : null;
    const matched =
      (queryErmId != null && list.find((item) => item.ermId === queryErmId)) || list[0] || null;

    if (!matched) {
      selectedErmId.value = null;
      summary.value = null;
      events.value = [];
      error.value = t('admin.applicantAudit.noEnrollments');
      return;
    }

    selectedErmId.value = matched.ermId;
    syncErmQuery(matched.ermId);
    await loadTimeline(matched.ermId);
  } catch (err) {
    console.error('Failed to load applicant enrollments:', err);
    const redirected = await resolveLegacyErmRoute(userId);
    if (redirected) return;
    error.value = t('admin.applicantAudit.loadError');
    enrollments.value = [];
    summary.value = null;
    events.value = [];
  } finally {
    isLoadingEnrollments.value = false;
  }
};

const onEnrollmentSelected = (ermId: number | null): void => {
  if (ermId == null) return;
  if (!enrollments.value.some((item) => item.ermId === ermId)) return;
  syncErmQuery(ermId);
  void loadTimeline(ermId);
};

watch(
  () => route.params.userId,
  () => {
    void loadApplicant();
  },
);

onMounted(() => {
  void loadApplicant();
});
</script>
