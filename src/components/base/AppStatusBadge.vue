<template>
  <div class="app-status-badge" :class="[`badge--${type}`]">
    <div v-if="dot" class="badge-dot" />
    <span class="badge-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * AppStatusBadge Component
 * A premium status indicator with a pill shape and indicator dot.
 * Designed according to BUU-GET brand guidelines and visual specifications.
 */

interface Props {
  /** The text to display inside the badge */
  label: string;
  /**
   * The visual style of the badge
   * @default 'primary'
   */
  type?: 'primary' | 'success' | 'warning' | 'error' | 'info' | undefined;
  /**
   * Whether to show the status dot
   * @default true
   */
  dot?: boolean | undefined;
}

withDefaults(defineProps<Props>(), {
  type: 'primary',
  dot: true,
});
</script>

<style scoped lang="scss">
@import '../../css/quasar.variables.scss';

.app-status-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 30px;
  // Based on spec: Gap 20px (Note: In visual design this might be the gap between components,
  // but as per explicit spec image, we use it here for the inner gap between dot and text)
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  width: fit-content;

  .badge-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .badge-label {
    line-height: 1;
    font-family: 'Noto Sans Thai', 'Inter', sans-serif;
    color: inherit;
  }

  // Variants using Global Design Tokens
  &.badge--primary {
    background-color: var(--badge-primary-bg);
    color: var(--badge-primary-text);
    .badge-dot { background-color: var(--badge-primary-dot); }
  }

  &.badge--success {
    background-color: var(--badge-success-bg);
    color: var(--badge-success-text);
    .badge-dot { background-color: var(--badge-success-dot); }
  }

  &.badge--warning {
    background-color: var(--badge-warning-bg);
    color: var(--badge-warning-text);
    .badge-dot { background-color: var(--badge-warning-dot); }
  }

  &.badge--error {
    background-color: var(--badge-error-bg);
    color: var(--badge-error-text);
    .badge-dot { background-color: var(--badge-error-dot); }
  }

  &.badge--info {
    background-color: var(--badge-info-bg);
    color: var(--badge-info-text);
    .badge-dot { background-color: var(--badge-info-dot); }
  }
}
</style>
