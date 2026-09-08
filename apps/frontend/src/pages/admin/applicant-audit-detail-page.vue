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

    <q-card v-if="summary" flat bordered class="q-mb-md q-pa-md">
      <div class="text-h6 text-weight-bold">{{ summary.fullnameTh || '—' }}</div>
      <div class="text-body2 text-grey-7 q-mt-xs">
        {{ summary.examName || '—' }}
        <span v-if="summary.examRound"> · {{ summary.examRound }}</span>
        <span v-if="summary.examFiscalYear"> · {{ summary.examFiscalYear }}</span>
      </div>
      <div class="row q-gutter-md q-mt-sm text-body2">
        <div>{{ $t('admin.applicantAudit.columns.nationalId') }}: {{ summary.nationalId || '—' }}</div>
        <div>
          {{ $t('admin.applicantAudit.columns.testTakerCode') }}:
          {{ summary.testTakerCode || '—' }}
        </div>
        <div>{{ $t('admin.applicantAudit.columns.status') }}: {{ statusLabel(summary.ermStatus) }}</div>
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
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import EnrollmentAuditTimeline from 'src/components/enrollment/enrollment-audit-timeline.vue';
import {
  fetchEnrollmentAuditEvents,
  fetchEnrollmentAuditSummary,
} from 'src/services/enrollment-audit.service';
import type {
  EnrollmentAuditEvent,
  EnrollmentAuditSummary,
} from 'src/types/enrollment-audit.types';
import { EnrollmentStatus } from 'src/types/enrollment.types';
import { formatAuditAmount } from 'src/utils/enrollment-audit-labels';

const route = useRoute();
const { t } = useI18n();

const isLoading = ref(false);
const error = ref<string | null>(null);
const summary = ref<EnrollmentAuditSummary | null>(null);
const events = ref<EnrollmentAuditEvent[]>([]);

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

const loadData = async (): Promise<void> => {
  const ermId = Number(route.params.ermId);
  if (isNaN(ermId) || ermId <= 0) {
    error.value = t('admin.applicantAudit.loadError');
    return;
  }

  isLoading.value = true;
  error.value = null;
  try {
    const [summaryResult, eventsResult] = await Promise.all([
      fetchEnrollmentAuditSummary(ermId),
      fetchEnrollmentAuditEvents(ermId),
    ]);
    summary.value = summaryResult;
    events.value = eventsResult;
  } catch (err) {
    console.error('Failed to load applicant audit detail:', err);
    error.value = t('admin.applicantAudit.loadError');
    summary.value = null;
    events.value = [];
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => route.params.ermId,
  () => {
    void loadData();
  },
);

onMounted(() => {
  void loadData();
});
</script>
