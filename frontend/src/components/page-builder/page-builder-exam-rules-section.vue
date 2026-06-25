<template>
  <q-card flat class="pb-card">
    <div class="text-h6 pb-section-title q-mb-md">{{ $t('admin.pageBuilder.examRules') }}</div>

    <div class="row q-col-gutter-lg items-stretch">
      <div class="col-12 col-md-6">
        <PageBuilderRuleColumn
          v-model="paper"
          :title="$t('admin.pageBuilder.paperBased')"
          :add-label="$t('admin.pageBuilder.actions.addRule')"
          :edit-locale="editLocale"
        />
      </div>
      <div class="col-12 col-md-6">
        <PageBuilderRuleColumn
          v-model="computer"
          :title="$t('admin.pageBuilder.computerBased')"
          :add-label="$t('admin.pageBuilder.actions.addRule')"
          :edit-locale="editLocale"
        />
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import PageBuilderRuleColumn from './page-builder-rule-column.vue';
import type { EditorSection, ExamRuleBoxContent } from 'src/types/page-builder.types';

interface Props {
  editLocale?: 'th' | 'en';
}

withDefaults(defineProps<Props>(), {
  editLocale: 'th',
});

const paper = defineModel<EditorSection<ExamRuleBoxContent>>('paper', { required: true });
const computer = defineModel<EditorSection<ExamRuleBoxContent>>('computer', {
  required: true,
});
</script>

<style scoped lang="scss">
.pb-card {
  padding: 24px 32px;
  border-radius: var(--radius-md);
  background-color: var(--surface-card);
  box-shadow: var(--shadow-card) !important;
}

.pb-section-title {
  font-weight: 600;
  color: var(--pb-heading-color);
}
</style>
