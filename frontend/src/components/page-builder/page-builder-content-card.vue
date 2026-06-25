<template>
  <q-card flat bordered class="content-card row no-wrap items-center">
    <q-icon
      name="drag_indicator"
      size="22px"
      color="grey-8"
      class="content-card__handle"
    />

    <div class="content-card__inputs col column q-gutter-y-sm">
      <div class="column q-gutter-y-xs">
        <span class="text-caption text-weight-bold text-grey-8">{{ $t('admin.pageBuilder.contentTitle') }}</span>
        <q-input
          v-model="titleValue"
          outlined
          dense
        />
      </div>
      <div class="column q-gutter-y-xs">
        <span class="text-caption text-weight-bold text-grey-8">{{ $t('admin.pageBuilder.contentLabel') }}</span>
        <q-input
          v-model="contentValue"
          type="textarea"
          outlined
          dense
          :rows="3"
          class="content-card__textarea"
        />
      </div>
    </div>

    <q-btn
      flat
      round
      dense
      icon="delete"
      color="grey-9"
      class="content-card__delete"
      @click="emit('remove')"
    />
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ContentBoxContent } from 'src/types/page-builder.types';

interface Props {
  editLocale?: 'th' | 'en';
}

const props = withDefaults(defineProps<Props>(), {
  editLocale: 'th',
});

const box = defineModel<ContentBoxContent>({ required: true });

const emit = defineEmits<{ (e: 'remove'): void }>();

const titleValue = computed<string>({
  get: () => box.value.title[props.editLocale] ?? '',
  set: (val) => {
    box.value.title = { ...box.value.title, [props.editLocale]: val };
  },
});

const contentValue = computed<string>({
  get: () => box.value.content[props.editLocale] ?? '',
  set: (val) => {
    box.value.content = { ...box.value.content, [props.editLocale]: val };
  },
});
</script>

<style scoped lang="scss">
.content-card {
  padding: 16px 16px 16px 8px;
  border-radius: var(--radius-md);
  gap: 12px;
}

.content-card__textarea :deep(.q-field__native) {
  min-height: 72px;
  resize: vertical;
}

.content-card__handle {
  flex: 0 0 auto;
  cursor: grab;
}

.content-card__delete {
  flex: 0 0 auto;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: var(--radius-10);
}

@media (max-width: 599px) {
  .content-card {
    flex-wrap: wrap;
    padding: 12px;
    gap: 8px;
  }
  
  .content-card__handle {
    order: 1;
  }
  
  .content-card__inputs {
    order: 3;
    width: 100%;
    flex: 1 0 100%;
    margin-top: 4px;
  }
  
  .content-card__delete {
    order: 2;
    margin-left: auto;
  }
}
</style>
