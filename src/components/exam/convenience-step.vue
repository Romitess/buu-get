<template>
  <q-card-section class="q-pa-none">
    <div class="text-h6 text-weight-bold text-grey-9 q-mb-xs">
      ข้อมูลเพิ่มเติมสำหรับการอำนวยความสะดวก
    </div>
    <div class="text-subtitle2 text-grey-6 q-mb-lg">
      กรุณาระบุข้อมูลที่เกี่ยวข้อง เพื่อให้ระบบสามารถจัดเตรียมความสะดวกได้อย่างเหมาะสม
    </div>

    <q-list class="q-gutter-y-sm q-mb-lg">
      <q-item
        v-for="option in options"
        :key="option"
        clickable
        v-ripple
        class="option-item border-radius-lg"
        :class="{ 'option-item--selected': modelValue === option }"
        @click="selectOption(option)"
      >
        <q-item-section avatar class="q-pr-none min-width-unset">
          <q-checkbox
            :model-value="modelValue === option"
            @update:model-value="selectOption(option)"
            color="primary"
            keep-color
          />
        </q-item-section>
        <q-item-section class="q-pl-md text-weight-medium text-grey-9">
          {{ option }}
        </q-item-section>
      </q-item>
    </q-list>

    <div class="info-banner q-pa-md text-center text-weight-medium text-grey-8 q-mb-xl">
      ข้อมูลนี้ใช้เพื่อการอำนวยความสะดวกเท่านั้น ไม่มีผลต่อการประเมินหรือสิทธิ์อื่นๆ
    </div>

    <q-card-actions class="row justify-center q-col-gutter-md q-px-none q-pb-none">
      <div class="col-6 col-sm-3">
        <AppButton
          flat
          label="ยกเลิก"
          class="full-width cancel-btn text-weight-bold"
          @click="$emit('cancel')"
        />
      </div>
      <div class="col-6 col-sm-3">
        <AppButton
          label="ถัดไป"
          class="full-width next-btn text-weight-bold"
          @click="$emit('next')"
        />
      </div>
    </q-card-actions>
  </q-card-section>
</template>

<script setup lang="ts">
import AppButton from 'src/components/base/app-button.vue';

defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'cancel'): void;
  (e: 'next'): void;
}>();

const options = [
  'พระภิกษุ / สามเณร',
  'นักบวช / ศาสนบุคคล',
  'บุคคลทุพพลภาพ',
  'ผู้ตั้งครรภ์',
  'ไม่มีข้อมูลข้างต้น',
];

const selectOption = (option: string): void => {
  emit('update:modelValue', option);
};
</script>

<style scoped lang="scss">
.option-item {
  border: 1px solid var(--neutral-200);
  border-radius: 12px;
  padding: 16px 24px;
  background-color: #ffffff;
  transition: all var(--transition-smooth);

  &:hover {
    border-color: var(--primary-light);
    background-color: rgba(30, 137, 229, 0.02);
  }

  &--selected {
    border-color: var(--primary);
    background-color: rgba(13, 71, 161, 0.02);
  }
}

.min-width-unset {
  min-width: unset;
}

.info-banner {
  background-color: #e0e0e0;
  border-radius: 12px;
  font-size: 0.9rem;
}

.cancel-btn {
  background-color: #e0e0e0 !important;
  color: var(--text-primary) !important;
  height: 44px;
  border-radius: 8px;
}

.next-btn {
  background-color: var(--primary) !important;
  color: white !important;
  height: 44px;
  border-radius: 8px;
}
</style>
