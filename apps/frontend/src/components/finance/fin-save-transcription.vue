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

    <!-- Signature Placement Preview (เต็มหน้าจอ ก่อนยืนยันการชำระเงิน) -->
    <q-dialog v-model="showPreview" persistent maximized>
      <q-card class="signature-preview-screen">
        <div class="preview-header">
          <div>
            <div class="text-h6 text-weight-bold dialog-title">
              {{ t('admin.finSaveTranscription.signaturePreviewTitle') }}
            </div>
            <div class="preview-hint">
              {{ t('admin.finSaveTranscription.signaturePreviewHint') }}
            </div>
          </div>
          <q-btn
            icon="close"
            flat
            round
            dense
            class="text-grey-6"
            :disable="isLoading"
            @click="closePreview"
          />
        </div>

        <div
          ref="previewStage"
          class="preview-stage"
          @wheel.prevent="onPreviewWheel"
          @dblclick="onPreviewDoubleClick"
        >
          <div
            ref="previewViewport"
            class="preview-viewport"
            :class="{ 'preview-viewport--zoomed': viewZoom > VIEW_ZOOM_MIN }"
            :style="previewViewportStyle"
            @pointerdown="onPreviewPointerDown"
            @pointermove="onPreviewPointerMove"
            @pointerup="onPreviewPointerEnd"
            @pointercancel="onPreviewPointerEnd"
          >
            <div class="preview-scaler" :style="previewScalerStyle">
              <ReceiptCard
                v-if="previewReceipt"
                :receipt="previewReceipt"
                :show-qr="false"
                :signature-image-url="signatureImageUrl"
                :collector-name="collectorName"
                :signature-placement="signaturePlacement"
              />
            </div>
          </div>
        </div>

        <div class="preview-footer">
          <div class="preview-controls">
            <div class="text-caption text-no-wrap">
              {{ t('admin.finSaveTranscription.signatureZoomLabel') }}
            </div>
            <q-btn
              icon="remove"
              flat
              round
              dense
              class="preview-zoom-out"
              :aria-label="t('admin.finSaveTranscription.signatureZoomOut')"
              :disable="isLoading || viewZoom <= VIEW_ZOOM_MIN"
              @click="zoomViewBy(1 / VIEW_ZOOM_STEP)"
            />
            <div class="preview-zoom-value">{{ viewZoomLabel }}</div>
            <q-btn
              icon="add"
              flat
              round
              dense
              class="preview-zoom-in"
              :aria-label="t('admin.finSaveTranscription.signatureZoomIn')"
              :disable="isLoading || viewZoom >= VIEW_ZOOM_MAX"
              @click="zoomViewBy(VIEW_ZOOM_STEP)"
            />
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              class="preview-zoom-fit"
              :label="t('admin.finSaveTranscription.signatureZoomFit')"
              :disable="isLoading"
              @click="resetViewZoom"
            />
          </div>
          <div class="preview-controls">
            <div class="text-caption text-no-wrap">
              {{ t('admin.finSaveTranscription.signatureScaleLabel') }}
            </div>
            <q-slider
              v-model="signaturePlacement.scale"
              :min="SIGNATURE_MIN_SCALE"
              :max="SIGNATURE_MAX_SCALE"
              :step="0.05"
              color="primary"
              class="preview-scale-slider"
              :disable="isLoading"
              @update:model-value="clampSignatureOffset"
            />
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              :label="t('admin.finSaveTranscription.signatureResetBtn')"
              :disable="isLoading"
              @click="resetSignaturePlacement"
            />
          </div>

          <div class="preview-actions">
            <q-btn
              :label="t('profile.cancel')"
              unelevated
              class="btn-dialog-cancel text-weight-bold"
              :disable="isLoading"
              @click="closePreview"
            />
            <q-btn
              :label="t('admin.finSaveTranscription.signatureConfirmBtn')"
              unelevated
              class="btn-dialog-confirm btn-preview-confirm text-weight-bold"
              :loading="isLoading"
              @click="onPreviewConfirm"
            />
          </div>
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
        :signature-placement="signaturePlacement"
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  clearPaymentImportLocalData,
  globalImportedRows,
} from 'src/composables/use-payment-import';
import {
  checkBankReconcileEsignReady,
  confirmBankReconcilePayments,
  type PendingPaymentImportRow,
  type SignedReceiptDraft,
} from 'src/services/bank-reconcile.service';
import { uploadSignedReceiptFile } from 'src/services/receipt.service';
import { generateReceiptQrDataUrl } from 'src/utils/verify-qr';
import ReceiptCard from 'src/components/receipt-card.vue';
import type { ReceiptData, SignaturePlacement } from 'src/types/receipt';

import type { PaymentRow } from 'src/types/exam.types';

/** ขนาดใบเสร็จ A4 ที่ 96dpi ใช้คำนวณสเกลพรีวิวให้พอดีหน้าจอ */
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const PREVIEW_MIN_SCALE = 0.45;
const PREVIEW_MAX_SCALE = 1.4;
const VIEW_ZOOM_MIN = 1;
const VIEW_ZOOM_MAX = 4;
const VIEW_ZOOM_STEP = 1.25;
const SIGNATURE_MIN_SCALE = 0.5;
const SIGNATURE_MAX_SCALE = 3;
const DEFAULT_PLACEMENT: SignaturePlacement = { offsetX: 0, offsetY: 0, scale: 1 };

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

const showPreview = ref(false);
const previewReceipt = ref<ReceiptData | null>(null);
const previewViewport = ref<HTMLElement | null>(null);
const previewStage = ref<HTMLElement | null>(null);
const previewScale = ref(0.5);
const viewZoom = ref(1);
const signaturePlacement = ref<SignaturePlacement>({ ...DEFAULT_PLACEMENT });
const pendingTranxIds = ref<number[]>([]);
const pendingSignature = ref<{ fullName: string; signatureBase64: string } | null>(null);
let dragState: {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
} | null = null;
let panState: {
  pointerId: number;
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
} | null = null;

const toSignatureDataUrl = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.startsWith('data:')) return trimmed;
  return `data:image/png;base64,${trimmed}`;
};

/** พรีวิวเต็มหน้าจอ — ย่อ/ขยายใบเสร็จให้พอดีพื้นที่ที่เหลือหลังหักหัวและท้ายหน้าจอ */
const updatePreviewScale = (): void => {
  const availableWidth = window.innerWidth - 80;
  const availableHeight = window.innerHeight - 250;
  if (availableWidth <= 0 || availableHeight <= 0) return;

  const fitted = Math.min(availableWidth / A4_WIDTH_PX, availableHeight / A4_HEIGHT_PX);
  previewScale.value = Math.min(PREVIEW_MAX_SCALE, Math.max(PREVIEW_MIN_SCALE, fitted));
};

const visualScale = computed(() => previewScale.value * viewZoom.value);

const previewViewportStyle = computed<Record<string, string>>(() => ({
  width: `${Math.round(A4_WIDTH_PX * visualScale.value)}px`,
  height: `${Math.round(A4_HEIGHT_PX * visualScale.value)}px`,
}));

const previewScalerStyle = computed<Record<string, string>>(() => ({
  transform: `scale(${visualScale.value})`,
}));

const viewZoomLabel = computed(() => `${Math.round(viewZoom.value * 100)}%`);

const clampViewZoom = (value: number): number =>
  Math.min(VIEW_ZOOM_MAX, Math.max(VIEW_ZOOM_MIN, Math.round(value * 100) / 100));

/** ซูมโดยตรึงจุดใต้เคอร์เซอร์ไว้ที่เดิม แล้วเลื่อนหน้าจอไปยังจุดนั้น */
const zoomViewAt = async (clientX: number, clientY: number, nextZoom: number): Promise<void> => {
  const zoom = clampViewZoom(nextZoom);
  const viewport = previewViewport.value;
  const stage = previewStage.value;
  if (!viewport || !stage || zoom === viewZoom.value) {
    viewZoom.value = zoom;
    return;
  }

  const rect = viewport.getBoundingClientRect();
  const currentScale = visualScale.value || 1;
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const inside =
    rect.width > 0 &&
    rect.height > 0 &&
    localX >= 0 &&
    localY >= 0 &&
    localX <= rect.width &&
    localY <= rect.height;
  const anchorX = inside ? clientX : rect.left + rect.width / 2;
  const anchorY = inside ? clientY : rect.top + rect.height / 2;
  const contentX = (inside ? localX : rect.width / 2) / currentScale;
  const contentY = (inside ? localY : rect.height / 2) / currentScale;

  viewZoom.value = zoom;
  await nextTick();

  const nextRect = viewport.getBoundingClientRect();
  stage.scrollLeft += nextRect.left + contentX * visualScale.value - anchorX;
  stage.scrollTop += nextRect.top + contentY * visualScale.value - anchorY;
};

const zoomViewBy = (factor: number): void => {
  const stage = previewStage.value;
  const rect = stage?.getBoundingClientRect();
  const clientX = rect ? rect.left + rect.width / 2 : 0;
  const clientY = rect ? rect.top + rect.height / 2 : 0;
  void zoomViewAt(clientX, clientY, viewZoom.value * factor);
};

const resetViewZoom = (): void => {
  viewZoom.value = VIEW_ZOOM_MIN;
  const stage = previewStage.value;
  if (!stage) return;
  stage.scrollLeft = 0;
  stage.scrollTop = 0;
};

const onPreviewWheel = (event: WheelEvent): void => {
  if (isLoading.value || event.deltaY === 0) return;
  const factor = event.deltaY < 0 ? VIEW_ZOOM_STEP : 1 / VIEW_ZOOM_STEP;
  void zoomViewAt(event.clientX, event.clientY, viewZoom.value * factor);
};

const onPreviewDoubleClick = (event: MouseEvent): void => {
  const target = event.target;
  if (target instanceof Element && target.closest('button')) return;
  void zoomViewAt(event.clientX, event.clientY, viewZoom.value * VIEW_ZOOM_STEP);
};

const parseAmount = (value: string | undefined): number => {
  const parsed = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

/** ใบเสร็จตัวอย่างจากแถวแรก — ยังไม่มีเลขใบเสร็จและ QR เพราะยังไม่ยืนยัน */
const buildPreviewReceipt = (): ReceiptData => {
  const row = (props.rows ?? [])[0];
  return {
    receiptNo: '-',
    transactionDate: new Date().toISOString(),
    fullName: row?.db_applicant_name?.trim() || row?.file_payer?.trim() || '-',
    nationalId: '-',
    address: '-',
    examName: 'ค่าสมัครทดสอบความรู้ภาษาอังกฤษ (BUU-GET)',
    examDate: '-',
    location: '',
    amount: parseAmount(row?.db_amount || row?.file_amount),
    paymentMethod: '',
    status: 'SUCCESS',
  };
};

const getSignatureBounds = (): {
  limitX: number;
  limitY: number;
} | null => {
  const box = previewViewport.value?.querySelector('.signature-box');
  const image = box?.querySelector('.signature-image');
  if (!(box instanceof HTMLElement) || !(image instanceof HTMLElement)) return null;

  const scaledWidth = image.offsetWidth * signaturePlacement.value.scale;
  const scaledHeight = image.offsetHeight * signaturePlacement.value.scale;
  return {
    limitX: Math.abs(box.clientWidth - scaledWidth) / 2,
    limitY: Math.abs(box.clientHeight - scaledHeight) / 2,
  };
};

/** ไม่ให้ลากจนลายเซ็นหลุดออกนอกช่อง «ภาพลายมือชื่อ» */
const clampSignatureOffset = (): void => {
  const bounds = getSignatureBounds();
  if (!bounds) return;
  const { offsetX, offsetY } = signaturePlacement.value;
  signaturePlacement.value = {
    ...signaturePlacement.value,
    offsetX: Math.min(bounds.limitX, Math.max(-bounds.limitX, offsetX)),
    offsetY: Math.min(bounds.limitY, Math.max(-bounds.limitY, offsetY)),
  };
};

const resetSignaturePlacement = (): void => {
  signaturePlacement.value = { ...DEFAULT_PLACEMENT };
};

const onPreviewPointerDown = (event: PointerEvent): void => {
  const target = event.target;
  const onSignature = target instanceof Element && Boolean(target.closest('.signature-box'));

  if (onSignature) {
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: signaturePlacement.value.offsetX,
      originY: signaturePlacement.value.offsetY,
    };
  } else if (viewZoom.value > VIEW_ZOOM_MIN) {
    panState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: previewStage.value?.scrollLeft ?? 0,
      scrollTop: previewStage.value?.scrollTop ?? 0,
    };
  } else {
    return;
  }

  previewViewport.value?.setPointerCapture(event.pointerId);
  event.preventDefault();
};

const onPreviewPointerMove = (event: PointerEvent): void => {
  if (dragState?.pointerId === event.pointerId) {
    signaturePlacement.value = {
      ...signaturePlacement.value,
      offsetX: dragState.originX + (event.clientX - dragState.startX) / visualScale.value,
      offsetY: dragState.originY + (event.clientY - dragState.startY) / visualScale.value,
    };
    clampSignatureOffset();
    return;
  }

  if (!panState || panState.pointerId !== event.pointerId || !previewStage.value) return;
  previewStage.value.scrollLeft = panState.scrollLeft - (event.clientX - panState.startX);
  previewStage.value.scrollTop = panState.scrollTop - (event.clientY - panState.startY);
};

const onPreviewPointerEnd = (event: PointerEvent): void => {
  if (dragState?.pointerId !== event.pointerId && panState?.pointerId !== event.pointerId) return;
  previewViewport.value?.releasePointerCapture(event.pointerId);
  dragState = null;
  panState = null;
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
    const response = (err as { response?: { data?: { message?: string | string[] } } }).response;
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

    // เปิดพรีวิวให้จัดตำแหน่งลายเซ็นก่อน ยังไม่เขียนข้อมูลใด ๆ
    signatureImageUrl.value = toSignatureDataUrl(signature.signatureBase64);
    collectorName.value = signature.fullName;
    pendingSignature.value = signature;
    pendingTranxIds.value = tranxIds;
    previewReceipt.value = buildPreviewReceipt();
    resetSignaturePlacement();
    viewZoom.value = VIEW_ZOOM_MIN;
    updatePreviewScale();
    showConfirm.value = false;
    showPreview.value = true;
  } catch (err) {
    console.error('Failed to prepare signature preview:', err);
    const message = getErrorMessage(err, t('admin.finSaveTranscription.signatureRequiredError'));
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

const closePreview = () => {
  if (isLoading.value) return;
  showPreview.value = false;
  previewReceipt.value = null;
  pendingSignature.value = null;
  pendingTranxIds.value = [];
  signatureImageUrl.value = '';
  collectorName.value = '';
};

const toPendingImportRows = (): PendingPaymentImportRow[] =>
  globalImportedRows.value
    .filter((row) => row.applicantId.trim() && row.payerName.trim())
    .map((row) => ({
      applicantId: row.applicantId.trim(),
      referenceNo:
        row.referenceNo.trim() && row.referenceNo.trim() !== '-' ? row.referenceNo.trim() : null,
      payerName: row.payerName.trim(),
      amount: Number(String(row.amount).replace(/,/g, '')) || 0,
      paymentDate: row.paymentDate && row.paymentDate !== '-' ? row.paymentDate : null,
      paymentTime: row.paymentTime && row.paymentTime !== '-' ? row.paymentTime : null,
    }));

const onPreviewConfirm = async () => {
  const signature = pendingSignature.value;
  if (!signature || pendingTranxIds.value.length === 0) {
    closePreview();
    return;
  }

  isLoading.value = true;
  try {
    const importRows = toPendingImportRows();
    if (importRows.length === 0) {
      $q.notify({
        type: 'warning',
        message: t('admin.finSaveTranscription.noMatchedRowsError'),
      });
      return;
    }

    const confirmed = await confirmBankReconcilePayments(pendingTranxIds.value, importRows);
    // ใช้ตำแหน่งและขนาดลายเซ็นชุดเดียวกับที่พรีวิวไว้กับใบเสร็จทุกใบ
    await archiveSignedReceipts(confirmed.receipts ?? [], signature);

    showPreview.value = false;
    previewReceipt.value = null;
    pendingSignature.value = null;
    pendingTranxIds.value = [];
    showSuccess.value = true;
  } catch (err) {
    console.error('Failed to save transcription payment statuses:', err);
    const message = getErrorMessage(err, t('admin.finSaveTranscription.saveError'));
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

onMounted(() => {
  window.addEventListener('resize', updatePreviewScale);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePreviewScale);
});

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

.signature-preview-screen {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  padding: 16px 24px;
  background-color: var(--neutral-100, #f4f5f7);
}

.preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex: 0 0 auto;
}

.preview-stage {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  overflow: auto;
  padding: 12px 0;
}

.preview-footer {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 560px;
  width: 100%;
  margin: 0 auto;
}

.preview-scale-slider {
  flex: 1 1 auto;
}

.preview-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.btn-preview-confirm {
  width: auto;
  min-width: 140px;
  padding: 0 16px;
}

.preview-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.preview-zoom-value {
  min-width: 48px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-size: 0.85rem;
}

.preview-viewport {
  flex: 0 0 auto;
  margin: auto;
  overflow: hidden;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-sm);
  background-color: #fff;
  box-shadow: var(--shadow-md);
  touch-action: none;
}

.preview-viewport--zoomed {
  cursor: grab;
}

.preview-scaler {
  width: 210mm;
  transform-origin: top left;

  :deep(.signature-box) {
    cursor: grab;
    outline: 2px dashed var(--primary);
    outline-offset: 2px;
  }

  :deep(.signature-image) {
    pointer-events: none;
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
