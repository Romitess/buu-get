<template>
  <div class="prep-step column">
    <div class="prep-step-icon row items-center justify-center q-mb-md" aria-hidden="true">
      <q-icon name="inventory_2" size="32px" color="primary" />
    </div>
    <div class="prep-step-title text-weight-bold q-mb-sm">
      {{ $t('exam.prepGuide.steps.items.title') }}
    </div>
    <div class="prep-step-body q-mb-md">
      {{ $t('exam.prepGuide.steps.items.body') }}
    </div>

    <div class="items-grid full-width row q-col-gutter-md">
      <div class="col-12 col-sm-6">
        <div class="items-panel items-panel--allowed q-pa-md">
          <div class="items-panel-title text-weight-bold q-mb-sm row items-center">
            <q-icon name="check_circle" color="positive" class="q-mr-xs" />
            {{ $t('exam.prepGuide.allowedTitle') }}
          </div>
          <ul class="items-list">
            <li v-for="key in allowedKeys" :key="key">
              {{ $t(`exam.prepGuide.allowedItems.${key}`) }}
            </li>
          </ul>
        </div>
      </div>
      <div class="col-12 col-sm-6">
        <div class="items-panel items-panel--forbidden q-pa-md">
          <div class="items-panel-title text-weight-bold q-mb-sm row items-center">
            <q-icon name="cancel" color="negative" class="q-mr-xs" />
            {{ $t('exam.prepGuide.forbiddenTitle') }}
          </div>
          <ul class="items-list">
            <li v-for="key in forbiddenKeys" :key="key">
              {{ $t(`exam.prepGuide.forbiddenItems.${key}`) }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const allowedKeys = ['item1', 'item2', 'item3'] as const;
const forbiddenKeys = ['item1', 'item2', 'item3'] as const;
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
  max-width: 480px;
  font-size: var(--font-size-sm, 0.875rem);
  line-height: 1.6;
  color: var(--text-muted, #6b7280);
}

.items-panel {
  border-radius: var(--radius-md, 12px);
  text-align: left;
  height: 100%;
}

.items-panel--allowed {
  background: color-mix(in srgb, var(--q-positive, #21ba45) 10%, transparent);
}

.items-panel--forbidden {
  background: color-mix(in srgb, var(--q-negative, #c10015) 8%, transparent);
}

.items-panel-title {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-primary);
}

.items-list {
  margin: 0;
  padding-left: 1.1rem;
  font-size: var(--font-size-sm, 0.875rem);
  line-height: 1.55;
  color: var(--text-primary);

  li + li {
    margin-top: 0.35rem;
  }
}
</style>
