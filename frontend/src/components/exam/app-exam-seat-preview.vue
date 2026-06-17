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
                  }"
                  @click="openColumnStatusDialog(colIndex)"
                >
                  {{ columnGuideLabels[colIndex - 1] }}
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
                      {{
                        brokenSeats.has(seat.id)
                          ? t('admin.locationManagement.seatTooltip.markAvailable')
                          : t('admin.locationManagement.seatTooltip.markBroken')
                      }}
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

defineExpose({ brokenSeats });

const getSeatStatus = (seatId: string): 'available' | 'assigned' | 'broken' | 'blocked' => {
  if (localOmittedSeats.value.has(seatId)) return 'blocked';
  if (brokenSeats.value.has(seatId)) return 'broken';

  return 'available';
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
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const numRows = rowCount.value;
  const numCols = colCount.value;

  for (let row = 0; row < numRows; row++) {
    const rowSeats = [];
    for (let col = 0; col < numCols; col++) {
      const horizontalSeatId = `${rowLetters[row] ?? row + 1}${col + 1}`;
      const verticalSeatId = `${rowLetters[col] ?? col + 1}${row + 1}`;

      rowSeats.push({
        id: props.numberingDirection === 'horizontal' ? horizontalSeatId : verticalSeatId,
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

const getSeatGridColumn = (colIndex: number): string => {
  return `${colIndex + 1}`;
};

const getSeatGridRow = (rowIndex: number): string => {
  return `${rowIndex + 1}`;
};

const cssNumber = (value: string): number => Number.parseFloat(value) || 0;

const seatStyle = computed(() => {
  const maxDimension = Math.max(rowCount.value, colCount.value);
  const denseWithWalkways = maxDimension > 18 && (hasColumnWalkways.value || hasRowWalkways.value);
  const mediumWithWalkways = maxDimension > 10 && (hasColumnWalkways.value || hasRowWalkways.value);
  const walkwaySize = denseWithWalkways ? '18px' : mediumWithWalkways ? '20px' : '18px';

  if (maxDimension > 18) {
    return {
      width: '40px',
      height: '40px',
      fontSize: '13px',
      rowGap: hasRowWalkways.value ? '24px' : '8px',
      colGap: hasColumnWalkways.value ? '24px' : '12px',
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
      rowGap: hasRowWalkways.value ? '28px' : '16px',
      colGap: hasColumnWalkways.value ? '28px' : '18px',
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
  const columnTracks = [
    props.showSeatGuides ? seatStyle.value.rowGuideWidth : '0px',
    ...Array.from({ length: colCount.value }, () => seatStyle.value.width),
  ];
  const rowTracks = [
    props.showSeatGuides ? seatStyle.value.guideHeight : '0px',
    ...Array.from({ length: rowCount.value }, () => seatStyle.value.height),
  ];

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

const seatBodyMetrics = computed(() => {
  const guideWidth = props.showSeatGuides ? cssNumber(seatStyle.value.rowGuideWidth) : 0;
  const guideHeight = props.showSeatGuides ? cssNumber(seatStyle.value.guideHeight) : 0;
  const seatWidth = cssNumber(seatStyle.value.width);
  const seatHeight = cssNumber(seatStyle.value.height);
  const colGap = cssNumber(seatStyle.value.colGap);
  const rowGap = cssNumber(seatStyle.value.rowGap);

  return {
    bodyLeft: guideWidth + colGap,
    bodyTop: guideHeight + rowGap,
    bodyWidth: colCount.value * seatWidth + Math.max(colCount.value - 1, 0) * colGap,
    bodyHeight: rowCount.value * seatHeight + Math.max(rowCount.value - 1, 0) * rowGap,
    colGap,
    rowGap,
    seatWidth,
    seatHeight,
  };
});

const getColumnWalkwayStyle = (colIndex: number): CSSProperties => {
  const metrics = seatBodyMetrics.value;
  const width = cssNumber(seatStyle.value.aisleWidth);
  const left =
    metrics.bodyLeft +
    colIndex * metrics.seatWidth +
    Math.max(colIndex - 1, 0) * metrics.colGap +
    (metrics.colGap - width) / 2;

  return {
    position: 'absolute',
    left: `${left}px`,
    top: `${metrics.bodyTop}px`,
    width: seatStyle.value.aisleWidth,
    height: `${metrics.bodyHeight}px`,
    fontSize: seatStyle.value.walkwayFontSize,
  };
};

const getRowWalkwayStyle = (rowIndex: number): CSSProperties => {
  const metrics = seatBodyMetrics.value;
  const height = cssNumber(seatStyle.value.aisleHeight);
  const top =
    metrics.bodyTop +
    rowIndex * metrics.seatHeight +
    Math.max(rowIndex - 1, 0) * metrics.rowGap +
    (metrics.rowGap - height) / 2;

  return {
    position: 'absolute',
    left: `${metrics.bodyLeft}px`,
    top: `${top}px`,
    width: `${metrics.bodyWidth}px`,
    height: seatStyle.value.aisleHeight,
    fontSize: seatStyle.value.walkwayFontSize,
  };
};

// ── Zoom-to-fit logic ──────────────────────────────────────
const scaleFactor = ref(1);
const gridNaturalWidth = ref(0);
const gridNaturalHeight = ref(0);
const shouldUseLargeGridScroll = computed(() => rowCount.value > 20 || colCount.value > 20);

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
  const availW = parentEl.clientWidth - 16; // small padding margin
  const availH = parentEl.clientHeight ? parentEl.clientHeight - 8 : 99999;

  if (gridW <= 0 || gridH <= 0) {
    scaleFactor.value = 1;
    return;
  }

  if (shouldUseLargeGridScroll.value) {
    scaleFactor.value = Math.min(availW / gridW, 1);
    return;
  }

  const scaleX = availW / gridW;
  const scaleY = availH / gridH;
  const s = Math.min(scaleX, scaleY, 1); // never zoom in, only zoom out
  scaleFactor.value = Math.max(0.15, s);
};

const wrapperStyle = computed<CSSProperties>(() => {
  const s = scaleFactor.value;
  const w = gridNaturalWidth.value;
  const h = gridNaturalHeight.value;

  if (shouldUseLargeGridScroll.value) {
    return {
      width: '100%',
      height: `${h * s}px`,
      position: 'relative',
      overflow: 'visible',
      display: 'flex',
      justifyContent: 'center',
    };
  }

  if (s >= 1 || w <= 0 || h <= 0) {
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

  if (shouldUseLargeGridScroll.value) {
    return {
      transform: `translateX(-50%) scale(${s})`,
      transformOrigin: 'top center',
      position: 'absolute',
      left: '50%',
      top: '0',
      width: `${w}px`,
      height: `${h}px`,
    };
  }

  if (s >= 1 || w <= 0 || h <= 0) {
    return {
      transform: 'none',
      width: 'max-content',
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
    rowCount,
    colCount,
    () => props.splitLeftRight,
    () => props.numberingDirection,
    () => props.walkwayPositions,
  ],
  () => {
    void nextTick(() => measureAndScale());
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
  overflow: auto;
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
}

.seat-column-guide {
  height: 26px;
  font-size: 14px;
  transform: translateY(4px);
}

.seat-row-guide {
  transform: translateX(4px);
}

.seat-column-walkway {
  display: flex;
  align-items: center;
  justify-content: center;
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
}

.seat-column-walkway span {
  position: relative;
  z-index: 3;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
  background: var(--Surface-Selected, #dddddd);
  border-radius: 6px;
  max-height: calc(100% - 12px);
  padding-block: 3px;
  padding-inline: 1px;
  overflow: hidden;
}

.seat-row-walkway {
  display: flex;
  align-items: center;
  justify-content: center;
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
}

.seat-row-walkway span {
  position: relative;
  z-index: 3;
  background: var(--Surface-Selected, #dddddd);
  border-radius: 6px;
  max-width: calc(100% - 12px);
  padding: 2px 8px;
  white-space: nowrap;
  overflow: hidden;
}

.seat-item {
  flex-shrink: 0;
  font-weight: var(--font-weight-semibold);
  z-index: 4;
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
