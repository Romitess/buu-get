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
  border-radius: 8px; /* Slightly reduced since the square is smaller */
  border: 1px solid var(--secondary, #1e89e5);
  user-select: none;
  font-size: clamp(10px, 1vw, 15px); /* Fluid font size prevents overflow when zoomed in */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  white-space: nowrap;
  padding: 4px;

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
  border-color: var(--seat-available-border);
}

.border-assigned {
  border-color: var(--primary-light);
}
</style>
