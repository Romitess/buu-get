<template>
  <q-page class="exam-history-page q-pa-lg">
    <!-- Page Header -->
    <div class="page-header q-mb-xl">
      <h1 class="page-title">{{ $t('exam.history.pageTitle') }}</h1>
      <p class="page-subtitle">
        {{ $t('exam.history.pageDescription') }}
      </p>
    </div>

    <!-- Pending Payment Section -->
    <div v-if="pendingExams.length > 0" class="history-section q-mb-xl">
      <div class="section-title row items-center q-mb-md">
        <q-icon name="schedule" size="24px" style="color: var(--badge-error-dot)" class="q-mr-sm" />
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
        >
          <template #actions>
            <AppButton
              v-if="exam.actions?.includes('cancel')"
              outline
              :label="$t('exam.history.cancel')"
              class="action-btn btn-cancel"
              @click="handleCancel(exam)"
            />
            <AppButton
              v-if="exam.actions?.includes('pay')"
              icon="payments"
              :label="$t('exam.history.pay')"
              class="action-btn pay-btn"
              @click="handlePay(exam)"
            />
          </template>
        </AppExamHistoryCard>
      </div>
    </div>

    <!-- History Section -->
    <div v-if="historyExams.length > 0" class="history-section">
      <div class="section-title row items-center q-mb-md">
        <q-icon name="schedule" size="24px" style="color: var(--badge-error-dot)" class="q-mr-sm" />
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
            <div
              :class="[
                'custom-status',
                `${exam.customStatus.type}-status`,
                'row items-center q-ml-md',
              ]"
            >
              <q-icon
                :name="exam.customStatus.icon"
                size="24px"
                :style="{
                  color: `var(--badge-${exam.customStatus.type}-dot)`,
                }"
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
              class="action-btn btn-cancel"
            />
            <AppButton
              v-if="exam.actions?.includes('certificate')"
              icon="file_download"
              :label="$t('exam.history.certificate')"
              class="action-btn pay-btn"
            />
            <AppButton
              v-if="exam.actions?.includes('candidateCard')"
              icon="file_download"
              :label="$t('exam.history.candidateCard')"
              class="action-btn pay-btn"
            />
            <AppButton
              v-if="exam.actions?.includes('downloadReceipt')"
              icon="receipt_long"
              :label="$t('exam.history.downloadReceipt')"
              class="action-btn pay-btn"
            />
          </template>
        </AppExamHistoryCard>
      </div>
    </div>

    <!-- Payment Dialog -->
    <AppPaymentDialog
      v-model="showPaymentDialog"
      :amount="selectedExam?.fee || 500"
      :countdown="'29 : 50'"
      @save="handleSaveQR"
    />

    <!-- Cancel Dialog -->
    <DialogCancel
      v-model="showCancelDialog"
      :exam-date="selectedExamForCancel?.date || ''"
      :exam-time="selectedExamForCancel?.time || ''"
      @confirm="handleConfirmCancel"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import AppExamHistoryCard from 'src/components/exam/AppExamHistoryCard.vue';
import AppButton from 'src/components/base/AppButton.vue';
import AppPaymentDialog from 'src/components/exam/AppPaymentDialog.vue';
import DialogCancel from 'src/components/exam/DialogCancel.vue';
import { useExamStore } from 'src/stores/exam.store';

/** สถานะเพิ่มเติม เช่น ผ่าน/ไม่ผ่าน หรือ หมดเวลาชำระเงิน */
interface CustomStatus {
  label: string;
  type: 'success' | 'error';
  icon: string;
}

/** รายการสอบแต่ละรายการในประวัติการสอบ */
interface ExamHistoryRecord {
  id: number;
  title: string;
  status: string;
  statusType: 'primary' | 'success' | 'warning' | 'error' | 'info';
  date: string;
  time: string;
  location: string;
  fee?: number;
  deadline?: string;
  customStatus?: CustomStatus;
  actions?: string[];
}

const { t } = useI18n();
const examStore = useExamStore();

// === State จาก Store ===
const { pendingRegistrations, historyRecords } = storeToRefs(examStore);

// === UI-only State ===
const showPaymentDialog = ref(false);
const selectedExam = ref<ExamHistoryRecord | null>(null);

const showCancelDialog = ref(false);
const selectedExamForCancel = ref<ExamHistoryRecord | null>(null);

// === Computed: แปลง i18n keys เป็นข้อความจริง ===
/**
 * Store เก็บ status เป็น translation key (เช่น 'exam.status.pending')
 * ที่นี่เราแปลงเป็นข้อความจริงก่อนส่งให้ Template
 */
const pendingExams = computed<ExamHistoryRecord[]>(() =>
  pendingRegistrations.value.map((item) => ({
    ...item,
    title: t('exam.history.defaultExamTitle'),
    status: t(item.status),
  })),
);

const historyExams = computed<ExamHistoryRecord[]>(() =>
  historyRecords.value.map((item) => {
    const translated: ExamHistoryRecord = {
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
const handlePay = (exam: ExamHistoryRecord) => {
  selectedExam.value = exam;
  showPaymentDialog.value = true;
};

const handleSaveQR = () => {
  // Logic to save/download QR image
  console.log('Saving QR Code...');
};

const handleCancel = (exam: ExamHistoryRecord) => {
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
.exam-history-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-top: 20px;
  .page-title {
    font-size: 28px;
    font-weight: 800;
    line-height: 1.4;
    color: var(--text-primary);
    margin: 0 0 8px 0;
  }
  .page-subtitle {
    font-family: 'Sarabun', sans-serif;
    font-size: 15px;
    color: var(--text-secondary);
    font-weight: 800;
    max-width: 900px;
    line-height: 24px;
    margin: 0;
    letter-spacing: 0px;
  }
}

.section-title {
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
}

.action-btn {
  min-width: 140px;
  height: 44px;
  border-radius: var(--radius-sm);
  font-weight: 700;

  &.btn-cancel {
    color: var(--text-primary) !important;
    border-color: var(--border-color) !important;
    &:hover {
      background: rgba(0, 0, 0, 0.02) !important;
    }
  }

  &.pay-btn {
    background-color: var(--primary) !important;
    color: var(--text-on-primary) !important;
    :deep(.q-icon) {
      color: var(--text-on-primary) !important;
    }
  }
}

.custom-status {
  font-size: 14px;
  font-weight: 700;

  &.success-status {
    color: var(--badge-success-dot);
  }

  &.error-status {
    color: var(--badge-error-dot);
  }

  &.warning-status {
    color: var(--badge-warning-dot);
  }
}
</style>
