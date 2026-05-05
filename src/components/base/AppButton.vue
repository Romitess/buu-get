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
      'app-button--pill': pill
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
/**
 * AppButton Component
 * A reusable button component following the BUU-GET brand guidelines.
 * Curvature and colors are matched with the application's layout system.
 */
interface Props {
  /** Optional icon name (Quasar icons) */
  icon?: string;
  /** Button label text */
  label?: string;
  /** Button color (e.g., 'primary', 'secondary', 'full', 'buu-gray-dark') */
  color?: string;
  /** If true, button will be flat */
  flat?: boolean;
  /** If true, button will have an outline */
  outline?: boolean;
  /** If true, button will be circular (round) */
  round?: boolean;
  /** If true, button will have a pill shape (fully rounded) */
  pill?: boolean;
}

withDefaults(defineProps<Props>(), {
  color: 'primary',
  flat: false,
  outline: false,
  round: false,
  pill: false
});
</script>

<style scoped lang="scss">
.app-button {
  // Border radius matching the layout elements
  border-radius: 8px;
  font-weight: 600;
  text-transform: none;
  padding: 8px 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.02em;

  // Round variant override
  &--round {
    border-radius: 50%;
    padding: 0;
  }

  // Pill variant override
  &--pill {
    border-radius: 100px;
    padding: 6px 18px;
    font-size: 0.85rem;
  }
  
  // Brand Variant (Primary Dark Blue - #0D47A1)
  &--brand {
    background-color: var(--primary) !important;
    color: white !important;
    box-shadow: 0 4px 10px rgba(13, 71, 161, 0.2);

    &:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
      box-shadow: 0 6px 15px rgba(13, 71, 161, 0.3);
    }
  }

  // Secondary Variant (Light Blue - #1E89E5)
  &--secondary {
    background-color: var(--secondary) !important;
    color: white !important;
    box-shadow: 0 4px 10px rgba(30, 137, 229, 0.2);

    &:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
      box-shadow: 0 6px 15px rgba(30, 137, 229, 0.3);
    }
  }

  // Full/Negative Variant (Light Red Background)
  &--full {
    background-color: #ffebeb !important;
    color: #f44336 !important;
    border: none;
    
    &:hover {
      background-color: #ffdada !important;
    }
  }

  // Dark Variant
  &--dark {
    background-color: var(--surface-sidebar) !important;
    color: white !important;
    
    &:hover {
      filter: brightness(1.2);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  // Flat Variant
  &--flat {
    &:hover {
      background: rgba(0, 0, 0, 0.05) !important;
    }
  }

  &:active {
    transform: translateY(0);
    filter: brightness(0.95);
  }

  // Ensure icons are centered
  :deep(.q-icon) {
    font-size: 1.2rem;
    margin-right: 6px;
  }

  &--round :deep(.q-icon) {
    margin-right: 0;
  }
}
</style>
