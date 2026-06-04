<template>
  <q-card-section class="q-pa-none">
    <div class="text-h6 text-weight-bold text-black q-mb-xs">ยืนยันการสมัครสอบ</div>
    <div class="text-subtitle2 text-grey-6 q-mb-lg">
      โปรดตรวจสอบรายละเอียดการสอบและข้อมูลส่วนตัวให้เรียบร้อยก่อนยืนยันการสมัคร
    </div>

    <q-card flat bordered class="q-mb-md exam-detail-box">
      <div class="row items-center q-px-lg q-py-md bg-white">
        <q-icon name="assignment" size="24px" color="black" class="q-mr-sm" />
        <div class="text-subtitle1 text-weight-bold text-black">รายละเอียดการสอบ</div>
      </div>
      <q-separator />
      <q-card-section class="row q-col-gutter-md q-px-lg q-py-md text-weight-medium text-black">
        <div class="col-12 col-sm-4 row items-center justify-center">
          <q-icon name="calendar_today" size="20px" class="q-mr-sm text-black" />
          <span>วันที่สอบ: {{ examDate }}</span>
        </div>
        <div class="col-12 col-sm-4 row items-center justify-center">
          <q-icon name="schedule" size="20px" class="q-mr-sm text-black" />
          <span>เวลาที่สอบ: {{ examTime }}</span>
        </div>
        <div class="col-12 col-sm-4 row items-center justify-center">
          <q-icon name="payments" size="20px" class="q-mr-sm text-black" />
          <span>ค่าธรรมเนียม: {{ formattedFee }}</span>
        </div>
      </q-card-section>
    </q-card>

    <RegistrantPersonalDetail :enrollment="enrollment" class="q-mb-lg" />

    <q-card-actions class="row justify-center q-col-gutter-md q-px-none q-pb-none">
      <div class="col-6 col-sm-auto">
        <AppButton flat label="ย้อนกลับ" class="back-btn text-weight-bold" @click="$emit('back')" />
      </div>
      <div class="col-6 col-sm-auto">
        <AppButton
          label="ยืนยันการสมัคร"
          class="confirm-btn text-weight-bold"
          @click="$emit('confirm')"
        />
      </div>
    </q-card-actions>
  </q-card-section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppButton from 'src/components/base/app-button.vue';
import RegistrantPersonalDetail from 'src/components/registrant-personal-detail.vue';

import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';

const props = defineProps<{
  examDate: string;
  examTime: string;
  examFee: string | number;
  enrollment: BackendEnrollmentDetail | null;
}>();

defineEmits<{
  (e: 'back'): void;
  (e: 'confirm'): void;
}>();

const formattedFee = computed((): string => {
  if (typeof props.examFee === 'number') {
    return `${props.examFee} บาท`;
  }
  if (props.examFee.includes('Fee :')) {
    return props.examFee.replace('Fee :', '').replace('฿', 'บาท').trim();
  }
  return `${props.examFee} บาท`;
});
</script>

<style scoped lang="scss">
.exam-detail-box {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--neutral-200);
}

.min-width-unset {
  min-width: unset;
}

.back-btn,
.confirm-btn {
  width: 100%;
  min-width: 160px;
  height: 44px;
  border-radius: 8px;

  @media (max-width: 599px) {
    min-width: unset;
  }
}

.back-btn {
  background-color: #e0e0e0 !important;
  color: var(--text-primary) !important;
}

.confirm-btn {
  background-color: var(--primary) !important;
  color: white !important;
}
</style>
