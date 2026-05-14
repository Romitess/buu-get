<template>
  <div class="exam-form-wrapper full-width">
    <!-- Card 1: รายละเอียดการสอบ -->
    <create-exam-details-card
      v-model:form="form"
      :location-options="locationOptions"
      :exam-type-options="examTypeOptions"
      :fund-source-options="fundSourceOptions"
      :is-loading-data="isLoadingData"
    />

    <!-- Card 2: กำหนดการสอบ -->
    <create-exam-schedule-card
      v-model:form="form"
      @add-time-slot="addTimeSlot"
      @remove-time-slot="removeTimeSlot"
    />

    <!-- Action Buttons -->
    <div class="row justify-end q-mt-md q-gutter-md action-container">
      <app-button label="ยกเลิก" @click="onCancel" class="action-btn cancel-btn text-weight-bold" />
      <app-button
        label="บันทึก"
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

// Define model for the form to allow two-way binding with parent
const form = defineModel<CreateExamForm>('form', { required: true });

// Pass the model directly to the composable to maintain reactivity
const {
  examTypeOptions,
  locationOptions,
  fundSourceOptions,
  isLoadingData,
  loadInitialData,
  addTimeSlot,
  removeTimeSlot,
  handleCancel,
  handleSave,
} = useCreateExam(form);

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
</style>
