<template>
  <div
    class="seat-square cursor-pointer flex items-center justify-center text-subtitle2 text-weight-bold transition-fast"
    :class="[
      status === 'assigned' ? 'text-white assigned-bg border-assigned' : '',
      status === 'broken' ? 'text-white broken-bg border-broken' : '',
      status === 'blocked' ? 'text-white blocked-bg border-blocked' : '',
      status === 'available' ? 'available-bg text-dark' : '',
    ]"
    @click="$emit('click', seatNumber)"
  >
    <q-icon v-if="status === 'broken' || status === 'blocked'" name="block" class="broken-icon" />
    <span v-else>{{ seatNumber }}</span>
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
  aspect-ratio: 1;
  border-radius: 8px;
  border: 1px solid var(--secondary, #1e89e5);
  user-select: none;
  font-size: clamp(10px, 1vw, 15px);
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

.broken-bg {
  background-color: var(--seat-broken-bg, #ef9a9a) !important;
  cursor: not-allowed !important;
}

.border-broken {
  border-color: var(--seat-broken-bg, #ef9a9a) !important;
}

.blocked-bg {
  background-color: #e0e0e0 !important;
  cursor: not-allowed !important;
}

.border-blocked {
  border-color: #bdbdbd !important;
}

.broken-icon {
  font-size: 18px;
  color: #757575;
}
</style>
