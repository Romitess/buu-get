<template>
  <button
    type="button"
    class="exam-prep-notify-btn exam-prep-notify-btn--attention"
    :aria-label="ariaLabel"
    @click.stop="$emit('click')"
  >
    <span class="tips-pulse" aria-hidden="true" />
    <q-icon name="notifications_active" class="tips-icon" aria-hidden="true" />
    <span v-if="showUnread" class="unread-dot" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    showUnread?: boolean;
    ariaLabel: string;
  }>(),
  {
    showUnread: false,
  },
);

defineEmits<{
  (e: 'click'): void;
}>();
</script>

<style scoped lang="scss">
.exam-prep-notify-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(var(--space-unit) * 9);
  height: calc(var(--space-unit) * 9);
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  color: var(--primary);

  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  &--attention {
    .tips-icon {
      animation: prep-notify-wiggle 1.4s ease-in-out infinite;
      transform-origin: 50% 0%;
    }

    .tips-pulse {
      animation: prep-notify-ring 1.4s ease-out infinite;
    }

    .unread-dot {
      animation: prep-notify-dot-pulse 1s ease-in-out infinite;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &--attention .tips-icon,
    &--attention .tips-pulse,
    &--attention .unread-dot {
      animation: none;
    }
  }
}

.tips-pulse {
  position: absolute;
  inset: 10%;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--primary) 55%, transparent);
  pointer-events: none;
}

.tips-icon {
  position: relative;
  z-index: 1;
  font-size: calc(var(--space-unit) * 6.5);
  color: var(--primary);
}

.unread-dot {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  width: calc(var(--space-unit) * 2);
  height: calc(var(--space-unit) * 2);
  border-radius: 50%;
  background: var(--badge-error-dot, #e53935);
  border: 1.5px solid var(--surface-card, #fff);
}

@keyframes prep-notify-wiggle {
  0%,
  100% {
    transform: rotate(0deg) scale(1);
  }
  15% {
    transform: rotate(-14deg) scale(1.12);
  }
  30% {
    transform: rotate(12deg) scale(1.12);
  }
  45% {
    transform: rotate(-10deg) scale(1.08);
  }
  60% {
    transform: rotate(8deg) scale(1.06);
  }
  75% {
    transform: rotate(-4deg) scale(1.02);
  }
}

@keyframes prep-notify-ring {
  0% {
    transform: scale(0.75);
    opacity: 0.7;
  }
  70% {
    transform: scale(1.45);
    opacity: 0;
  }
  100% {
    transform: scale(1.45);
    opacity: 0;
  }
}

@keyframes prep-notify-dot-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.8;
  }
}
</style>
