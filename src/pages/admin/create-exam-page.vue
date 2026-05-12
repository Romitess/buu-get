<template>
  <q-page class="q-px-xl q-pt-md q-pb-xl flex column items-center">
    <div class="form-container full-width" style="max-width: 1100px">
      <!-- Page Title & Breadcrumbs -->
      <div class="q-mb-lg">
        <q-breadcrumbs class="text-grey-6 q-mb-sm" active-color="dark" style="font-size: 13px">
          <template v-slot:separator>
            <q-icon size="1.2em" name="chevron_right" color="grey-5" />
          </template>
          <q-breadcrumbs-el icon="home" label="หน้าหลัก" />
          <q-breadcrumbs-el label="จัดการรอบสอบ" />
          <q-breadcrumbs-el label="สร้างรอบสอบ" class="text-weight-bold" />
        </q-breadcrumbs>
        <div class="text-h5 text-weight-bold text-dark q-mb-xs">สร้างรอบสอบ</div>
        <div class="text-grey-6" style="font-size: 14px">
          ดำเนินการสร้างรอบสอบและกำหนดรายละเอียดการสอบ
        </div>
      </div>

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
      <div class="row justify-end q-mt-md q-gutter-md" style="padding-bottom: 60px">
        <app-button
          label="ยกเลิก"
          @click="handleCancel"
          class="action-btn cancel-btn text-weight-bold"
        />
        <app-button
          label="บันทึก"
          @click="handleSave"
          class="action-btn save-btn text-white text-weight-bold"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useCreateExam } from 'src/composables/use-create-exam';
import AppButton from 'src/components/base/app-button.vue';
import CreateExamDetailsCard from 'src/components/exam/create-exam-details-card.vue';
import CreateExamScheduleCard from 'src/components/exam/create-exam-schedule-card.vue';

const {
  form,
  examTypeOptions,
  locationOptions,
  fundSourceOptions,
  isLoadingData,
  loadInitialData,
  addTimeSlot,
  removeTimeSlot,
  handleCancel,
  handleSave,
} = useCreateExam();

onMounted(loadInitialData);
</script>

<style scoped>
/* Action Buttons */
.action-btn {
  min-width: 140px;
  border-radius: var(--radius-sm);
  font-size: 15px;
  padding: 10px 28px;
}
.cancel-btn {
  background-color: var(--neutral-200) !important;
  color: var(--text-primary) !important;
}
.save-btn {
  background-color: var(--primary) !important;
}
</style>
