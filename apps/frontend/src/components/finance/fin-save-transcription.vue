<template>
  <div>
    <!-- Save Button Trigger -->
    <q-btn
      :label="t('admin.finSaveTranscription.btnLabel')"
      unelevated
      :disable="disabled"
      class="btn-save-trigger full-width"
      :class="{ 'btn-disabled': disabled }"
      @click="showConfirm = true"
    />

    <!-- Confirm Dialog -->
    <q-dialog v-model="showConfirm" persistent>
      <q-card class="confirm-dialog-card">
        <!-- Close Button & Title -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-bold dialog-title">
            {{ t('admin.finSaveTranscription.confirmTitle') }}
          </div>
          <q-btn
            icon="close"
            flat
            round
            dense
            v-close-popup
            class="text-grey-6"
            :disable="isLoading"
          />
        </div>

        <!-- Confirm Message -->
        <div class="text-center q-my-lg message-text">
          {{ t('admin.finSaveTranscription.confirmMessage') }}
        </div>

        <!-- Action Buttons -->
        <div class="row justify-center q-gutter-x-md q-mt-lg">
          <q-btn
            :label="t('profile.cancel')"
            unelevated
            v-close-popup
            class="btn-dialog-cancel text-weight-bold"
            :disable="isLoading"
          />
          <q-btn
            :label="t('admin.finSaveTranscription.confirmBtn')"
            unelevated
            @click="onConfirm"
            class="btn-dialog-confirm text-weight-bold"
            :loading="isLoading"
          />
        </div>
      </q-card>
    </q-dialog>

    <div
      v-if="renderingReceipt"
      id="signed-receipt-render-container"
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
      <ReceiptCard
        :receipt="renderingReceipt"
        :signature-image-url="signatureImageUrl"
        :collector-name="collectorName"
      />
    </div>

    <!-- Success Dialog -->
    <q-dialog v-model="showSuccess" persistent>
      <q-card class="success-dialog-card">
        <!-- Close Button & Title -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-bold dialog-title">
            {{ t('admin.finSaveTranscription.successTitle') }}
          </div>
          <q-btn icon="close" flat round dense @click="onSuccessClose" class="text-grey-6" />
        </div>

        <!-- Success Message -->
        <div class="text-center q-my-lg message-text">
          {{ t('admin.finSaveTranscription.successMessage') }}
        </div>

        <!-- Full width OK Button -->
        <div class="row q-mt-lg">
          <q-btn
            :label="t('admin.finSaveTranscription.okBtn')"
            unelevated
            @click="onSuccessClose"
            class="btn-dialog-ok text-weight-bold full-width"
          />
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { clearPaymentImportLocalData } from 'src/composables/use-payment-import';
import {
  checkBankReconcileEsignReady,
  confirmBankReconcilePayments,
  type SignedReceiptDraft,
} from 'src/services/bank-reconcile.service';
import { uploadSignedReceiptFile } from 'src/services/receipt.service';
import { generateReceiptQrDataUrl } from 'src/utils/verify-qr';
import ReceiptCard from 'src/components/receipt-card.vue';
import type { ReceiptData } from 'src/types/receipt';

import type { PaymentRow } from 'src/types/exam.types';

const props = defineProps<{
  disabled?: boolean;
  rows?: (PaymentRow & { tranxId?: number | null })[];
}>();

const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const showConfirm = ref(false);
const showSuccess = ref(false);
const isLoading = ref(false);
const renderingReceipt = ref<ReceiptData | null>(null);
const signatureImageUrl = ref('');
const collectorName = ref('');

const toSignatureDataUrl = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.startsWith('data:')) return trimmed;
  return `data:image/png;base64,${trimmed}`;
};

const waitForImages = async (element: HTMLElement): Promise<void> => {
  const pendingImages = Array.from(element.querySelectorAll('img')).filter(
    (image) => !image.complete,
  );
  if (pendingImages.length === 0) return;
  await Promise.race([
    Promise.all(
      pendingImages.map(
        (image) =>
          new Promise<void>((resolve) => {
            image.onload = () => resolve();
            image.onerror = () => resolve();
          }),
      ),
    ),
    new Promise<void>((resolve) => window.setTimeout(resolve, 800)),
  ]);
};

const toReceiptData = async (draft: SignedReceiptDraft): Promise<ReceiptData> => {
  const qrDataUrl = await generateReceiptQrDataUrl(draft.verifyCode);
  return {
    receiptNo: draft.receiptNo,
    transactionDate: draft.issuedAt,
    fullName: draft.payerName,
    nationalId: draft.taxId || '-',
    address: draft.address || '-',
    examName: draft.description,
    examDate: draft.examDate || '-',
    location: '',
    amount: Number(draft.amount) || 0,
    paymentMethod: draft.paymentChannel === 3 ? 'QR' : 'Mobile Banking',
    status: 'SUCCESS',
    verifyCode: draft.verifyCode,
    qrDataUrl,
  };
};

const renderSignedReceiptPdf = async (receipt: ReceiptData): Promise<Blob> => {
  renderingReceipt.value = receipt;
  await nextTick();
  await new Promise<void>((resolve) => window.setTimeout(resolve, 300));

  const container = document.getElementById('signed-receipt-render-container');
  const receiptElement = container?.querySelector('.receipt-container') as HTMLElement | null;
  if (!receiptElement) {
    throw new Error('Receipt element not found');
  }
  await waitForImages(receiptElement);

  const canvas = await html2canvas(receiptElement, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
  });
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.72), 'JPEG', 0, 0, 210, 297);
  renderingReceipt.value = null;
  return pdf.output('blob');
};

const archiveSignedReceipts = async (
  drafts: SignedReceiptDraft[],
  signature: { fullName: string; signatureBase64: string },
): Promise<void> => {
  signatureImageUrl.value = toSignatureDataUrl(signature.signatureBase64);
  collectorName.value = signature.fullName;
  try {
    for (const draft of drafts) {
      const receipt = await toReceiptData(draft);
      const pdf = await renderSignedReceiptPdf(receipt);
      await uploadSignedReceiptFile(draft.rcId, pdf);
    }
  } finally {
    renderingReceipt.value = null;
  }
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (
      err as { response?: { data?: { message?: string | string[] } } }
    ).response;
    const message = response?.data?.message;
    if (Array.isArray(message) && message.length > 0) {
      return message.join(', ');
    }
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return fallback;
};

const onConfirm = async () => {
  isLoading.value = true;
  try {
    const tranxIds = (props.rows ?? [])
      .filter((row) => row.tranxId)
      .map((row) => Number(row.tranxId))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (tranxIds.length === 0) {
      $q.notify({
        type: 'warning',
        message: t('admin.finSaveTranscription.noMatchedRowsError'),
      });
      return;
    }

    // ต้องได้ลายเซ็นก่อน — ถ้าไม่ได้จะไม่เรียก confirm (ไม่เขียน DB ชุดอนุมัติ/ใบเสร็จ)
    const signature = await checkBankReconcileEsignReady();
    const confirmed = await confirmBankReconcilePayments(tranxIds);
    // แปะลายเซ็นในช่อง «ภาพลายมือชื่อ» ของใบเสร็จรูปแบบเดิม แล้วค่อยอัปโหลดไฟล์
    await archiveSignedReceipts(confirmed.receipts ?? [], signature);

    showConfirm.value = false;
    showSuccess.value = true;
  } catch (err) {
    console.error('Failed to save transcription payment statuses:', err);
    const message = getErrorMessage(
      err,
      t('admin.finSaveTranscription.signatureRequiredError'),
    );
    $q.notify({
      type: 'negative',
      message: /signature|e-sign|ลายเซ็น/i.test(message)
        ? t('admin.finSaveTranscription.signatureRequiredError')
        : message || t('admin.finSaveTranscription.saveError'),
    });
  } finally {
    isLoading.value = false;
  }
};

const onSuccessClose = () => {
  showSuccess.value = false;
  clearPaymentImportLocalData({ suspendAutoLoad: true });
  void router.push('/admin/payment-import');
};
</script>

<style scoped lang="scss">
.btn-save-trigger {
  background-color: var(--primary) !important;
  color: white !important;
  border-radius: var(--radius-sm);
  height: 48px;
  font-size: 1rem;
  transition: all 0.3s ease;

  &.btn-disabled {
    background-color: var(--neutral-200) !important;
    color: var(--neutral-400) !important;
    cursor: not-allowed;
  }

  &:not(.btn-disabled):hover {
    background-color: var(--primary-dark) !important;
  }
}

.confirm-dialog-card,
.success-dialog-card {
  width: 450px;
  max-width: 90vw;
  border-radius: var(--radius-lg);
  padding: 24px 32px;
  box-shadow: var(--shadow-lg);
}

.dialog-title {
  color: var(--text-primary);
  font-size: 1.15rem;
}

.message-text {
  font-size: 1.05rem;
  color: var(--text-primary);
  font-weight: 500;
}

.btn-dialog-cancel {
  background-color: var(--neutral-200) !important;
  color: var(--neutral-600) !important;
  width: 120px;
  height: 40px;
  border-radius: var(--radius-sm);
  text-transform: none;
}

.btn-dialog-confirm {
  background-color: var(--primary) !important;
  color: white !important;
  width: 120px;
  height: 40px;
  border-radius: var(--radius-sm);
  text-transform: none;

  &:hover {
    background-color: var(--primary-dark) !important;
  }
}

.btn-dialog-ok {
  background-color: var(--primary) !important;
  color: white !important;
  height: 44px;
  border-radius: var(--radius-sm);
  text-transform: none;
  font-size: 1rem;

  &:hover {
    background-color: var(--primary-dark) !important;
  }
}
</style>
