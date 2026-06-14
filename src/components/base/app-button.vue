<template>
  <q-btn
    v-bind="$attrs"
    :color="['primary', 'secondary', 'buu-gray-dark'].includes(color) ? undefined : color"
    :unelevated="!flat && !outline"
    :flat="flat"
    :outline="outline"
    :round="round"
    class="app-button"
    :class="{
      'app-button--brand': (!color || color === 'primary') && !flat && !outline,
      'app-button--secondary': color === 'secondary' && !flat && !outline,
      'app-button--full': color === 'full',
      'app-button--dark': color === 'buu-gray-dark',
      'app-button--flat': flat,
      'app-button--round': round,
      'app-button--pill': pill,
    }"
    :icon="icon"
    :label="label"
  >
    <slot />
    <template v-if="$slots.loading" v-slot:loading>
      <slot name="loading" />
    </template>
  </q-btn>
</template>

<script setup lang="ts">
interface Props {
  icon?: string;
  label?: string;
  color?: string;
  flat?: boolean;
  outline?: boolean;
  round?: boolean;
  pill?: boolean;
}

withDefaults(defineProps<Props>(), {
  color: 'primary',
  flat: false,
  outline: false,
  round: false,
  pill: false,
});
</script>

<style scoped lang="scss">
.app-button {
  border-radius: 8px;
  font-weight: 600;
  text-transform: none;
  padding: 8px 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.02em;

  &--round {
    border-radius: 50%;
    padding: 0;
  }

  &--pill {
    border-radius: 100px;
    padding: 6px 18px;
    font-size: 0.85rem;
  }

  &--brand {
    background-color: var(--primary) !important;
    color: white !important;
    box-shadow: none !important;

    &:hover {
      filter: brightness(1.1) !important;
      box-shadow: none !important;
    }
  }

  &--secondary {
    background-color: var(--secondary) !important;
    color: white !important;
    box-shadow: none !important;

    &:hover {
      filter: brightness(1.1) !important;
      box-shadow: none !important;
    }
  }

  &--full {
    background-color: var(--btn-danger-light-bg) !important;
    color: var(--btn-danger-light-text) !important;
    border: none;

    &:hover {
      background-color: var(--btn-danger-light-hover) !important;
    }
  }

  &--dark {
    background-color: var(--surface-sidebar) !important;
    color: white !important;
    box-shadow: none !important;

    &:hover {
      filter: brightness(1.2) !important;
      box-shadow: none !important;
    }
  }

  &--flat {
    &:hover {
      background: rgba(0, 0, 0, 0.05) !important;
    }
  }

  &.cancel-btn,
  &.cancel-btn:hover,
  &.cancel-btn:focus,
  &.cancel-btn:active {
    background-color: var(--neutral-300) !important;
    color: var(--text-primary) !important;
    border: none !important;
    box-shadow: none !important;
  }

  &.cancel-btn::before {
    box-shadow: none !important;
  }

  &:active {
    transform: translateY(0);
    filter: brightness(0.95);
  }

  :deep(.q-icon) {
    font-size: 1.2rem;
    margin-right: 6px;
  }

  &--round :deep(.q-icon) {
    margin-right: 0;
  }
}
</style>
