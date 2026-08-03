<template>
  <div class="prep-step column">
    <div class="prep-step-icon row items-center justify-center q-mb-md" aria-hidden="true">
      <q-icon name="print" size="32px" color="primary" />
    </div>

    <div class="prep-step-title text-weight-bold q-mb-sm">
      {{ $t('exam.prepGuide.steps.print.title') }}
    </div>

    <div class="prep-step-body q-mb-md">
      {{ $t('exam.prepGuide.steps.print.body') }}
    </div>

    <div class="prep-reminder q-pa-md q-mb-lg">
      <div class="row items-start no-wrap">
        <q-icon name="warning_amber" size="20px" class="reminder-icon q-mr-sm" aria-hidden="true" />
        <div class="reminder-text">{{ $t('exam.prepGuide.steps.print.reminder') }}</div>
      </div>
    </div>

    <AppButton
      icon="print"
      :label="$t('exam.prepGuide.printCta')"
      :loading="isPrinting"
      class="print-cta-btn"
      @click="$emit('print')"
    />
  </div>
</template>

<script setup lang="ts">
import AppButton from 'src/components/base/app-button.vue';

withDefaults(
  defineProps<{
    isPrinting?: boolean;
  }>(),
  {
    isPrinting: false,
  },
);

defineEmits<{
  (e: 'print'): void;
}>();
</script>

<style scoped lang="scss">
.prep-step {
  width: 100%;
  height: 100%;
  min-height: 0;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.prep-step-icon {
  width: calc(var(--space-unit) * 14);
  height: calc(var(--space-unit) * 14);
  border-radius: 50%;
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}

.prep-step-title {
  font-size: var(--font-size-h3, 1.25rem);
  color: var(--text-primary);
}

.prep-step-body {
  max-width: 440px;
  font-size: var(--font-size-sm, 0.875rem);
  line-height: 1.65;
  color: var(--text-primary);
  font-weight: var(--font-weight-medium, 500);
}

.prep-reminder {
  max-width: 440px;
  width: 100%;
  border-radius: var(--radius-md, 12px);
  background: color-mix(in srgb, var(--q-warning, #f2c037) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--q-warning, #f2c037) 45%, transparent);
  text-align: left;
}

.reminder-icon {
  color: #b7791f;
  flex-shrink: 0;
  margin-top: 1px;
}

.reminder-text {
  font-size: var(--font-size-sm, 0.875rem);
  line-height: 1.55;
  color: var(--text-primary);
  font-weight: var(--font-weight-medium, 500);
}

.print-cta-btn {
  min-width: 240px;
}
</style>
