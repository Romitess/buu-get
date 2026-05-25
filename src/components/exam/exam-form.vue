<template>
  <div class="exam-form-wrapper full-width">
    <!-- Card 1: ข้อมูลพื้นฐาน -->
    <create-exam-details-card
      v-model:form="form"
      :exam-type-options="examTypeOptions"
      :exam-format-options="examFormatOptions"
      :fund-source-options="fundSourceOptions"
      :is-loading-data="isLoadingData"
      :is-locked="wasOriginallyPublished"
      :is-special-round="isSpecialRound"
    />

    <!-- Card 2: กำหนดการสอบ -->
    <create-exam-schedule-card
      v-model:form="form"
      :locked="isScheduleLocked"
      :location-options="locationOptions"
      :proctor-options="proctorOptions"
      :active-slot-index="activeSlotIndex"
      @add-time-slot="addTimeSlot"
      @remove-time-slot="removeTimeSlot"
      @add-room="addRoom"
      @remove-room="removeRoom"
      @update:active-slot-index="activeSlotIndex = $event"
    />

    <!-- Card 3: กำหนดการลงทะเบียนและชำระเงิน -->
    <create-exam-registration-card
      v-model:form="form"
      :locked="isScheduleLocked"
      :is-special-round="isSpecialRound"
    />

    <!-- Card 4: รายชื่อผู้มีสิทธิ์สอบ (เฉพาะรอบพิเศษ) -->
    <create-exam-candidates-card
      v-if="isSpecialRound"
      v-model:search-query="candidateSearch"
      :filtered-candidates="filteredCandidates"
      @import-candidates="importCandidates"
      @generate-passcodes="generatePasscodes"
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
    <div class="row justify-end q-mt-md q-gutter-sm action-container">
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
import CreateExamRegistrationCard from 'src/components/exam/create-exam-registration-card.vue';
import CreateExamCandidatesCard from 'src/components/exam/create-exam-candidates-card.vue';

const props = defineProps<{
  /** Exam ID for edit mode. If not provided, the form operates in create mode. */
  examId?: number;
}>();

// Define model for the form to allow two-way binding with parent
const form = defineModel<CreateExamForm>('form', { required: true });

// Pass the model directly to the composable to maintain reactivity
const {
  examTypeOptions,
  examFormatOptions,
  proctorOptions,
  locationOptions,
  fundSourceOptions,
  isLoadingData,
  isEditMode,
  isScheduleLocked,
  isLockedByEnrollment,
  isSpecialRound,
  wasOriginallyPublished,
  activeSlotIndex,
  candidateSearch,
  filteredCandidates,
  loadInitialData,
  addTimeSlot,
  removeTimeSlot,
  addRoom,
  removeRoom,
  importCandidates,
  generatePasscodes,
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
  min-width: 160px;
  border-radius: var(--radius-sm);
  font-size: 16px;
  padding: 12px 32px;
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
