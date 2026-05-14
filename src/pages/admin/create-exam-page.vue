<template>
  <q-page class="q-px-xl q-pt-md q-pb-xl flex column items-center">
    <div class="form-container full-width" style="max-width: 1100px">
      <!-- Standardized Reusable Page Header -->
      <app-page-header
        :breadcrumbs="[
          { label: 'หน้าหลัก', icon: 'home', to: '/' },
          { label: 'จัดการรอบสอบ', to: '/admin/exam-management' },
          { label: 'สร้างรอบสอบ' },
        ]"
        title="สร้างรอบสอบ"
        subtitle="ดำเนินการสร้างรอบสอบและกำหนดรายละเอียดการสอบ"
      />

      <!-- Consistently reusable Exam Form component -->
      <exam-form v-model:form="form" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import ExamForm from 'src/components/exam/exam-form.vue';
import { useCreateExam } from 'src/composables/use-create-exam';

// Initialize form with default values for creation
const { form } = useCreateExam();
</script>

<style scoped>
/* Page-specific styles (if any) */
</style>
