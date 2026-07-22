<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="dialog-passcode-type-card">
      <!-- Header -->
      <q-card-section class="row items-center justify-between q-pb-none">
        <div class="text-h6 text-weight-bold dialog-title">เลือกรูปแบบของ PASSCODE</div>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <!-- Options -->
      <q-card-section class="row q-col-gutter-md q-pt-lg q-pb-xl">
        <!-- Option 1: Single Passcode -->
        <div class="col-6">
          <div
            class="option-card column items-center q-pa-lg"
            :class="{ 'option-card--selected': selected === 'single' }"
            @click="onSelect('single')"
          >
            <q-icon name="groups" size="48px" class="option-icon q-mb-md" />
            <div class="option-title text-center">Passcode ชุดเดียวสำหรับผู้สอบทุกคน</div>
            <div class="option-subtitle text-center q-mt-xs">One Passcode for all candidates</div>
          </div>
        </div>

        <!-- Option 2: Individual Passcode -->
        <div class="col-6">
          <div
            class="option-card column items-center q-pa-lg"
            :class="{ 'option-card--selected': selected === 'individual' }"
            @click="onSelect('individual')"
          >
            <q-icon name="person" size="48px" class="option-icon q-mb-md" />
            <div class="option-title text-center">Passcode เฉพาะตัวสำหรับผู้สอบแต่ละคน</div>
            <div class="option-subtitle text-center q-mt-xs">Individual Passcode per candidate</div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { PasscodeType } from 'src/types/exam';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'select', type: PasscodeType): void;
}>();

const selected = ref<PasscodeType | null>(null);

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      selected.value = null;
    }
  },
);

const onSelect = (type: PasscodeType): void => {
  selected.value = type;
  emit('select', type);
  emit('update:modelValue', false);
};
</script>

<style scoped lang="scss">
.dialog-passcode-type-card {
  width: 100%;
  max-width: 600px;
  border-radius: 16px;
  background: var(--surface-card);
  box-shadow: var(--dialog-shadow);
}

.dialog-title {
  color: var(--primary);
  letter-spacing: 0.02em;
}

.option-card {
  border: 2px solid var(--neutral-200);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  min-height: 180px;
  justify-content: center;

  &:hover {
    border-color: var(--primary-light);
    background-color: var(--neutral-50);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  &--selected {
    border-color: var(--primary);
    background-color: rgba(13, 71, 161, 0.04);
    box-shadow: 0 4px 16px rgba(13, 71, 161, 0.15);
  }
}

.option-icon {
  color: var(--primary);
}

.option-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}

.option-subtitle {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
  line-height: 1.3;
}

@media (max-width: 600px) {
  .dialog-passcode-type-card {
    width: 95vw;
    border-radius: 12px;
  }

  .option-card {
    min-height: 140px;
  }

  .option-icon {
    font-size: 36px !important;
  }

  .option-title {
    font-size: 12px;
  }

  .option-subtitle {
    font-size: 10px;
  }
}
</style>
