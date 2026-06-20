<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="checkin-dialog-card">
      <header class="dialog-header">
        <h2>เช็คอินเข้าห้องสอบ</h2>
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

      <section class="search-section">
        <div class="row items-end q-col-gutter-x-md">
          <div class="col">
            <AppLabeledInput
              v-model="searchInput"
              label="เลขบัตรประชาชน/เลข Passport"
              placeholder="กรอกเลขบัตรประชาชน หรือ Passport"
              class="custom-labeled-input"
              maxlength="13"
              hide-bottom-space
              @keyup.enter="handleSearch"
            >
              <template v-slot:label>
                เลขบัตรประชาชน/เลข Passport <span class="text-red">*</span>
              </template>
            </AppLabeledInput>
          </div>
          <div class="col-shrink">
            <AppButton label="ค้นหา" color="primary" class="search-btn" @click="handleSearch" />
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
          label="เช็คอินเข้าห้องสอบ"
          color="primary"
          class="footer-btn checkin-confirm-btn"
          :disable="!canCheckIn"
          @click="handleCheckIn"
        />
      </footer>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import AppLabeledInput from 'src/components/base/app-labeled-input.vue';
import AppButton from 'src/components/base/app-button.vue';
import TestVoucherReport from 'src/components/test-voucher-report.vue';
import { createExamAttendance } from 'src/services/exam-attendance.service';
import type { AttendanceTableRow } from 'src/types/enrollment.types';
import { ExamAttendStatus } from 'src/types/enrollment.types';
import type { VoucherData } from 'src/types/voucher';

const props = defineProps<{
  attendances: AttendanceTableRow[];
  examName: string;
  examDate: string;
  examTime: string;
  examLocation: string;
  examRound: string;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();
const $q = useQuasar();

const searchInput = ref('');
const validationError = ref('');
const searchedCandidate = ref<AttendanceTableRow | null>(null);

const handleSearch = () => {
  validationError.value = '';
  const query = searchInput.value.trim();

  if (!query) {
    validationError.value = 'กรุณากรอกเลขบัตรประชาชนหรือเลขพาสปอร์ต';
    searchedCandidate.value = null;
    return;
  }

  const candidate = props.attendances.find(
    (item) =>
      item.nationalId === query ||
      (item.passportNo && item.passportNo === query) ||
      (item.testTakerCode && item.testTakerCode === query),
  );

  if (!candidate) {
    $q.notify({
      type: 'negative',
      message: 'ไม่พบข้อมูลผู้เข้าสอบในรอบสอบนี้',
      position: 'top',
    });
    searchedCandidate.value = null;
    return;
  }

  searchedCandidate.value = candidate;
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
  };
});

const canCheckIn = computed(() => {
  return (
    searchedCandidate.value && searchedCandidate.value.attendanceStatus !== ExamAttendStatus.INTIME
  );
});

const handleCheckIn = async () => {
  if (!searchedCandidate.value) return;

  try {
    await createExamAttendance({
      ERM_ID: searchedCandidate.value.ermId,
      ATTEND_STATUS: 1,
    });

    $q.notify({
      type: 'positive',
      message: 'เช็คอินเข้าห้องสอบสำเร็จ',
      position: 'top',
    });

    onDialogOK();
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'เกิดข้อผิดพลาดในการเช็คอิน',
      position: 'top',
    });
  }
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
