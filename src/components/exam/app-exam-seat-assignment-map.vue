<template>
  <section class="seat-map-panel">
    <header class="seat-map-header">
      <h2 class="seat-map-title">{{ title }}</h2>
      <div class="row items-center no-wrap q-gutter-x-sm">
        <span class="shuffle-label">{{ swapModeLabel }}</span>
        <q-toggle v-model="swapMode" dense color="primary" />
      </div>
    </header>

    <div
      v-if="seatsByRow.length > 0"
      ref="gridEl"
      class="seat-map-grid"
      :class="{ 'is-swap-active': swapMode, 'is-dragging': draggingSeatId !== null }"
      :style="gridStyle"
    >
      <div v-for="(rowSeats, rowIndex) in seatsByRow" :key="rowIndex" class="seat-map-row">
        <template v-for="(seat, colIndex) in rowSeats" :key="seat.id">
          <div
            v-if="
              splitLeftRight && colIndex === Math.ceil(rowSeats.length / 2) && rowSeats.length > 1
            "
            class="aisle-gap"
          ></div>
          <div
            class="seat-cell"
            :class="{
              'is-drag-source': draggingSeatId === seat.id,
              'is-drag-over': draggingSeatId !== null && dragOverSeatId === seat.id,
            }"
            @mousedown="onSeatMouseDown($event, seat)"
            @mouseenter="onSeatMouseEnter(seat)"
            @mouseleave="onSeatMouseLeave(seat)"
          >
            <AppExamSeatAssignmentTile
              :seat-label="seat.label"
              :status="seat.status"
              :student="seat.student"
              :swap-mode="swapMode"
              :selected="
                draggingSeatId === seat.id ||
                (draggingSeatId !== null && dragOverSeatId === seat.id)
              "
            />
          </div>
        </template>
      </div>
    </div>

    <div v-else class="empty-seat-map column items-center justify-center text-grey-6">
      <q-icon name="grid_off" size="42px" />
      <div class="text-body2 q-mt-sm">{{ emptyLabel }}</div>
    </div>

    <!-- Floating ghost that follows the cursor while dragging a seat to swap -->
    <Teleport to="body">
      <div v-if="draggedSeat" class="seat-drag-ghost" :style="ghostStyle">
        <div v-if="ghostName" class="ghost-name">{{ ghostName }}</div>
        <q-avatar size="30px" class="ghost-avatar">
          <img v-if="draggedSeat.student?.avatar" :src="draggedSeat.student.avatar" alt="" />
          <q-icon v-else name="person" size="18px" color="grey-8" />
        </q-avatar>
        <div class="ghost-label">{{ draggedSeat.label }}</div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import AppExamSeatAssignmentTile from 'src/components/exam/app-exam-seat-assignment-tile.vue';
import type { SeatCell } from 'src/composables/use-exam-seat-management';

const props = withDefaults(
  defineProps<{
    title: string;
    seatsByRow: SeatCell[][];
    splitLeftRight: boolean;
    swapModeLabel?: string;
    emptyLabel?: string;
  }>(),
  {
    swapModeLabel: 'โหมดสลับที่นั่ง',
    emptyLabel: 'ไม่มีข้อมูลผังที่นั่ง',
  },
);

const emit = defineEmits<{
  (e: 'swap', sourceSeatId: string, targetSeatId: string): void;
}>();

const swapMode = ref(false);

// ── Zoom-to-fit ──────────────────────────────────────────
// Measure the real grid width/height so a large layout can zoom out to fit.
const gridEl = ref<HTMLElement | null>(null);
const containerWidth = ref(700);
const containerHeight = ref(342);
let resizeObserver: ResizeObserver | null = null;

const measure = (): void => {
  if (!gridEl.value) return;
  containerWidth.value = gridEl.value.clientWidth || containerWidth.value;
  containerHeight.value = gridEl.value.clientHeight || containerHeight.value;
};

const maxColumnCount = computed(() => Math.max(...props.seatsByRow.map((row) => row.length), 1));
const rowCount = computed(() => Math.max(props.seatsByRow.length, 1));

// Approximate footprint of one cell incl. gap (64px seat + label/gaps).
const CELL_FOOTPRINT_X = 71;
const CELL_FOOTPRINT_Y = 90;
const MIN_SCALE = 0.3;

const gridScale = computed(() => {
  const widthScale = containerWidth.value / (maxColumnCount.value * CELL_FOOTPRINT_X);
  const heightScale = containerHeight.value / (rowCount.value * CELL_FOOTPRINT_Y);
  return Math.max(MIN_SCALE, Math.min(1, widthScale, heightScale));
});

const gridStyle = computed(() => ({
  '--seat-grid-scale': String(gridScale.value),
}));

// ── Drag-to-swap ─────────────────────────────────────────
const draggingSeatId = ref<string | null>(null);
const dragOverSeatId = ref<string | null>(null);
const dragX = ref(0);
const dragY = ref(0);

const isUsable = (seat: SeatCell): boolean => seat.status !== 'broken' && seat.status !== 'blocked';

const draggedSeat = computed((): SeatCell | null => {
  if (!draggingSeatId.value) return null;
  for (const row of props.seatsByRow) {
    const found = row.find((seat) => seat.id === draggingSeatId.value);
    if (found) return found;
  }
  return null;
});

const ghostName = computed((): string => draggedSeat.value?.student?.name ?? '');

const ghostStyle = computed(() => ({
  left: `${dragX.value}px`,
  top: `${dragY.value}px`,
}));

const onDragMove = (e: MouseEvent): void => {
  dragX.value = e.clientX;
  dragY.value = e.clientY;
};

const onDragEnd = (): void => {
  const source = draggingSeatId.value;
  const target = dragOverSeatId.value;

  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('mouseup', onDragEnd);
  document.body.classList.remove('is-dragging-active');

  draggingSeatId.value = null;
  dragOverSeatId.value = null;

  if (source && target && source !== target) {
    emit('swap', source, target);
  }
};

const onSeatMouseDown = (e: MouseEvent, seat: SeatCell): void => {
  // Drag-to-swap only when swap mode is on, left button, from an occupied seat.
  if (!swapMode.value || e.button !== 0) return;
  if (!isUsable(seat) || !seat.student) return;

  e.preventDefault();
  draggingSeatId.value = seat.id;
  dragOverSeatId.value = null;
  dragX.value = e.clientX;
  dragY.value = e.clientY;

  document.body.classList.add('is-dragging-active');
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragEnd);
};

const onSeatMouseEnter = (seat: SeatCell): void => {
  if (!draggingSeatId.value) return;
  dragOverSeatId.value = isUsable(seat) ? seat.id : null;
};

const onSeatMouseLeave = (seat: SeatCell): void => {
  if (dragOverSeatId.value === seat.id) dragOverSeatId.value = null;
};

onMounted(() => {
  measure();
  if (typeof ResizeObserver !== 'undefined' && gridEl.value) {
    resizeObserver = new ResizeObserver(() => measure());
    resizeObserver.observe(gridEl.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('mouseup', onDragEnd);
  document.body.classList.remove('is-dragging-active');
});
</script>

<style scoped lang="scss">
.seat-map-panel {
  border: 1px solid #9e9e9e;
  border-radius: 10px;
  background: #ffffff;
  padding: 14px 18px 12px;
  min-height: 424px;
  overflow: hidden;
}

.seat-map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.seat-map-title {
  margin: 0;
  color: #111111;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
}

.shuffle-label {
  font-size: 14px;
  color: #111111;
  white-space: nowrap;
}

.seat-map-grid {
  width: 100%;
  height: 420px;
  display: flex;
  flex-direction: column;
  gap: calc(8px * var(--seat-grid-scale));
  overflow: hidden;
  align-items: center;
  justify-content: center;

  &.is-swap-active .seat-cell {
    cursor: grab;
  }

  &.is-dragging .seat-cell {
    cursor: grabbing;
  }
}

.seat-map-row {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: calc(7px * var(--seat-grid-scale));
  min-width: 0;
  height: calc(82px * var(--seat-grid-scale));
}

.seat-cell {
  // Shrink the layout box together with the visual scale so a wide grid always
  // fits inside its panel and never bleeds over the student list on the left.
  width: calc(64px * var(--seat-grid-scale));
  flex: 0 0 calc(64px * var(--seat-grid-scale));
  transform: scale(var(--seat-grid-scale));
  transform-origin: top left;
  transition: opacity 0.12s ease;
}

.seat-cell.is-drag-source {
  opacity: 0.4;
}

.aisle-gap {
  width: 14px;
  flex: 0 0 14px;
}

.empty-seat-map {
  min-height: 320px;
}

.seat-drag-ghost {
  position: fixed;
  z-index: 9999;
  transform: translate(12px, 12px);
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 8px;
  background: var(--primary, #0d47a1);
  color: #ffffff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.ghost-name {
  max-width: 120px;
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ghost-avatar {
  background: #0c8fe8;
}

.ghost-label {
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

@media (max-width: 1200px) {
  .seat-map-panel {
    padding: 14px;
  }

  .seat-map-row {
    gap: calc(5px * var(--seat-grid-scale));
  }
}
</style>
