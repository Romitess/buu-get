<template>
  <section class="seat-map-panel" :class="{ 'is-print-mode': printMode }">
    <header v-if="!hideHeader" class="seat-map-header">
      <h2 class="seat-map-title">{{ title }}</h2>
      <div v-if="!printMode" class="seat-map-controls row items-center no-wrap q-gutter-x-md">
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
          :class="{
            'is-swap-active': swapMode,
            'is-dragging': draggingSeatId !== null,
            'is-preparing-seat-shift': isPreparingSeatShift,
          }"
          :style="gridTransformStyle"
        >
          <div class="seat-grid-wrapper" :style="seatGridStyle">
            <template v-for="(rowSeats, rowIndex) in seatsByRow" :key="rowIndex">
              <template v-for="(seat, colIndex) in rowSeats" :key="seat.id">
                <div
                  :ref="(el) => setSeatCellRef(el, seat.id)"
                  class="seat-cell"
                  :class="{
                    'is-drag-source': draggingSeatId === seat.id,
                    'is-drag-over': draggingSeatId !== null && dragOverSeatId === seat.id,
                  }"
                  :style="getSeatCellGridStyle(rowIndex + 1, colIndex + 1)"
                  @mousedown="onSeatMouseDown($event, seat)"
                  @mouseenter="onSeatMouseEnter(seat)"
                  @mouseleave="onSeatMouseLeave(seat)"
                >
                  <div
                    class="seat-cell-content"
                    :class="{
                      'is-seat-shifting': seat.student && movingStudentIds.has(seat.student.id),
                    }"
                    :style="getSeatCellContentStyle(seat)"
                  >
                    <AppExamSeatAssignmentTile
                      :seat-label="seat.label"
                      :status="draggingSeatId === seat.id ? 'available' : seat.status"
                      :student="draggingSeatId === seat.id ? null : seat.student"
                      :swap-mode="swapMode"
                      :selected="
                        draggingSeatId !== seat.id &&
                        draggingSeatId !== null &&
                        dragOverSeatId === seat.id
                      "
                    />
                  </div>
                </div>
              </template>
            </template>

            <div
              v-for="colNo in columnAislePositions"
              :key="`column-aisle-${colNo}`"
              class="seat-column-aisle"
              :style="getColumnAisleGridStyle(colNo)"
              aria-hidden="true"
            >
              <span>ทางเดิน</span>
            </div>
            <div
              v-for="rowNo in rowAislePositions"
              :key="`row-aisle-${rowNo}`"
              class="seat-row-aisle"
              :style="getRowAisleGridStyle(rowNo)"
              aria-hidden="true"
            >
              <span>ทางเดิน</span>
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
      <div v-if="draggedSeat" ref="dragGhostRef" class="seat-drag-ghost" :style="ghostStyle">
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
import type { SeatCell } from 'src/composables/use-exam-seat-management';

const SHIFT_ANIMATION_MS = 460;

const props = withDefaults(
  defineProps<{
    title: string;
    seatsByRow: SeatCell[][];
    splitLeftRight: boolean;
    aisleAfterCols?: number[];
    aisleAfterRows?: number[];
    printMode?: boolean;
    hideHeader?: boolean;
    swapModeLabel?: string;
    emptyLabel?: string;
  }>(),
  {
    aisleAfterCols: () => [],
    aisleAfterRows: () => [],
    printMode: false,
    hideHeader: false,
    swapModeLabel: 'โหมดสลับที่นั่ง',
    emptyLabel: 'ไม่มีข้อมูลผังที่นั่ง',
  },
);

const emit = defineEmits<{
  (e: 'swap', sourceSeatId: string, targetSeatId: string): void;
}>();

const swapMode = ref(false);

const rowCount = computed(() => props.seatsByRow.length);
const colCount = computed(() =>
  props.seatsByRow.reduce((maxCols, rowSeats) => Math.max(maxCols, rowSeats.length), 0),
);

const normalizedAisleAfterCols = computed(() =>
  [...new Set(props.aisleAfterCols)]
    .filter((colNo) => Number.isInteger(colNo) && colNo >= 1 && colNo < colCount.value)
    .sort((a, b) => a - b),
);

const normalizedAisleAfterRows = computed(() =>
  [...new Set(props.aisleAfterRows)]
    .filter((rowNo) => Number.isInteger(rowNo) && rowNo >= 1 && rowNo < rowCount.value)
    .sort((a, b) => a - b),
);

const columnAislePositions = computed(() => {
  if (normalizedAisleAfterCols.value.length > 0) return normalizedAisleAfterCols.value;

  const fallbackMidpoint = Math.ceil(colCount.value / 2);
  return props.splitLeftRight && fallbackMidpoint < colCount.value ? [fallbackMidpoint] : [];
});

const rowAislePositions = computed(() => normalizedAisleAfterRows.value);

const getGridTrackIndex = (index: number, aisleIndexes: number[]): number =>
  index + aisleIndexes.filter((aisleIndex) => aisleIndex < index).length;

const getAisleTrackIndex = (index: number, aisleIndexes: number[]): number =>
  index + aisleIndexes.filter((aisleIndex) => aisleIndex <= index).length;

const seatGridStyle = computed<CSSProperties>(() => {
  const columnTracks: string[] = [];
  for (let col = 1; col <= colCount.value; col++) {
    columnTracks.push('64px');
    if (columnAislePositions.value.includes(col)) {
      columnTracks.push('18px');
    }
  }

  const rowTracks: string[] = [];
  for (let row = 1; row <= rowCount.value; row++) {
    rowTracks.push('82px');
    if (rowAislePositions.value.includes(row)) {
      rowTracks.push('18px');
    }
  }

  return {
    display: 'grid',
    gridTemplateColumns: columnTracks.join(' '),
    gridTemplateRows: rowTracks.join(' '),
    columnGap: '16px',
    rowGap: '10px',
    paddingBottom: '28px',
  };
});

const getSeatCellGridStyle = (rowNo: number, colNo: number): CSSProperties => ({
  gridColumn: `${getGridTrackIndex(colNo, columnAislePositions.value)}`,
  gridRow: `${getGridTrackIndex(rowNo, rowAislePositions.value)}`,
});

const getColumnAisleLabelTop = (): number => {
  const seatTrackHeight = 82;
  const aisleTrackHeight = 18;
  const rowGap = 10;
  const totalTracks = rowCount.value + rowAislePositions.value.length;
  const totalHeight =
    rowCount.value * seatTrackHeight +
    rowAislePositions.value.length * aisleTrackHeight +
    Math.max(totalTracks - 1, 0) * rowGap;

  const rowAisleBands = rowAislePositions.value
    .map((rowNo) => {
      const aisleTrackIndex = getAisleTrackIndex(rowNo, rowAislePositions.value);
      let top = 0;

      for (let track = 1; track < aisleTrackIndex; track += 1) {
        const isAisleTrack = rowAislePositions.value.some(
          (aisleRowNo) => getAisleTrackIndex(aisleRowNo, rowAislePositions.value) === track,
        );
        top += isAisleTrack ? aisleTrackHeight : seatTrackHeight;
        top += rowGap;
      }

      return {
        start: Math.max(0, top - 6),
        end: Math.min(totalHeight, top + aisleTrackHeight + 6),
      };
    })
    .sort((a, b) => a.start - b.start);

  const clearSegments = rowAisleBands.reduce<Array<{ start: number; end: number }>>(
    (segments, band) => {
      const previous = segments[segments.length - 1];
      if (!previous) return segments;

      if (band.start > previous.start) {
        previous.end = Math.min(previous.end, band.start);
      }

      if (band.end < totalHeight) {
        segments.push({ start: band.end, end: totalHeight });
      }

      return segments;
    },
    [{ start: 0, end: totalHeight }],
  );

  const labelSegment = clearSegments.reduce(
    (largest, segment) =>
      segment.end - segment.start > largest.end - largest.start ? segment : largest,
    clearSegments[0] ?? { start: 0, end: totalHeight },
  );

  return Math.max(
    18,
    Math.min(labelSegment.start + (labelSegment.end - labelSegment.start) / 2, totalHeight - 18),
  );
};

const getColumnAisleGridStyle = (colNo: number): CSSProperties => ({
  gridColumn: `${getAisleTrackIndex(colNo, columnAislePositions.value)}`,
  gridRow: `1 / ${rowCount.value + rowAislePositions.value.length + 1}`,
  '--column-aisle-label-top': `${getColumnAisleLabelTop()}px`,
});

const getRowAisleGridStyle = (rowNo: number): CSSProperties => ({
  gridColumn: `1 / ${colCount.value + columnAislePositions.value.length + 1}`,
  gridRow: `${getAisleTrackIndex(rowNo, rowAislePositions.value)}`,
});

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
const seatShiftTransforms = ref<Map<string, string>>(new Map());
const isPreparingSeatShift = ref(false);
const shouldAnimateNextSeatChange = ref(false);
let shiftAnimationSequence = 0;
let pendingShiftResetTimer: number | null = null;
let pendingShiftOldRects: Map<string, RectSnapshot> | null = null;
let pendingShiftOldStudents: Map<string, StudentSeatSnapshot> | null = null;
let pendingDraggedStudentId: string | null = null;

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

type SeatCellContentStyle = CSSProperties & Record<string, string>;

const getSeatCellContentStyle = (seat: SeatCell): SeatCellContentStyle => {
  if (!seat.student) return {};

  const transform = seatShiftTransforms.value.get(seat.student.id);
  return transform ? { '--seat-card-shift': transform } : {};
};

const addMovingStudentIds = (studentIds: Set<string>): void => {
  movingStudentIds.value = new Set([...movingStudentIds.value, ...studentIds]);
};

const removeMovingStudentIds = (studentIds: Set<string>): void => {
  movingStudentIds.value = new Set(
    [...movingStudentIds.value].filter((studentId) => !studentIds.has(studentId)),
  );
  seatShiftTransforms.value = new Map(
    [...seatShiftTransforms.value].filter(([studentId]) => !studentIds.has(studentId)),
  );
};

const clearPendingShiftResetTimer = (): void => {
  if (pendingShiftResetTimer === null) return;
  window.clearTimeout(pendingShiftResetTimer);
  pendingShiftResetTimer = null;
};

const clearSeatShiftAnimation = (studentIds: Set<string>): void => {
  seatShiftTransforms.value = new Map(
    [...seatShiftTransforms.value].filter(([studentId]) => !studentIds.has(studentId)),
  );
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
  const gridH = gridRef.value.scrollHeight + 56;
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
  // let the map scroll vertically instead of shrinking every label. Up to 2.0 scale.
  scaleFactor.value = Math.min(scaleX, Math.max(scaleY, minimumReadableScale), 2.0);
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
  if (props.printMode) return;
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
  window.removeEventListener('blur', cancelDrag);
  stopViewportPan();
  document.body.classList.remove('is-dragging-active');
});

// Recalculate when seatsByRow or splitLeftRight changes
watch(
  [
    () => props.seatsByRow,
    () => props.splitLeftRight,
    () => props.aisleAfterCols,
    () => props.aisleAfterRows,
  ],
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

    const oldStudents = pendingShiftOldStudents ?? getStudentSeatSnapshots(oldRows);
    const oldRects = pendingShiftOldRects ?? getSeatRects();
    const draggedStudentId = pendingDraggedStudentId;
    pendingShiftOldStudents = null;
    pendingShiftOldRects = null;
    pendingDraggedStudentId = null;

    void nextTick(() => {
      const newStudents = getStudentSeatSnapshots(newRows);
      const newRects = getSeatRects();
      const movedStudentIds = new Set<string>();
      const shiftTransforms = new Map<string, string>();
      const ghosts: SeatShiftGhost[] = [];
      const sequence = ++shiftAnimationSequence;

      newStudents.forEach((newSeat, studentId) => {
        if (studentId === draggedStudentId) return;

        const oldSeat = oldStudents.get(studentId);
        if (!oldSeat || oldSeat.seatId === newSeat.seatId) return;

        const from = oldRects.get(oldSeat.seatId);
        const to = newRects.get(newSeat.seatId);
        if (!from || !to) return;

        movedStudentIds.add(studentId);
        shiftTransforms.set(
          studentId,
          `translate3d(${from.left - to.left}px, ${from.top - to.top}px, 0)`,
        );
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

      isPreparingSeatShift.value = true;
      addMovingStudentIds(movedStudentIds);
      seatShiftTransforms.value = new Map([...seatShiftTransforms.value, ...shiftTransforms]);
      shiftGhosts.value = [];

      window.requestAnimationFrame(() => {
        if (gridRef.value) void gridRef.value.offsetHeight;
        isPreparingSeatShift.value = false;

        window.requestAnimationFrame(() => {
          clearSeatShiftAnimation(movedStudentIds);
        });
      });

      window.setTimeout(() => {
        removeMovingStudentIds(movedStudentIds);
      }, SHIFT_ANIMATION_MS + 80);
    });
  },
  { deep: true, flush: 'pre' },
);

// ── Drag-to-shift ────────────────────────────────────────
const draggingSeatId = ref<string | null>(null);
const dragOverSeatId = ref<string | null>(null);
const dragGhostRef = ref<HTMLElement | null>(null);
const dragOffsetX = ref(32);
const dragOffsetY = ref(32);
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
  left: '0',
  top: '0',
  width: `${dragGhostWidth.value}px`,
  height: `${dragGhostHeight.value}px`,
}));

const updateDragGhostPosition = (clientX: number, clientY: number): void => {
  const ghost = dragGhostRef.value;
  if (!ghost) return;
  ghost.style.transform = `translate3d(${clientX - dragOffsetX.value}px, ${
    clientY - dragOffsetY.value
  }px, 0) scale(1.04)`;
};

const getSeatIdAtPoint = (clientX: number, clientY: number): string | null => {
  const element = document.elementFromPoint(clientX, clientY);
  const seatCell = element?.closest('.seat-cell');
  if (!(seatCell instanceof HTMLElement)) return null;

  for (const [seatId, el] of seatCellRefs) {
    if (el === seatCell) return seatId;
  }
  return null;
};

const updateDragOverFromPoint = (clientX: number, clientY: number): void => {
  const seatId = getSeatIdAtPoint(clientX, clientY);
  if (!seatId) {
    dragOverSeatId.value = null;
    return;
  }

  const seat = props.seatsByRow.flat().find((item) => item.id === seatId);
  dragOverSeatId.value = seat && isUsable(seat) ? seat.id : null;
};

const onDragMove = (e: MouseEvent): void => {
  updateDragGhostPosition(e.clientX, e.clientY);
  updateDragOverFromPoint(e.clientX, e.clientY);
};

const onDragEnd = (e?: MouseEvent): void => {
  if (e) updateDragOverFromPoint(e.clientX, e.clientY);

  const source = draggingSeatId.value;
  const target = dragOverSeatId.value;
  const sourceSeat = props.seatsByRow.flat().find((seat) => seat.id === source);

  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('mouseup', onDragEnd);
  window.removeEventListener('blur', cancelDrag);
  document.body.classList.remove('is-dragging-active');

  draggingSeatId.value = null;
  dragOverSeatId.value = null;

  if (source && target && source !== target) {
    pendingShiftOldStudents = getStudentSeatSnapshots(props.seatsByRow);
    pendingShiftOldRects = getSeatRects();
    pendingDraggedStudentId = sourceSeat?.student?.id ?? null;
    shouldAnimateNextSeatChange.value = true;
    emit('swap', source, target);
  }
};

const cancelDrag = (): void => {
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('mouseup', onDragEnd);
  window.removeEventListener('blur', cancelDrag);
  document.body.classList.remove('is-dragging-active');
  draggingSeatId.value = null;
  dragOverSeatId.value = null;
};

const onSeatMouseDown = (e: MouseEvent, seat: SeatCell): void => {
  if (props.printMode) return;
  // Drag-to-shift only when swap mode is on, left button, from an occupied seat.
  if (!swapMode.value || e.button !== 0) return;
  if (!isUsable(seat) || !seat.student) return;

  e.preventDefault();
  const seatCell = e.currentTarget as HTMLElement | null;
  const seatTileRect = seatCell?.querySelector('.seat-assignment-tile')?.getBoundingClientRect();
  if (seatTileRect) {
    dragGhostWidth.value = seatTileRect.width;
    dragGhostHeight.value = seatTileRect.height;
    dragOffsetX.value = e.clientX - seatTileRect.left;
    dragOffsetY.value = e.clientY - seatTileRect.top;
  }

  draggingSeatId.value = seat.id;
  dragOverSeatId.value = null;
  void nextTick(() => {
    updateDragGhostPosition(e.clientX, e.clientY);
  });

  document.body.classList.add('is-dragging-active');
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragEnd);
  window.addEventListener('blur', cancelDrag);
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

.seat-map-panel.is-print-mode {
  border: 0;
  border-radius: 0;
  padding: 0;
  min-height: 0;
  height: auto;
  overflow: visible;

  .seat-map-header {
    margin-bottom: 14px;
  }

  .seat-map-title {
    font-size: 22px;
  }

  .seat-map-content {
    overflow: visible;
    cursor: default;
    user-select: text;
    scrollbar-gutter: auto;
  }
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
  contain: layout;
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

  &.is-preparing-seat-shift .seat-cell-content {
    :deep(.seat-assignment-tile) {
      transition: none !important;
    }
  }
}

.seat-grid-wrapper {
  display: grid;
  width: max-content;
  margin-inline: auto;
  align-items: start;
  justify-content: start;
}

.seat-column-aisle {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 18px;
  height: 100%;
  border-radius: 9px;
  background: transparent;
  color: #111111;
  font-family: Sarabun, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 100%;
  overflow: visible;
  z-index: 0;
}

.seat-column-aisle::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 9px;
  background: var(--Surface-Selected, #dddddd);
}

.seat-column-aisle span {
  position: absolute;
  top: var(--column-aisle-label-top, 50%);
  left: 50%;
  writing-mode: vertical-rl;
  transform: translate(-50%, -50%) rotate(180deg);
  white-space: nowrap;
  background: transparent;
  border-radius: 0;
  padding: 0;
  max-height: calc(100% - 28px);
  overflow: hidden;
  z-index: 1;
}

.seat-row-aisle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 18px;
  border-radius: 9px;
  position: relative;
  background: transparent;
  color: #111111;
  font-family: Sarabun, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 100%;
  overflow: visible;
  z-index: 3;
}

.seat-row-aisle::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 9px;
  background: var(--Surface-Selected, #dddddd);
}

.seat-row-aisle span {
  position: relative;
  z-index: 4;
  white-space: nowrap;
  background: transparent;
  border-radius: 0;
  padding: 0 10px;
}

.seat-cell {
  width: 64px;
  position: relative;
  z-index: 2;
  transition:
    opacity 0.16s ease,
    transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.seat-cell-content {
  width: 64px;
  min-height: 82px;
  position: relative;
  backface-visibility: hidden;
}

.seat-cell-content.is-seat-shifting {
  position: relative;
  z-index: 5;
  pointer-events: none;

  &::before {
    content: 'ว่าง';
    position: absolute;
    top: 0;
    left: 0;
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--primary, #0d47a1);
    border-radius: 7px;
    background: #ffffff;
    box-sizing: border-box;
    color: var(--primary, #0d47a1);
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    z-index: 0;
  }

  :deep(.seat-assignment-tile) {
    position: relative;
    z-index: 1;
    border: 1px solid var(--primary, #0d47a1);
    background: var(--primary, #0d47a1);
    box-shadow:
      0 12px 22px rgba(8, 15, 30, 0.2),
      0 0 0 1px rgba(13, 71, 161, 0.18);
    opacity: 1;
    backface-visibility: hidden;
    transform: var(--seat-card-shift, translate3d(0, 0, 0));
    transition: transform 0.46s cubic-bezier(0.18, 0.9, 0.22, 1);
    will-change: transform;
  }
}

.seat-cell.is-drag-source {
  pointer-events: none;
}

.seat-cell.is-drag-over {
  transform: translateY(-2px);

  :deep(.seat-assignment-tile) {
    box-shadow:
      0 0 0 2px #ffffff,
      0 0 0 5px var(--primary, #0d47a1),
      0 12px 26px rgba(13, 71, 161, 0.22);
  }
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

.seat-drag-ghost {
  position: fixed;
  z-index: 9999;
  transform-origin: top left;
  pointer-events: none;
  padding: 0;
  box-sizing: border-box;
  opacity: 0.96;
  filter: drop-shadow(0 14px 20px rgba(13, 71, 161, 0.22));
  transition: none;
  will-change: transform;

  :deep(.seat-assignment-tile) {
    border: 1px solid rgba(13, 71, 161, 0.46);
    background: var(--primary, #0d47a1);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.18),
      0 0 0 1px rgba(13, 71, 161, 0.12);
    transition: none;
    opacity: 1 !important;
    visibility: visible !important;
  }

  :deep(.seat-label) {
    display: none;
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
  border: 2px solid rgba(255, 255, 255, 0.24);
  background: #14233d;
  color: #ffffff;
  opacity: 0;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 12px 24px rgba(8, 15, 30, 0.24);
  transition:
    transform 0.46s cubic-bezier(0.18, 0.9, 0.22, 1),
    opacity 0.16s ease,
    box-shadow 0.46s ease;

  &.is-active {
    opacity: 0.98;
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.08),
      0 18px 34px rgba(8, 15, 30, 0.3);
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
