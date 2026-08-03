<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="issue-ticket-dialog-card">
      <header class="dialog-header">
        <h2>ข้อมูลการออกใบ Test Voucher</h2>
        <q-btn
          flat
          round
          dense
          icon="close"
          color="grey-6"
          aria-label="ปิด"
          :disable="isConfirming"
          @click="onCancelClick"
        />
      </header>

      <section class="exam-details">
        <div class="details-title">
          <q-icon name="description" size="23px" />
          <span>รายละเอียดการสอบ</span>
        </div>
        <div class="details-grid">
          <div class="detail-column">
            <div class="detail-item">
              <q-icon name="calendar_today" />
              <span>วันที่สอบ: {{ sessionDetails.date || '-' }}</span>
            </div>
            <div class="detail-item">
              <q-icon name="schedule" />
              <span>เวลาที่สอบ: {{ sessionDetails.time || '-' }}</span>
            </div>
          </div>
          <div class="detail-column detail-column-right">
            <div class="detail-item">
              <q-icon name="location_city" />
              <span>สถานที่สอบ: {{ sessionDetails.room || '-' }}</span>
            </div>
            <div class="detail-item">
              <q-icon name="group" />
              <span>จำนวนผู้สมัคร: {{ sessionDetails.studentCount || 0 }} คน</span>
            </div>
          </div>
        </div>
      </section>

      <AppVoucherPreview
        :voucher-data="voucherData"
        :title="$t('admin.seatCandidates.voucherPreviewTitle')"
        use-image-placeholder
      />

      <aside class="seat-lock-note" role="note">
        <q-icon name="info" size="18px" class="seat-lock-note__icon" aria-hidden="true" />
        <p class="seat-lock-note__text">
          <strong class="seat-lock-note__label">{{
            $t('admin.seatCandidates.issueTicketDialog.seatLockNoteLabel')
          }}</strong>
          {{ $t('admin.seatCandidates.issueTicketDialog.seatLockNote') }}
        </p>
      </aside>

      <p v-if="confirmError" class="confirm-error" role="alert">{{ confirmError }}</p>

      <q-card-actions class="dialog-actions">
        <AppButton
          label="ยกเลิก"
          color="grey-4"
          text-color="black"
          class="action-btn"
          :disable="isConfirming"
          @click="onCancelClick"
        />
        <AppButton
          label="ยืนยันการออกใบเข้าสอบ"
          color="primary"
          class="action-btn"
          :loading="isConfirming"
          :disable="isConfirming"
          @click="onOKClick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import type { PropType } from 'vue';
import AppButton from 'src/components/base/app-button.vue';
import AppVoucherPreview from 'src/components/exam/app-voucher-preview.vue';
import type { VoucherData } from 'src/types/voucher';

const props = defineProps({
  sessionDetails: {
    type: Object as PropType<{
      date?: string;
      time?: string;
      room?: string;
      studentCount?: string | number;
    }>,
    default: () => ({}),
  },
  voucherData: {
    type: Object as PropType<VoucherData>,
    required: true,
  },
  onConfirm: {
    type: Function as PropType<() => Promise<void>>,
    default: undefined,
  },
});

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

const isConfirming = ref(false);
const confirmError = ref<string | null>(null);

const onOKClick = async (): Promise<void> => {
  if (!props.onConfirm) {
    onDialogOK();
    return;
  }

  isConfirming.value = true;
  confirmError.value = null;

  try {
    await props.onConfirm();
    onDialogOK();
  } catch {
    confirmError.value = 'เกิดข้อผิดพลาดในการออกบัตรหรือส่งอีเมล กรุณาลองใหม่อีกครั้ง';
  } finally {
    isConfirming.value = false;
  }
};

const onCancelClick = (): void => {
  if (isConfirming.value) return;
  onDialogCancel();
};
</script>

<style scoped lang="scss">
.issue-ticket-dialog-card {
  width: min(800px, calc(100vw - 32px));
  max-width: 800px;
  max-height: calc(100vh - 32px);
  padding: 28px 40px 32px;
  border-radius: 10px;
  overflow-y: auto;
  background: #ffffff;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;

  h2 {
    margin: 0;
    font-size: 22px;
    line-height: 1.3;
    font-weight: 600;
  }
}

.exam-details {
  border: 1px solid #d7d7d7;
  border-radius: 14px;
  overflow: hidden;
}

.details-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid #dddddd;
  font-size: 16px;
  font-weight: 700;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 10px 20px;
}

.detail-column {
  display: grid;
  gap: 8px;
  padding: 0 12px;
}

.detail-column-right {
  border-left: 1px solid #dddddd;
  padding-left: 28px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 30px;
  font-size: 15px;

  .q-icon {
    flex: 0 0 23px;
    font-size: 23px;
  }
}

.seat-lock-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 72px 0;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #f0d9a8;
  background: #fff8eb;
}

.seat-lock-note__icon {
  flex: 0 0 auto;
  color: #b7791f;
}

.seat-lock-note__text {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 1.45;
  color: #5c4a1f;
  text-wrap: pretty;
}

.seat-lock-note__label {
  font-weight: 700;
  margin-right: 4px;
}

.confirm-error {
  margin: 16px 0 0;
  color: #c10015;
  font-size: 14px;
  text-align: center;
}

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 24px 72px 0;
}

.action-btn {
  flex: 1;
  min-height: 52px;
  border-radius: 10px;
  font-size: 16px;
}

@media (max-width: $breakpoint-xs-max) {
  .issue-ticket-dialog-card {
    padding: 22px 18px;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .detail-column-right {
    margin-top: 8px;
    padding-left: 12px;
    border-left: 0;
  }

  .seat-lock-note {
    margin-inline: 0;
  }

  .dialog-actions {
    padding-inline: 0;
  }
}
</style>
