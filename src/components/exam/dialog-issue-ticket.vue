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

      <section class="voucher-preview-section">
        <div class="preview-heading">
          <span>ตัวอย่างใบ Test Voucher</span>
          <div class="side-tabs" role="tablist" aria-label="เลือกด้านของใบเข้าสอบ">
            <button
              type="button"
              :class="{ active: previewSide === 'front' }"
              @click="previewSide = 'front'"
            >
              ด้านหน้า
            </button>
            <span>|</span>
            <button
              type="button"
              :class="{ active: previewSide === 'back' }"
              @click="previewSide = 'back'"
            >
              ด้านหลัง
            </button>
          </div>
        </div>

        <div class="voucher-preview" :class="`is-${previewSide}`">
          <TestVoucherReport
            :data="voucherData"
            :show-actions="false"
            :show-voucher-card="previewSide === 'front'"
            :show-regulations="previewSide === 'back'"
            use-image-placeholder
          />
        </div>
      </section>

      <q-card-actions class="dialog-actions">
        <AppButton
          label="ยกเลิก"
          color="grey-4"
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
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import type { PropType } from 'vue';
import AppButton from 'src/components/base/app-button.vue';
import TestVoucherReport from 'src/components/test-voucher-report.vue';
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

const previewSide = ref<'front' | 'back'>('front');
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

.voucher-preview-section {
  margin-top: 24px;
}

.preview-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  font-size: 14px;
}

.side-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #aaaaaa;

  button {
    padding: 0 0 2px;
    border: 0;
    border-bottom: 1px solid transparent;
    background: transparent;
    color: #aaaaaa;
    font: inherit;
    cursor: pointer;
  }

  button.active {
    border-bottom-color: #111111;
    color: #111111;
    font-weight: 600;
  }
}

.voucher-preview {
  height: 380px;
  margin-top: 3px;
  border: 1px solid #222222;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(120.96deg, #fafafa 0%, #f0f4f8 100%);

  :deep(.page-container-test) {
    width: 100%;
    height: 100%;
    min-height: 0;
    padding: 0;
    display: block;
  }

  :deep(.voucher-wrapper) {
    width: 100%;
    height: 100%;
    max-width: none;
    margin: 0;
    padding: 0;
  }

  :deep(.voucher-card),
  :deep(.regulations-block) {
    width: 100%;
    margin: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background: linear-gradient(120.96deg, #fafafa 0%, #f0f4f8 100%);
  }

  :deep(.voucher-card) {
    width: 100%;
    height: 100%;
    min-height: 0;
    padding: 8px;
  }

  &.is-front :deep(.voucher-header),
  &.is-front :deep(.voucher-body),
  &.is-front :deep(.voucher-footer) {
    background: transparent;
  }

  &.is-front :deep(.voucher-header) {
    grid-template-columns: 190px minmax(0, 1fr);
    min-height: 74px;
    padding: 10px 20px;
  }

  &.is-front :deep(.header-logo) {
    width: 170px;
  }

  &.is-front :deep(.header-title) {
    font-size: 17px !important;
  }

  &.is-front :deep(.header-subtitle) {
    font-size: 16px !important;
    color: var(--Gray, #676767) !important;
  }

  &.is-front :deep(.voucher-body) {
    min-height: 225px;
    padding: 14px 46px 6px;
    display: flex;
    align-items: center;
  }

  &.is-front :deep(.content-container) {
    width: 100%;
    grid-template-columns: 170px minmax(0, 1fr);
    column-gap: 34px;
  }

  &.is-front :deep(.profile-photo-wrapper) {
    width: 150px;
    height: 174px;
  }

  &.is-front :deep(.signature-line) {
    width: 150px;
    margin-top: 32px;
  }

  &.is-front :deep(.details-grid) {
    grid-auto-rows: minmax(42px, auto);
    column-gap: 38px;
  }

  &.is-front :deep(.info-label) {
    font-size: 13px !important;
    color: var(--Gray, #676767) !important;
  }

  &.is-front :deep(.info-value) {
    font-size: clamp(12px, 1.55vw, 16px) !important;
    white-space: nowrap;
    overflow: visible;
  }

  &.is-front :deep(.voucher-footer) {
    padding: 5px 20px 12px;
  }

  &.is-front :deep(.barcode-svg) {
    width: 290px;
    height: 40px;
  }

  &.is-front :deep(.watermark-bg) {
    left: 64%;
    top: 40%;
  }

  :deep(.regulations-block) {
    margin-top: 0 !important;
    height: 100%;
  }

  :deep(.regulations-box) {
    height: 100%;
    min-height: 0;
    border: 0;
    border-radius: 0;
    padding: 0;
    background: transparent;
  }

  :deep(.watermark-bg) {
    font-family: 'Outfit', var(--font-family-base);
    font-size: 205px;
    font-style: normal;
    font-weight: 800;
    line-height: 100%;
    letter-spacing: 0;
    vertical-align: middle;
    color: #1e89e50d;
  }

  &.is-back :deep(.regulations-content-wrapper) {
    height: 100%;
    box-sizing: border-box;
    padding: 16px 28px 14px;
    overflow: hidden;
    background: transparent;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  &.is-back :deep(.watermark-bg) {
    left: 48% !important;
  }

  &.is-back :deep(.regulations-heading-inline) {
    margin-bottom: 5px;
    font-size: 14px;
  }

  &.is-back :deep(.regulations-text-content) {
    font-size: 13px;
    line-height: 1.3;
  }

  &.is-back :deep(.regulations-text-content.q-mb-md) {
    margin-bottom: 8px;
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
