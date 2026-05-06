<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="dialog-confirm-card">
      <q-card-section class="column items-center q-pt-xl q-pb-lg">
        <!-- Icon Header (Figma 100%) -->
        <div class="icon-container-wrapper">
          <div class="icon-container">
            <q-icon name="calendar_today" size="28px" />
          </div>
        </div>

        <!-- Title & Subtitle -->
        <div class="text-title q-mt-md">ยืนยันการสมัครสอบ</div>
        <div class="text-subtitle q-mt-sm">คุณต้องการยืนยันการสมัครสอบในรอบที่เลือกใช่หรือไม่?</div>
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
          <AppButton
            outline
            label="ยกเลิก"
            class="full-width btn-cancel"
            @click="$emit('update:modelValue', false)"
          />
        </div>
        <div class="col-6">
          <AppButton
            label="ยืนยันการสมัคร"
            class="full-width btn-confirm"
            @click="$emit('confirm')"
          />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import AppButton from 'src/components/base/AppButton.vue';

/**
 * DialogConfirm
 * Component สำหรับยืนยันการสมัครสอบ ตาม Figma UI 100%
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
.dialog-confirm-card {
  width: 100%;
  max-width: 460px;
  border-radius: 24px;
  background: var(--surface-card);
  box-shadow: var(--shadow-lg);
  overflow: visible;
}

.icon-container-wrapper {
  filter: drop-shadow(0 4px 12px rgba(13, 71, 161, 0.25));
}

.icon-container {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #bbdefb 0%, #e3f2fd 100%);
  color: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
}

.text-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.text-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
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
  background-color: var(--surface-card);
}

.info-row {
  .label-text {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-secondary);
  }
  .value-text {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .underline {
    height: 1.5px;
    background-color: var(--primary);
    opacity: 0.5;
    width: 100%;
    margin-top: 4px;
  }
}

.btn-confirm {
  height: 48px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 6px 12px rgba(13, 71, 161, 0.3);
  transition: transform 0.2s;
  &:active {
    transform: scale(0.98);
  }
}

.btn-cancel {
  height: 48px;
  border-radius: 12px;
  font-weight: 500;
  color: var(--text-muted) !important;
  border: 1.5px solid #aecdf5 !important;
}

@media (max-width: 600px) {
  .dialog-confirm-card {
    border-radius: 16px;
  }

  .q-card__section.q-px-xl {
    padding-left: 20px !important;
    padding-right: 20px !important;
  }

  .q-card__actions.q-px-xl {
    padding-left: 20px !important;
    padding-right: 20px !important;
    padding-bottom: 24px !important;
  }

  .text-title {
    font-size: 1.25rem;
  }

  .text-subtitle {
    font-size: 0.85rem;
    padding: 0 10px;
  }

  .info-box {
    padding: 16px;
  }

  .info-row {
    .label-text {
      font-size: 0.85rem;
    }
    .value-text {
      font-size: 0.95rem;
    }
  }

  .btn-confirm,
  .btn-cancel {
    height: 44px;
    font-size: 0.9rem;
  }
}
</style>
