<template>
  <div
    class="footer-credits row justify-between items-center q-pa-md text-center text-sm-left"
    :class="`footer-credits--${variant}`"
  >
    <div class="col-12 col-sm-auto text-weight-medium q-mb-xs q-mb-sm-none">
      Crafted by the computer center of Burapha University
    </div>
    <div class="col-12 col-sm-auto text-caption opacity-80">
      &copy; {{ currentYear }} Copyright All Right Reserved.
      <span v-if="appVersion"> · {{ appVersion }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

withDefaults(
  defineProps<{
    variant?: 'primary' | 'white';
  }>(),
  {
    variant: 'primary',
  },
);

const currentYear = computed(() => new Date().getFullYear());
const appVersion = computed(() => import.meta.env.VITE_APP_VERSION?.trim() || '');
</script>

<style scoped lang="scss">
.footer-credits {
  transition: var(--transition-smooth);

  &--primary {
    background-color: var(--primary);
    color: var(--text-on-primary);
  }

  &--white {
    background-color: var(--surface-card);
    color: var(--text-primary);
    border-top: 1px solid var(--border-color);
  }
}

.opacity-80 {
  opacity: 0.8;
}
</style>
