<template>
  <Teleport to="body">
    <div v-if="visible && targetRect" class="product-tour-overlay" @click.self="emitSkip">
      <div
        class="product-tour-spotlight"
        :class="{ 'product-tour-spotlight--no-motion': prefersReducedMotion }"
        :style="spotlightStyle"
        aria-hidden="true"
      />

      <div
        ref="popoverRef"
        class="product-tour-popover"
        :class="`product-tour-popover--${resolvedPlacement}`"
        :style="popoverStyle"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="bodyId"
        @keydown.escape.prevent="emitSkip"
      >
        <div
          class="product-tour-popover__arrow"
          :class="`product-tour-popover__arrow--${resolvedPlacement}`"
          aria-hidden="true"
        />

        <div class="product-tour-popover__header">
          <span class="product-tour-popover__badge">{{ badgeLabel }}</span>
          <h2 :id="titleId" class="product-tour-popover__title">{{ title }}</h2>
        </div>

        <p :id="bodyId" class="product-tour-popover__body">{{ body }}</p>

        <div class="product-tour-popover__actions">
          <q-btn
            ref="nextButtonRef"
            color="primary"
            :label="nextLabel"
            no-caps
            unelevated
            class="product-tour-popover__next-btn"
            @click="emitNext"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import type { TourPlacement } from 'src/composables/exam-simulation-tour-steps';

interface Props {
  visible: boolean;
  targetRect: DOMRect | null;
  stepNumber: number;
  title: string;
  body: string;
  badgeLabel: string;
  nextLabel: string;
  placement?: TourPlacement;
  isLast?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'left',
  isLast: false,
});

const emit = defineEmits<{
  next: [];
  skip: [];
}>();

const POPOVER_GAP = 16;
const SPOTLIGHT_PADDING = 8;
const VIEWPORT_MARGIN = 16;
const POPOVER_WIDTH = 360;

const popoverRef = ref<HTMLElement | null>(null);
const nextButtonRef = ref<{ $el: HTMLElement } | null>(null);
const popoverHeight = ref(0);
const prefersReducedMotion = ref(false);

const titleId = useId();
const bodyId = useId();

const resolvedPlacement = computed<TourPlacement>(() => {
  if (!props.targetRect) {
    return props.placement;
  }

  if (typeof window === 'undefined') {
    return props.placement;
  }

  const isNarrow = window.innerWidth < 1024;
  if (isNarrow) {
    return 'bottom';
  }

  return props.placement;
});

const spotlightStyle = computed(() => {
  if (!props.targetRect) {
    return {};
  }

  const top = props.targetRect.top - SPOTLIGHT_PADDING;
  const left = props.targetRect.left - SPOTLIGHT_PADDING;
  const width = props.targetRect.width + SPOTLIGHT_PADDING * 2;
  const height = props.targetRect.height + SPOTLIGHT_PADDING * 2;

  return {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`,
  };
});

const popoverStyle = computed(() => {
  if (!props.targetRect) {
    return {};
  }

  const rect = props.targetRect;
  const placement = resolvedPlacement.value;
  const height = popoverHeight.value || 220;
  let top = 0;
  let left = 0;

  switch (placement) {
    case 'left':
      top = rect.top + rect.height / 2 - height / 2;
      left = rect.left - POPOVER_GAP - POPOVER_WIDTH;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - height / 2;
      left = rect.right + POPOVER_GAP;
      break;
    case 'top':
      top = rect.top - POPOVER_GAP - height;
      left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
      break;
    case 'bottom':
      top = rect.bottom + POPOVER_GAP;
      left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
      break;
  }

  const maxLeft = window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN;
  const maxTop = window.innerHeight - height - VIEWPORT_MARGIN;

  top = Math.max(VIEWPORT_MARGIN, Math.min(top, maxTop));
  left = Math.max(VIEWPORT_MARGIN, Math.min(left, maxLeft));

  return {
    top: `${top}px`,
    left: `${left}px`,
    width: `${POPOVER_WIDTH}px`,
  };
});

let resizeObserver: ResizeObserver | null = null;

const measurePopover = async (): Promise<void> => {
  await nextTick();
  if (popoverRef.value) {
    popoverHeight.value = popoverRef.value.offsetHeight;
  }
};

const focusNextButton = async (): Promise<void> => {
  await nextTick();
  nextButtonRef.value?.$el?.focus();
};

const emitNext = (): void => {
  emit('next');
};

const emitSkip = (): void => {
  emit('skip');
};

const updateReducedMotion = (): void => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

watch(
  () => [props.visible, props.targetRect, props.title, props.body],
  async () => {
    if (!props.visible) {
      return;
    }
    await measurePopover();
    await focusNextButton();
  },
  { flush: 'post' },
);

onMounted(() => {
  updateReducedMotion();
  window
    .matchMedia('(prefers-reduced-motion: reduce)')
    .addEventListener('change', updateReducedMotion);

  if (popoverRef.value) {
    resizeObserver = new ResizeObserver(() => {
      void measurePopover();
    });
    resizeObserver.observe(popoverRef.value);
  }
});

onBeforeUnmount(() => {
  window
    .matchMedia('(prefers-reduced-motion: reduce)')
    .removeEventListener('change', updateReducedMotion);
  resizeObserver?.disconnect();
});
</script>

<style scoped lang="scss">
.product-tour-overlay {
  position: fixed;
  inset: 0;
  z-index: 7000;
}

.product-tour-spotlight {
  position: fixed;
  border-radius: 10px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
  pointer-events: none;
  z-index: 7001;
  transition:
    top 0.2s ease,
    left 0.2s ease,
    width 0.2s ease,
    height 0.2s ease;

  &--no-motion {
    transition: none;
  }
}

.product-tour-popover {
  position: fixed;
  z-index: 7002;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  padding: 20px 24px 16px;
  box-sizing: border-box;
}

.product-tour-popover__arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #ffffff;
  transform: rotate(45deg);
  box-shadow: -2px 2px 4px rgba(0, 0, 0, 0.06);

  &--left {
    right: -6px;
    top: 50%;
    margin-top: -6px;
  }

  &--right {
    left: -6px;
    top: 50%;
    margin-top: -6px;
  }

  &--top {
    bottom: -6px;
    left: 50%;
    margin-left: -6px;
  }

  &--bottom {
    top: -6px;
    left: 50%;
    margin-left: -6px;
  }
}

.product-tour-popover__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.product-tour-popover__badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background-color: #e0f2fe;
  color: var(--q-primary, #1565c0);
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.product-tour-popover__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.4;
}

.product-tour-popover__body {
  margin: 0 0 20px;
  font-size: 0.9rem;
  line-height: 1.65;
  color: #4a4a4a;
}

.product-tour-popover__actions {
  display: flex;
  justify-content: flex-end;
}

.product-tour-popover__next-btn {
  border-radius: 8px;
  font-weight: 600;
  min-width: 88px;
}
</style>
