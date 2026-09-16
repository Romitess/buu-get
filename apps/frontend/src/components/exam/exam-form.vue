<template>
  <div class="exam-form-wrapper full-width relative-position">
    <q-inner-loading :showing="isLoadingData">
      <div class="column items-center">
        <q-spinner color="primary" size="42px" />
        <div class="q-mt-sm text-primary">{{ t('examSchedule.loading') }}</div>
      </div>
    </q-inner-loading>

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
      :locked="isScheduleLocked || isLoadingData"
      :location-options="locationOptions"
      :get-occupied-location-ids-for-slot="getOccupiedLocationIdsForSlot"
      :proctor-options="proctorOptions"
      @upsert-proctor-options="upsertProctorOptions"
      :active-slot-index="activeSlotIndex"
      :date-errors="dateErrors"
      :field-errors="fieldErrors"
      :shake-key="shakeKey"
      @remove-time-slot="removeTimeSlot"
      @add-room="addRoom"
      @remove-room="removeRoom"
      @update:active-slot-index="activeSlotIndex = $event"
      @sort-time-slots="sortTimeSlots"
      @clear-field-error="clearFieldError"
    />

    <!-- Card 3: กำหนดการลงทะเบียนและชำระเงิน -->
    <create-exam-room-preview-card
      v-model:form="form"
      :location-options="locationOptions"
      :active-slot-index="activeSlotIndex"
      :is-loading-data="isLoadingData"
    />

    <create-exam-registration-card
      v-model:form="form"
      :locked="isLoadingData"
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
      :candidates="form.eligibleCandidates"
      :existing-candidate-keys="existingCandidateKeys"
      :has-candidates="hasEligibleCandidates"
      :loading="isImportingCandidates || isLoadingData"
      :locked="isLoadingData || isEligibleCandidatesLocked"
      @import-candidates="importCandidates"
      @add-candidates-from-users="addEligibleCandidatesFromUsers"
      @remove-candidates="removeEligibleCandidates"
      @passcode-type-selected="generatePasscodes"
      @shared-passcode-defined="applySharedPasscode"
      @export-candidates="exportCandidates"
    />

    <!-- Schedule Lock Notice -->
    <div v-if="isPublishedSectionLocked || isEligibleCandidatesLocked">
      <q-banner
        v-if="isEligibleCandidatesLocked"
        dense
        class="alert-banner-warning q-mb-md rounded-borders"
      >
        <template v-slot:avatar>
          <q-icon name="lock" class="alert-icon-warning" />
        </template>
        {{ t('admin.examForm.banners.candidatesLocked') }}
      </q-banner>
      <!-- Warning Banner for Published/Locked Exams -->
      <q-banner
        v-if="isPublishedSectionLocked"
        dense
        class="alert-banner-warning q-mb-md rounded-borders"
      >
        <template v-slot:avatar>
          <q-icon name="info" class="alert-icon-warning" />
        </template>
        {{ t('admin.examForm.banners.publishedLocked') }}
      </q-banner>
    </div>

    <!-- Action Buttons -->
    <div class="row justify-end q-mt-md q-gutter-sm action-container">
      <app-button
        :label="wasOriginallyPublished ? t('admin.examForm.actions.backToManagement') : t('profile.cancel')"
        :disable="isSaving"
        @click="onCancel"
        class="action-btn cancel-btn text-weight-bold"
      />
      <app-button
        :label="isEditMode ? t('admin.examForm.actions.saveEdit') : t('profile.save')"
        :loading="isSaving"
        :disable="isSaving || isLoadingData"
        @click="onSave"
        class="action-btn save-btn text-white text-weight-bold"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCreateExam, type CreateExamForm } from 'src/composables/use-create-exam';
import AppButton from 'src/components/base/app-button.vue';
import CreateExamDetailsCard from 'src/components/exam/create-exam-details-card.vue';
import CreateExamScheduleCard from 'src/components/exam/create-exam-schedule-card.vue';
import CreateExamRoomPreviewCard from 'src/components/exam/create-exam-room-preview-card.vue';
import CreateExamRegistrationCard from 'src/components/exam/create-exam-registration-card.vue';
import CreateExamCandidatesCard from 'src/components/exam/create-exam-candidates-card.vue';

const { t } = useI18n();

const props = defineProps<{
  /** Exam ID for edit mode. If not provided, the form operates in create mode. */
  examId?: number;
}>();

// Define model for the form to allow two-way binding with parent
const form = defineModel<CreateExamForm>('form', { required: true });

// Pass the model directly to the composable to maintain reactivity
const examIdRef = computed(() => props.examId);

const {
  examTypeOptions,
  examFormatOptions,
  proctorOptions,
  upsertProctorOptions,
  locationOptions,
  fundSourceOptions,
  getOccupiedLocationIdsForSlot,
  isLoadingData,
  isSaving,
  isImportingCandidates,
  isEditMode,
  isPublishedSectionLocked,
  isScheduleLocked,
  isEligibleCandidatesLocked,
  isSpecialRound,
  wasOriginallyPublished,
  activeSlotIndex,
  candidateSearch,
  filteredCandidates,
  existingCandidateKeys,
  hasEligibleCandidates,
  fieldErrors,
  shakeKey,
  loadInitialData,
  removeTimeSlot,
  addRoom,
  removeRoom,
  importCandidates,
  addEligibleCandidatesFromUsers,
  removeEligibleCandidates,
  generatePasscodes,
  applySharedPasscode,
  exportCandidates,
  handleCancel,
  handleSave,
  sortTimeSlots,
  dateErrors,
  clearFieldError,
} = useCreateExam(form, { examId: examIdRef });

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

watch(examIdRef, () => {
  void loadInitialData();
}, { immediate: true });
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
