<template>
  <div class="app-status-badge" :class="[`badge--${type}`]">
    <div v-if="dot" class="badge-dot" />
    <span class="badge-label">
      <!-- Slot for flexible content, falls back to the label prop if empty -->
      <slot>{{ label }}</slot>
    </span>
  </div>
</template>

<script setup lang="ts">
/**
 * AppStatusBadge Component
 * A premium status indicator with a pill shape and indicator dot.
 * Designed according to BUU-GET brand guidelines and visual specifications.
 */

interface Props {
  /** The text to display inside the badge (optional if using slot) */
  label?: string;
  /**
   * The visual style of the badge
   * @default 'primary'
   */
  type?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  /**
   * Whether to show the status dot
   * @default true
   */
  dot?: boolean;
}

withDefaults(defineProps<Props>(), {
  label: '',
  type: 'primary',
  dot: true,
});
</script>

<style scoped lang="scss">
.app-status-badge {
  display: inline-flex;
  align-items: center;
  height: var(--space-lg);
  padding: 0 var(--space-sm); // More compact padding to align better with title
  border-radius: var(--radius-pill);
  gap: var(--space-xs);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
  width: fit-content;
  color: inherit;
  font-family: 'Sarabun', sans-serif;

  .badge-dot {
    width: calc(var(--space-unit) * 2);
    height: calc(var(--space-unit) * 2);
    border-radius: var(--radius-pill);
    flex-shrink: 0;
  }

  .badge-label {
    line-height: normal; // Better for Thai font vertical centering
    color: inherit;
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
  }

  // Variants using Global Design Tokens from app.scss
  &.badge--primary {
    background-color: var(--badge-primary-bg);
    color: var(--text-primary);
    .badge-dot {
      background-color: var(--badge-primary-text);
    }
  }

  &.badge--success {
    background-color: var(--badge-success-bg);
    color: var(--text-primary);
    .badge-dot {
      background-color: var(--badge-success-text);
    }
  }

  &.badge--warning {
    background-color: var(--badge-warning-bg);
    color: var(--text-primary);
    .badge-dot {
      background-color: var(--badge-warning-text);
    }
  }

  &.badge--error {
    background-color: var(--badge-error-bg);
    color: var(--text-primary);
    .badge-dot {
      background-color: var(--badge-error-text);
    }
  }

  &.badge--info {
    background-color: var(--badge-info-bg);
    color: var(--text-primary);
    .badge-dot {
      background-color: var(--badge-info-text);
    }
  }
}
@media (max-width: 600px) {
  .app-status-badge {
    height: calc(var(--space-unit) * 5.5);
    padding: 0 var(--space-sm);
    font-size: var(--font-size-xs);
    gap: calc(var(--space-unit) * 1);
    .badge-dot {
      width: calc(var(--space-unit) * 1.5);
      height: calc(var(--space-unit) * 1.5);
    }
  }
}
</style>
