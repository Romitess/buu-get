<template>
  <div
    class="footer-credits row justify-between items-center q-pa-md"
    :class="`footer-credits--${variant}`"
  >
    <div class="text-weight-medium">Crafted by the computer center of Burapha University</div>
    <div class="text-caption opacity-80">&copy; 2026 Copyright All Right Reserved.</div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'white';
  }>(),
  {
    variant: 'primary',
  },
);
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
