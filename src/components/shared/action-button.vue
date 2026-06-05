<template>
  <q-btn
    :icon="!image ? icon : undefined"
    unelevated
    dense
    class="action-btn"
    :class="{
      'btn-danger': icon === 'delete',
      'btn-primary-bg': color === 'primary' || !!image,
    }"
    :disable="disable"
    @click="$emit('click')"
  >
    <template v-if="image">
      <img :src="image" class="btn-custom-img" alt="button icon" />
    </template>

    <q-tooltip v-if="tooltip" anchor="top middle" self="bottom middle" :offset="[10, 10]">
      {{ tooltip }}
    </q-tooltip>
  </q-btn>
</template>

<style scoped lang="scss">
.action-btn {
  background-color: var(--badge-primary-bg);
  color: var(--badge-primary-text);
  width: 32px;
  height: 32px;
  border-radius: 6px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  .btn-custom-img {
    width: 32px;
    height: 32px;
    object-fit: contain;
    display: block;
    user-select: none;
    pointer-events: none;
  }

  &:hover {
    background-color: var(--dialog-info-border);
  }

  &.btn-danger {
    background-color: var(--badge-error-dot);
    color: var(--text-on-primary);

    &:hover {
      background-color: var(--badge-error-text);
    }
  }

  &.btn-primary-bg {
    background-color: var(--primary) !important;
    color: white !important;

    &:hover {
      background-color: var(--primary-dark) !important;
    }
  }

  &:disabled,
  &.disabled,
  &.q-btn--disabled {
    background-color: var(--neutral-100) !important;
    color: var(--text-muted) !important;
    opacity: 1 !important;
    cursor: not-allowed !important;

    &.btn-danger,
    &.btn-primary-bg {
      background-color: var(--neutral-100) !important;
      color: var(--text-muted) !important;
    }

    .btn-custom-img {
      filter: grayscale(100%) opacity(0.6);
    }
  }
}
</style>

<script setup lang="ts">
defineProps<{
  icon?: string | undefined;
  image?: string | undefined;
  color?: string | undefined;
  tooltip?: string | undefined;
  disable?: boolean | undefined;
}>();

defineEmits<{
  (e: 'click'): void;
}>();
</script>
