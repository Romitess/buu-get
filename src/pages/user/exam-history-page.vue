<template>
  <div class="page-container exam-history-page q-pa-lg">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('exam.history.pageTitle')"
      :subtitle="$t('exam.history.pageDescription')"
    />

    <!-- Pending Payment Section -->
    <div v-if="pendingExams.length > 0" class="history-section q-mb-xl">
      <div class="section-title row items-center q-mb-md">
        <q-icon name="schedule" size="var(--space-lg)" class="section-icon q-mr-sm" />
        <span class="text-weight-bold text-subtitle1">{{
          $t('exam.history.pendingSectionTitle')
        }}</span>
      </div>

      <div class="q-gutter-y-md">
        <AppExamHistoryCard
          v-for="exam in pendingExams"
          :key="exam.id"
          :status-label="exam.status"
          :status-type="exam.statusType"
          :title="exam.title"
          :date="exam.date"
          :time="exam.time"
          :location="exam.location"
          :fee="exam.fee"
          :deadline="exam.deadline"
          @timeout="handleTimeout(exam)"
        >
          <template #actions>
            <AppButton
              v-if="exam.actions?.includes('cancel')"
              outline
              :label="$t('exam.history.cancel')"
              class="action-btn btn-action-outline"
              @click="handleCancel(exam)"
            />
            <AppButton
              v-if="exam.actions?.includes('pay')"
              icon="payments"
              :label="$t('exam.history.pay')"
              class="action-btn btn-action-filled"
              @click="handlePay(exam)"
            />
          </template>
        </AppExamHistoryCard>
      </div>
    </div>

    <!-- History Section -->
    <div v-if="historyExams.length > 0" class="history-section">
      <div class="section-title row items-center q-mb-md">
        <q-icon name="schedule" size="var(--space-lg)" class="section-icon q-mr-sm" />
        <span class="text-weight-bold text-subtitle1">{{ $t('exam.history.sectionTitle') }}</span>
      </div>

      <div class="q-gutter-y-md">
        <AppExamHistoryCard
          v-for="exam in historyExams"
          :key="exam.id"
          :status-label="exam.status"
          :status-type="exam.statusType"
          :title="exam.title"
          :date="exam.date"
          :time="exam.time"
          :location="exam.location"
        >
          <template v-if="exam.customStatus" #status-append>
            <div :class="['custom-status', `${exam.customStatus.type}-status`, 'row items-center']">
              <q-icon
                :name="exam.customStatus.icon"
                size="calc(var(--space-unit) * 5)"
                class="q-mr-xs"
              />
              <span :class="{ 'text-weight-bold': exam.customStatus.type === 'error' }">
                {{ exam.customStatus.label }}
              </span>
            </div>
          </template>

          <template #actions>
            <AppButton
              v-if="exam.actions?.includes('scoreDetails')"
              outline
              :label="$t('exam.history.scoreDetails')"
              class="action-btn btn-action-outline"
            />
            <AppButton
              v-if="exam.actions?.includes('certificate')"
              icon="file_download"
              :label="$t('exam.history.certificate')"
              class="action-btn btn-action-filled"
            />
            <AppButton
              v-if="exam.actions?.includes('candidateCard')"
              icon="file_download"
              :label="$t('exam.history.candidateCard')"
              class="action-btn btn-action-filled"
            />
            <AppButton
              v-if="exam.actions?.includes('downloadReceipt')"
              icon="receipt_long"
              :label="$t('exam.history.downloadReceipt')"
              class="action-btn btn-action-filled"
            />
          </template>
        </AppExamHistoryCard>
      </div>
    </div>

    <!-- Payment Dialog -->
    <AppPaymentDialog
      v-model="showPaymentDialog"
      :amount="selectedExam?.fee || DEFAULT_EXAM_FEE_THB"
      :countdown="PAYMENT_DIALOG_COUNTDOWN_DEFAULT"
      @save="handleSaveQR"
    />

    <!-- Cancel Dialog -->
    <DialogCancel
      v-model="showCancelDialog"
      :exam-date="selectedExamForCancel?.date || ''"
      :exam-time="selectedExamForCancel?.time || ''"
      @confirm="handleConfirmCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppExamHistoryCard from 'src/components/exam/app-exam-history-card.vue';
import AppButton from 'src/components/base/app-button.vue';
import AppPaymentDialog from 'src/components/exam/app-payment-dialog.vue';
import DialogCancel from 'src/components/exam/dialog-cancel.vue';
import { useExamStore } from 'src/stores/exam.store';
import { DEFAULT_EXAM_FEE_THB, PAYMENT_DIALOG_COUNTDOWN_DEFAULT } from 'src/constants/exam';
import type { ExamHistoryItem } from 'src/types/exam';

const { t } = useI18n();
const examStore = useExamStore();

// === State จาก Store ===
const { pendingRegistrations, historyRecords } = storeToRefs(examStore);

// === UI-only State ===
const showPaymentDialog = ref(false);
const selectedExam = ref<ExamHistoryItem | null>(null);

const showCancelDialog = ref(false);
const selectedExamForCancel = ref<ExamHistoryItem | null>(null);

// === Computed: แปลง i18n keys เป็นข้อความจริง ===
/**
 * Store เก็บ status เป็น translation key (เช่น 'exam.status.pending')
 * ที่นี่เราแปลงเป็นข้อความจริงก่อนส่งให้ Template
 */
const pendingExams = computed<ExamHistoryItem[]>(() =>
  pendingRegistrations.value.map((item) => ({
    ...item,
    title: t('exam.history.defaultExamTitle'),
    status: t(item.status),
  })),
);

const historyExams = computed<ExamHistoryItem[]>(() =>
  historyRecords.value.map((item) => {
    const translated: ExamHistoryItem = {
      ...item,
      title: t('exam.history.defaultExamTitle'),
      status: t(item.status),
    };
    if (item.customStatus) {
      translated.customStatus = {
        ...item.customStatus,
        label: item.customStatus.label.includes('PLACEHOLDER_PASSED')
          ? `${t('exam.statusLabel')} : ${t('exam.status.passed')}`
          : item.customStatus.label.includes('PLACEHOLDER_FAILED')
            ? `${t('exam.statusLabel')} : ${t('exam.status.failed')}`
            : t(item.customStatus.label),
      };
    }
    return translated;
  }),
);

// === Methods ===
const handleTimeout = (exam: ExamHistoryItem) => {
  examStore.cancelRegistration(exam.id);
};

const handlePay = (exam: ExamHistoryItem) => {
  selectedExam.value = exam;
  showPaymentDialog.value = true;
};

const handleSaveQR = () => {
  // TODO: Logic to save/download QR image
};

const handleCancel = (exam: ExamHistoryItem) => {
  selectedExamForCancel.value = exam;
  showCancelDialog.value = true;
};

const handleConfirmCancel = () => {
  if (selectedExamForCancel.value) {
    examStore.cancelRegistration(selectedExamForCancel.value.id);
  }
  showCancelDialog.value = false;
};
</script>

<style scoped lang="scss">
// .exam-history-page {
//   // Full width
// }

.section-title {
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: var(--space-sm);
}

.action-btn {
  // Let AppButton handle its own sizing — only define color variants here

  &.btn-action-outline {
    color: var(--text-primary) !important;
    border-color: var(--border-color) !important;
    &:hover {
      background: rgba(0, 0, 0, 0.02) !important;
    }
  }

  &.btn-action-filled {
    background-color: var(--primary) !important;
    color: var(--text-on-primary) !important;
    :deep(.q-icon) {
      color: var(--text-on-primary) !important;
    }
  }
}

.section-icon {
  color: var(--badge-error-dot);
}

.custom-status {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);

  &.success-status {
    color: var(--badge-success-dot);
  }

  &.error-status {
    color: var(--badge-error-dot);
  }

  &.warning-status {
    color: var(--badge-warning-dot);
  }

  // Icon inherits color from parent status class
  :deep(.q-icon) {
    color: inherit;
  }

  @media (max-width: 600px) {
    font-size: var(--font-size-xs);
    :deep(.q-icon) {
      font-size: var(--font-size-body) !important;
    }
  }
}
@media (max-width: 600px) {
  .exam-history-page {
    padding: var(--space-md) !important;
  }

  .page-header {
    margin-bottom: var(--space-xl) !important;

    .page-title {
      font-size: var(--font-size-h2);
    }

    .page-subtitle {
      font-size: var(--font-size-sm);
      line-height: 1.5;
    }
  }

  .section-title {
    padding-bottom: var(--space-sm);
    .text-subtitle1 {
      font-size: var(--font-size-body);
    }
  }
}
</style>
