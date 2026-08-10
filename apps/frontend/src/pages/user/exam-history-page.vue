<template>
  <div class="page-container exam-history-page q-pa-lg">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('exam.history.pageTitle')"
      :subtitle="$t('exam.history.pageDescription')"
    />

    <!-- Loading state -->
    <div v-if="isLoadingHistory" class="q-gutter-y-md">
      <CardSkeleton v-for="n in 3" :key="`history-skeleton-${n}`" height="160px" :lines="4" />
    </div>

    <div v-else-if="historyError" class="text-center q-pa-xl">
      <q-icon name="error_outline" size="48px" color="negative" />
      <p class="text-grey-7 q-mt-md">{{ historyError }}</p>
      <q-btn
        flat
        color="primary"
        class="q-mt-sm"
        :label="$t('exam.history.retry')"
        @click="retryLoadHistory"
      />
    </div>

    <template v-else>
      <div
        v-if="hasAnyRecords"
        class="history-filter-bar q-mb-lg"
        role="tablist"
        :aria-label="$t('exam.history.sectionTitle')"
      >
        <button
          v-for="option in filterOptions"
          :key="option.value"
          type="button"
          role="tab"
          class="history-filter-tab"
          :class="{ 'history-filter-tab--active': activeFilter === option.value }"
          :aria-selected="activeFilter === option.value"
          @click="activeFilter = option.value"
        >
          <span class="history-filter-tab__label">{{ option.label }}</span>
          <span v-if="option.count > 0" class="history-filter-tab__count">{{ option.count }}</span>
        </button>
      </div>

      <!-- Pending Payment Section -->
      <div v-if="visiblePendingExams.length > 0" class="history-section q-mb-xl">
        <div class="section-title row items-center q-mb-md">
          <q-icon name="payments" size="var(--space-lg)" class="section-icon q-mr-sm" />
          <span class="text-weight-bold text-subtitle1">{{
            $t('exam.history.pendingSectionTitle')
          }}</span>
        </div>

        <div class="q-gutter-y-md">
          <AppExamHistoryCard
            v-for="exam in visiblePendingExams"
            :key="exam.id"
            v-bind="getPendingCardProps(exam)"
            @timeout="handleSessionTimeout(exam)"
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

      <div v-if="!hasVisibleRecords" class="text-center q-pa-xl">
        <q-icon name="history" size="48px" color="grey-4" />
        <p class="text-grey-6 q-mt-md">
          {{ hasAnyRecords ? $t('exam.history.emptyFilter') : $t('exam.history.empty') }}
        </p>
      </div>

      <!-- History Section -->
      <div v-if="visibleHistoryExams.length > 0" class="history-section">
        <div class="section-title row items-center q-mb-md">
          <q-icon name="history" size="var(--space-lg)" class="section-icon q-mr-sm" />
          <span class="text-weight-bold text-subtitle1">{{ $t('exam.history.sectionTitle') }}</span>
        </div>

        <div class="q-gutter-y-md">
          <AppExamHistoryCard
            v-for="exam in visibleHistoryExams"
            :key="exam.id"
            v-bind="getHistoryCardProps(exam)"
          >
            <template v-if="exam.actions?.includes('candidateCard')" #notify>
              <ExamPrepNotifyButton
                :show-unread="isPrepGuideUnread(exam.id)"
                :ariaLabel="$t('exam.prepGuide.notifyAria')"
                @click="openPrepGuide(exam)"
              />
            </template>

            <template v-if="exam.customStatus" #status-append>
              <div
                :class="['custom-status', `${exam.customStatus.type}-status`, 'row items-center']"
              >
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
                :loading="isDownloadingReceipt"
                @click="handlePrintReceipt(exam)"
              />
              <AppButton
                v-if="exam.actions?.includes('certificate')"
                icon="file_download"
                :label="$t('exam.history.certificate')"
                class="action-btn btn-action-filled"
                :loading="isDownloadingCertificate"
                @click="handlePrintCertificate(exam)"
              />
              <AppButton
                v-if="exam.actions?.includes('candidateCard')"
                icon="badge"
                :label="$t('exam.history.candidateCard')"
                class="action-btn btn-action-filled"
                :loading="isDownloadingVoucher"
                @click="handlePrintVoucher(exam)"
              />
            </template>
          </AppExamHistoryCard>
        </div>
      </div>
    </template>

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

    <ExamPrepGuideDialog
      v-model="showPrepGuide"
      :exam="selectedExamForPrep"
      :is-printing="isDownloadingVoucher"
      @print="handlePrepGuidePrint"
      @finish="onPrepGuideFinish"
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
      v-if="isDownloadingCertificate && selectedCertificateData"
      id="certificate-render-container"
      class="certificate-render-container"
    >
      <CertificateCard
        v-for="side in certificateSides"
        :key="side"
        class="certificate-render-card"
        :side="side"
        :fullname="selectedCertificateData.fullName"
        :test-taker-id="selectedCertificateData.testTakerId"
        :national-id="selectedCertificateData.nationalId"
        :test-session="selectedCertificateData.testSession"
        :test-date="selectedCertificateData.testDate"
        :vocab-score="selectedCertificateData.vocabScore"
        :reading-score="selectedCertificateData.readingScore"
        v-bind="
          selectedCertificateData.scoreLines
            ? { scoreLines: selectedCertificateData.scoreLines }
            : {}
        "
        :total-score="selectedCertificateData.totalScore"
        :band-level="selectedCertificateData.bandLevel"
        :issue-date="selectedCertificateData.reportIssueDate"
        :valid-until="selectedCertificateData.scoreValidUntil"
        :certificate-code="selectedCertificateData.certificateCode"
        :qr-data-url="selectedCertificateData.qrDataUrl ?? null"
        :band-rules="selectedCertificateData.bandRules"
        :photo-url="selectedCertificateData.profileImage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
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
import ExamPrepNotifyButton from 'src/components/exam/exam-prep-notify-button.vue';
import ExamPrepGuideDialog from 'src/components/exam/exam-prep-guide-dialog.vue';
import TestVoucherReport from 'src/components/test-voucher-report.vue';
import ReceiptCard from 'src/components/receipt-card.vue';
import CertificateCard from 'src/components/exam/certificate-card.vue';
import { useExamStore } from 'src/stores/exam.store';
import { useUserStore } from 'src/stores/user.store';
import { useExamDocuments } from 'src/composables/use-exam-documents';
import { useExamCertificateDocument } from 'src/composables/use-exam-certificate-document';
import { useExamPrepGuide } from 'src/composables/use-exam-prep-guide';
import { useAppDate } from 'src/composables/useAppDate';
import type { ExamHistoryCategory, ExamHistoryItem } from 'src/types/exam';
import type { ReceiptInformation } from 'src/types/receipt-information';
import { matchesHistoryCategory } from 'src/utils/map-enrollment-history-status';
import { CardSkeleton } from 'src/components/base/skeleton';

type HistoryFilter = ExamHistoryCategory | 'all';

interface TranslatedExamHistoryItem extends ExamHistoryItem {
  registrationStatusLabel: string;
  examStatusLabel?: string;
  customStatus?: ExamHistoryItem['customStatus'] & { label: string };
}

const $q = useQuasar();
const { t } = useI18n();
const examStore = useExamStore();
const userStore = useUserStore();
const { formatDateRange } = useAppDate();
const { isUnread: isPrepGuideUnread, markSeen: markPrepGuideSeen } = useExamPrepGuide();

// === State จาก Store ===
const { pendingRegistrations, historyRecords, historyError } = storeToRefs(examStore);

const isLoadingHistory = ref(true);

const loadHistory = async (): Promise<void> => {
  isLoadingHistory.value = true;
  try {
    await examStore.fetchHistory(true);
  } finally {
    isLoadingHistory.value = false;
  }
};

const retryLoadHistory = async (): Promise<void> => {
  await loadHistory();
};

onMounted(async () => {
  await loadHistory();
});

// === UI-only State ===
const showPaymentDialog = ref(false);
const showReceiptInformationDialog = ref(false);
const selectedExam = ref<ExamHistoryItem | null>(null);
const pendingTransactionId = ref<number | null>(null);
const receiptInformation = ref<ReceiptInformation | null>(null);
/** QR session expiry from startPaymentSession — countdown starts when dialog opens */
const paymentExpiryTime = ref('');

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
const showPrepGuide = ref(false);
const selectedExamForPrep = ref<ExamHistoryItem | null>(null);

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

const certificateSides = ['front', 'back'] as const;

const activeFilter = ref<HistoryFilter>('all');

const filterOptions = computed(() => {
  const options: { label: string; value: HistoryFilter; count: number }[] = [
    { label: t('exam.history.filters.all'), value: 'all', count: 0 },
    { label: t('exam.history.filters.pending'), value: 'pending', count: 0 },
    { label: t('exam.history.filters.registration'), value: 'registration', count: 0 },
    { label: t('exam.history.filters.exam'), value: 'exam', count: 0 },
    { label: t('exam.history.filters.completed'), value: 'completed', count: 0 },
    { label: t('exam.history.filters.cancelled'), value: 'cancelled', count: 0 },
  ];

  return options
    .map((option) => ({
      ...option,
      count: countItemsForFilter(option.value),
    }))
    .filter((option) => option.value === 'all' || option.count > 0);
});

const translateHistoryItem = (item: ExamHistoryItem): TranslatedExamHistoryItem => {
  const translated: TranslatedExamHistoryItem = {
    ...item,
    title: item.title || t('exam.history.defaultExamTitle'),
    registrationStatusLabel: t(item.registrationStatus.label),
  };

  if (item.examStatus) {
    translated.examStatusLabel = t(item.examStatus.label);
  }

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
};

const pendingExams = computed<TranslatedExamHistoryItem[]>(() =>
  pendingRegistrations.value.map(translateHistoryItem),
);

const historyExams = computed<TranslatedExamHistoryItem[]>(() =>
  historyRecords.value.map(translateHistoryItem),
);

const countItemsForFilter = (filter: HistoryFilter): number => {
  const pendingCount =
    filter === 'all' || filter === 'pending'
      ? pendingExams.value.filter((item) => matchesHistoryCategory(item, filter)).length
      : 0;
  const historyCount = historyExams.value.filter((item) =>
    matchesHistoryCategory(item, filter),
  ).length;
  return pendingCount + historyCount;
};

const hasAnyRecords = computed(
  () => pendingExams.value.length > 0 || historyExams.value.length > 0,
);

const visiblePendingExams = computed(() =>
  pendingExams.value.filter((item) => matchesHistoryCategory(item, activeFilter.value)),
);

const visibleHistoryExams = computed(() =>
  historyExams.value.filter((item) => matchesHistoryCategory(item, activeFilter.value)),
);

const hasVisibleRecords = computed(
  () => visiblePendingExams.value.length > 0 || visibleHistoryExams.value.length > 0,
);

watch(filterOptions, (options) => {
  if (!options.some((option) => option.value === activeFilter.value)) {
    activeFilter.value = 'all';
  }
});

const getPendingCardProps = (exam: TranslatedExamHistoryItem) => ({
  registrationStatusLabel: exam.registrationStatusLabel,
  registrationStatusType: exam.registrationStatus.type,
  title: exam.title,
  date: exam.date,
  time: exam.time,
  location: exam.location,
  ...(exam.seatLabel ? { seatLabel: exam.seatLabel } : {}),
  ...(exam.fee !== undefined ? { fee: exam.fee } : {}),
  ...(exam.deadline ? { deadline: exam.deadline } : {}),
  ...(exam.payByDate ? { payByDate: exam.payByDate } : {}),
});

const getHistoryCardProps = (exam: TranslatedExamHistoryItem) => ({
  registrationStatusLabel: exam.registrationStatusLabel,
  registrationStatusType: exam.registrationStatus.type,
  ...(exam.examStatusLabel ? { examStatusLabel: exam.examStatusLabel } : {}),
  ...(exam.examStatus ? { examStatusType: exam.examStatus.type } : {}),
  title: exam.title,
  date: exam.date,
  time: exam.time,
  location: exam.location,
  ...(exam.seatLabel ? { seatLabel: exam.seatLabel } : {}),
});

// === Methods ===
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
  paymentExpiryTime.value = '';

  try {
    const amount = exam.fee;
    if (amount === undefined) {
      throw new Error('Exam fee is missing');
    }

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

const handleReceiptInformationConfirm = async (value: ReceiptInformation): Promise<void> => {
  receiptInformation.value = value;
  showReceiptInformationDialog.value = false;

  const tranxId = pendingTransactionId.value;
  if (!tranxId) {
    $q.notify({
      type: 'negative',
      message: 'ไม่พบรายการชำระเงิน',
      position: 'bottom',
      timeout: 5000,
    });
    return;
  }

  try {
    paymentExpiryTime.value = await examStore.startPaymentSession(tranxId);
    showPaymentDialog.value = true;
    // Refresh so history card switches from pay-by date to countdown
    await examStore.fetchHistory(true);
  } catch (err: unknown) {
    console.error('Payment session start failed:', err);
    pendingTransactionId.value = null;
    paymentExpiryTime.value = '';
    $q.notify({
      type: 'negative',
      message: getErrorMessage(err, 'เกิดข้อผิดพลาดในการเริ่มการชำระเงิน'),
      position: 'bottom',
      timeout: 5000,
    });
    await examStore.fetchHistory(true);
  }
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
      paymentExpiryTime.value = '';
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

const handleSessionTimeout = async (exam: ExamHistoryItem): Promise<void> => {
  // While QR dialog is open, dialog timeout owns expire to avoid double cancel/notify
  if (showPaymentDialog.value) {
    return;
  }

  const tranxId =
    pendingTransactionId.value ?? exam.rawEnrollment?.TRANSACTION?.TRANX_ID ?? null;

  if (tranxId) {
    try {
      await examStore.expireTransaction(tranxId, exam.id);
      pendingTransactionId.value = null;
      paymentExpiryTime.value = '';
      $q.notify({
        type: 'warning',
        message: t('exam.status.paymentTimeout'),
        position: 'bottom',
        timeout: 5000,
      });
    } catch (err: unknown) {
      console.error('Payment session expiration failed:', err);
      $q.notify({
        type: 'negative',
        message: getErrorMessage(err, 'เกิดข้อผิดพลาดในการหมดอายุรายการชำระเงิน'),
        position: 'bottom',
        timeout: 5000,
      });
    }
    return;
  }

  void examStore.cancelRegistration(exam.id, 'paymentTimeout');
};

const handlePaymentTimeout = async (): Promise<void> => {
  const tranxId = pendingTransactionId.value;
  if (!tranxId) return;

  try {
    await examStore.expireTransaction(tranxId, selectedExam.value?.id);
    pendingTransactionId.value = null;
    paymentExpiryTime.value = '';
    showPaymentDialog.value = false;
    $q.notify({
      type: 'warning',
      message: t('exam.status.paymentTimeout'),
      position: 'bottom',
      timeout: 5000,
    });
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

const openPrepGuide = (exam: ExamHistoryItem): void => {
  selectedExamForPrep.value = exam;
  showPrepGuide.value = true;
  markPrepGuideSeen(exam.id);
};

const handlePrepGuidePrint = (): void => {
  if (!selectedExamForPrep.value) {
    return;
  }
  handlePrintVoucher(selectedExamForPrep.value);
};

const onPrepGuideFinish = (): void => {
  if (selectedExamForPrep.value) {
    markPrepGuideSeen(selectedExamForPrep.value.id);
  }
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

.history-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  align-items: center;
  border-bottom: 1px solid var(--neutral-200);
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.history-filter-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-xs);
  margin-bottom: -1px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    color: var(--primary);
  }

  &--active {
    color: var(--primary);
    font-weight: var(--font-weight-bold);
    border-bottom-color: var(--primary);
  }
}

.history-filter-tab__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: calc(var(--space-unit) * 5);
  height: calc(var(--space-unit) * 5);
  padding: 0 calc(var(--space-unit) * 1.5);
  border-radius: var(--radius-pill);
  background: var(--neutral-100);
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.history-filter-tab--active .history-filter-tab__count {
  background: color-mix(in srgb, var(--primary) 12%, white);
  color: var(--primary);
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

.certificate-render-container {
  position: absolute;
  left: -9999px;
  top: -9999px;
  z-index: -1000;
  pointer-events: none;
  width: 616px;
  background-color: #ffffff;
}

.certificate-render-card + .certificate-render-card {
  margin-top: var(--space-md);
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

  .history-filter-bar {
    gap: var(--space-sm);
  }

  .history-filter-tab {
    font-size: var(--font-size-sm);
    padding: var(--space-sm) 2px;
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
