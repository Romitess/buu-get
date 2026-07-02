<template>
  <q-dialog v-model="isOpen">
    <q-card class="seat-status-dialog-card">
      <button
        class="seat-status-close"
        type="button"
        aria-label="Close"
        @pointerdown.stop
        @click.stop="closeDialog"
      >
        <q-icon name="close" size="32px" />
      </button>

      <q-card-section class="seat-status-content">
        <div class="seat-status-title">ระบุสถานะที่นั่งของ{{ targetLabel }}</div>

        <div class="seat-status-options">
          <button
            v-for="option in options"
            :key="option.value"
            class="seat-status-option"
            :class="[
              `seat-status-option--${option.value}`,
              { 'seat-status-option--selected': option.value === selectedStatus },
            ]"
            type="button"
            @click="selectStatus(option.value)"
          >
            <q-icon :name="option.icon" :class="option.iconClass" />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

type SeatStatusOption = 'available' | 'omitted' | 'broken';

interface Props {
  modelValue: boolean;
  targetLabel: string;
  currentStatus: SeatStatusOption;
}

const props = withDefaults(defineProps<Props>(), {
  currentStatus: 'available',
});
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'select', value: SeatStatusOption): void;
}>();

const selectedStatus = ref<SeatStatusOption>('available');

const options: Array<{
  value: SeatStatusOption;
  label: string;
  icon: string;
  iconClass: string;
}> = [
  {
    value: 'available',
    label: 'เปิดใช้ที่นั่ง',
    icon: 'event_seat',
    iconClass: 'seat-status-icon--available',
  },
  {
    value: 'omitted',
    label: 'ละเว้นที่นั่ง',
    icon: 'remove_circle',
    iconClass: 'seat-status-icon--omitted',
  },
  {
    value: 'broken',
    label: 'ที่นั่งชำรุด',
    icon: 'block',
    iconClass: 'seat-status-icon--broken',
  },
];

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const closeDialog = (): void => {
  isOpen.value = false;
};

const selectStatus = (status: SeatStatusOption): void => {
  selectedStatus.value = status;
  emit('select', status);
  closeDialog();
};

watch(
  () => props.modelValue,
  (value) => {
    if (value) selectedStatus.value = props.currentStatus;
  },
);

watch(
  () => props.currentStatus,
  (value) => {
    if (props.modelValue) selectedStatus.value = value;
  },
);
</script>

<style scoped lang="scss">
.seat-status-dialog-card {
  position: relative;
  width: 837px;
  max-width: calc(100vw - 32px);
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
}

.seat-status-close {
  position: absolute;
  top: 22px;
  right: 24px;
  z-index: 3;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #8f8f8f;
  cursor: pointer;
  pointer-events: auto;
}

.seat-status-content {
  padding: 32px 38px 40px;
}

.seat-status-title {
  color: #232323;
  font-family: 'Sarabun', sans-serif;
  font-size: 26px;
  font-weight: 700;
  line-height: 36px;
  margin-bottom: 26px;
}

.seat-status-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.seat-status-option {
  height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  border: 1px solid #dddddd;
  border-radius: 10px;
  background: #ffffff;
  color: #111111;
  font-family: 'Sarabun', sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 26px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

.seat-status-option:hover,
.seat-status-option:active,
.seat-status-option:focus,
.seat-status-option:focus-visible {
  background: #ffffff;
}

.seat-status-option--selected {
  border-color: #0d4faf;
  color: #0d4faf;
}

.seat-status-option--selected.seat-status-option--omitted {
  background: #ffffff;
}

.seat-status-icon--available {
  color: #000000;
  font-size: 58px;
}

.seat-status-icon--omitted {
  color: #000000;
  font-size: 64px;
}

.seat-status-icon--broken {
  color: #000000;
  font-size: 64px;
}

.seat-status-option--selected.seat-status-option--available .seat-status-icon--available,
.seat-status-option--selected.seat-status-option--omitted .seat-status-icon--omitted,
.seat-status-option--selected.seat-status-option--broken .seat-status-icon--broken {
  color: #0d4faf;
}

@media (max-width: 700px) {
  .seat-status-content {
    padding: 28px 18px 24px;
  }

  .seat-status-title {
    padding-right: 44px;
    font-size: 22px;
    line-height: 30px;
  }

  .seat-status-options {
    grid-template-columns: 1fr;
  }

  .seat-status-option {
    height: 150px;
  }
}
</style>
