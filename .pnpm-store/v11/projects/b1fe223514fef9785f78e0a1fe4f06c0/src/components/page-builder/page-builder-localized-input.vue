<template>
  <div class="localized-input column q-gutter-sm">
    <q-input
      v-model="thValue"
      :label="`${label} (ไทย)`"
      :type="type"
      :autogrow="type === 'textarea'"
      outlined
      dense
    />
    <q-input
      v-model="enValue"
      :label="`${label} (English)`"
      :type="type"
      :autogrow="type === 'textarea'"
      outlined
      dense
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { LocalizedText } from 'src/types/page-builder.types';

interface Props {
  label: string;
  type?: 'text' | 'textarea';
}

withDefaults(defineProps<Props>(), {
  type: 'text',
});

const model = defineModel<LocalizedText>({ required: true });

const thValue = computed<string>({
  get: () => model.value.th ?? '',
  set: (val) => {
    model.value = { ...model.value, th: val };
  },
});

const enValue = computed<string>({
  get: () => model.value.en ?? '',
  set: (val) => {
    model.value = { ...model.value, en: val };
  },
});
</script>
