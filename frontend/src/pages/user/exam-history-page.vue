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
              v-if="exam.actions?.includes('downloadReceipt')"
              icon="receipt_long"
              :label="$t('exam.history.downloadReceipt')"
              class="action-btn btn-action-filled"
              @click="handlePrintReceipt(exam)"
            />
            <AppButton
              v-if="exam.actions?.includes('certificate')"
              icon="file_download"
              :label="$t('exam.history.certificate')"
              class="action-btn btn-action-filled"
              @click="handlePrintCertificate(exam)"
            />
            <AppButton
              v-if="exam.actions?.includes('candidateCard')"
              icon="badge"
              :label="$t('exam.history.candidateCard')"
              class="action-btn btn-action-filled"
              @click="handlePrintVoucher(exam)"
            />
          </template>
        </AppExamHistoryCard>
      </div>
    </div>

    <ReceiptInformationDialog
      v-model="showReceiptInformationDialog"
      :exam-title="selectedExam?.title || ''"
      :amount="selectedExam?.fee ?? 0"
      :payment-deadline="selectedExamPaymentPeriod"
      :initial-value="initialReceiptInformation"
      :is-foreign-user="isForeignUser"
      @confirm="handleReceiptInformationConfirm"
    />

    <!-- Payment Dialog -->
    <AppPaymentDialog
      v-model="showPaymentDialog"
      :amount="selectedExam?.fee ?? 0"
      :expiry-time="paymentExpiryTime"
      @save="handleSaveQR"
      @timeout="handlePaymentTimeout"
    />

    <!-- Cancel Dialog -->
    <DialogCancel
      v-model="showCancelDialog"
      :exam-date="selectedExamForCancel?.date || ''"
      :exam-time="selectedExamForCancel?.time || ''"
      @confirm="handleConfirmCancel"
    />

    <!-- Hidden container for PDF generation -->
    <div
      v-if="isDownloadingVoucher"
      id="pdf-render-container"
      style="
        position: absolute;
        left: -9999px;
        top: -9999px;
        width: 800px;
        z-index: -1000;
        pointer-events: none;
      "
    >
      <div class="exam-history-voucher-download">
        <TestVoucherReport
          :data="selectedVoucherData"
          :regulations-en="selectedVoucherRegulationsEn"
          :regulations-th="selectedVoucherRegulationsTh"
        />
      </div>
    </div>

    <!-- Hidden container for Receipt PDF generation -->
    <div
      v-if="isDownloadingReceipt"
      id="receipt-render-container"
      style="
        position: absolute;
        left: -9999px;
        top: -9999px;
        width: 210mm;
        height: 297mm;
        z-index: -1000;
        pointer-events: none;
        background-color: #ffffff;
      "
    >
      <ReceiptCard :receipt="selectedReceiptData" />
    </div>

    <!-- Hidden container for Certificate PDF generation -->
    <div
      v-if="isDownloadingCertificate"
      id="certificate-render-container"
      style="
        position: absolute;
        left: -9999px;
        top: -9999px;
        width: 210mm;
        height: 297mm;
        z-index: -1000;
        pointer-events: none;
        background-color: #ffffff;
      "
    >
      <CertificateScoreReport v-if="selectedCertificateData" :data="selectedCertificateData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { AxiosError } from 'axios';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppExamHistoryCard from 'src/components/exam/app-exam-history-card.vue';
import AppButton from 'src/components/base/app-button.vue';
import AppPaymentDialog from 'src/components/exam/app-payment-dialog.vue';
import ReceiptInformationDialog from 'src/components/exam/receipt-information-dialog.vue';
import DialogCancel from 'src/components/exam/dialog-cancel.vue';
import TestVoucherReport from 'src/components/test-voucher-report.vue';
import ReceiptCard from 'src/components/receipt-card.vue';
import CertificateScoreReport from 'src/components/certificate-score-report.vue';
import { useExamStore } from 'src/stores/exam.store';
import { useUserStore } from 'src/stores/user.store';
import { useExamDocuments } from 'src/composables/use-exam-documents';
import { useExamCertificateDocument } from 'src/composables/use-exam-certificate-document';
import { useAppDate } from 'src/composables/useAppDate';
import { PAYMENT_DURATION_SECONDS_DEFAULT } from 'src/constants/exam';
import type { ExamHistoryItem } from 'src/types/exam';
import type { ReceiptInformation } from 'src/types/receipt-information';

const $q = useQuasar();
const { t } = useI18n();
const examStore = useExamStore();
const userStore = useUserStore();
const { formatDateRange } = useAppDate();

// === State จาก Store ===
const { pendingRegistrations, historyRecords } = storeToRefs(examStore);

onMounted(async () => {
  await examStore.fetchHistory();
});

// === UI-only State ===
const showPaymentDialog = ref(false);
const showReceiptInformationDialog = ref(false);
const selectedExam = ref<ExamHistoryItem | null>(null);
const pendingTransactionId = ref<number | null>(null);
const paymentExpiryTime = ref<string>(new Date().toISOString());
const receiptInformation = ref<ReceiptInformation | null>(null);

const initialReceiptInformation = computed<ReceiptInformation>(() => {
  const user = userStore.currentUser;
  return {
    taxId: user?.taxId || user?.nationalId || user?.passportNo || '',
    fullName: user?.fullNameTH || user?.fullNameEN || '',
    phone: user?.phone || '',
    address: user?.address || '',
  };
});

const isForeignUser = computed(
  () => !userStore.currentUser?.nationalId && Boolean(userStore.currentUser?.passportNo),
);

const selectedExamPaymentPeriod = computed((): string => {
  const exam = selectedExam.value?.rawEnrollment?.SESSION?.EXAM;
  if (!exam?.EXAM_PAY_START_DATE || !exam.EXAM_PAY_END_DATE) return '-';
  return formatDateRange(exam.EXAM_PAY_START_DATE, exam.EXAM_PAY_END_DATE);
});

const showCancelDialog = ref(false);
const selectedExamForCancel = ref<ExamHistoryItem | null>(null);

// === Composable: PDF Documents Handling ===
const {
  isDownloadingVoucher,
  selectedVoucherData,
  selectedVoucherRegulationsEn,
  selectedVoucherRegulationsTh,
  isDownloadingReceipt,
  selectedReceiptData,
  printVoucher,
  printReceipt,
} = useExamDocuments();

const { isDownloadingCertificate, selectedCertificateData, printCertificate } =
  useExamCertificateDocument();

// === Computed: แปลง i18n keys เป็นข้อความจริง ===
/**
 * Store เก็บ status เป็น translation key (เช่น 'exam.status.pending')
 * ที่นี่เราแปลงเป็นข้อความจริงก่อนส่งให้ Template
 */
const pendingExams = computed<ExamHistoryItem[]>(() =>
  pendingRegistrations.value.map((item) => ({
    ...item,
    title: item.title || t('exam.history.defaultExamTitle'),
    status: t(item.status),
  })),
);

const historyExams = computed<ExamHistoryItem[]>(() =>
  historyRecords.value.map((item) => {
    const translated: ExamHistoryItem = {
      ...item,
      title: item.title || t('exam.history.defaultExamTitle'),
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
  void examStore.cancelRegistration(exam.id, 'paymentTimeout');
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof AxiosError) {
    return err.response?.data?.message || err.message || fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
};

const handlePay = async (exam: ExamHistoryItem): Promise<void> => {
  selectedExam.value = exam;
  receiptInformation.value = null;
  pendingTransactionId.value = null;

  try {
    const amount = exam.fee;
    if (amount === undefined) {
      throw new Error('Exam fee is missing');
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + PAYMENT_DURATION_SECONDS_DEFAULT * 1000);
    paymentExpiryTime.value = expiry.toISOString();

    pendingTransactionId.value = await examStore.createTransaction(exam.id, amount, 1);
    showReceiptInformationDialog.value = true;
  } catch (err: unknown) {
    console.error('Transaction creation failed:', err);
    $q.notify({
      type: 'negative',
      message: getErrorMessage(err, 'เกิดข้อผิดพลาดในการสร้างรายการชำระเงิน'),
      position: 'bottom',
      timeout: 5000,
    });
  }
};

const handleReceiptInformationConfirm = (value: ReceiptInformation): void => {
  receiptInformation.value = value;
  showReceiptInformationDialog.value = false;
  showPaymentDialog.value = true;
};

const handleSaveQR = async (): Promise<void> => {
  if (pendingTransactionId.value && receiptInformation.value) {
    try {
      const userCode = userStore.currentUser?.userCode ?? '';

      await examStore.confirmPayment(
        pendingTransactionId.value,
        userCode,
        receiptInformation.value,
      );
      pendingTransactionId.value = null;
      $q.notify({
        type: 'positive',
        message: t('success'),
        position: 'bottom',
      });
    } catch (err: unknown) {
      console.error('Payment confirmation failed:', err);
      $q.notify({
        type: 'negative',
        message: getErrorMessage(err, 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน'),
        position: 'bottom',
        timeout: 5000,
      });
    }
  }
  showPaymentDialog.value = false;
};

const handlePaymentTimeout = async (): Promise<void> => {
  const tranxId = pendingTransactionId.value;
  if (!tranxId) return;

  try {
    await examStore.expireTransaction(tranxId);
    pendingTransactionId.value = null;
    showPaymentDialog.value = false;
  } catch (err: unknown) {
    console.error('Payment expiration failed:', err);
    $q.notify({
      type: 'negative',
      message: getErrorMessage(err, 'เกิดข้อผิดพลาดในการหมดอายุรายการชำระเงิน'),
      position: 'bottom',
      timeout: 5000,
    });
  }
};

const handleCancel = (exam: ExamHistoryItem): void => {
  selectedExamForCancel.value = exam;
  showCancelDialog.value = true;
};

const handleConfirmCancel = async (): Promise<void> => {
  if (selectedExamForCancel.value) {
    try {
      await examStore.cancelRegistration(selectedExamForCancel.value.id, 'manual');
      $q.notify({
        type: 'positive',
        message: 'ยกเลิกการสมัครสอบเรียบร้อยแล้ว',
        position: 'bottom',
        timeout: 2000,
      });
    } catch {
      $q.notify({
        type: 'negative',
        message: 'เกิดข้อผิดพลาดในการยกเลิกการสมัคร',
        position: 'bottom',
        timeout: 2000,
      });
    }
  }
  showCancelDialog.value = false;
};

const handlePrintVoucher = (exam: ExamHistoryItem): void => {
  void printVoucher(exam);
};

const handlePrintReceipt = (exam: ExamHistoryItem): void => {
  void printReceipt(exam);
};

const handlePrintCertificate = (exam: ExamHistoryItem): void => {
  void printCertificate(exam);
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

.exam-history-voucher-download {
  --voucher-download-subtitle-size: 15px;
  --voucher-download-photo-width: 140px;
  --voucher-download-photo-height: 156px;
  --voucher-download-details-gap: 40px;
  --voucher-download-signature-gap: 30px;
  --voucher-download-watermark-color: #1e89e50d;
  --voucher-download-front-watermark-left: 52%;
  --voucher-download-front-watermark-top: 47%;
  --voucher-download-rules-watermark-left: 48%;
  --voucher-download-rules-watermark-top: 52%;
  --voucher-download-rules-watermark-size: 150px;

  :deep(.voucher-header .header-subtitle) {
    font-size: var(--voucher-download-subtitle-size) !important;
    line-height: 1.25 !important;
  }

  :deep(.voucher-body .content-container) {
    grid-template-columns: var(--voucher-download-photo-width) minmax(0, 1fr);
    column-gap: var(--voucher-download-details-gap);
  }

  :deep(.profile-photo-wrapper) {
    width: var(--voucher-download-photo-width);
    height: var(--voucher-download-photo-height);
    border-radius: 0;
  }

  :deep(.profile-photo-wrapper .profile-photo-img) {
    border-radius: 0 !important;
  }

  :deep(.signature-line) {
    width: var(--voucher-download-photo-width);
    margin-top: var(--voucher-download-signature-gap);
  }

  :deep(.voucher-card .watermark-bg) {
    color: var(--voucher-download-watermark-color);
    left: var(--voucher-download-front-watermark-left);
    top: var(--voucher-download-front-watermark-top);
  }

  :deep(.regulations-box .watermark-bg) {
    color: var(--voucher-download-watermark-color);
    left: var(--voucher-download-rules-watermark-left) !important;
    top: var(--voucher-download-rules-watermark-top);
    font-size: var(--voucher-download-rules-watermark-size);
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

// Print Styles for Admission Voucher Modal
@media print {
  // Hide all general page structures completely
  body,
  html {
    background-color: #ffffff !important;
    overflow: visible !important;
    height: auto !important;
  }

  .q-dialog__backdrop,
  .q-header,
  .q-footer,
  .q-drawer,
  .page-container:not(.voucher-print-dialog),
  .q-dialog-plugin,
  .no-print {
    display: none !important;
  }

  // Ensure Quasar dialog displays inline/fully block for printing
  .q-dialog {
    position: relative !important;
    overflow: visible !important;
    box-shadow: none !important;
  }

  .q-dialog__inner {
    padding: 0 !important;
    display: block !important;
    overflow: visible !important;
    position: relative !important;
    box-shadow: none !important;
  }

  .q-dialog__inner > div {
    max-width: 100% !important;
    width: 100% !important;
    box-shadow: none !important;
    border: none !important;
    background: transparent !important;
    overflow: visible !important;
  }
}
</style>
