<template>
  <q-card flat class="pb-card column">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6 pb-section-title">{{ title }}</div>
      <AppButton
        outline
        color="primary"
        icon="add_circle"
        :label="addLabel"
        class="pb-add-btn"
        @click="addBox"
      />
    </div>

    <div class="content-list-container">
      <div class="column q-gutter-y-md">
        <PageBuilderContentCard
          v-for="(box, index) in section.boxes"
          :key="index"
          v-model="section.boxes[index]!"
          :edit-locale="editLocale"
          draggable="true"
          @dragstart="onDragStart(index)"
          @dragover.prevent
          @drop.prevent="onDrop(index)"
          @dragend="onDragEnd"
          @remove="removeBox(index)"
        />

        <div v-if="section.boxes.length === 0" class="content-empty column flex-center text-grey-6">
          <q-icon name="inbox" size="40px" />
          <div class="text-body2 q-mt-sm">
            {{ emptyLabel || $t('admin.pageBuilder.empty.default') }}
          </div>
        </div>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppButton from 'src/components/base/app-button.vue';
import PageBuilderContentCard from './page-builder-content-card.vue';
import type { ContentBoxContent, EditorSection } from 'src/types/page-builder.types';

interface Props {
  title: string;
  addLabel: string;
  emptyLabel?: string;
  editLocale?: 'th' | 'en';
}

withDefaults(defineProps<Props>(), {
  emptyLabel: '',
  editLocale: 'th',
});

const section = defineModel<EditorSection<ContentBoxContent>>({ required: true });

const dragIndex = ref<number | null>(null);

const addBox = (): void => {
  section.value.boxes.push({
    sortOrder: section.value.boxes.length + 1,
    title: { th: '', en: '' },
    content: { th: '', en: '' },
    active: true,
  });
};

const removeBox = (index: number): void => {
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
.pb-card {
  padding: 24px 32px;
  border-radius: var(--radius-md);
  background-color: var(--surface-card);
  box-shadow: var(--shadow-card) !important;
  height: 100%;
}

.pb-section-title {
  font-weight: 600;
  color: var(--pb-heading-color);
}

.pb-add-btn {
  min-height: var(--pb-rule-icon-size);
  color: var(--primary) !important;
  background-color: transparent !important;

  &:before {
    border: 1px solid var(--primary) !important;
  }

  &:hover {
    background-color: rgba(13, 71, 161, 0.05) !important;
  }
}

.content-list-container {
  max-height: 500px;
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

.content-empty {
  height: 200px;
  border: 1px dashed var(--neutral-300);
  border-radius: var(--radius-md);
}

@media (max-width: 599px) {
  .pb-card {
    padding: 16px;
  }

  .pb-add-btn {
    flex: 0 0 auto;
  }
}
</style>
