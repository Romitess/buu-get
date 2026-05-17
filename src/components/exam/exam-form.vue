<template>
  <div class="exam-form-wrapper full-width">
    <!-- Card 1: รายละเอียดการสอบ -->
    <create-exam-details-card
      v-model:form="form"
      :location-options="locationOptions"
      :exam-type-options="examTypeOptions"
      :fund-source-options="fundSourceOptions"
      :is-loading-data="isLoadingData"
      :is-locked="wasOriginallyPublished"
    />

    <!-- Card 2: กำหนดการสอบ -->
    <create-exam-schedule-card
      v-model:form="form"
      :locked="isScheduleLocked"
      @add-time-slot="addTimeSlot"
      @remove-time-slot="removeTimeSlot"
    />

    <!-- Schedule Lock Notice -->
    <div v-if="isScheduleLocked">
      <!-- Case 1: Locked by Enrollments (Permanent) -->
      <q-banner
        v-if="isLockedByEnrollment"
        dense
        class="bg-red-1 text-red-9 rounded-borders q-mb-md"
      >
        <template v-slot:avatar>
          <q-icon name="error_outline" size="sm" />
        </template>
        <div class="text-weight-medium">
          ไม่สามารถแก้ไขกำหนดการสอบได้ เนื่องจากมีผู้สมัครสอบแล้ว
        </div>
        <div class="text-caption">
          เพื่อความปลอดภัยของข้อมูลผู้สมัคร ระบบไม่อนุญาตให้แก้ไขวัน/เวลาสอบ
        </div>
      </q-banner>

      <!-- Warning Banner for Published/Locked Exams -->
      <q-banner
        v-if="isScheduleLocked && !isLockedByEnrollment"
        dense
        class="bg-amber-1 text-amber-9 q-mb-md rounded-borders"
      >
        <template v-slot:avatar>
          <q-icon name="visibility" color="amber-9" />
        </template>
        รอบสอบนี้เคยผ่านการเผยแพร่แล้ว ระบบจึงแสดงผลใน
        <b>"โหมดดูข้อมูลเท่านั้น (View Only)"</b> ไม่สามารถบันทึกหรือแก้ไขข้อมูลใดๆ ได้
      </q-banner>
    </div>

    <!-- Action Buttons -->
    <div class="row justify-end q-mt-md q-gutter-md action-container">
      <app-button
        :label="wasOriginallyPublished ? 'กลับสู่หน้าจัดการ' : 'ยกเลิก'"
        @click="onCancel"
        class="action-btn cancel-btn text-weight-bold"
      />
      <app-button
        v-if="!wasOriginallyPublished"
        :label="isEditMode ? 'บันทึกการแก้ไข' : 'บันทึก'"
        @click="onSave"
        class="action-btn save-btn text-white text-weight-bold"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useCreateExam, type CreateExamForm } from 'src/composables/use-create-exam';
import AppButton from 'src/components/base/app-button.vue';
import CreateExamDetailsCard from 'src/components/exam/create-exam-details-card.vue';
import CreateExamScheduleCard from 'src/components/exam/create-exam-schedule-card.vue';

const props = defineProps<{
  /** Exam ID for edit mode. If not provided, the form operates in create mode. */
  examId?: number;
}>();

// Define model for the form to allow two-way binding with parent
const form = defineModel<CreateExamForm>('form', { required: true });

// Pass the model directly to the composable to maintain reactivity
const {
  examTypeOptions,
  locationOptions,
  fundSourceOptions,
  isLoadingData,
  isEditMode,
  isScheduleLocked,
  isLockedByEnrollment,
  wasOriginallyPublished,
  loadInitialData,
  addTimeSlot,
  removeTimeSlot,
  handleCancel,
  handleSave,
} = useCreateExam(form, { examId: props.examId });

const emit = defineEmits(['save', 'cancel']);

const onSave = async () => {
  const success = await handleSave();
  if (success) {
    emit('save');
  }
};

const onCancel = () => {
  handleCancel();
  emit('cancel');
};

onMounted(loadInitialData);
</script>

<style scoped>
.action-container {
  padding-bottom: 60px;
}
.action-btn {
  min-width: 140px;
  border-radius: var(--radius-sm);
  font-size: 15px;
  padding: 10px 28px;
}
/* Use deep selector if the component doesn't apply classes directly to the root of app-button */
.cancel-btn {
  background-color: var(--neutral-200) !important;
  color: var(--text-primary) !important;
}
.save-btn {
  background-color: var(--primary) !important;
}
.lock-notice {
  display: flex;
  align-items: center;
  color: var(--neutral-600);
  font-size: 13px;
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 10px 16px;
}
</style>
