<template>
  <article class="seat-plan-print">
    <header class="seat-plan-print__header">
      <div>
        <h1>แผนผังที่นั่งสอบ</h1>
        <p>{{ roomLabel }}</p>
      </div>
      <div v-if="false" class="seat-plan-print__meta">
        <span>{{ rowCount }} แถว</span>
        <span>{{ colCount }} คอลัมน์</span>
        <span>{{ seatCount }} ที่นั่ง</span>
      </div>
    </header>

    <section class="seat-plan-print__stage">
      <div class="seat-plan-print__scale-shell" :style="mapScaleShellStyle">
        <div class="seat-plan-print__scale-content" :style="mapScaleStyle">
          <div class="teacher-desk-divider" :style="teacherDeskStyle">
            <div class="teacher-desk-label">Teacher's Desk &amp; Projector Screen</div>
          </div>

          <div class="seat-plan-print__grid-shell">
            <div class="seat-plan-print__grid" :style="seatGridStyle">
              <div class="seat-guide-spacer"></div>

              <div
                v-for="colNo in colCount"
                :key="`col-guide-${colNo}`"
                class="seat-column-guide"
                :style="{ gridColumn: getSeatGridColumn(colNo), gridRow: '1' }"
              >
                {{ columnGuideLabel(colNo) }}
              </div>

              <template
                v-for="(rowSeats, rowIndex) in normalizedSeatsByRow"
                :key="`row-${rowIndex}`"
              >
                <div
                  class="seat-row-guide"
                  :style="{ gridColumn: '1', gridRow: getSeatGridRow(rowIndex + 1) }"
                >
                  {{ rowGuideLabel(rowIndex + 1) }}
                </div>

                <div
                  v-for="(seat, colIndex) in rowSeats"
                  :key="seat.id"
                  class="seat-print-square"
                  :class="{
                    'is-blocked': seat.status === 'blocked',
                    'is-broken': seat.status === 'broken',
                  }"
                  :style="{
                    gridColumn: getSeatGridColumn(seat.colNo || colIndex + 1),
                    gridRow: getSeatGridRow(seat.rowNo || rowIndex + 1),
                  }"
                >
                  <svg
                    v-if="seat.status === 'broken'"
                    class="seat-print-broken-icon"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M12 2.75A9.25 9.25 0 1 0 12 21.25 9.25 9.25 0 0 0 12 2.75Zm0 2.5c1.47 0 2.82.48 3.91 1.3L6.55 15.91A6.72 6.72 0 0 1 5.25 12 6.75 6.75 0 0 1 12 5.25Zm0 13.5c-1.47 0-2.82-.48-3.91-1.3l9.36-9.36A6.72 6.72 0 0 1 18.75 12 6.75 6.75 0 0 1 12 18.75Z"
                    />
                  </svg>
                  <span v-else>{{ seat.label }}</span>
                </div>
              </template>

              <div
                v-for="colNo in normalizedAisleAfterCols"
                :key="`col-aisle-${colNo}`"
                class="seat-column-aisle"
                :style="getColumnAisleStyle(colNo)"
              >
                <span>ทางเดิน</span>
              </div>

              <div
                v-for="rowNo in normalizedAisleAfterRows"
                :key="`row-aisle-${rowNo}`"
                class="seat-row-aisle"
                :style="getRowAisleStyle(rowNo)"
              >
                <span>ทางเดิน</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CSSProperties } from 'vue';
import type { SeatCell } from 'src/composables/use-exam-seat-management';

const props = withDefaults(
  defineProps<{
    roomLabel: string;
    seatsByRow: SeatCell[][];
    aisleAfterCols?: number[];
    aisleAfterRows?: number[];
    seatDirection?: 'HORIZONTAL' | 'VERTICAL';
    layoutRows?: number;
    layoutCols?: number;
  }>(),
  {
    aisleAfterCols: () => [],
    aisleAfterRows: () => [],
    seatDirection: 'HORIZONTAL',
    layoutRows: 0,
    layoutCols: 0,
  },
);

const seatSize = 58;
const guideSize = 26;
const aisleSize = 22;
const compactGap = 12;
const stageWidth = 700;
const stageHeight = 880;
const teacherHeight = 46;
const teacherBottomGap = 24;
const maxScale = 2.5;
const minScale = 0.22;

const flatSeats = computed(() => props.seatsByRow.flat());
const seatRowCount = computed(() =>
  props.seatsByRow.reduce(
    (maxRows, rowSeats, rowIndex) =>
      Math.max(maxRows, rowIndex + 1, ...rowSeats.map((seat) => seat.rowNo)),
    props.seatsByRow.length,
  ),
);
const seatColCount = computed(() =>
  props.seatsByRow.reduce(
    (maxCols, rowSeats) =>
      Math.max(maxCols, rowSeats.length, ...rowSeats.map((seat) => seat.colNo)),
    0,
  ),
);
const rowCount = computed(() => props.layoutRows || seatRowCount.value);
const colCount = computed(() => props.layoutCols || seatColCount.value);
const seatCount = computed(() => flatSeats.value.length);

const normalizedSeatsByRow = computed(() =>
  Array.from({ length: rowCount.value }, (_, rowIndex) => props.seatsByRow[rowIndex] ?? []),
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

const columnTracks = computed(() => {
  const tracks: number[] = [guideSize];
  for (let colNo = 1; colNo <= colCount.value; colNo += 1) {
    tracks.push(seatSize);
    if (normalizedAisleAfterCols.value.includes(colNo)) {
      tracks.push(aisleSize);
    }
  }
  return tracks;
});

const rowTracks = computed(() => {
  const tracks: number[] = [guideSize];
  for (let rowNo = 1; rowNo <= rowCount.value; rowNo += 1) {
    tracks.push(seatSize);
    if (normalizedAisleAfterRows.value.includes(rowNo)) {
      tracks.push(aisleSize);
    }
  }
  return tracks;
});

const gridWidth = computed(
  () =>
    columnTracks.value.reduce((sum, trackSize) => sum + trackSize, 0) +
    Math.max(columnTracks.value.length - 1, 0) * compactGap,
);
const gridHeight = computed(
  () =>
    rowTracks.value.reduce((sum, trackSize) => sum + trackSize, 0) +
    Math.max(rowTracks.value.length - 1, 0) * compactGap,
);
const teacherDeskWidth = computed(() => Math.max(gridWidth.value - guideSize - compactGap, 420));
const mapNaturalWidth = computed(() => Math.max(gridWidth.value, teacherDeskWidth.value));
const mapNaturalHeight = computed(() => teacherHeight + teacherBottomGap + gridHeight.value);

const mapScale = computed(() => {
  if (mapNaturalWidth.value <= 0 || mapNaturalHeight.value <= 0) return 1;

  const scale = Math.min(stageWidth / mapNaturalWidth.value, stageHeight / mapNaturalHeight.value);
  return Math.max(minScale, Math.min(scale, maxScale));
});

const mapScaleShellStyle = computed<CSSProperties>(() => ({
  width: `${mapNaturalWidth.value * mapScale.value}px`,
  height: `${mapNaturalHeight.value * mapScale.value}px`,
}));

const mapScaleStyle = computed<CSSProperties>(() => ({
  width: `${mapNaturalWidth.value}px`,
  height: `${mapNaturalHeight.value}px`,
  transform: `scale(${mapScale.value})`,
}));

const teacherDeskStyle = computed<CSSProperties>(() => ({
  width: `${teacherDeskWidth.value}px`,
}));

const guideLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const columnGuideLabel = (colNo: number): string => {
  if (props.seatDirection === 'HORIZONTAL') return `${colNo}`;

  return guideLetters[colNo - 1] ?? `${colNo}`;
};

const rowGuideLabel = (rowNo: number): string => {
  if (props.seatDirection === 'HORIZONTAL') return guideLetters[rowNo - 1] ?? `${rowNo}`;

  return `${rowNo}`;
};

const countAislesBeforeColumn = (colNo: number): number =>
  normalizedAisleAfterCols.value.filter((aisleColNo) => aisleColNo < colNo).length;

const countAislesBeforeRow = (rowNo: number): number =>
  normalizedAisleAfterRows.value.filter((aisleRowNo) => aisleRowNo < rowNo).length;

const getSeatGridColumn = (colNo: number): string =>
  `${colNo + 1 + countAislesBeforeColumn(colNo)}`;
const getSeatGridRow = (rowNo: number): string => `${rowNo + 1 + countAislesBeforeRow(rowNo)}`;

const seatGridStyle = computed<CSSProperties>(() => ({
  display: 'grid',
  gridTemplateColumns: columnTracks.value.map((trackSize) => `${trackSize}px`).join(' '),
  gridTemplateRows: rowTracks.value.map((trackSize) => `${trackSize}px`).join(' '),
  columnGap: `${compactGap}px`,
  rowGap: `${compactGap}px`,
}));

const totalGridColumnTracks = computed(() => columnTracks.value.length);
const totalGridRowTracks = computed(() => rowTracks.value.length);

const getColumnAisleStyle = (colNo: number): CSSProperties => {
  return {
    gridColumn: `${colNo + 2 + countAislesBeforeColumn(colNo)}`,
    gridRow: `2 / ${totalGridRowTracks.value + 1}`,
  };
};

const getRowAisleStyle = (rowNo: number): CSSProperties => {
  return {
    gridColumn: `2 / ${totalGridColumnTracks.value + 1}`,
    gridRow: `${rowNo + 2 + countAislesBeforeRow(rowNo)}`,
  };
};
</script>

<style scoped lang="scss">
.seat-plan-print {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #ffffff;
  color: #111111;
  font-family: Sarabun, Arial, sans-serif;
  overflow: hidden;
  break-after: avoid;
  break-inside: avoid;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}

.seat-plan-print__header {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0;
  flex-shrink: 0;
  padding: 0 0 12px;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;
}

.seat-plan-print__header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.35;
}

.seat-plan-print__header p {
  margin: 4px 0 0;
  font-size: 15px;
  line-height: 1.35;
  color: #343434;
}

.seat-plan-print__meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
  max-width: 320px;
}

.seat-plan-print__meta span {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: #e7f3ff;
  color: #0d47a1;
  font-size: 13px;
  font-weight: 600;
}

.seat-plan-print__stage {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex: 1;
  padding-top: 8px;
  overflow: hidden;
}

.seat-plan-print__scale-shell {
  position: relative;
  overflow: visible;
}

.seat-plan-print__scale-content {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
}

.teacher-desk-divider {
  position: relative;
  height: 46px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 0;
    border-top: 8px solid #7b6753;
    border-radius: 8px;
    background: transparent;
    transform: translateY(-50%);
  }
}

.teacher-desk-label {
  position: relative;
  z-index: 1;
  padding: 7px 26px;
  border-radius: 8px;
  background: #f1f2f4;
  color: #000000;
  font-size: 16px;
  line-height: 22px;
  text-align: center;
}

.seat-plan-print__grid-shell {
  display: flex;
  justify-content: center;
  width: 100%;
  overflow: visible;
}

.seat-plan-print__grid {
  position: relative;
  width: max-content;
  align-items: center;
  justify-content: center;
}

.seat-guide-spacer,
.seat-column-guide,
.seat-row-guide {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #e7f3ff;
  color: #0d47a1;
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
}

.seat-guide-spacer {
  background: transparent;
}

.seat-print-square {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border: 1.6px solid var(--primary, #0d47a1);
  border-radius: 8px;
  background: #ffffff;
  color: #111111;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  z-index: 2;
}

.seat-print-square.is-blocked {
  border-color: var(--gray, #bcbbbb);
  background: var(--gray, #bcbbbb);
}

.seat-print-square.is-broken {
  border-color: #6b6b6b;
  background: #6b6b6b;
  color: #ffffff;
}

.seat-print-broken-icon {
  width: 25px;
  height: 25px;
  display: block;
}

.seat-column-aisle,
.seat-row-aisle {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  justify-self: stretch;
  border-radius: 10px;
  border: 1px solid var(--Surface-Selected, #dddddd);
  background: var(--Surface-Selected, #dddddd);
  box-shadow: inset 0 0 0 999px var(--Surface-Selected, #dddddd);
  color: #111111;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  overflow: hidden;
  z-index: 7;
  min-width: 0;
  min-height: 0;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}

.seat-column-aisle span {
  writing-mode: horizontal-tb;
  transform: rotate(-90deg);
  white-space: nowrap;
}

.seat-row-aisle {
  z-index: 8;
  justify-content: flex-end;
  padding-right: 12px;
}

.seat-row-aisle span {
  white-space: nowrap;
  position: relative;
  z-index: 2;
}

@media print {
  .seat-plan-print {
    height: 100%;
    max-height: 100%;
    break-after: avoid;
    break-inside: avoid;
    page-break-after: avoid;
    page-break-inside: avoid;
  }
}
</style>
