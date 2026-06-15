<template>
  <div
    class="seat-square cursor-pointer flex items-center justify-center text-subtitle2 text-weight-bold transition-fast"
    :class="[
      status === 'assigned' ? 'assigned-bg border-assigned' : '',
      status === 'broken' ? 'broken-bg border-broken' : '',
      status === 'blocked' ? 'blocked-bg border-blocked' : '',
      status === 'available' ? 'available-bg text-dark' : '',
    ]"
    @click="$emit('click', seatNumber)"
  >
    <img
      v-if="status === 'broken' || status === 'blocked'"
      src="/icons/seat-broken.svg"
      class="broken-icon"
      alt=""
      aria-hidden="true"
    />
    <span v-else>{{ seatNumber }}</span>
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  seatNumber: string;
  status?: 'available' | 'assigned' | 'broken' | 'blocked';
}

withDefaults(defineProps<Props>(), {
  status: 'available',
});

defineEmits<{
  (e: 'click', seatNumber: string): void;
}>();
</script>

<style scoped lang="scss">
.seat-square {
  width: 100%;
  height: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  border: 1px solid var(--secondary);
  user-select: none;
  font-size: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  white-space: nowrap;
  padding: 2px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.transition-fast {
  transition: all var(--transition-fast);
}

.assigned-bg {
  background-color: var(--primary-light);
}

.available-bg {
  background-color: var(--surface-card);
  border-color: var(--secondary);
}

.border-assigned {
  border-color: var(--primary-light);
}

.broken-bg,
.blocked-bg {
  &:hover {
    transform: none;
    box-shadow: none;
  }
}

.broken-bg {
  background-color: var(--seat-broken-bg);
  cursor: not-allowed;
}

.border-broken {
  border-color: var(--seat-broken-bg);
}

.blocked-bg {
  background-color: var(--neutral-gray-light);
  cursor: not-allowed;
}

.border-blocked {
  border-color: var(--text-muted);
}

.broken-icon {
  width: clamp(17px, 52%, 24px);
  height: clamp(17px, 52%, 24px);
  color: var(--text-on-primary);
}
</style>
