<template>
  <q-card flat bordered class="pb-section">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-subtitle1 text-weight-medium">
        <q-icon name="gavel" class="q-mr-sm" />ข้อปฏิบัติในการสอบ
      </div>
      <q-toggle v-model="section.active" label="แสดงบนหน้าแรก" />
    </div>

    <div class="column q-gutter-y-sm">
      <q-card
        v-for="(box, index) in rules"
        :key="index"
        flat
        bordered
        class="pb-rule-item"
      >
        <div class="row items-center no-wrap q-gutter-x-sm">
          <q-icon name="drag_indicator" color="grey-6" />
          <q-input
            v-model="box.icon"
            label="ไอคอน"
            outlined
            dense
            class="rule-icon-input"
          >
            <template #prepend>
              <q-icon :name="box.icon || 'help_outline'" size="20px" />
            </template>
          </q-input>
          <div class="col">
            <PageBuilderLocalizedInput
              :model-value="box.text ?? { th: '', en: '' }"
              label="ข้อความ"
              type="text"
              @update:model-value="(val) => (box.text = val)"
            />
          </div>
          <div class="column items-center">
            <q-toggle v-model="box.active" size="sm" />
            <div class="row no-wrap">
              <q-btn
                flat
                round
                dense
                size="sm"
                icon="arrow_upward"
                :disable="index === 0"
                @click="emit('move', index, index - 1)"
              />
              <q-btn
                flat
                round
                dense
                size="sm"
                icon="arrow_downward"
                :disable="index === rules.length - 1"
                @click="emit('move', index, index + 1)"
              />
              <q-btn
                flat
                round
                dense
                size="sm"
                icon="delete"
                color="negative"
                @click="emit('remove', index)"
              />
            </div>
          </div>
        </div>
      </q-card>

      <q-btn
        outline
        color="primary"
        icon="add_circle"
        label="เพิ่มข้อปฏิบัติ"
        class="pb-add-btn q-mt-sm"
        @click="emit('add')"
      />
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PageBuilderLocalizedInput from './page-builder-localized-input.vue';
import type { ExamRuleBoxContent, PageSectionContent } from 'src/types/page-builder.types';

const section = defineModel<PageSectionContent>({ required: true });

const emit = defineEmits<{
  (e: 'add'): void;
  (e: 'remove', index: number): void;
  (e: 'move', from: number, to: number): void;
}>();

const rules = computed(() => section.value.boxes as ExamRuleBoxContent[]);
</script>

<style scoped lang="scss">
.pb-section {
  padding: 20px 24px;
  border-radius: 12px;
}

.pb-rule-item {
  padding: 10px 12px;
  border-radius: 12px;
}

.rule-icon-input {
  width: 160px;
}

.pb-add-btn {
  border-radius: 8px;
  align-self: center;
}
</style>
