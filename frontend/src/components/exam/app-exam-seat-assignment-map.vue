<template>
  <section class="seat-map-panel">
    <header class="seat-map-header">
      <h2 class="seat-map-title">{{ title }}</h2>
      <div class="seat-map-controls row items-center no-wrap q-gutter-x-md">
        <div class="row items-center no-wrap q-gutter-x-sm">
          <span class="shuffle-label">{{ swapModeLabel }}</span>
          <q-toggle v-model="swapMode" dense color="primary" class="shuffle-toggle" />
        </div>
        <q-select
          v-model="zoomPercent"
          :options="zoomOptions"
          emit-value
          map-options
          dense
          outlined
          options-dense
          class="zoom-select"
          aria-label="ระดับการซูมผังที่นั่ง"
        >
          <template #prepend>
            <q-icon name="zoom_in" size="19px" color="grey-8" />
          </template>
        </q-select>
      </div>
    </header>
    <!-- Keep seats readable, fit the width, and scroll vertically for large rooms. -->
    <div
      ref="containerRef"
      class="seat-map-content"
      :class="{ 'is-panning': isPanning }"
      @mousedown="onViewportMouseDown"
    >
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
                  :ref="(el) => setSeatCellRef(el, seat.id)"
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
                    :moving="seat.student ? movingStudentIds.has(seat.student.id) : false"
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
        <AppExamSeatAssignmentTile
          :seat-label="draggedSeat.label"
          :status="draggedSeat.status"
          :student="draggedSeat.student"
        />
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-for="ghost in shiftGhosts"
        :key="ghost.key"
        class="seat-shift-ghost"
        :class="{ 'is-active': ghost.active }"
        :style="getShiftGhostStyle(ghost)"
      >
        <div class="shift-ghost-name">{{ ghost.name }}</div>
        <q-avatar size="34px" class="shift-ghost-avatar">
          <img v-if="ghost.avatar" :src="ghost.avatar" alt="" />
          <q-icon v-else name="person" size="21px" color="grey-8" />
        </q-avatar>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import type { ComponentPublicInstance, CSSProperties } from 'vue';
import AppExamSeatAssignmentTile from 'src/components/exam/app-exam-seat-assignment-tile.vue';
import AppSeatSplitDivider from 'src/components/exam/app-seat-split-divider.vue';
import type { SeatCell } from 'src/composables/use-exam-seat-management';

const SHIFT_ANIMATION_MS = 360;

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

interface RectSnapshot {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface StudentSeatSnapshot {
  seatId: string;
  studentId: string;
  name: string;
  avatar: string | null;
}

interface SeatShiftGhost {
  key: string;
  studentId: string;
  name: string;
  avatar: string | null;
  from: RectSnapshot;
  to: RectSnapshot;
  active: boolean;
}

const seatCellRefs = new Map<string, HTMLElement>();
const shiftGhosts = ref<SeatShiftGhost[]>([]);
const movingStudentIds = ref<Set<string>>(new Set());
const shouldAnimateNextSeatChange = ref(false);
let shiftAnimationSequence = 0;
let pendingShiftResetTimer: number | null = null;

const setSeatCellRef = (el: Element | ComponentPublicInstance | null, seatId: string): void => {
  if (el instanceof HTMLElement) {
    seatCellRefs.set(seatId, el);
  } else {
    seatCellRefs.delete(seatId);
  }
};

const getSeatRects = (): Map<string, RectSnapshot> => {
  const rects = new Map<string, RectSnapshot>();
  seatCellRefs.forEach((el, seatId) => {
    const rect = el.getBoundingClientRect();
    rects.set(seatId, {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
  });
  return rects;
};

const getStudentSeatSnapshots = (
  rows: SeatCell[][] | undefined,
): Map<string, StudentSeatSnapshot> => {
  const snapshots = new Map<string, StudentSeatSnapshot>();
  rows?.forEach((row) => {
    row.forEach((seat) => {
      if (!seat.student) return;
      snapshots.set(seat.student.id, {
        seatId: seat.id,
        studentId: seat.student.id,
        name: seat.student.name,
        avatar: seat.student.avatar,
      });
    });
  });
  return snapshots;
};

const getShiftGhostStyle = (ghost: SeatShiftGhost): CSSProperties => ({
  left: `${ghost.from.left}px`,
  top: `${ghost.from.top}px`,
  width: `${ghost.from.width}px`,
  height: `${ghost.from.height}px`,
  transform: ghost.active
    ? `translate(${ghost.to.left - ghost.from.left}px, ${ghost.to.top - ghost.from.top}px)`
    : 'translate(0, 0)',
});

const addMovingStudentIds = (studentIds: Set<string>): void => {
  movingStudentIds.value = new Set([...movingStudentIds.value, ...studentIds]);
};

const removeMovingStudentIds = (studentIds: Set<string>): void => {
  movingStudentIds.value = new Set(
    [...movingStudentIds.value].filter((studentId) => !studentIds.has(studentId)),
  );
};

const clearPendingShiftResetTimer = (): void => {
  if (pendingShiftResetTimer === null) return;
  window.clearTimeout(pendingShiftResetTimer);
  pendingShiftResetTimer = null;
};

// ── Zoom-to-fit ──────────────────────────────────────────
const containerRef = ref<HTMLElement | null>(null);
const gridRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);
const containerHeight = ref(0);
const scaleFactor = ref(1);
const gridNaturalWidth = ref(0);
const gridNaturalHeight = ref(0);
const zoomPercent = ref(100);
const isPanning = ref(false);

const zoomOptions = [
  { label: '50%', value: 50 },
  { label: '75%', value: 75 },
  { label: '100%', value: 100 },
  { label: '125%', value: 125 },
  { label: '150%', value: 150 },
];

const effectiveScale = computed(() => scaleFactor.value * (zoomPercent.value / 100));

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
  const availH = containerHeight.value ? containerHeight.value - 8 : gridH;

  if (gridW <= 0 || gridH <= 0) {
    scaleFactor.value = 1;
    return;
  }

  const scaleX = availW / gridW;
  const scaleY = availH / gridH;
  const minimumReadableScale = 1;

  // Always fit the width. For tall rooms, preserve a readable seat size and
  // let the map scroll vertically instead of shrinking every label.
  scaleFactor.value = Math.min(scaleX, Math.max(scaleY, minimumReadableScale), 1);
};

const wrapperStyle = computed<CSSProperties>(() => {
  const s = effectiveScale.value;
  const w = gridNaturalWidth.value;
  const h = gridNaturalHeight.value;

  if (w <= 0 || h <= 0) {
    return {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    };
  }

  return {
    width: `${Math.max(w * s, containerWidth.value - 16)}px`,
    height: `${h * s}px`,
    position: 'relative',
    overflow: 'visible',
  };
});

const gridTransformStyle = computed<CSSProperties>(() => {
  const s = effectiveScale.value;
  const w = gridNaturalWidth.value;
  const h = gridNaturalHeight.value;

  if (w <= 0 || h <= 0) {
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

const stopViewportPan = (): void => {
  isPanning.value = false;
  window.removeEventListener('mousemove', onViewportMouseMove);
  window.removeEventListener('mouseup', stopViewportPan);
};

const onViewportMouseMove = (event: MouseEvent): void => {
  if (!isPanning.value || !containerRef.value) return;
  containerRef.value.scrollLeft -= event.movementX;
  containerRef.value.scrollTop -= event.movementY;
};

const onViewportMouseDown = (event: MouseEvent): void => {
  if (event.button !== 0 || draggingSeatId.value !== null) return;

  const target = event.target as HTMLElement | null;
  if (target?.closest('.q-field, .q-toggle')) return;
  if (swapMode.value && target?.closest('.seat-cell')) return;
  if (!containerRef.value) return;

  event.preventDefault();
  isPanning.value = true;
  window.addEventListener('mousemove', onViewportMouseMove);
  window.addEventListener('mouseup', stopViewportPan);
};

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
  clearPendingShiftResetTimer();
  resizeObserver?.disconnect();
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('mouseup', onDragEnd);
  stopViewportPan();
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

watch(
  () => props.seatsByRow,
  (newRows, oldRows) => {
    if (!shouldAnimateNextSeatChange.value) return;

    shouldAnimateNextSeatChange.value = false;
    clearPendingShiftResetTimer();

    const oldStudents = getStudentSeatSnapshots(oldRows);
    const oldRects = getSeatRects();

    void nextTick(() => {
      const newStudents = getStudentSeatSnapshots(newRows);
      const newRects = getSeatRects();
      const movedStudentIds = new Set<string>();
      const ghosts: SeatShiftGhost[] = [];
      const sequence = ++shiftAnimationSequence;

      newStudents.forEach((newSeat, studentId) => {
        const oldSeat = oldStudents.get(studentId);
        if (!oldSeat || oldSeat.seatId === newSeat.seatId) return;

        const from = oldRects.get(oldSeat.seatId);
        const to = newRects.get(newSeat.seatId);
        if (!from || !to) return;

        movedStudentIds.add(studentId);
        ghosts.push({
          key: `${sequence}-${studentId}`,
          studentId,
          name: newSeat.name,
          avatar: newSeat.avatar,
          from,
          to,
          active: false,
        });
      });

      if (ghosts.length === 0) return;

      addMovingStudentIds(movedStudentIds);
      shiftGhosts.value = [...shiftGhosts.value, ...ghosts];

      window.requestAnimationFrame(() => {
        shiftGhosts.value = shiftGhosts.value.map((ghost) =>
          ghosts.some((item) => item.key === ghost.key) ? { ...ghost, active: true } : ghost,
        );
      });

      window.setTimeout(() => {
        const ghostKeys = new Set(ghosts.map((ghost) => ghost.key));
        shiftGhosts.value = shiftGhosts.value.filter((ghost) => !ghostKeys.has(ghost.key));
        removeMovingStudentIds(movedStudentIds);
      }, SHIFT_ANIMATION_MS + 80);
    });
  },
  { deep: true, flush: 'pre' },
);

// ── Drag-to-shift ────────────────────────────────────────
const draggingSeatId = ref<string | null>(null);
const dragOverSeatId = ref<string | null>(null);
const dragX = ref(0);
const dragY = ref(0);
const dragGhostWidth = ref(64);
const dragGhostHeight = ref(64);

const isUsable = (seat: SeatCell): boolean => seat.status !== 'broken' && seat.status !== 'blocked';

const draggedSeat = computed((): SeatCell | null => {
  if (!draggingSeatId.value) return null;
  for (const row of props.seatsByRow) {
    const found = row.find((seat) => seat.id === draggingSeatId.value);
    if (found) return found;
  }
  return null;
});

const ghostStyle = computed(() => ({
  left: `${dragX.value}px`,
  top: `${dragY.value}px`,
  width: `${dragGhostWidth.value}px`,
  height: `${dragGhostHeight.value}px`,
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
  // Drag-to-shift only when swap mode is on, left button, from an occupied seat.
  if (!swapMode.value || e.button !== 0) return;
  if (!isUsable(seat) || !seat.student) return;

  e.preventDefault();
  const seatCellRect = (e.currentTarget as HTMLElement | null)?.getBoundingClientRect();
  if (seatCellRect) {
    dragGhostWidth.value = seatCellRect.width;
    dragGhostHeight.value = seatCellRect.height;
  }

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
  padding: 12px 14px 10px;
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
  margin-bottom: 6px;
  flex-shrink: 0;
}

.seat-map-title {
  margin: 0;
  color: #111111;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
}

.seat-map-controls {
  flex-shrink: 0;
}

.zoom-select {
  width: 116px;

  :deep(.q-field__control) {
    height: 36px;
    min-height: 36px;
    border-radius: 8px;
  }

  :deep(.q-field__prepend) {
    padding-right: 6px;
  }

  :deep(.q-field__native) {
    min-width: 44px;
    overflow: visible;
    text-overflow: clip;
    white-space: nowrap;
  }

  :deep(.q-field__native),
  :deep(.q-field__marginal) {
    min-height: 36px;
  }
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
  overflow-x: auto;
  overflow-y: auto;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
  flex: 1;
  min-height: 0;
  cursor: grab;
  user-select: none;
  contain: layout paint;
  will-change: scroll-position;

  &.is-panning {
    cursor: grabbing;

    .seat-grid-scalable {
      transition: none;
    }
  }
}

.seat-map-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.seat-map-content::-webkit-scrollbar-track {
  background: transparent;
}

.seat-map-content::-webkit-scrollbar-thumb {
  background: var(--neutral-400);
  border-radius: var(--radius-pill);
}

.seat-map-content::-webkit-scrollbar-thumb:hover {
  background: var(--neutral-500);
}

.seat-grid-scaling-wrapper {
  position: relative;
  overflow: visible;
}

.seat-grid-scalable {
  display: block;
  width: max-content;
  flex-shrink: 0;
  transition: none;

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
  gap: 10px;
  width: 100%;
  margin-inline: auto;
  align-items: stretch;
}

.seat-map-row {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 16px;
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
  padding: 0;
  box-sizing: border-box;
  opacity: 0.82;
  filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.28));

  :deep(.seat-assignment-tile) {
    transition: none;
  }
}

.seat-shift-ghost {
  position: fixed;
  z-index: 9998;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 7px;
  border: 1px solid var(--primary, #0d47a1);
  background: var(--primary, #0d47a1);
  color: #ffffff;
  opacity: 0.96;
  box-shadow: 0 10px 24px rgba(13, 71, 161, 0.26);
  transition:
    transform 0.36s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.36s ease;

  &.is-active {
    box-shadow: 0 16px 32px rgba(13, 71, 161, 0.34);
  }
}

.shift-ghost-name {
  max-width: 56px;
  font-size: 11px;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shift-ghost-avatar {
  background: #0c8fe8;

  img {
    width: 34px;
    height: 34px;
    object-fit: cover;
  }
}

@media (max-width: 1200px) {
  .seat-map-panel {
    padding: 14px;
  }

  .seat-map-row {
    gap: 8px;
  }
}

@media (max-width: $breakpoint-sm-max) {
  .seat-map-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .seat-map-controls {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
