<template>
  <div class="rule-column column">
    <div class="text-subtitle1 text-weight-bold text-primary q-mb-md">{{ title }}</div>

    <div class="rule-column__list-container">
      <div class="column q-gutter-y-sm">
        <PageBuilderRuleCard
          v-for="(box, index) in section.boxes"
          :key="index"
          v-model="section.boxes[index]!"
          :edit-locale="editLocale"
          draggable="true"
          @dragstart="onDragStart(index)"
          @dragover.prevent
          @drop.prevent="onDrop(index)"
          @dragend="onDragEnd"
          @remove="removeRule(index)"
        />

        <div v-if="section.boxes.length === 0" class="rule-empty column flex-center text-grey-6">
          <q-icon name="rule" size="36px" />
          <div class="text-body2 q-mt-sm">{{ $t('admin.pageBuilder.empty.rule') }}</div>
        </div>
      </div>
    </div>

    <button type="button" class="rule-column__add" @click="addRule">
      <q-icon name="add" size="20px" />
      <span>{{ addLabel }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PageBuilderRuleCard from './page-builder-rule-card.vue';
import type { EditorSection, ExamRuleBoxContent } from 'src/types/page-builder.types';

interface Props {
  title: string;
  addLabel: string;
  editLocale?: 'th' | 'en';
}

withDefaults(defineProps<Props>(), {
  editLocale: 'th',
});

const section = defineModel<EditorSection<ExamRuleBoxContent>>({ required: true });

const dragIndex = ref<number | null>(null);

const addRule = (): void => {
  section.value.boxes.push({
    sortOrder: section.value.boxes.length + 1,
    icon: 'rule',
    text: { th: '', en: '' },
    active: true,
  });
};

const removeRule = (index: number): void => {
  section.value.boxes.splice(index, 1);
};

const onDragStart = (index: number): void => {
  dragIndex.value = index;
};

const onDrop = (targetIndex: number): void => {
  const from = dragIndex.value;
  if (from === null || from === targetIndex) return;
  const [moved] = section.value.boxes.splice(from, 1);
  if (moved) section.value.boxes.splice(targetIndex, 0, moved);
  dragIndex.value = null;
};

const onDragEnd = (): void => {
  dragIndex.value = null;
};
</script>

<style scoped lang="scss">
.rule-column {
  height: 100%;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-md);
  padding: 20px;
  background-color: var(--surface-card);
}

.rule-column__add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-top: 12px;
  padding: 14px 12px;
  border: 1px dashed var(--neutral-300);
  border-radius: var(--radius-md);
  background-color: transparent;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
    background-color: rgba(13, 71, 161, 0.04);
  }
}

.rule-column__list-container {
  max-height: 400px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--pb-scrollbar-thumb) var(--pb-scrollbar-track);

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: var(--pb-scrollbar-track);
    border-radius: var(--radius-md);
  }
  &::-webkit-scrollbar-thumb {
    background: var(--pb-scrollbar-thumb);
    border-radius: var(--radius-md);

    &:hover {
      background: var(--text-secondary);
    }
  }
}

.rule-empty {
  height: 160px;
  border: 1px dashed var(--neutral-300);
  border-radius: var(--radius-md);
}

@media (max-width: 599px) {
  .rule-column {
    padding: 14px;
  }
}
</style>
