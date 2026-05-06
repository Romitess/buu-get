<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="dialog-cancel-card">
      <q-card-section class="column items-center q-pt-xl q-pb-lg">
        <!-- Icon Header (Figma 100%) -->
        <div class="icon-container-wrapper">
          <div class="icon-container">
            <q-icon name="calendar_today" size="28px" />
          </div>
        </div>

        <!-- Title & Subtitle -->
        <div class="text-title q-mt-md">ยืนยันยกเลิกการสมัครสอบ</div>
        <div class="text-subtitle q-mt-sm">
          คุณต้องการยืนยันยกเลิกการสมัครสอบในรอบที่เลือกใช่หรือไม่?
        </div>
      </q-card-section>

      <!-- Info Box (Figma Style: Underlined Rows) -->
      <q-card-section class="q-px-xl q-pb-lg">
        <div class="info-box">
          <div class="info-row">
            <div class="row justify-between items-end q-pb-xs">
              <div class="row items-center label-text">
                <q-icon name="event" size="18px" class="q-mr-sm" />
                <span>Date</span>
              </div>
              <div class="value-text">{{ examDate }}</div>
            </div>
            <div class="underline"></div>
          </div>

          <div class="info-row q-mt-md">
            <div class="row justify-between items-end q-pb-xs">
              <div class="row items-center label-text">
                <q-icon name="schedule" size="18px" class="q-mr-sm" />
                <span>Time</span>
              </div>
              <div class="value-text">{{ examTime }}</div>
            </div>
            <div class="underline"></div>
          </div>
        </div>
      </q-card-section>

      <!-- Actions (Figma Spacing & Shadow) -->
      <q-card-actions class="row q-px-xl q-pb-xl q-col-gutter-md">
        <div class="col-6">
          <q-btn
            flat
            label="ยกเลิก"
            no-caps
            class="full-width btn-close"
            @click="$emit('update:modelValue', false)"
          />
        </div>
        <div class="col-6">
          <q-btn
            unelevated
            label="ยืนยันการยกเลิก"
            no-caps
            class="full-width btn-confirm-cancel"
            @click="$emit('confirm')"
          />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
/**
 * DialogCancel
 * Component สำหรับยืนยันยกเลิกการสมัครสอบ ตาม Figma UI 100%
 */

interface Props {
  modelValue: boolean;
  examDate: string;
  examTime: string;
}

defineProps<Props>();

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
}>();
</script>

<style scoped lang="scss">
.dialog-cancel-card {
  width: 100%;
  max-width: 460px;
  border-radius: 24px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  overflow: visible;
}

.icon-container-wrapper {
  filter: drop-shadow(0 4px 12px rgba(13, 71, 161, 0.25));
}

.icon-container {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #bbdefb 0%, #e3f2fd 100%);
  color: #0d47a1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
}

.text-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.01em;
}

.text-subtitle {
  font-size: 0.9rem;
  color: #666;
  text-align: center;
  line-height: 1.5;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.info-box {
  border: 1.5px solid #aecdf5;
  border-radius: 16px;
  padding: 20px 24px;
  background-color: white;
}

.info-row {
  .label-text {
    font-size: 0.95rem;
    font-weight: 500;
    color: #555;
  }
  .value-text {
    font-size: 1.05rem;
    font-weight: 600;
    color: #1a1a1a;
  }
  .underline {
    height: 1.5px;
    background-color: #0d47a1;
    opacity: 0.5;
    width: 100%;
    margin-top: 4px;
  }
}

.btn-confirm-cancel {
  background-color: #0d47a1 !important;
  color: white !important;
  height: 48px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 6px 12px rgba(13, 71, 161, 0.3);
  transition: transform 0.2s;
  &:active {
    transform: scale(0.98);
  }
}

.btn-close {
  color: #888 !important;
  border: 1.5px solid #aecdf5 !important;
  height: 48px;
  border-radius: 12px;
  font-weight: 500;
  background-color: white;
}
</style>
