<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="seat-broken-dialog-card">
      <q-card-section class="column items-center q-pt-xl q-pb-md">
        <!-- Icon -->
        <div class="dialog-icon-circle q-mb-md flex flex-center">
          <span class="material-icons-outlined dialog-warning-icon">warning_amber</span>
        </div>

        <!-- Title -->
        <div class="dialog-title text-h6 text-weight-bold q-mb-sm text-center">
          ยืนยันสถานะเครื่องชำรุด
        </div>

        <!-- Subtitle -->
        <div class="dialog-subtitle text-body2 text-center q-px-md">
          คุณต้องการยืนยันการเปลี่ยนสถานะของที่นั่ง {{ seatId }}
          เป็นเครื่องที่ชำรุดใช่หรือไม่
        </div>
      </q-card-section>

      <q-card-actions class="row q-px-lg q-pb-lg q-pt-sm" align="center">
        <AppButton
          outline
          label="ยกเลิก"
          color="grey-6"
          text-color="grey-8"
          class="col q-mr-sm"
          no-caps
          @click="onCancel"
        />
        <AppButton label="ยืนยัน" color="primary" class="col q-ml-sm" no-caps @click="onConfirm" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppButton from 'src/components/base/app-button.vue';

interface Props {
  modelValue: boolean;
  seatId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', seatId: string): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const onCancel = () => {
  isOpen.value = false;
};

const onConfirm = () => {
  emit('confirm', props.seatId);
  isOpen.value = false;
};
</script>

<style scoped lang="scss">
.seat-broken-dialog-card {
  width: 400px;
  max-width: 90vw;
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  box-shadow: var(--dialog-shadow);
}

.dialog-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: var(--dialog-broken-icon-outer-bg);
}

.dialog-warning-icon {
  font-size: 32px;
  line-height: 1;
  color: var(--dialog-broken-icon-inner-bg);
}

.dialog-title {
  color: var(--text-primary);
}

.dialog-subtitle {
  line-height: 1.5;
  color: var(--text-primary);
}
</style>
