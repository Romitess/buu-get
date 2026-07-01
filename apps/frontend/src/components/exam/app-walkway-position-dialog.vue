<template>
  <q-dialog v-model="isOpen">
    <q-card class="walkway-dialog-card">
      <button
        class="walkway-dialog-close"
        type="button"
        aria-label="Close"
        @click.stop="closeDialog"
      >
        <q-icon name="close" size="28px" />
      </button>

      <q-card-section class="walkway-dialog-content">
        <div class="walkway-dialog-title">ระบุตำแหน่งทางเดิน</div>
        <div class="walkway-dialog-subtitle">
          เลือกตำแหน่งที่ต้องการเพิ่มทางเดิน (แทรกหลังแถว/คอลัมน์)
        </div>

        <div class="walkway-picker">
          <section class="walkway-picker-section">
            <div class="walkway-picker-heading">แถว</div>
            <div class="walkway-option-grid walkway-option-grid--rows">
              <AppButton
                v-for="option in rowOptions"
                :key="option.value"
                outline
                no-caps
                color="grey-5"
                class="walkway-option-btn"
                :class="{
                  'walkway-option-btn--selected': localSelectedPositions.includes(option.value),
                }"
                :label="option.label"
                @click="togglePosition(option.value)"
              />
            </div>
          </section>

          <div class="walkway-divider"></div>

          <section class="walkway-picker-section">
            <div class="walkway-picker-heading">คอลัมน์</div>
            <div class="walkway-option-grid walkway-option-grid--cols">
              <AppButton
                v-for="option in colOptions"
                :key="option.value"
                outline
                no-caps
                color="grey-5"
                class="walkway-option-btn"
                :class="{
                  'walkway-option-btn--selected': localSelectedPositions.includes(option.value),
                }"
                :label="option.label"
                @click="togglePosition(option.value)"
              />
            </div>
          </section>
        </div>

        <div class="walkway-actions">
          <AppButton
            label="ยกเลิก"
            no-caps
            class="walkway-action-btn cancel-btn"
            @click="closeDialog"
          />
          <AppButton
            label="ยืนยัน"
            no-caps
            color="primary"
            class="walkway-action-btn"
            @click="confirmPosition"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppButton from 'src/components/base/app-button.vue';

type WalkwayPosition = string;

interface Props {
  modelValue: boolean;
  rows: number;
  cols: number;
  numberingDirection: 'horizontal' | 'vertical';
  selectedPositions: WalkwayPosition[];
}

const props = withDefaults(defineProps<Props>(), {
  rows: 0,
  cols: 0,
  numberingDirection: 'vertical',
  selectedPositions: () => [],
});
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', value: WalkwayPosition[]): void;
}>();

const localSelectedPositions = ref<WalkwayPosition[]>([]);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const rowOptions = computed(() => {
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return Array.from({ length: Math.max(props.rows, 0) }, (_, index) => ({
    label: `แถว ${props.numberingDirection === 'horizontal' ? (rowLetters[index] ?? index + 1) : index + 1}`,
    value: `row-${index + 1}`,
  }));
});

const colOptions = computed(() => {
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return Array.from({ length: Math.max(props.cols, 0) }, (_, index) => ({
    label: `คอลัมน์ที่ ${props.numberingDirection === 'horizontal' ? index + 1 : (rowLetters[index] ?? index + 1)}`,
    value: `col-${index + 1}`,
  }));
});

const closeDialog = (): void => {
  isOpen.value = false;
};

const togglePosition = (position: WalkwayPosition): void => {
  if (localSelectedPositions.value.includes(position)) {
    localSelectedPositions.value = localSelectedPositions.value.filter((item) => item !== position);
    return;
  }

  localSelectedPositions.value = [...localSelectedPositions.value, position];
};

const confirmPosition = (): void => {
  emit('confirm', localSelectedPositions.value);
  closeDialog();
};

watch(
  () => props.modelValue,
  (value) => {
    if (value) localSelectedPositions.value = [...props.selectedPositions];
  },
);
</script>

<style scoped lang="scss">
.walkway-dialog-card {
  position: relative;
  width: 1030px;
  max-width: calc(100vw - 32px);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
}

.walkway-dialog-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #9b9b9b;
  cursor: pointer;
}

.walkway-dialog-content {
  padding: 40px 48px 30px;
  font-family: 'Sarabun', sans-serif;
}

.walkway-dialog-title {
  color: #111111;
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
  margin-bottom: 4px;
}

.walkway-dialog-subtitle {
  color: #111111;
  font-size: 18px;
  font-weight: 400;
  line-height: 28px;
  margin-bottom: 20px;
}

.walkway-picker {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr);
  gap: 36px;
  min-height: 234px;
}

.walkway-picker-heading {
  color: #111111;
  font-size: 18px;
  font-weight: 400;
  line-height: 28px;
  margin-bottom: 6px;
}

.walkway-divider {
  width: 1px;
  min-height: 234px;
  background: #dddddd;
}

.walkway-option-grid {
  display: grid;
  gap: 10px;
}

.walkway-option-grid--rows {
  grid-template-columns: repeat(3, 136px);
}

.walkway-option-grid--cols {
  grid-template-columns: repeat(3, 136px);
}

.walkway-option-btn {
  width: 136px;
  height: 44px;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 12px;
  color: #111111 !important;
  font-size: 16px;
  font-weight: 400;
  box-shadow: none !important;

  &::before {
    border: 1px solid var(--Surface-Selected, #dddddd) !important;
  }

  :deep(.q-btn__content) {
    white-space: nowrap;
  }
}

.walkway-option-btn--selected {
  color: var(--primary) !important;

  &::before {
    border: 1px solid var(--primary, #0d47a1) !important;
  }
}

.walkway-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 26px;
}

.walkway-action-btn {
  width: 162px;
  height: 50px;
  min-height: 50px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 700;
}

@media (max-width: 800px) {
  .walkway-dialog-content {
    padding: 32px 20px 24px;
  }

  .walkway-picker {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .walkway-divider {
    display: none;
  }

  .walkway-option-grid--rows,
  .walkway-option-grid--cols {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .walkway-option-btn {
    width: 100%;
  }
}
</style>
