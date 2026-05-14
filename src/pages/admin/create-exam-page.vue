<template>
  <q-page class="create-exam-page q-px-lg q-px-sm-xl q-py-lg">
    <div class="full-width">
      <!-- Standardized Reusable Page Header -->
      <AppBreadcrumbs />
      <AppPageHeader
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
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import ExamForm from 'src/components/exam/exam-form.vue';
import { useCreateExam } from 'src/composables/use-create-exam';

// Initialize form with default values for creation
const { form } = useCreateExam();
</script>

<style scoped>
/* Page-specific styles (if any) */
</style>
