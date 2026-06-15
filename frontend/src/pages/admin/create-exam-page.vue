<template>
  <q-page class="page-container create-exam-page surface-page-bg">
    <!-- Standardized Reusable Page Header -->
    <AppBreadcrumbs />
    <AppPageHeader title="สร้างรอบสอบ" subtitle="ดำเนินการสร้างรอบสอบและกำหนดรายละเอียดการสอบ" />

    <!-- Consistently reusable Exam Form component -->
    <exam-form v-model:form="form" />
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
.surface-page-bg {
  background-color: var(--surface-page);
}
</style>
