<template>
  <div class="exam-form-wrapper full-width">
    <!-- Card 1: ข้อมูลพื้นฐาน -->
    <create-exam-details-card
      v-model:form="form"
      :exam-type-options="examTypeOptions"
      :exam-format-options="examFormatOptions"
      :fund-source-options="fundSourceOptions"
      :is-loading-data="isLoadingData"
      :is-locked="isPublishedSectionLocked"
      :is-special-round="isSpecialRound"
      :field-errors="fieldErrors"
      :shake-key="shakeKey"
      @clear-field-error="clearFieldError"
    />

    <!-- Card 2: กำหนดการสอบ -->
    <create-exam-schedule-card
      v-model:form="form"
      :locked="isScheduleLocked"
      :location-options="locationOptions"
      :proctor-options="proctorOptions"
      :active-slot-index="activeSlotIndex"
      :date-errors="dateErrors"
      :field-errors="fieldErrors"
      :shake-key="shakeKey"
      @add-time-slot="addTimeSlot"
      @remove-time-slot="removeTimeSlot"
      @add-room="addRoom"
      @remove-room="removeRoom"
      @update:active-slot-index="activeSlotIndex = $event"
      @sort-time-slots="sortTimeSlots"
      @clear-field-error="clearFieldError"
    />

    <!-- Card 3: กำหนดการลงทะเบียนและชำระเงิน -->
    <create-exam-registration-card
      v-model:form="form"
      :locked="isPublishedSectionLocked || isLockedByEnrollment"
      :is-special-round="isSpecialRound"
      :date-errors="dateErrors"
      :field-errors="fieldErrors"
      :shake-key="shakeKey"
      @clear-field-error="clearFieldError"
    />

    <!-- Card 4: รายชื่อผู้มีสิทธิ์สอบ (เฉพาะรอบพิเศษ) -->
    <create-exam-candidates-card
      v-if="isSpecialRound"
      v-model:search-query="candidateSearch"
      :filtered-candidates="filteredCandidates"
      :locked="isPublishedSectionLocked || isLockedByEnrollment"
      @import-candidates="importCandidates"
      @passcode-type-selected="generatePasscodes"
      @export-candidates="exportCandidates"
    />

    <!-- Schedule Lock Notice -->
    <div v-if="isPublishedSectionLocked">
      <!-- Case 1: Locked by Enrollments (Permanent) -->
      <!-- Warning Banner for Published/Locked Exams -->
      <q-banner
        v-if="isPublishedSectionLocked"
        dense
        class="alert-banner-warning q-mb-md rounded-borders"
      >
        <template v-slot:avatar>
          <q-icon name="info" class="alert-icon-warning" />
        </template>
        รอบสอบนี้เคยผ่านการเผยแพร่แล้ว ระบบจึงจำกัดการแก้ไขข้อมูล
        (อนุญาตให้แก้ไขเฉพาะข้อมูลผู้คุมสอบได้เท่านั้น)
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
  isPublishedSectionLocked,
  isScheduleLocked,
  isLockedByEnrollment,
  isSpecialRound,
  wasOriginallyPublished,
  activeSlotIndex,
  candidateSearch,
  filteredCandidates,
  fieldErrors,
  shakeKey,
  loadInitialData,
  addTimeSlot,
  removeTimeSlot,
  addRoom,
  removeRoom,
  importCandidates,
  generatePasscodes,
  exportCandidates,
  handleCancel,
  handleSave,
  sortTimeSlots,
  dateErrors,
  clearFieldError,
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
.save-btn {
  background-color: var(--primary) !important;
  box-shadow: none !important;
}
.alert-banner-error {
  background-color: var(--badge-error-bg) !important;
  color: var(--badge-error-text) !important;
}
.alert-banner-warning {
  background-color: var(--badge-warning-bg) !important;
  color: var(--badge-warning-text) !important;
}
.alert-icon-warning {
  color: var(--badge-warning-dot) !important;
}
</style>
