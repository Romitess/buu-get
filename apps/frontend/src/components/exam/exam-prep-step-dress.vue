<template>
  <div class="prep-step column">
    <div class="prep-step-icon row items-center justify-center q-mb-md" aria-hidden="true">
      <q-icon name="checkroom" size="32px" color="primary" />
    </div>
    <div class="prep-step-title text-weight-bold q-mb-sm">
      {{ $t('exam.prepGuide.steps.dress.title') }}
    </div>
    <div class="prep-step-body">
      {{ $t('exam.prepGuide.steps.dress.body') }}
    </div>
  </div>
</template>

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
  max-width: 420px;
  font-size: var(--font-size-sm, 0.875rem);
  line-height: 1.6;
  color: var(--text-muted, #6b7280);
}
</style>
