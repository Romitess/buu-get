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
  height: 24px;
  padding: 0 10px;
  border-radius: 30px; // Pill shape as per design spec
  gap: 6px;
  font-size: 13px;
  font-weight: 700; // Bold for intensity as requested
  white-space: nowrap;
  width: fit-content;
  color: var(--text-primary); // Ensure text is black/dark for all variants

  .badge-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .badge-label {
    line-height: 1;
    color: inherit;
  }

  // Variants using Global Design Tokens from app.scss
  &.badge--primary {
    background-color: var(--badge-primary-bg);
    .badge-dot {
      background-color: var(--badge-primary-text);
    }
  }

  &.badge--success {
    background-color: var(--badge-success-bg);
    .badge-dot {
      background-color: var(--badge-success-text);
    }
  }

  &.badge--warning {
    background-color: var(--badge-warning-bg);
    .badge-dot {
      background-color: var(--badge-warning-text);
    }
  }

  &.badge--error {
    background-color: var(--badge-error-bg);
    .badge-dot {
      background-color: var(--badge-error-text);
    }
  }

  &.badge--info {
    background-color: var(--badge-info-bg);
    .badge-dot {
      background-color: var(--badge-info-text);
    }
  }
}
</style>
