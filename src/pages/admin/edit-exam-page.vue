<template>
  <q-page class="q-px-xl q-pt-md q-pb-xl flex column items-center">
    <div class="form-container full-width" style="max-width: 1100px">
      <!-- Standardized Reusable Page Header -->
      <app-page-header
        :breadcrumbs="[
          { label: 'หน้าหลัก', icon: 'home', to: '/' },
          { label: 'จัดการรอบสอบ', to: '/admin/exam-management' },
          { label: 'แก้ไขรอบสอบ' },
        ]"
        title="แก้ไขรอบสอบ"
        subtitle="แก้ไขรายละเอียดและกำหนดการของรอบสอบที่เลือก"
      />

      <!-- Loading State -->
      <div v-if="!examId" class="text-center q-pa-xl">
        <q-icon name="error_outline" size="48px" color="negative" />
        <div class="text-h6 q-mt-md">ไม่พบรหัสรอบสอบ</div>
      </div>

      <!-- Reusable Exam Form component (in edit mode) -->
      <exam-form v-else v-model:form="form" :exam-id="examId" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
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

// Initialize form with default values — the composable will populate it from the API
const { form } = useCreateExam();
</script>

<style scoped>
/* Page-specific styles (if any) */
</style>
