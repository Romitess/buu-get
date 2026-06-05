<template>
  <q-card-section class="q-pa-none">
    <div class="text-h6 text-weight-bold text-grey-9 q-mb-xs">
      {{ $t('examSchedule.convenienceDialog.title') }}
    </div>
    <div class="text-subtitle2 text-grey-6 q-mb-lg">
      {{ $t('examSchedule.convenienceDialog.subtitle') }}
    </div>

    <q-list class="q-gutter-y-sm q-mb-lg">
      <q-item
        v-for="option in options"
        :key="option.value"
        clickable
        v-ripple
        class="option-item border-radius-lg"
        :class="{ 'option-item--selected': modelValue === option.value }"
        @click="selectOption(option.value)"
      >
        <q-item-section avatar class="q-pr-none min-width-unset">
          <q-checkbox
            :model-value="modelValue === option.value"
            @update:model-value="selectOption(option.value)"
            color="primary"
            keep-color
          />
        </q-item-section>
        <q-item-section class="q-pl-md text-weight-medium text-grey-9">
          {{ $t(option.labelKey) }}
        </q-item-section>
      </q-item>
    </q-list>

    <div class="info-banner q-pa-md text-center text-weight-medium text-grey-8 q-mb-xl">
      {{ $t('examSchedule.convenienceDialog.infoBanner') }}
    </div>

    <q-card-actions class="row justify-center q-col-gutter-md q-px-none q-pb-none">
      <div class="col-6 col-sm-3">
        <AppButton
          flat
          :label="$t('examSchedule.convenienceDialog.cancelBtn')"
          class="full-width cancel-btn text-weight-bold"
          @click="$emit('cancel')"
        />
      </div>
      <div class="col-6 col-sm-3">
        <AppButton
          :label="$t('examSchedule.convenienceDialog.nextBtn')"
          class="full-width next-btn text-weight-bold"
          @click="$emit('next')"
        />
      </div>
    </q-card-actions>
  </q-card-section>
</template>

<script setup lang="ts">
import AppButton from 'src/components/base/app-button.vue';
import th from 'src/i18n/th';

defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'cancel'): void;
  (e: 'next'): void;
}>();

const options = [
  {
    value: th.examSchedule.convenienceDialog.options.monk,
    labelKey: 'examSchedule.convenienceDialog.options.monk',
  },
  {
    value: th.examSchedule.convenienceDialog.options.clergy,
    labelKey: 'examSchedule.convenienceDialog.options.clergy',
  },
  {
    value: th.examSchedule.convenienceDialog.options.disabled,
    labelKey: 'examSchedule.convenienceDialog.options.disabled',
  },
  {
    value: th.examSchedule.convenienceDialog.options.pregnant,
    labelKey: 'examSchedule.convenienceDialog.options.pregnant',
  },
  {
    value: th.examSchedule.convenienceDialog.options.none,
    labelKey: 'examSchedule.convenienceDialog.options.none',
  },
];

const selectOption = (option: string): void => {
  emit('update:modelValue', option);
};
</script>

<style scoped lang="scss">
.option-item {
  border: 1px solid var(--neutral-200);
  border-radius: 12px;
  padding: 16px 24px;
  background-color: var(--surface-card);
  transition: all var(--transition-smooth);

  &:hover {
    border-color: var(--primary-light);
    background-color: var(--neutral-50);
  }

  &--selected {
    border-color: var(--primary);
    background-color: var(--neutral-100);
  }
}

.min-width-unset {
  min-width: unset;
}

.info-banner {
  background-color: var(--neutral-200);
  border-radius: 12px;
  font-size: 0.9rem;
}

.cancel-btn {
  background-color: var(--neutral-200) !important;
  color: var(--text-primary) !important;
  height: 44px;
  border-radius: 8px;
}

.next-btn {
  background-color: var(--primary) !important;
  color: var(--text-on-primary) !important;
  height: 44px;
  border-radius: 8px;
}
</style>
