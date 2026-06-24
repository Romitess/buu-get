<template>
  <q-card flat bordered class="pb-section">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-subtitle1 text-weight-medium">
        <q-icon name="dashboard" class="q-mr-sm" />การ์ดเนื้อหา
      </div>
      <q-toggle v-model="section.active" label="แสดงบนหน้าแรก" />
    </div>

    <div class="column q-gutter-y-md items-center">
      <q-card
        v-for="(box, index) in cards"
        :key="index"
        flat
        bordered
        class="pb-item full-width"
      >
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-caption text-grey-7">การ์ดที่ {{ index + 1 }}</div>
          <div class="row items-center q-gutter-x-xs">
            <q-toggle v-model="box.active" size="sm" label="แสดง" />
            <q-btn
              flat
              round
              dense
              icon="arrow_upward"
              :disable="index === 0"
              @click="emit('move', index, index - 1)"
            />
            <q-btn
              flat
              round
              dense
              icon="arrow_downward"
              :disable="index === cards.length - 1"
              @click="emit('move', index, index + 1)"
            />
            <q-btn flat round dense icon="delete" color="negative" @click="emit('remove', index)" />
          </div>
        </div>

        <q-input
          v-model="box.icon"
          label="ไอคอน (Material icon name)"
          outlined
          dense
          class="q-mb-sm"
        >
          <template #prepend>
            <q-icon :name="box.icon || 'help_outline'" />
          </template>
        </q-input>

        <PageBuilderLocalizedInput
          :model-value="box.title ?? { th: '', en: '' }"
          label="หัวข้อ"
          type="text"
          class="q-mb-sm"
          @update:model-value="(val) => (box.title = val)"
        />
        <PageBuilderLocalizedInput
          :model-value="box.subtitle ?? { th: '', en: '' }"
          label="เนื้อหา"
          type="textarea"
          @update:model-value="(val) => (box.subtitle = val)"
        />
      </q-card>

      <q-btn
        outline
        color="primary"
        icon="add_circle"
        label="เพิ่มการ์ด"
        class="pb-add-btn"
        @click="emit('add')"
      />
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PageBuilderLocalizedInput from './page-builder-localized-input.vue';
import type { CardBoxContent, PageSectionContent } from 'src/types/page-builder.types';

const section = defineModel<PageSectionContent>({ required: true });

const emit = defineEmits<{
  (e: 'add'): void;
  (e: 'remove', index: number): void;
  (e: 'move', from: number, to: number): void;
}>();

const cards = computed(() => section.value.boxes as CardBoxContent[]);
</script>

<style scoped lang="scss">
.pb-section {
  padding: 20px 24px;
  border-radius: 12px;
}

.pb-item {
  padding: 16px;
  border-radius: 12px;
  max-width: 720px;
}

.pb-add-btn {
  border-radius: 8px;
}
</style>
