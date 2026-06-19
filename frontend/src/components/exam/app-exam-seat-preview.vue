<template>
  <div class="exam-seat-preview">
    <!-- Legend -->
    <div class="q-mb-xs">
      <AppSeatLegend :items="legendItems" />
    </div>

    <!-- Divider -->
    <div class="teacher-desk-divider q-mb-sm">
      <div class="teacher-line"></div>
      <div class="q-px-md rounded-borders teacher-desk-label">
        Teacher's Desk & Projector Screen
      </div>
      <div class="teacher-line"></div>
    </div>

    <!-- Seat Preview Container (zoom-to-fit, no scrollbar) -->
    <div
      ref="containerRef"
      class="seat-preview-content"
      :class="{ 'seat-preview-content--scroll': shouldUseLargeGridScroll }"
    >
      <div v-if="totalSeats > 0" class="seat-grid-scaling-wrapper" :style="wrapperStyle">
        <div ref="gridRef" class="seat-grid-scalable" :style="gridTransformStyle">
          <div class="seat-grid-wrapper" :style="seatGridStyle">
            <template v-if="props.showSeatGuides && colCount > 0">
              <div
                class="seat-row-guide-spacer"
                :style="{ gridColumn: '1', gridRow: '1', width: seatStyle.rowGuideWidth }"
              ></div>
              <template v-for="colIndex in colCount" :key="`col-guide-${colIndex}`">
                <button
                  class="seat-column-guide"
                  type="button"
                  :style="{
                    gridColumn: getSeatGridColumn(colIndex),
                    gridRow: '1',
                    width: seatStyle.width,
                    height: seatStyle.guideHeight,
                    fontSize: seatStyle.guideFontSize,
                  }"
                  @click="openColumnStatusDialog(colIndex)"
                >
                  {{ columnGuideLabels[colIndex - 1] }}
                  <q-tooltip
                    anchor="top middle"
                    self="bottom middle"
                    class="seat-tooltip text-body2"
                  >
                    คลิกเพื่อตั้งค่าสถานะที่นั่งทั้งแถว
                  </q-tooltip>
                </button>
              </template>
            </template>

            <template v-for="(rowSeats, rowIndex) in seatsByRow" :key="`row-${rowIndex}`">
              <button
                v-if="props.showSeatGuides"
                class="seat-row-guide"
                type="button"
                :style="{
                  gridColumn: '1',
                  gridRow: getSeatGridRow(rowIndex + 1),
                  width: seatStyle.rowGuideWidth,
                  height: seatStyle.height,
                  fontSize: seatStyle.guideFontSize,
                }"
                @click="openRowStatusDialog(rowIndex)"
              >
                {{ rowGuideLabels[rowIndex] }}
                <q-tooltip anchor="top middle" self="bottom middle" class="seat-tooltip text-body2">
                  คลิกเพื่อตั้งค่าสถานะที่นั่งทั้งแถว
                </q-tooltip>
              </button>

              <template v-for="(seat, colIndex) in rowSeats" :key="seat.id">
                <div
                  class="seat-item"
                  :style="{
                    gridColumn: getSeatGridColumn(colIndex + 1),
                    gridRow: getSeatGridRow(rowIndex + 1),
                    width: seatStyle.width,
                    height: seatStyle.height,
                    fontSize: seatStyle.fontSize,
                  }"
                >
                  <AppExamSeatSquare
                    :seat-number="seat.id"
                    :status="getSeatStatus(seat.id)"
                    @click="handleSeatClick"
                  >
                    <q-tooltip
                      anchor="top middle"
                      self="bottom middle"
                      class="seat-tooltip text-body2"
                    >
                      คลิกเพื่อตั้งค่าสถานะที่นั่ง
                    </q-tooltip>
                  </AppExamSeatSquare>
                </div>
              </template>
            </template>

            <div
              v-for="position in columnWalkwayPositions"
              :key="`column-walkway-${position.index}`"
              class="seat-column-walkway"
              :style="getColumnWalkwayStyle(position.index)"
            >
              <span>ทางเดิน</span>
            </div>

            <div
              v-for="position in rowWalkwayPositions"
              :key="`row-walkway-${position.index}`"
              class="seat-row-walkway"
              :style="getRowWalkwayStyle(position.index)"
            >
              <span>ทางเดิน</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-preview"></div>
    </div>

    <div v-if="props.showFooterHint" class="seat-preview-footer">
      <q-icon name="info_outline" size="18px" color="dark" />
      <span>
        {{ t('admin.locationManagement.createPage.previewHint') }}
      </span>
    </div>

    <AppSeatStatusDialog
      v-model="isSeatStatusDialogOpen"
      :target-label="statusDialogTarget"
      :current-status="statusDialogCurrentStatus"
      @select="applySeatStatus"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import type { CSSProperties } from 'vue';
import { useI18n } from 'vue-i18n';
import AppSeatLegend from './app-seat-legend.vue';
import AppExamSeatSquare from './app-exam-seat-square.vue';
import AppSeatStatusDialog from './app-seat-status-dialog.vue';

type SeatStatusOption = 'available' | 'omitted' | 'broken';
type SeatStatusTarget =
  | { type: 'row' | 'column'; index: number }
  | { type: 'seat'; seatId: string }
  | null;

interface WalkwayPosition {
  type: 'row' | 'column';
  index: number;
}

interface Props {
  rows?: number | null;
  cols?: number | null;
  placeholderText?: string;
  splitLeftRight?: boolean;
  walkwayPositions?: WalkwayPosition[];
  numberingDirection?: 'horizontal' | 'vertical';
  omittedSeats?: Set<string>;
  showSeatGuides?: boolean;
  showFooterHint?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 0,
  cols: 0,
  placeholderText: 'จำนวนที่นั่งทั้งหมด',
  splitLeftRight: false,
  walkwayPositions: () => [],
  numberingDirection: 'vertical',
  omittedSeats: () => new Set<string>(),
  showSeatGuides: false,
  showFooterHint: false,
});

const MAX_SEATS = Infinity;
const { t } = useI18n();

const containerRef = ref<HTMLElement | null>(null);
const gridRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);
const containerHeight = ref(0);

const rowCount = computed(() => props.rows ?? 0);
const colCount = computed(() => props.cols ?? 0);

const legendItems = [
  { label: 'ที่นั่งว่าง', dotClass: 'available' },
  { label: 'ละเว้นที่นั่ง', dotClass: 'omitted' },
  { label: 'ที่นั่งชำรุด', dotClass: 'broken' },
];

const totalSeats = computed(() => {
  const total = rowCount.value * colCount.value;
  return Math.min(total, MAX_SEATS);
});

const isSeatStatusDialogOpen = ref(false);
const statusDialogTarget = ref('');
const statusDialogTargetMeta = ref<SeatStatusTarget>(null);
const statusDialogCurrentStatus = ref<SeatStatusOption>('available');
const localOmittedSeats = ref<Set<string>>(new Set());
const brokenSeats = ref<Set<string>>(new Set());

const handleSeatClick = (seatId: string): void => {
  statusDialogTarget.value = `ที่นั่ง ${seatId}`;
  statusDialogTargetMeta.value = { type: 'seat', seatId };
  statusDialogCurrentStatus.value = getSeatStatusOption(seatId);
  isSeatStatusDialogOpen.value = true;
};

const openColumnStatusDialog = (colIndex: number): void => {
  statusDialogTarget.value = `คอลัมน์ ${colIndex}`;
  statusDialogTargetMeta.value = { type: 'column', index: colIndex - 1 };
  statusDialogCurrentStatus.value = getTargetStatus();
  isSeatStatusDialogOpen.value = true;
};

const openRowStatusDialog = (rowIndex: number): void => {
  statusDialogTarget.value = `แถว ${rowIndex + 1}`;
  statusDialogTargetMeta.value = { type: 'row', index: rowIndex };
  statusDialogCurrentStatus.value = getTargetStatus();
  isSeatStatusDialogOpen.value = true;
};

const getTargetSeatIds = (): string[] => {
  const target = statusDialogTargetMeta.value;

  if (!target) return [];

  if (target.type === 'seat') {
    return [target.seatId];
  }

  if (target.type === 'row') {
    return seatsByRow.value[target.index]?.map((seat) => seat.id) ?? [];
  }

  return seatsByRow.value
    .map((rowSeats) => rowSeats[target.index]?.id)
    .filter((seatId): seatId is string => typeof seatId === 'string');
};

const applySeatStatus = (status: SeatStatusOption): void => {
  const targetSeatIds = getTargetSeatIds();
  const nextOmittedSeats = new Set(localOmittedSeats.value);
  const nextBrokenSeats = new Set(brokenSeats.value);

  targetSeatIds.forEach((seatId) => {
    nextOmittedSeats.delete(seatId);
    nextBrokenSeats.delete(seatId);

    if (status === 'omitted') {
      nextOmittedSeats.add(seatId);
    }

    if (status === 'broken') {
      nextBrokenSeats.add(seatId);
    }
  });

  localOmittedSeats.value = nextOmittedSeats;
  brokenSeats.value = nextBrokenSeats;
  statusDialogCurrentStatus.value = status;
};

const getSeatStatusOption = (seatId: string): SeatStatusOption => {
  if (localOmittedSeats.value.has(seatId)) return 'omitted';
  if (brokenSeats.value.has(seatId)) return 'broken';

  return 'available';
};

const getTargetStatus = (): SeatStatusOption => {
  const targetSeatIds = getTargetSeatIds();
  const firstSeatId = targetSeatIds[0];

  if (!firstSeatId) return 'available';

  const firstStatus = getSeatStatusOption(firstSeatId);
  const isSameStatus = targetSeatIds.every((seatId) => getSeatStatusOption(seatId) === firstStatus);

  return isSameStatus ? firstStatus : 'available';
};

const setSeatStatusSets = (statuses: {
  brokenSeats?: Iterable<string>;
  omittedSeats?: Iterable<string>;
}): void => {
  brokenSeats.value = new Set(statuses.brokenSeats ?? []);
  localOmittedSeats.value = new Set(statuses.omittedSeats ?? []);
};

const getSeatStatuses = (): Record<string, number> => {
  const statusMap: Record<string, number> = {};

  seatsByRow.value.forEach((rowSeats, rowIndex) => {
    rowSeats.forEach((seat, colIndex) => {
      const status = getSeatStatusOption(seat.id);
      const statusCode = status === 'broken' ? 1 : status === 'omitted' ? 2 : 0;
      statusMap[seat.id] = statusCode;
      statusMap[`${rowIndex + 1}-${colIndex + 1}`] = statusCode;
    });
  });

  return statusMap;
};

defineExpose({
  brokenSeats,
  omittedSeats: localOmittedSeats,
  setSeatStatusSets,
  getSeatStatuses,
});

const getSeatStatus = (seatId: string): 'available' | 'assigned' | 'broken' | 'blocked' => {
  if (localOmittedSeats.value.has(seatId)) return 'blocked';
  if (brokenSeats.value.has(seatId)) return 'broken';

  return 'available';
};

const getSeatIdByPosition = (
  rowIndex: number,
  colIndex: number,
  direction: 'horizontal' | 'vertical',
): string => {
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const horizontalSeatId = `${rowLetters[rowIndex] ?? rowIndex + 1}${colIndex + 1}`;
  const verticalSeatId = `${rowLetters[colIndex] ?? colIndex + 1}${rowIndex + 1}`;

  return direction === 'horizontal' ? horizontalSeatId : verticalSeatId;
};

const remapSeatStatusSetByDirection = (
  source: Set<string>,
  oldDirection: 'horizontal' | 'vertical',
  nextDirection: 'horizontal' | 'vertical',
): Set<string> => {
  if (oldDirection === nextDirection) return new Set(source);

  const remapped = new Set<string>();

  for (let row = 0; row < rowCount.value; row++) {
    for (let col = 0; col < colCount.value; col++) {
      const oldSeatId = getSeatIdByPosition(row, col, oldDirection);

      if (source.has(oldSeatId)) {
        remapped.add(getSeatIdByPosition(row, col, nextDirection));
      }
    }
  }

  return remapped;
};

const columnGuideLabels = computed(() => {
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  if (props.numberingDirection === 'horizontal') {
    return Array.from({ length: colCount.value }, (_, index) => `${index + 1}`);
  }

  return Array.from({ length: colCount.value }, (_, index) => rowLetters[index] ?? `${index + 1}`);
});

const rowGuideLabels = computed(() => {
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  if (props.numberingDirection === 'horizontal') {
    return Array.from(
      { length: rowCount.value },
      (_, index) => rowLetters[index] ?? `${index + 1}`,
    );
  }

  return Array.from({ length: rowCount.value }, (_, index) => `${index + 1}`);
});

const seatsByRow = computed(() => {
  const rows: Array<Array<{ id: string }>> = [];
  const numRows = rowCount.value;
  const numCols = colCount.value;

  for (let row = 0; row < numRows; row++) {
    const rowSeats = [];
    for (let col = 0; col < numCols; col++) {
      rowSeats.push({
        id: getSeatIdByPosition(row, col, props.numberingDirection),
      });
    }
    rows.push(rowSeats);
  }

  return rows;
});

const columnWalkwayPositions = computed(() =>
  props.walkwayPositions
    .filter((position) => position.type === 'column')
    .sort((a, b) => a.index - b.index),
);

const rowWalkwayPositions = computed(() =>
  props.walkwayPositions
    .filter((position) => position.type === 'row')
    .sort((a, b) => a.index - b.index),
);

const hasColumnWalkways = computed(() => columnWalkwayPositions.value.length > 0);
const hasRowWalkways = computed(() => rowWalkwayPositions.value.length > 0);

const activeColumnWalkwayIndexes = computed(() =>
  Array.from(
    new Set(
      columnWalkwayPositions.value
        .map((position) => position.index)
        .filter((index) => index > 0 && index < colCount.value),
    ),
  ).sort((a, b) => a - b),
);

const activeRowWalkwayIndexes = computed(() =>
  Array.from(
    new Set(
      rowWalkwayPositions.value
        .map((position) => position.index)
        .filter((index) => index > 0 && index < rowCount.value),
    ),
  ).sort((a, b) => a - b),
);

const getColumnWalkwaysBefore = (colIndex: number): number =>
  activeColumnWalkwayIndexes.value.filter((index) => index < colIndex).length;

const getRowWalkwaysBefore = (rowIndex: number): number =>
  activeRowWalkwayIndexes.value.filter((index) => index < rowIndex).length;

const getSeatGridColumn = (colIndex: number): string => {
  return `${colIndex + 1 + getColumnWalkwaysBefore(colIndex)}`;
};

const getSeatGridRow = (rowIndex: number): string => {
  return `${rowIndex + 1 + getRowWalkwaysBefore(rowIndex)}`;
};

const getColumnWalkwayGridColumn = (colIndex: number): string => {
  return `${colIndex + 2 + getColumnWalkwaysBefore(colIndex)}`;
};

const getRowWalkwayGridRow = (rowIndex: number): string => {
  return `${rowIndex + 2 + getRowWalkwaysBefore(rowIndex)}`;
};

const seatStyle = computed(() => {
  const maxDimension = Math.max(rowCount.value, colCount.value);
  const denseWithWalkways = maxDimension > 18 && (hasColumnWalkways.value || hasRowWalkways.value);
  const mediumWithWalkways = maxDimension > 10 && (hasColumnWalkways.value || hasRowWalkways.value);
  const walkwaySize = denseWithWalkways ? '22px' : mediumWithWalkways ? '24px' : '26px';

  if (maxDimension > 18) {
    return {
      width: '40px',
      height: '40px',
      fontSize: '13px',
      rowGap: '8px',
      colGap: '12px',
      aisleWidth: hasColumnWalkways.value ? walkwaySize : '10px',
      aisleHeight: hasRowWalkways.value ? walkwaySize : '10px',
      guideHeight: '22px',
      rowGuideWidth: '22px',
      rowWalkwayOffset: '34px',
      guideFontSize: '12px',
      walkwayFontSize: denseWithWalkways ? '14px' : '14px',
    };
  }

  if (maxDimension > 10) {
    return {
      width: '52px',
      height: '52px',
      fontSize: '14px',
      rowGap: '16px',
      colGap: '18px',
      aisleWidth: hasColumnWalkways.value ? walkwaySize : '14px',
      aisleHeight: hasRowWalkways.value ? walkwaySize : '14px',
      guideHeight: '24px',
      rowGuideWidth: '24px',
      rowWalkwayOffset: '42px',
      guideFontSize: '13px',
      walkwayFontSize: '14px',
    };
  }

  return {
    width: '64px',
    height: '64px',
    fontSize: '16px',
    rowGap: '36px',
    colGap: '24px',
    aisleWidth: walkwaySize,
    aisleHeight: walkwaySize,
    guideHeight: '26px',
    rowGuideWidth: '26px',
    rowWalkwayOffset: '50px',
    guideFontSize: '14px',
    walkwayFontSize: '14px',
  };
});

const seatGridStyle = computed<CSSProperties>(() => {
  const columnTracks = [props.showSeatGuides ? seatStyle.value.rowGuideWidth : '0px'];
  for (let col = 1; col <= colCount.value; col += 1) {
    columnTracks.push(seatStyle.value.width);
    if (activeColumnWalkwayIndexes.value.includes(col)) {
      columnTracks.push(seatStyle.value.aisleWidth);
    }
  }

  const rowTracks = [props.showSeatGuides ? seatStyle.value.guideHeight : '0px'];
  for (let row = 1; row <= rowCount.value; row += 1) {
    rowTracks.push(seatStyle.value.height);
    if (activeRowWalkwayIndexes.value.includes(row)) {
      rowTracks.push(seatStyle.value.aisleHeight);
    }
  }

  return {
    display: 'grid',
    gridTemplateColumns: columnTracks.join(' '),
    gridTemplateRows: rowTracks.join(' '),
    columnGap: seatStyle.value.colGap,
    rowGap: seatStyle.value.rowGap,
    paddingRight: seatStyle.value.colGap,
    paddingBottom: seatStyle.value.rowGap,
  };
});

const getColumnWalkwayStyle = (colIndex: number): CSSProperties => {
  return {
    gridColumn: getColumnWalkwayGridColumn(colIndex),
    gridRow: `2 / ${rowCount.value + activeRowWalkwayIndexes.value.length + 2}`,
    width: seatStyle.value.aisleWidth,
    fontSize: seatStyle.value.walkwayFontSize,
  };
};

const getRowWalkwayStyle = (rowIndex: number): CSSProperties => {
  return {
    gridColumn: `2 / ${colCount.value + activeColumnWalkwayIndexes.value.length + 2}`,
    gridRow: getRowWalkwayGridRow(rowIndex),
    height: seatStyle.value.aisleHeight,
    fontSize: seatStyle.value.walkwayFontSize,
  };
};

// ── Zoom-to-fit logic ──────────────────────────────────────
const scaleFactor = ref(1);
const gridNaturalWidth = ref(0);
const gridNaturalHeight = ref(0);
const shouldUseLargeGridScroll = computed(() => rowCount.value > 20 || colCount.value > 20);
const PREVIEW_HORIZONTAL_SAFETY_GAP = 2;
const MAX_PREVIEW_FILL_SCALE = 1.35;

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
  const gridH = gridRef.value.scrollHeight + 24;
  gridNaturalWidth.value = gridW;
  gridNaturalHeight.value = gridH;

  // Restore style
  style.transform = prevTransform;
  style.position = prevPosition;
  style.width = prevWidth;
  style.height = prevHeight;

  const parentEl = containerRef.value;
  const availW = Math.max(parentEl.clientWidth - PREVIEW_HORIZONTAL_SAFETY_GAP, 1);
  const availH = parentEl.clientHeight ? parentEl.clientHeight - 8 : 99999;

  if (gridW <= 0 || gridH <= 0) {
    scaleFactor.value = 1;
    return;
  }

  const scaleX = availW / gridW;

  if (shouldUseLargeGridScroll.value || gridH > availH) {
    scaleFactor.value = Math.max(0.15, Math.min(scaleX, MAX_PREVIEW_FILL_SCALE));
    return;
  }

  const scaleY = availH / gridH;
  const s = Math.min(scaleX, scaleY, 1); // never zoom in, only zoom out
  scaleFactor.value = Math.max(0.15, s);
};

const wrapperStyle = computed<CSSProperties>(() => {
  const s = scaleFactor.value;
  const w = gridNaturalWidth.value;
  const h = gridNaturalHeight.value;

  if (w <= 0 || h <= 0) {
    return {
      width: '100%',
      minHeight: '120px',
      position: 'relative',
      overflow: 'visible',
    };
  }

  if (shouldUseLargeGridScroll.value) {
    return {
      width: '100%',
      height: `${h * s}px`,
      position: 'relative',
      overflow: 'visible',
    };
  }

  if (s >= 1) {
    return {
      width: '100%',
      height: `${h}px`,
      position: 'relative',
      overflow: 'visible',
    };
  }

  return {
    width: `${Math.max(containerWidth.value - PREVIEW_HORIZONTAL_SAFETY_GAP, 1)}px`,
    height: `${h * s}px`,
    position: 'relative',
    overflow: 'visible',
  };
});

const gridTransformStyle = computed<CSSProperties>(() => {
  const s = scaleFactor.value;
  const w = gridNaturalWidth.value;
  const h = gridNaturalHeight.value;

  if (w <= 0 || h <= 0) {
    return {
      transform: 'translateX(-50%) scale(1)',
      transformOrigin: 'top center',
      position: 'absolute',
      left: '50%',
      top: '0',
      width: 'max-content',
      opacity: 0,
      pointerEvents: 'none',
    };
  }

  if (shouldUseLargeGridScroll.value) {
    return {
      transform: `translateX(-50%) scale(${s})`,
      transformOrigin: 'top center',
      position: 'absolute',
      left: '50%',
      top: '0',
      width: `${w}px`,
      height: `${h}px`,
      opacity: 1,
    };
  }

  if (s >= 1) {
    return {
      transform: 'translateX(-50%) scale(1)',
      transformOrigin: 'top center',
      position: 'absolute',
      left: '50%',
      top: '0',
      width: `${w}px`,
      height: `${h}px`,
      opacity: 1,
    };
  }

  return {
    transform: `translateX(-50%) scale(${s})`,
    transformOrigin: 'top center',
    position: 'absolute',
    left: '50%',
    top: '0',
    width: `${w}px`,
    height: `${h}px`,
    opacity: 1,
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
});

// Recalculate when rows/cols/split change
watch(
  [
    totalSeats,
    rowCount,
    colCount,
    () => props.splitLeftRight,
    () => props.numberingDirection,
    () => props.walkwayPositions,
  ],
  () => {
    if (totalSeats.value <= 0) {
      scaleFactor.value = 1;
      gridNaturalWidth.value = 0;
      gridNaturalHeight.value = 0;
      return;
    }

    void nextTick(() => measureAndScale());
  },
);

watch(
  () => props.numberingDirection,
  (nextDirection, oldDirection) => {
    if (!oldDirection || nextDirection === oldDirection) return;

    brokenSeats.value = remapSeatStatusSetByDirection(
      brokenSeats.value,
      oldDirection,
      nextDirection,
    );
    localOmittedSeats.value = remapSeatStatusSetByDirection(
      localOmittedSeats.value,
      oldDirection,
      nextDirection,
    );
  },
);

watch(
  () => props.omittedSeats,
  (value) => {
    localOmittedSeats.value = new Set(value);
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.exam-seat-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.teacher-desk-divider {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-inline: var(--space-sm);
  box-sizing: border-box;

  &::before {
    content: '';
    position: absolute;
    left: var(--space-sm);
    right: var(--space-sm);
    top: 50%;
    height: 8px;
    background: #7b6753;
    border-radius: var(--radius-sm, 4px);
    transform: translateY(-50%);
  }
}

.teacher-desk-label {
  position: relative;
  z-index: 1;
  flex: 0 1 auto;
  min-width: 0;
  max-width: min(100%, 420px);
  background: #f1f2f4;
  color: #000000;
  font-weight: 400;
  font-style: normal;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: 0px;
  vertical-align: middle;
  padding: 6px 16px;
  border-radius: var(--radius-sm, 4px);
  text-align: center;
  overflow-wrap: anywhere;
}

.teacher-line {
  display: none;
}

.seat-preview-content {
  background: transparent;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: var(--space-md);
  padding-bottom: var(--space-md);
  overflow-x: hidden;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.seat-preview-content--scroll {
  justify-content: center;
  overflow-x: hidden;
  overflow-y: auto;
}

.seat-grid-scalable {
  display: block;
  width: max-content;
  flex-shrink: 0;
  will-change: opacity;
  transition: opacity 180ms ease;
}

.seat-grid-wrapper {
  position: relative;
  width: max-content;
  margin-inline: auto;
}

.seat-row-guide-spacer {
  flex-shrink: 0;
}

.seat-column-guide,
.seat-row-guide {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: #e7f3ff;
  color: #0d47a1;
  border-radius: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  cursor: pointer;
  will-change: transform, opacity;
  transition:
    transform 280ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 220ms ease,
    background-color 220ms ease;
}

.seat-column-guide {
  height: 26px;
  font-size: 14px;
}

.seat-row-guide {
  transform: translateX(4px);
}

.seat-column-walkway {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  border-radius: 10px;
  border: 1px solid var(--Surface-Selected, #dddddd);
  background: var(--Surface-Selected, #dddddd);
  color: #111111;
  font-family: Sarabun, sans-serif;
  font-weight: 500;
  letter-spacing: 0;
  line-height: 100%;
  text-align: center;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
  transform-origin: center;
  will-change: transform, opacity;
  animation: seat-walkway-enter 320ms cubic-bezier(0.16, 1, 0.3, 1);
  transition:
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 220ms ease,
    width 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.seat-column-walkway span {
  position: absolute;
  top: var(--column-label-top, 50%);
  left: 50%;
  z-index: 4;
  writing-mode: vertical-rl;
  transform: translate(-50%, -50%) rotate(180deg);
  white-space: nowrap;
  background: var(--Surface-Selected, #dddddd) !important;
  border-radius: 6px;
  max-height: calc(100% - 28px);
  padding-block: 4px;
  padding-inline: 2px;
  overflow: hidden;
}

.seat-row-walkway {
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: stretch;
  border-radius: 10px;
  border: 1px solid var(--Surface-Selected, #dddddd);
  background: var(--Surface-Selected, #dddddd);
  color: #111111;
  font-family: Sarabun, sans-serif;
  font-weight: 500;
  letter-spacing: 0;
  line-height: 100%;
  text-align: center;
  z-index: 5;
  pointer-events: none;
  overflow: hidden;
  transform-origin: center;
  will-change: transform, opacity;
  animation: seat-walkway-enter 320ms cubic-bezier(0.16, 1, 0.3, 1);
  transition:
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 220ms ease,
    height 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.seat-row-walkway span {
  position: relative;
  z-index: 6;
  background: var(--Surface-Selected, #dddddd) !important;
  border-radius: 6px;
  max-width: calc(100% - 12px);
  padding: 3px 10px;
  white-space: nowrap;
  overflow: hidden;
}

.seat-item {
  flex-shrink: 0;
  font-weight: var(--font-weight-semibold);
  z-index: 4;
  transform-origin: center;
  will-change: transform, opacity;
  animation: seat-item-enter 260ms cubic-bezier(0.16, 1, 0.3, 1);
  transition:
    transform 280ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 220ms ease;
}

@keyframes seat-item-enter {
  from {
    opacity: 0;
    transform: scale(0.94);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes seat-walkway-enter {
  from {
    opacity: 0;
    transform: scale(0.92);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.empty-preview {
  width: 100%;
  height: 100%;
  min-height: 300px;
  color: var(--text-muted);
}

.seat-preview-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.4;
  padding-top: var(--space-xs);
  text-align: center;
}

:global(.seat-tooltip) {
  z-index: 10000;
}

@media (prefers-reduced-motion: reduce) {
  .seat-grid-scaling-wrapper,
  .seat-grid-scalable,
  .seat-grid-wrapper,
  .seat-column-guide,
  .seat-row-guide,
  .seat-column-walkway,
  .seat-row-walkway,
  .seat-item {
    animation: none !important;
    transition: none !important;
  }
}

@media (max-width: 599px) {
  .teacher-desk-divider {
    gap: var(--space-xs);
    padding-inline: 0;
  }

  .teacher-desk-label {
    max-width: 70%;
    padding: 6px 10px;
    font-size: 14px;
    line-height: 20px;
  }

  .teacher-line {
    flex-basis: 24px;
    height: 6px;
  }
}
</style>
