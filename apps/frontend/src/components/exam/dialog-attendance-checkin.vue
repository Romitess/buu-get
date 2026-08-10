<template>
  <q-dialog ref="dialogRef" @hide="handleDialogHide">
    <q-card class="checkin-dialog-card">
      <header class="dialog-header">
        <h2>เช็กอินเข้าห้องสอบ</h2>
        <q-btn
          flat
          round
          dense
          icon="close"
          color="grey-6"
          aria-label="ปิด"
          class="close-btn"
          @click="onCancelClick"
        />
      </header>

      <section v-if="isAssistActive" class="assist-section">
        <h3 class="assist-section-title">มือถือช่วยแสกน</h3>
        <p class="assist-section-hint">
          ให้เจ้าหน้าที่สแกน QR นี้เพื่อเปิดกล้องแสกนบนมือถือ (ต้องล็อกอิน)
        </p>
        <div v-if="qrDataUrl" class="assist-qr-wrap">
          <img :src="qrDataUrl" alt="QR สำหรับเข้าร่วมช่วยแสกน" class="assist-qr-image" />
        </div>
        <p v-if="joinUrl" class="assist-url">{{ joinUrl }}</p>
        <div class="row justify-center q-mt-sm">
          <AppButton
            label="ปิดโหมดมือถือ"
            class="footer-btn cancel-btn"
            :disable="isCheckingIn"
            @click="disablePhoneAssist"
          />
        </div>
      </section>
      <section v-else class="assist-toggle-section">
        <AppButton
          icon="qr_code_scanner"
          label="มือถือช่วยแสกน"
          color="secondary"
          outline
          class="assist-toggle-btn"
          :loading="isAssistStarting"
          :disable="isCheckingIn || !canStartAssist"
          @click="enablePhoneAssist"
        />
      </section>

      <section class="search-section">
        <div class="row items-end q-col-gutter-x-md">
          <div
            ref="searchFieldWrapperRef"
            class="col"
            @keydown.capture="onSearchKeydown"
            @beforeinput.capture="onSearchBeforeInput"
          >
            <AppLabeledInput
              v-model="searchInput"
              label="เลขบัตรประชาชน / Passport / Test Taker ID"
              placeholder="กรอกหรือแสกนบาร์โค้ดจาก Test Voucher"
              class="custom-labeled-input"
              maxlength="13"
              hide-bottom-space
              autofocus
              :disable="isCheckingIn"
            >
              <template v-slot:label>
                เลขบัตรประชาชน / Passport / Test Taker ID <span class="text-red">*</span>
              </template>
            </AppLabeledInput>
          </div>
          <div class="col-shrink">
            <AppButton
              label="ค้นหา"
              color="primary"
              class="search-btn"
              :disable="isCheckingIn"
              @click="handleSearch"
            />
          </div>
        </div>
        <div v-if="validationError" class="validation-error q-mt-xs">
          {{ validationError }}
        </div>
      </section>

      <section class="voucher-section">
        <h3 class="voucher-section-title">Test Voucher</h3>
        <div class="voucher-preview-container">
          <TestVoucherReport
            :data="currentVoucherData"
            :show-actions="false"
            :show-regulations="false"
            :use-image-placeholder="isPlaceholderImage"
          />
        </div>
      </section>

      <footer class="action-footer row justify-center q-mt-md q-gutter-x-md">
        <AppButton label="ยกเลิก" class="footer-btn cancel-btn" @click="onCancelClick" />
        <AppButton
          label="เช็กอินเข้าห้องสอบ"
          color="primary"
          class="footer-btn checkin-confirm-btn"
          :disable="!canCheckIn || isCheckingIn"
          :loading="isCheckingIn"
          @click="handleCheckIn"
        />
      </footer>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import AppLabeledInput from 'src/components/base/app-labeled-input.vue';
import AppButton from 'src/components/base/app-button.vue';
import TestVoucherReport from 'src/components/test-voucher-report.vue';
import { checkInEnrollment } from 'src/services/enrollment.service';
import type { AttendanceTableRow } from 'src/types/enrollment.types';
import { ExamAttendStatus, EnrollmentStatus } from 'src/types/enrollment.types';
import type { VoucherData } from 'src/types/voucher';
import { codeToScanChar, normalizeScanPayload } from 'src/utils/scan-keyboard';
import { useCheckInAssistHost } from 'src/composables/use-check-in-assist-host';
import type { AssistEvent } from 'src/types/check-in-assist.types';

/** Short delay so voucher paints before auto check-in */
const SCAN_PREVIEW_DELAY_MS = 250;
const SEARCH_MAX_LENGTH = 13;

const props = defineProps<{
  attendances: AttendanceTableRow[];
  examId: number;
  sessionIds: number[];
  examName: string;
  examDate: string;
  examTime: string;
  examLocation: string;
  examRound: string;
  /** Refresh parent attendance table without closing this dialog */
  onCheckedIn?: () => void;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const $q = useQuasar();

const searchInput = ref('');
const validationError = ref('');
const searchedCandidate = ref<AttendanceTableRow | null>(null);
const isCheckingIn = ref(false);
const searchFieldWrapperRef = ref<HTMLElement | null>(null);

const {
  joinUrl,
  qrDataUrl,
  isAssistActive,
  isStarting: isAssistStarting,
  startAssist,
  stopAssist,
} = useCheckInAssistHost();

const canStartAssist = computed(() => props.examId > 0 && props.sessionIds.length > 0);

/** Snapshot so we can mark INTIME after check-in without reopening the dialog */
const localAttendances = ref<AttendanceTableRow[]>(props.attendances.map((row) => ({ ...row })));

const getSearchNativeInput = (): HTMLInputElement | null => {
  return searchFieldWrapperRef.value?.querySelector('input') ?? null;
};

const focusSearchInput = (): void => {
  void nextTick(() => {
    const input = getSearchNativeInput();
    input?.focus();
    input?.select();
  });
};

/**
 * Capture-phase handler: runs before the native input inserts layout-mapped glyphs
 * (Thai Kedmanee). Prefer event.code so Digit6 → "6" even when OS is Thai.
 */
const appendScanChar = (scanChar: string): void => {
  if (searchInput.value.length >= SEARCH_MAX_LENGTH) {
    return;
  }
  searchInput.value += scanChar;
};

const onSearchKeydown = (event: KeyboardEvent): void => {
  if (isCheckingIn.value) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (event.code === 'Enter' || event.code === 'NumpadEnter') {
    event.preventDefault();
    event.stopPropagation();
    void handleScanSubmit();
    return;
  }

  // Readonly field: handle edit keys ourselves
  if (event.code === 'Backspace') {
    event.preventDefault();
    event.stopPropagation();
    searchInput.value = searchInput.value.slice(0, -1);
    return;
  }
  if (event.code === 'Delete') {
    event.preventDefault();
    event.stopPropagation();
    searchInput.value = '';
    return;
  }

  // Primary: physical key (layout-independent)
  const fromCode = codeToScanChar(event.code);
  if (fromCode) {
    event.preventDefault();
    event.stopPropagation();
    appendScanChar(fromCode);
    return;
  }

  // Fallback: OS already mapped to Thai glyph in event.key (some IMEs / scanners)
  if (event.key.length === 1) {
    const fromKey = normalizeScanPayload(event.key);
    if (fromKey && fromKey !== event.key) {
      event.preventDefault();
      event.stopPropagation();
      appendScanChar(fromKey);
    }
  }
};

/** Block insertText that contains Kedmanee glyphs; insert ASCII instead */
const onSearchBeforeInput = (event: Event): void => {
  const inputEvent = event as InputEvent;
  if (isCheckingIn.value) {
    inputEvent.preventDefault();
    return;
  }
  if (inputEvent.inputType !== 'insertText' || !inputEvent.data) {
    return;
  }
  const normalized = normalizeScanPayload(inputEvent.data);
  if (normalized === inputEvent.data) {
    return;
  }
  inputEvent.preventDefault();
  for (const ch of normalized) {
    appendScanChar(ch);
  }
};

/** If any Thai glyph still slips in (IME/paste), convert immediately for display + match */
watch(searchInput, (value) => {
  const normalized = normalizeScanPayload(value);
  if (normalized !== value) {
    searchInput.value = normalized.slice(0, SEARCH_MAX_LENGTH);
  }
});

onMounted(() => {
  focusSearchInput();
});

const formatAssistCheckInTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const applyAssistCandidate = (event: AssistEvent): void => {
  const candidate = event.candidate;
  if (!candidate) return;

  const existing = localAttendances.value.find((row) => row.ermId === candidate.ermId);
  let merged: AttendanceTableRow;

  if (existing) {
    merged = {
      index: existing.index,
      ermId: existing.ermId,
      nationalId: candidate.nationalId ?? existing.nationalId,
      location: existing.location,
      titleTh: candidate.titleTh || existing.titleTh,
      fullnameTh: candidate.fullnameTh || existing.fullnameTh,
      titleEn: candidate.titleEn ?? existing.titleEn ?? null,
      fullnameEn: candidate.fullnameEn ?? existing.fullnameEn ?? null,
      seatNumber: candidate.seatNumber || existing.seatNumber,
      attendanceStatus: ExamAttendStatus.INTIME,
      checkInTime: formatAssistCheckInTime(event.at),
      sessionId: existing.sessionId,
      sessionLocationId: existing.sessionLocationId,
      hasRecord: true,
      passportNo: candidate.passportNo ?? existing.passportNo ?? null,
      profileImage: candidate.profileImage ?? existing.profileImage ?? null,
      testSession: candidate.testSession ?? existing.testSession ?? null,
      voucherNo: candidate.voucherNo ?? existing.voucherNo ?? null,
      examType: candidate.examType ?? existing.examType ?? null,
      testTakerCode: candidate.testTakerCode ?? existing.testTakerCode ?? null,
      paymentStatus: existing.paymentStatus,
    };
    if (existing.slId !== undefined) merged.slId = existing.slId;
    if (existing.lsId !== undefined) merged.lsId = existing.lsId;
  } else {
    merged = {
      index: localAttendances.value.length + 1,
      ermId: candidate.ermId,
      nationalId: candidate.nationalId ?? '-',
      location: props.examLocation,
      titleTh: candidate.titleTh,
      fullnameTh: candidate.fullnameTh,
      titleEn: candidate.titleEn ?? null,
      fullnameEn: candidate.fullnameEn ?? null,
      seatNumber: candidate.seatNumber,
      attendanceStatus: ExamAttendStatus.INTIME,
      checkInTime: formatAssistCheckInTime(event.at),
      sessionId: props.sessionIds[0] ?? 0,
      sessionLocationId: null,
      hasRecord: true,
      passportNo: candidate.passportNo ?? null,
      profileImage: candidate.profileImage ?? null,
      testSession: candidate.testSession ?? props.examRound,
      voucherNo: candidate.voucherNo ?? '-',
      examType: candidate.examType ?? 'General',
      testTakerCode: candidate.testTakerCode ?? null,
      paymentStatus: EnrollmentStatus.ATTENDED,
    };
  }

  searchedCandidate.value = merged;

  if (
    event.type === 'CHECKED_IN' ||
    event.type === 'ALREADY_CHECKED_IN'
  ) {
    markCandidateCheckedIn(candidate.ermId, event.at);
  }
};

const handleAssistEvent = (event: AssistEvent): void => {
  if (event.candidate) {
    applyAssistCandidate(event);
  }

  switch (event.type) {
    case 'CHECKED_IN':
      $q.notify({
        type: 'positive',
        message: 'เช็กอินจากมือถือสำเร็จ',
        position: 'top',
      });
      props.onCheckedIn?.();
      break;
    case 'ALREADY_CHECKED_IN':
      $q.notify({
        type: 'warning',
        message: 'ผู้เข้าสอบคนนี้เช็กอินแล้ว',
        position: 'top',
      });
      break;
    case 'NOT_FOUND':
      $q.notify({
        type: 'negative',
        message: 'ไม่พบข้อมูลผู้เข้าสอบในรอบสอบนี้',
        position: 'top',
      });
      break;
    case 'INVALID_CODE':
      $q.notify({
        type: 'warning',
        message: 'รหัสที่แสกนไม่ถูกต้อง',
        position: 'top',
      });
      break;
    default:
      break;
  }
};

const enablePhoneAssist = async (): Promise<void> => {
  if (!canStartAssist.value || isAssistActive.value) return;
  await startAssist(props.examId, props.sessionIds, handleAssistEvent);
};

const disablePhoneAssist = async (): Promise<void> => {
  await stopAssist();
};

const handleDialogHide = (): void => {
  void stopAssist();
  onDialogHide();
};

const findCandidate = (query: string): AttendanceTableRow | undefined => {
  return localAttendances.value.find(
    (item) =>
      item.nationalId === query ||
      (item.passportNo && item.passportNo === query) ||
      (item.testTakerCode && item.testTakerCode === query),
  );
};

const resolveCandidateFromInput = (): AttendanceTableRow | null => {
  validationError.value = '';
  const query = normalizeScanPayload(searchInput.value);

  if (query !== searchInput.value) {
    searchInput.value = query;
  }

  if (!query) {
    validationError.value = 'กรุณากรอกเลขบัตรประชาชน Passport หรือแสกน Test Taker ID';
    searchedCandidate.value = null;
    return null;
  }

  const candidate = findCandidate(query);

  if (!candidate) {
    $q.notify({
      type: 'negative',
      message: 'ไม่พบข้อมูลผู้เข้าสอบในรอบสอบนี้',
      position: 'top',
    });
    searchedCandidate.value = null;
    return null;
  }

  searchedCandidate.value = candidate;
  return candidate;
};

/** Manual search: preview voucher only */
const handleSearch = (): void => {
  if (isCheckingIn.value) return;
  resolveCandidateFromInput();
};

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

/**
 * Scanner / Enter: show voucher first, then auto check-in.
 * HID wedge scanners type the payload and send Enter.
 */
const handleScanSubmit = async (): Promise<void> => {
  if (isCheckingIn.value) return;

  const candidate = resolveCandidateFromInput();
  if (!candidate) return;

  if (candidate.attendanceStatus === ExamAttendStatus.INTIME) {
    $q.notify({
      type: 'warning',
      message: 'ผู้เข้าสอบคนนี้เช็กอินแล้ว',
      position: 'top',
    });
    return;
  }

  // Lock for the whole preview + API window to block double Enter from scanners
  isCheckingIn.value = true;
  try {
    await nextTick();
    await wait(SCAN_PREVIEW_DELAY_MS);
    await performCheckIn();
  } finally {
    isCheckingIn.value = false;
  }
};

const markCandidateCheckedIn = (ermId: number, checkedInAt?: string): void => {
  const index = localAttendances.value.findIndex((row) => row.ermId === ermId);
  if (index < 0) return;

  const current = localAttendances.value[index];
  if (!current) return;

  localAttendances.value[index] = {
    ...current,
    attendanceStatus: ExamAttendStatus.INTIME,
    checkInTime: checkedInAt ? formatAssistCheckInTime(checkedInAt) : new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    hasRecord: true,
  };
};

const resetForNextScan = (): void => {
  searchInput.value = '';
  searchedCandidate.value = null;
  validationError.value = '';
  focusSearchInput();
};

/** Shared check-in path: keep dialog open for continuous scanning */
const performCheckIn = async (): Promise<void> => {
  const candidate = searchedCandidate.value;
  if (!candidate) return;

  if (candidate.attendanceStatus === ExamAttendStatus.INTIME) {
    $q.notify({
      type: 'warning',
      message: 'ผู้เข้าสอบคนนี้เช็กอินแล้ว',
      position: 'top',
    });
    return;
  }

  const alreadyLocked = isCheckingIn.value;
  if (!alreadyLocked) {
    isCheckingIn.value = true;
  }

  try {
    await checkInEnrollment(candidate.ermId);

    markCandidateCheckedIn(candidate.ermId);

    $q.notify({
      type: 'positive',
      message: 'เช็กอินเข้าห้องสอบสำเร็จ',
      position: 'top',
    });

    props.onCheckedIn?.();
    resetForNextScan();
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'เกิดข้อผิดพลาดในการเช็กอิน',
      position: 'top',
    });
  } finally {
    if (!alreadyLocked) {
      isCheckingIn.value = false;
    }
  }
};

const isPlaceholderImage = computed(() => {
  return !searchedCandidate.value;
});

const currentVoucherData = computed<VoucherData>(() => {
  if (!searchedCandidate.value) {
    return {
      id: 0,
      fullName: 'XX. XXXXX XXXXXX',
      studentId: 'XXXXXXXXX',
      examName: props.examName,
      examDate: props.examDate,
      examTime: props.examTime,
      examType: 'General',
      location: props.examLocation,
      seatNo: 'XX',
      voucherNo: 'ENGXXXX-XXX',
      citizenId: 'X-XXXX-XXXXX-XX-X',
      testSession: props.examRound,
      profileImage: undefined,
    };
  }

  const candidate = searchedCandidate.value;
  const fullNameEn =
    candidate.titleEn && candidate.fullnameEn
      ? `${candidate.titleEn} ${candidate.fullnameEn}`
      : candidate.fullnameEn || candidate.fullnameTh || '-';
  return {
    id: candidate.ermId,
    fullName: fullNameEn,
    studentId: candidate.testTakerCode || '-',
    examName: props.examName,
    examDate: props.examDate,
    examTime: props.examTime,
    examType: candidate.examType || 'General',
    location: props.examLocation,
    seatNo: candidate.seatNumber || '-',
    voucherNo: candidate.voucherNo || '-',
    citizenId: candidate.nationalId || candidate.passportNo || '-',
    testSession: candidate.testSession || props.examRound,
    profileImage: candidate.profileImage || undefined,
    barcodeValue: candidate.testTakerCode || '',
  };
});

const canCheckIn = computed(() => {
  return (
    !!searchedCandidate.value &&
    searchedCandidate.value.attendanceStatus !== ExamAttendStatus.INTIME
  );
});

const handleCheckIn = async (): Promise<void> => {
  await performCheckIn();
};

const onCancelClick = () => {
  onDialogCancel();
};
</script>

<style scoped lang="scss">
.checkin-dialog-card {
  width: min(722px, calc(100vw - 32px));
  max-width: 722px;
  max-height: calc(100vh - 32px);
  padding: 24px;
  border-radius: 12px;
  overflow-y: auto;
  background: #ffffff;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 0 12px;

  h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
  }
}

.assist-section,
.assist-toggle-section {
  margin: 0 12px 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}

.assist-section-title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: #334155;
}

.assist-section-hint {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: #64748b;
}

.assist-qr-wrap {
  display: flex;
  justify-content: center;
}

.assist-qr-image {
  width: 180px;
  height: 180px;
  border-radius: 8px;
  background: #fff;
}

.assist-url {
  margin: 8px 0 0;
  font-size: 0.75rem;
  color: #64748b;
  word-break: break-all;
  text-align: center;
}

.assist-toggle-btn {
  width: 100%;
}

.search-section {
  margin-bottom: 8px;
  padding: 0 12px;
}

.search-btn {
  height: 40px;
  min-width: 100px;
  border-radius: 8px !important;
}

.validation-error {
  color: var(--red-6, #e53935);
  font-size: 0.85rem;
  font-weight: 500;
}

.voucher-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  margin: 0 12px 8px 12px;
}

.voucher-preview-container {
  width: 100%;
  overflow: hidden;

  :deep(.page-container-test) {
    width: 100%;
    padding: 0 !important;
    display: block;
  }

  :deep(.voucher-card) {
    border: 1px solid #000000;
    border-radius: 12px;
    box-shadow: none;
  }
}

.footer-btn {
  width: 180px;
  height: 40px;
  border-radius: 8px !important;
  font-weight: 600;
}

@media (max-width: 600px) {
  .checkin-dialog-card {
    padding: 20px;
  }

  .footer-btn {
    min-width: 100% !important;
    margin-bottom: 8px;
  }

  .action-footer {
    flex-direction: column-reverse;
  }
}
</style>
