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
              icon="badge"
              :label="$t('exam.history.candidateCard')"
              class="action-btn btn-action-filled"
              @click="handlePrintVoucher(exam)"
            />
            <AppButton
              v-if="exam.actions?.includes('downloadReceipt')"
              icon="receipt_long"
              :label="$t('exam.history.downloadReceipt')"
              class="action-btn btn-action-filled"
              @click="handlePrintReceipt(exam)"
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
      <TestVoucherReport :data="selectedVoucherData" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppExamHistoryCard from 'src/components/exam/app-exam-history-card.vue';
import AppButton from 'src/components/base/app-button.vue';
import AppPaymentDialog from 'src/components/exam/app-payment-dialog.vue';
import DialogCancel from 'src/components/exam/dialog-cancel.vue';
import TestVoucherReport from 'src/components/test-voucher-report.vue';
import ReceiptCard from 'src/components/receipt-card.vue';
import { useExamStore } from 'src/stores/exam.store';
import { useUserStore } from 'src/stores/user.store';
import { DEFAULT_EXAM_FEE_THB, PAYMENT_DURATION_SECONDS_DEFAULT } from 'src/constants/exam';
import type { ExamHistoryItem } from 'src/types/exam';
import type { VoucherData } from 'src/types/voucher';
import type { ReceiptData } from 'src/types/receipt';

const $q = useQuasar();
const { t } = useI18n();
const examStore = useExamStore();
const userStore = useUserStore();

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

const isDownloadingVoucher = ref(false);
const selectedVoucherData = ref<VoucherData | undefined>(undefined);

const isDownloadingReceipt = ref(false);
const selectedReceiptData = ref<ReceiptData>({
  receiptNo: '',
  transactionDate: '',
  fullName: '',
  nationalId: '',
  examName: '',
  examDate: '',
  location: '',
  amount: 0,
  paymentMethod: '',
  status: 'PENDING',
});

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

const handlePrintVoucher = async (exam: ExamHistoryItem): Promise<void> => {
  const enrollment = exam.rawEnrollment;
  const user = userStore.currentUser;

  if (enrollment && enrollment.SESSION) {
    const session = enrollment.SESSION;
    const examObj = session.EXAM;
    const locationObj = session.LOCATION;

    // Format date nicely to match "15 May 2026"
    let dateStr = '15 May 2026';
    if (examObj?.EXAM_DATE) {
      const d = new Date(examObj.EXAM_DATE);
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    // Format times to "08.00 AM - 10.00 AM" or similar
    const formatTime = (timeStr?: string) => {
      if (!timeStr) return '';
      const parts = timeStr.split(':');
      const part0 = parts[0];
      const part1 = parts[1];
      if (parts.length >= 2 && part0 !== undefined && part1 !== undefined) {
        const hour = parseInt(part0, 10);
        const min = part1;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${String(formattedHour).padStart(2, '0')}.${min} ${ampm}`;
      }
      return timeStr;
    };

    const startTime = formatTime(session.SS_START_TIME);
    const endTime = formatTime(session.SS_END_TIME);
    const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : '08.00 AM - 10.00 AM';

    const locationText = locationObj
      ? `${locationObj.LOCATION_NAME}${locationObj.LOCATION_ROOM_NO ? ` (${locationObj.LOCATION_ROOM_NO})` : ''}`
      : 'QS1, Burapha University';

    selectedVoucherData.value = {
      id: enrollment.ERM_ID,
      fullName: user
        ? `${user.titleEN || ''} ${user.fullNameEN || user.fullNameTH || ''}`.trim()
        : 'Mr. Somdream Jaidee',
      studentId: user?.nationalId || String(user?.id || '66100001'),
      examName: examObj?.EXAM_NAME || "BUU-GET : Burapha University's Graduate English Test",
      examDate: dateStr,
      examTime: timeRange,
      examType: examObj?.EXAM_TYPE || 'ทั่วไป',
      location: locationText,
      seatNo: enrollment.ERM_SEAT_NUMBER || 'A1',
      voucherNo: `ENG2026-${String(enrollment.ERM_ID).padStart(3, '0')}`,
      citizenId: user?.nationalId || '1-1234-12345-12-1',
      testSession: session.SS_NAME || '1/2569',
      barcodeValue: `ENG2026${String(enrollment.ERM_ID).padStart(5, '0')}`,
    };

    $q.loading.show({
      message: 'กำลังเตรียมบัตรประจำตัวผู้สอบเพื่อดาวน์โหลด (Generating Admission Voucher)...',
    });

    isDownloadingVoucher.value = true;

    // Wait for DOM to mount offscreen container
    await nextTick();
    // Brief sleep to allow barcode canvas or images to render fully
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const container = document.getElementById('pdf-render-container');
      const cardElement = container?.querySelector('.voucher-card') as HTMLElement | null;

      if (cardElement) {
        const canvas = await html2canvas(cardElement, {
          scale: 3, // very high-quality rendering (600 DPI feel)
          useCORS: true,
          allowTaint: true,
          backgroundColor: null, // transparent backgrounds
        });

        const imgData = canvas.toDataURL('image/png');

        // Calculate the exact size of the card in millimeters (1px = 0.264583mm)
        // We divide by the scale (3) to get the original dimensions
        const pxToMm = 0.264583;
        const widthMm = (canvas.width * pxToMm) / 3;
        const heightMm = (canvas.height * pxToMm) / 3;

        // Create a PDF with the EXACT dimensions of the card
        const pdf = new jsPDF({
          orientation: widthMm > heightMm ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [widthMm, heightMm],
        });

        // Fill the entire PDF page with the image with no margins
        pdf.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm);
        pdf.save(`BUU-GET_Voucher_${enrollment.ERM_ID}.pdf`);

        $q.notify({
          type: 'positive',
          message: 'ดาวน์โหลดบัตรประจำตัวผู้สอบเรียบร้อยแล้ว (PDF)',
          position: 'top',
        });
      } else {
        throw new Error('Voucher card element not found');
      }
    } catch (err) {
      console.error(err);
      $q.notify({
        type: 'negative',
        message: 'เกิดข้อผิดพลาดในการสร้างไฟล์ดาวน์โหลด กรุณาลองใหม่อีกครั้ง',
        position: 'top',
      });
    } finally {
      $q.loading.hide();
      isDownloadingVoucher.value = false;
      selectedVoucherData.value = undefined;
    }
  }
};

const handlePrintReceipt = async (exam: ExamHistoryItem): Promise<void> => {
  const enrollment = exam.rawEnrollment;
  const user = userStore.currentUser;

  if (enrollment && enrollment.SESSION) {
    const session = enrollment.SESSION;
    const examObj = session.EXAM;
    const locationObj = session.LOCATION;

    // Format date nicely to match "15 May 2026"
    let dateStr = '15 May 2026';
    if (examObj?.EXAM_DATE) {
      const d = new Date(examObj.EXAM_DATE);
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    const locationText = locationObj
      ? `${locationObj.LOCATION_NAME}${locationObj.LOCATION_ROOM_NO ? ` (${locationObj.LOCATION_ROOM_NO})` : ''}`
      : 'QS1, Burapha University';

    const transaction = enrollment.TRANSACTION;

    selectedReceiptData.value = {
      receiptNo: transaction?.TRANX_REF1 || `RC2026-${String(enrollment.ERM_ID).padStart(5, '0')}`,
      transactionDate: transaction?.TRANX_PAID_AT
        ? new Date(transaction.TRANX_PAID_AT).toISOString()
        : transaction?.TRANX_CREATED_AT
          ? new Date(transaction.TRANX_CREATED_AT).toISOString()
          : new Date().toISOString(),
      fullName:
        transaction?.TRANX_RECEIPT_NAME ||
        (user
          ? `${user.titleEN || ''} ${user.fullNameEN || user.fullNameTH || ''}`.trim()
          : 'Mr. Somdream Jaidee'),
      nationalId: transaction?.TRANX_TAX_ID || user?.nationalId || '1-1234-12345-12-1',
      address:
        transaction?.TRANX_RECEIPT_ADDRESS || '169 Longhad Bangsaen Rd, Saen Suk, Chon Buri 20131',
      examName: examObj?.EXAM_NAME || "BUU-GET : Burapha University's Graduate English Test",
      examDate: dateStr,
      location: locationText,
      amount: transaction?.TRANX_AMOUNT || examObj?.EXAM_FEE || 1500,
      paymentMethod: transaction?.TRANX_CHANNEL || 'Mobile Banking',
      status: 'SUCCESS',
    };

    $q.loading.show({
      message: 'กำลังเตรียมใบเสร็จรับเงินเพื่อดาวน์โหลด (Generating Electronic Receipt)...',
    });

    isDownloadingReceipt.value = true;

    // Wait for DOM to mount offscreen container
    await nextTick();
    // Brief sleep to allow elements/watermarks to render fully
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const container = document.getElementById('receipt-render-container');
      const receiptElement = container?.querySelector('.receipt-container') as HTMLElement | null;

      if (receiptElement) {
        const canvas = await html2canvas(receiptElement, {
          scale: 3, // very high-quality rendering (600 DPI feel)
          useCORS: true,
          allowTaint: true,
        });

        const imgData = canvas.toDataURL('image/png');

        // Standard A4 dimensions in PDF: 210mm x 297mm
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        // Fill the entire PDF page with the image with no margins
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        pdf.save(`BUU-GET_Receipt_${enrollment.ERM_ID}.pdf`);

        $q.notify({
          type: 'positive',
          message: 'ดาวน์โหลดใบเสร็จรับเงินเรียบร้อยแล้ว (PDF)',
          position: 'top',
        });
      } else {
        throw new Error('Receipt element not found');
      }
    } catch (err) {
      console.error(err);
      $q.notify({
        type: 'negative',
        message: 'เกิดข้อผิดพลาดในการสร้างใบเสร็จ กรุณาลองใหม่อีกครั้ง',
        position: 'top',
      });
    } finally {
      $q.loading.hide();
      isDownloadingReceipt.value = false;
      selectedReceiptData.value = {
        receiptNo: '',
        transactionDate: '',
        fullName: '',
        nationalId: '',
        examName: '',
        examDate: '',
        location: '',
        amount: 0,
        paymentMethod: '',
        status: 'PENDING',
      };
    }
  }
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
