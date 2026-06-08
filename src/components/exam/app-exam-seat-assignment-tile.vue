<template>
  <div
    class="seat-assignment-tile"
    :class="{
      'is-assigned': status === 'assigned',
      'is-broken': status === 'broken' || status === 'blocked',
      'is-empty': status === 'available',
      'is-swap-mode': swapMode && status !== 'broken' && status !== 'blocked',
      'is-selected': selected,
      'is-moving': moving,
    }"
    @click="emit('click')"
  >
    <template v-if="status === 'broken' || status === 'blocked'">
      <img src="/icons/seat-broken.svg" class="broken-icon" alt="" aria-hidden="true" />
    </template>
    <template v-else-if="student">
      <div class="seat-name">{{ shortName }}</div>
      <q-avatar size="34px" class="seat-avatar">
        <img v-if="student.avatar" :src="student.avatar" alt="" />
        <q-icon v-else name="person" size="21px" color="grey-8" />
      </q-avatar>
      <q-icon v-if="swapMode" name="swap_horiz" class="swap-icon" />
    </template>
    <template v-else>
      <span class="empty-text">{{ emptyLabel }}</span>
    </template>
  </div>
  <div class="seat-label">{{ seatLabel }}</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SeatStatus, StudentSeatInfo } from 'src/composables/use-exam-seat-management';

const props = withDefaults(
  defineProps<{
    seatLabel: string;
    status: SeatStatus;
    student?: StudentSeatInfo | null;
    swapMode?: boolean;
    selected?: boolean;
    moving?: boolean;
    emptyLabel?: string;
    nameFallback?: string;
  }>(),
  {
    student: null,
    swapMode: false,
    selected: false,
    moving: false,
    emptyLabel: '\u0e27\u0e48\u0e32\u0e07',
    nameFallback: 'Name',
  },
);

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const shortName = computed(() => {
  const name = props.student?.name?.trim();
  if (!name) return props.nameFallback;

  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && /^[A-Za-z.]+$/.test(parts[0] ?? '')) {
    return parts[1] ?? name;
  }

  return parts[0] ?? name;
});
</script>

<style scoped lang="scss">
.seat-assignment-tile {
  width: 64px;
  height: 64px;
  border-radius: 7px;
  border: 1px solid var(--primary, #0d47a1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  overflow: hidden;
  position: relative;
  transition:
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

.seat-assignment-tile > * {
  position: relative;
  z-index: 1;
}

.is-assigned {
  background: var(--primary, #0d47a1);
  color: #ffffff;
}

.is-empty {
  background: #ffffff;
  color: #111111;
}

.is-broken {
  background: #6b6b6b;
  border-color: #6b6b6b;
}

.is-swap-mode {
  cursor: pointer;
}

.is-assigned.is-swap-mode::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(6, 28, 70, 0.48);
  z-index: 2;
  pointer-events: none;
}

.is-assigned.is-swap-mode .seat-name,
.is-assigned.is-swap-mode .seat-avatar {
  opacity: 0.58;
}

.is-selected {
  box-shadow:
    0 0 0 2px #ffffff,
    0 0 0 5px var(--primary, #0d47a1);
  transform: translateY(-1px);
}

.is-moving .seat-name,
.is-moving .seat-avatar,
.is-moving .swap-icon {
  opacity: 0;
}

.seat-name {
  max-width: 56px;
  font-size: 11px;
  line-height: 1;
  color: #ffffff;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.seat-avatar {
  background: #0c8fe8;
  flex-shrink: 0;

  img {
    width: 34px;
    height: 34px;
    object-fit: cover;
  }
}

.empty-text {
  font-size: 15px;
  line-height: 1;
}

.broken-icon {
  width: 25px;
  height: 25px;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}

.swap-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ffffff;
  font-size: 30px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
  pointer-events: none;
  z-index: 3;
}

.seat-label {
  width: 64px;
  text-align: center;
  font-size: 12px;
  line-height: 18px;
  color: #111111;
}
</style>
