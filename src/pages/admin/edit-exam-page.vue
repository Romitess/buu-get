<template>
  <q-page class="page-container edit-exam-page">
    <!-- Standardized Reusable Page Header -->
    <AppBreadcrumbs />
    <AppPageHeader title="แก้ไขรอบสอบ" subtitle="แก้ไขรายละเอียดและกำหนดการของรอบสอบที่เลือก" />

    <!-- Reusable Exam Form component (in edit mode) -->
    <exam-form v-if="examId" v-model:form="form" :exam-id="examId" />

    <!-- Error State -->
    <div v-else class="text-center q-pa-xl">
      <q-icon name="error_outline" size="48px" color="negative" />
      <div class="text-h6 q-mt-md">ไม่พบรหัสรอบสอบ</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import ExamForm from 'src/components/exam/exam-form.vue';
import { useCreateExam } from 'src/composables/use-create-exam';

const route = useRoute();

// Extract examId from route params and convert to number
const examId = computed(() => {
  const id = route.params.examId;
  if (typeof id === 'string') {
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
});

// Initialize form with default values — the composable in ExamForm will populate it from the API
const { form } = useCreateExam();
</script>

<style scoped>
/* Page-specific styles (if any) */
</style>
