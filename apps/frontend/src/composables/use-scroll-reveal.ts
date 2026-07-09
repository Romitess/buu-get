import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue';

const REVEAL_THRESHOLD = 0.12;
const REVEAL_ROOT_MARGIN = '0px 0px -6% 0px';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface UseScrollRevealOptions {
  disabled?: Ref<boolean> | boolean;
  once?: boolean;
}

export function useScrollReveal(
  targetRef: Ref<HTMLElement | null | undefined>,
  options: UseScrollRevealOptions = {},
) {
  const isRevealed = ref(false);
  const { once = false } = options;

  let observer: IntersectionObserver | null = null;

  const getDisabled = (): boolean => {
    const { disabled } = options;
    if (disabled === undefined) return false;
    return typeof disabled === 'boolean' ? disabled : disabled.value;
  };

  const setRevealed = (revealed: boolean): void => {
    isRevealed.value = revealed;
    if (revealed && once && observer) {
      observer.disconnect();
      observer = null;
    }
  };

  const setupObserver = (): void => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    if (getDisabled() || prefersReducedMotion()) {
      setRevealed(true);
      return;
    }

    const el = targetRef.value;
    if (!el) return;

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          setRevealed(true);
        } else if (!once) {
          setRevealed(false);
        }
      },
      {
        threshold: REVEAL_THRESHOLD,
        rootMargin: REVEAL_ROOT_MARGIN,
      },
    );

    observer.observe(el);
  };

  onMounted(() => {
    setupObserver();
  });

  onUnmounted(() => {
    observer?.disconnect();
    observer = null;
  });

  if (typeof options.disabled !== 'boolean' && options.disabled !== undefined) {
    watch(options.disabled, () => {
      if (getDisabled()) {
        setRevealed(true);
      } else {
        setupObserver();
      }
    });
  }

  return { isRevealed };
}
