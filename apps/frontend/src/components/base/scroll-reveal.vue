<template>
  <component
    :is="as"
    ref="rootRef"
    class="scroll-reveal"
    :class="{ 'scroll-reveal--revealed': isRevealed || disabled }"
    :style="revealStyle"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { useScrollReveal } from 'src/composables/use-scroll-reveal';

interface Props {
  delay?: number;
  disabled?: boolean;
  once?: boolean;
  as?: string;
}

const props = withDefaults(defineProps<Props>(), {
  delay: 0,
  disabled: false,
  once: false,
  as: 'div',
});

const rootRef = ref<HTMLElement | null>(null);
const disabledRef = toRef(props, 'disabled');

const { isRevealed } = useScrollReveal(rootRef, {
  disabled: disabledRef,
  once: props.once,
});

const revealStyle = computed(() => ({
  '--reveal-delay': `${props.delay}ms`,
}));
</script>

<style scoped>
.scroll-reveal {
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity 200ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
  transition-delay: var(--reveal-delay, 0ms);
  will-change: opacity, transform;
}

.scroll-reveal--revealed {
  opacity: 1;
  transform: translateY(0);
  transition-delay: var(--reveal-delay, 0ms);
}

.scroll-reveal:not(.scroll-reveal--revealed) {
  transition-delay: 0ms;
}

@media (prefers-reduced-motion: reduce) {
  .scroll-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
