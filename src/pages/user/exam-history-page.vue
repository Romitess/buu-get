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
      :expiry-time="paymentExpiryTime"
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
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppExamHistoryCard from 'src/components/exam/app-exam-history-card.vue';
import AppButton from 'src/components/base/app-button.vue';
import AppPaymentDialog from 'src/components/exam/app-payment-dialog.vue';
import DialogCancel from 'src/components/exam/dialog-cancel.vue';
import { useExamStore } from 'src/stores/exam.store';
import { DEFAULT_EXAM_FEE_THB, PAYMENT_DURATION_SECONDS_DEFAULT } from 'src/constants/exam';
import type { ExamHistoryItem } from 'src/types/exam';

const $q = useQuasar();
const { t } = useI18n();
const examStore = useExamStore();

// === State จาก Store ===
const { pendingRegistrations, historyRecords } = storeToRefs(examStore);

onMounted(async () => {
  await examStore.fetchHistory();
});

// === UI-only State ===
const showPaymentDialog = ref(false);
const selectedExam = ref<ExamHistoryItem | null>(null);
const paymentExpiryTime = ref<string>(new Date().toISOString());

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
      const { result } = item.customStatus;
      translated.customStatus = {
        ...item.customStatus,
        label: result
          ? `${t('exam.statusLabel')} : ${t(`exam.status.${result}`)}`
          : t(item.customStatus.label),
      };
    }
    return translated;
  }),
);

// === Methods ===
const handleTimeout = (exam: ExamHistoryItem): void => {
  void examStore.cancelRegistration(exam.id);
};

const handlePay = (exam: ExamHistoryItem): void => {
  selectedExam.value = exam;

  // Use the existing deadline from the exam object to stay in sync with the page
  if (exam.deadline) {
    paymentExpiryTime.value = exam.deadline;
  } else {
    // Fallback only if deadline is missing
    const now = new Date();
    const expiry = new Date(now.getTime() + PAYMENT_DURATION_SECONDS_DEFAULT * 1000);
    paymentExpiryTime.value = expiry.toISOString();
  }

  showPaymentDialog.value = true;
};

const handleSaveQR = async (): Promise<void> => {
  if (selectedExam.value) {
    try {
      await examStore.confirmPayment(selectedExam.value.id);
      $q.notify({
        type: 'positive',
        message: t('success'),
        position: 'top',
      });
    } catch {
      $q.notify({
        type: 'negative',
        message: 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน',
        position: 'top',
      });
    }
  }
  showPaymentDialog.value = false;
};

const handleCancel = (exam: ExamHistoryItem): void => {
  selectedExamForCancel.value = exam;
  showCancelDialog.value = true;
};

const handleConfirmCancel = async (): Promise<void> => {
  if (selectedExamForCancel.value) {
    try {
      await examStore.cancelRegistration(selectedExamForCancel.value.id);
      $q.notify({
        type: 'positive',
        message: 'ยกเลิกการสมัครสอบเรียบร้อยแล้ว',
        position: 'top',
        timeout: 2000,
      });
    } catch {
      $q.notify({
        type: 'negative',
        message: 'เกิดข้อผิดพลาดในการยกเลิกการสมัคร',
        position: 'top',
        timeout: 2000,
      });
    }
  }
  showCancelDialog.value = false;
};
</script>

<style scoped lang="scss">
.page-header {
  margin-top: var(--space-lg);
  .page-title {
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-black);
    line-height: 1.4;
    color: var(--text-primary);
    margin: 0 0 var(--space-sm) 0;
  }
  .page-subtitle {
    font-family: 'Sarabun', sans-serif;
    font-size: var(--font-size-body);
    color: var(--text-primary);
    font-weight: var(--font-weight-black);
    max-width: 900px;
    line-height: 1.6;
    margin: 0;
    letter-spacing: 0;
  }
}

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
