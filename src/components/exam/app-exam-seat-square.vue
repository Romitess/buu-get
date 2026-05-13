<template>
  <div
    class="seat-square cursor-pointer flex items-center justify-center text-subtitle2 text-weight-bold transition-fast"
    :class="[
      status === 'assigned' ? 'text-white assigned-bg border-assigned' : 'available-bg text-dark',
    ]"
    @click="$emit('click', seatNumber)"
  >
    {{ seatNumber }}
  </div>
</template>

<script setup lang="ts">
interface Props {
  seatNumber: string;
  status?: 'available' | 'assigned';
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
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--primary-light);
  user-select: none;
  font-size: var(--font-size-sm);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
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
  border-color: var(--neutral-400);
}

.border-assigned {
  border-color: var(--primary-light);
}
</style>
