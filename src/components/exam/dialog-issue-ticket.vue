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

      <q-card-actions class="dialog-actions">
        <AppButton
          label="ยกเลิก"
          color="grey-3"
          text-color="black"
          class="action-btn"
          @click="onCancelClick"
        />
        <AppButton
          label="ยืนยันการออกใบเข้าสอบ"
          color="primary"
          class="action-btn"
          @click="onOKClick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import type { PropType } from 'vue';
import AppButton from 'src/components/base/app-button.vue';
import AppVoucherPreview from 'src/components/exam/app-voucher-preview.vue';
import type { VoucherData } from 'src/types/voucher';

defineProps({
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
});

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

const onOKClick = (): void => onDialogOK();
const onCancelClick = (): void => onDialogCancel();
</script>

<style scoped lang="scss">
.issue-ticket-dialog-card {
  width: min(760px, calc(100vw - 32px));
  max-width: 760px;
  max-height: calc(100vh - 32px);
  padding: 28px 56px 32px;
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

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 30px 72px 0;
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

  .dialog-actions {
    padding-inline: 0;
  }
}
</style>
