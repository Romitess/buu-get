<template>
  <q-page class="page-container edit-exam-page surface-page-bg">
    <!-- Standardized Reusable Page Header -->
    <AppBreadcrumbs />
    <AppPageHeader :title="t('navigation.editExam')" :subtitle="t('admin.examManagement.pageDescription')" />

    <!-- Reusable Exam Form component (in edit mode) -->
    <exam-form v-if="examId" v-model:form="form" :exam-id="examId" :key="examId" />

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
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import ExamForm from 'src/components/exam/exam-form.vue';
import { useCreateExam } from 'src/composables/use-create-exam';

const route = useRoute();
const { t } = useI18n();

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
.surface-page-bg {
  background-color: var(--surface-page);
}
</style>
