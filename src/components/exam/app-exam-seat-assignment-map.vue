<template>
  <section class="seat-map-panel">
    <header class="seat-map-header">
      <h2 class="seat-map-title">{{ title }}</h2>
      <div class="row items-center no-wrap q-gutter-x-sm">
        <span class="shuffle-label">{{ swapModeLabel }}</span>
        <q-toggle v-model="swapMode" dense color="primary" class="shuffle-toggle" />
      </div>
    </header>

    <!-- Seat Map Container (zoom-to-fit, no scrollbar) -->
    <div ref="containerRef" class="seat-map-content">
      <div v-if="seatsByRow.length > 0" class="seat-grid-scaling-wrapper" :style="wrapperStyle">
        <div
          ref="gridRef"
          class="seat-grid-scalable"
          :class="{ 'is-swap-active': swapMode, 'is-dragging': draggingSeatId !== null }"
          :style="gridTransformStyle"
        >
          <div class="seat-grid-wrapper">
            <div v-for="(rowSeats, rowIndex) in seatsByRow" :key="rowIndex" class="seat-map-row">
              <template v-for="(seat, colIndex) in rowSeats" :key="seat.id">
                <AppSeatSplitDivider
                  v-if="
                    splitLeftRight &&
                    colIndex === Math.ceil(rowSeats.length / 2) &&
                    rowSeats.length > 1
                  "
                  width="48px"
                />
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
        </div>
      </div>

      <div v-else class="empty-seat-map column items-center justify-center text-grey-6">
        <q-icon name="grid_off" size="42px" />
        <div class="text-body2 q-mt-sm">{{ emptyLabel }}</div>
      </div>
    </div>

    <!-- Dimmed ghost centered on the cursor so it feels like the seat is moving -->
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
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import type { CSSProperties } from 'vue';
import AppExamSeatAssignmentTile from 'src/components/exam/app-exam-seat-assignment-tile.vue';
import AppSeatSplitDivider from 'src/components/exam/app-seat-split-divider.vue';
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
const containerRef = ref<HTMLElement | null>(null);
const gridRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);
const containerHeight = ref(0);
const scaleFactor = ref(1);
const gridNaturalWidth = ref(0);
const gridNaturalHeight = ref(0);

const measureAndScale = (): void => {
  if (!gridRef.value || !containerRef.value) {
    scaleFactor.value = 1;
    return;
  }

  // Temporarily reset styles to measure natural size
  const style = gridRef.value.style;
  const prevTransform = style.transform;
  const prevPosition = style.position;
  const prevWidth = style.width;
  const prevHeight = style.height;

  style.transform = 'none';
  style.position = 'static';
  style.width = 'max-content';
  style.height = 'auto';

  void gridRef.value.offsetWidth; // force reflow

  const gridW = gridRef.value.scrollWidth;
  const gridH = gridRef.value.scrollHeight + 16;
  gridNaturalWidth.value = gridW;
  gridNaturalHeight.value = gridH;

  // Restore style
  style.transform = prevTransform;
  style.position = prevPosition;
  style.width = prevWidth;
  style.height = prevHeight;

  const parentEl = containerRef.value;
  const availW = parentEl.clientWidth - 16; // small padding margin
  const availH = parentEl.clientHeight ? parentEl.clientHeight - 8 : 99999;

  if (gridW <= 0 || gridH <= 0) {
    scaleFactor.value = 1;
    return;
  }

  const scaleX = availW / gridW;
  const scaleY = availH / gridH;
  const s = Math.min(scaleX, scaleY, 1.4); // allow zooming in up to 1.4x to fill empty space
  scaleFactor.value = Math.max(0.15, s);
};

const wrapperStyle = computed<CSSProperties>(() => {
  const s = scaleFactor.value;
  const w = gridNaturalWidth.value;
  const h = gridNaturalHeight.value;

  if (s === 1 || w <= 0 || h <= 0) {
    return {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    };
  }

  return {
    width: `${containerWidth.value - 16}px`, // Always take full available width of container
    height: `${h * s}px`,
    position: 'relative',
    overflow: 'visible',
  };
});

const gridTransformStyle = computed<CSSProperties>(() => {
  const s = scaleFactor.value;
  const w = gridNaturalWidth.value;
  const h = gridNaturalHeight.value;

  if (s === 1 || w <= 0 || h <= 0) {
    return {
      transform: 'none',
      width: 'max-content',
    };
  }

  const leftOffset = Math.max((containerWidth.value - 16 - w * s) / 2, 0);

  return {
    transform: `scale(${s})`,
    transformOrigin: 'top left',
    position: 'absolute',
    left: `${leftOffset}px`,
    top: '0',
    width: `${w}px`,
    height: `${h}px`,
  };
});

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      containerWidth.value = containerRef.value?.clientWidth ?? 0;
      containerHeight.value = containerRef.value?.clientHeight ?? 0;
      measureAndScale();
    });
    resizeObserver.observe(containerRef.value);
  }
  void nextTick(() => measureAndScale());
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('mouseup', onDragEnd);
  document.body.classList.remove('is-dragging-active');
});

// Recalculate when seatsByRow or splitLeftRight changes
watch(
  [() => props.seatsByRow, () => props.splitLeftRight],
  () => {
    void nextTick(() => measureAndScale());
  },
  { deep: true },
);

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
</script>

<style scoped lang="scss">
.seat-map-panel {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background: #ffffff;
  padding: 14px 18px 12px;
  height: 100%;
  min-height: 424px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.seat-map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.seat-map-title {
  margin: 0;
  color: #111111;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
}

.shuffle-label {
  font-size: 15px;
  color: #111111;
  white-space: nowrap;
}

.shuffle-toggle {
  :deep(.q-toggle__inner) {
    width: 52px;
    min-width: 52px;
    height: 30px;
    padding: 0;
  }

  :deep(.q-toggle__track) {
    width: 52px;
    height: 30px;
    border-radius: 999px;
    opacity: 1;
    background: #d5dbe4;
  }

  :deep(.q-toggle__inner--truthy .q-toggle__track) {
    background: var(--primary, #0d47a1);
  }

  :deep(.q-toggle__thumb) {
    top: 4px;
    left: 4px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    color: #ffffff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  }

  :deep(.q-toggle__inner--truthy .q-toggle__thumb) {
    left: 26px;
  }
}

.seat-map-content {
  background: transparent;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: var(--space-xs);
  padding-bottom: var(--space-xs);
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.seat-grid-scaling-wrapper {
  position: relative;
  overflow: visible;
}

.seat-grid-scalable {
  display: block;
  width: max-content;
  flex-shrink: 0;
  transition: transform 0.25s ease;

  &.is-swap-active .seat-cell {
    cursor: grab;
  }

  &.is-dragging .seat-cell {
    cursor: grabbing;
  }
}

.seat-grid-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  margin-inline: auto;
  align-items: stretch;
}

.seat-map-row {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 24px;
  min-width: 0;
}

.seat-cell {
  width: 64px;
  flex: 0 0 64px;
  transition: opacity 0.12s ease;
}

.seat-cell.is-drag-source {
  opacity: 0.4;
}

.empty-seat-map {
  width: 100%;
  height: 100%;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

// Dimmed ghost centered on the cursor while dragging a seat
.seat-drag-ghost {
  position: fixed;
  z-index: 9999;
  transform: translate(-50%, -50%);
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 8px;
  background: var(--primary, #0d47a1);
  color: #ffffff;
  opacity: 0.65;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
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
    gap: 8px;
  }
}
</style>
