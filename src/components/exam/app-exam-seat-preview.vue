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
    <div ref="containerRef" class="seat-preview-content">
      <div v-if="totalSeats > 0" class="seat-grid-scaling-wrapper" :style="wrapperStyle">
        <div ref="gridRef" class="seat-grid-scalable" :style="gridTransformStyle">
          <div class="seat-grid-wrapper" :style="{ gap: seatStyle.rowGap }">
            <!-- Render each row separately to lock position -->
            <div
              v-for="(rowSeats, rowIndex) in seatsByRow"
              :key="rowIndex"
              class="seat-row"
              :style="{ gap: seatStyle.colGap }"
            >
              <template v-for="(seat, colIndex) in rowSeats" :key="seat.id">
                <!-- Aisle divider between left/right halves -->
                <AppSeatSplitDivider
                  v-if="
                    props.splitLeftRight &&
                    colIndex === Math.ceil(rowSeats.length / 2) &&
                    rowSeats.length > 1
                  "
                  :width="seatStyle.aisleWidth"
                />

                <div
                  class="seat-item"
                  :style="{
                    width: seatStyle.width,
                    height: seatStyle.height,
                    fontSize: seatStyle.fontSize,
                  }"
                >
                  <AppExamSeatSquare
                    :seat-number="seat.id"
                    :status="brokenSeats.has(seat.id) ? 'broken' : 'available'"
                    @click="handleSeatClick"
                  >
                    <q-tooltip anchor="top middle" self="bottom middle" class="text-body2">
                      {{
                        brokenSeats.has(seat.id)
                          ? t('admin.locationManagement.seatTooltip.markAvailable')
                          : t('admin.locationManagement.seatTooltip.markBroken')
                      }}
                    </q-tooltip>
                  </AppExamSeatSquare>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-preview"></div>
    </div>

    <!-- Broken Seat Dialog -->
    <AppSeatBrokenDialog
      v-model="isDialogOpen"
      :seat-id="selectedSeatId"
      @confirm="confirmBrokenSeat"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import type { CSSProperties } from 'vue';
import { useI18n } from 'vue-i18n';
import AppSeatLegend from './app-seat-legend.vue';
import AppSeatBrokenDialog from './app-seat-broken-dialog.vue';
import AppExamSeatSquare from './app-exam-seat-square.vue';
import AppSeatSplitDivider from './app-seat-split-divider.vue';

interface Props {
  rows?: number | null;
  cols?: number | null;
  placeholderText?: string;
  splitLeftRight?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 0,
  cols: 0,
  placeholderText: 'จำนวนที่นั่งทั้งหมด',
  splitLeftRight: false,
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
  { label: 'ชำรุด', dotClass: 'broken' },
];

const totalSeats = computed(() => {
  const total = rowCount.value * colCount.value;
  return Math.min(total, MAX_SEATS);
});

const isDialogOpen = ref(false);
const selectedSeatId = ref('');
const brokenSeats = ref<Set<string>>(new Set());

const handleSeatClick = (seatId: string) => {
  if (!brokenSeats.value.has(seatId)) {
    selectedSeatId.value = seatId;
    isDialogOpen.value = true;
  } else {
    // Un-break if already broken
    brokenSeats.value.delete(seatId);
  }
};

const confirmBrokenSeat = (seatId: string): void => {
  brokenSeats.value.add(seatId);
};

defineExpose({ brokenSeats });

const seatsByRow = computed(() => {
  const rows: Array<Array<{ id: string }>> = [];
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const numRows = rowCount.value;
  const numCols = colCount.value;

  for (let row = 0; row < numRows; row++) {
    const rowSeats = [];
    for (let col = 0; col < numCols; col++) {
      rowSeats.push({
        id: `${rowLetters[row]}${col + 1}`,
      });
    }
    rows.push(rowSeats);
  }

  return rows;
});

const seatStyle = computed(() => {
  const total = rowCount.value * colCount.value;
  const cols = colCount.value || 1;
  const rows = rowCount.value || 1;
  const aisleWidth = props.splitLeftRight ? 48 : 0;

  if (total <= 40) {
    const rGap = rows <= 4 ? 56 : rows <= 6 ? 36 : 24;
    return {
      width: '64px',
      height: '64px',
      fontSize: '16px',
      rowGap: `${rGap}px`,
      colGap: '24px',
      aisleWidth: `${aisleWidth}px`,
    };
  }

  const containerW = 850;
  const scale = Math.max(32, Math.min(64, (containerW - aisleWidth) / cols - 10));
  const colGap = Math.max(6, Math.min(24, scale * 0.25));
  const rowGap = Math.max(6, Math.min(56, (500 - rows * scale) / (rows - 1 || 1)));

  return {
    width: `${scale}px`,
    height: `${scale}px`,
    fontSize: `${Math.max(12, scale * 0.44)}px`,
    rowGap: `${rowGap}px`,
    colGap: `${colGap}px`,
    aisleWidth: `${aisleWidth}px`,
  };
});

// ── Zoom-to-fit logic ──────────────────────────────────────
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

  const scaleX = availW / gridW;
  const scaleY = availH / gridH;
  const s = Math.min(scaleX, scaleY, 1); // never zoom in, only zoom out
  scaleFactor.value = Math.max(0.15, s);
};

const wrapperStyle = computed<CSSProperties>(() => {
  const s = scaleFactor.value;
  const w = gridNaturalWidth.value;
  const h = gridNaturalHeight.value;

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

  if (s >= 1 || w <= 0 || h <= 0) {
    return {
      transform: 'none',
      width: 'max-content',
    };
  }

  const targetW = (containerWidth.value - 16) / s;

  return {
    transform: `scale(${s})`,
    transformOrigin: 'top left',
    position: 'absolute',
    left: '0',
    top: '0',
    width: `${targetW}px`,
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
watch([rowCount, colCount, () => props.splitLeftRight], () => {
  void nextTick(() => measureAndScale());
});
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
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding-inline: var(--space-sm);
  box-sizing: border-box;
}

.teacher-desk-label {
  flex: 0 1 auto;
  min-width: 0;
  max-width: min(100%, 420px);
  background: #f1f2f4;
  color: #926f6c;
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
  flex: 1 1 120px;
  width: auto;
  max-width: 270px;
  min-width: 16px;
  height: 8px;
  background: #e7bdb9;
  border-radius: var(--radius-sm, 4px);
}

.seat-preview-content {
  background: transparent;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: var(--space-md);
  padding-bottom: var(--space-md);
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.seat-grid-scalable {
  display: block;
  width: max-content;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}

.seat-grid-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-inline: auto;
  align-items: stretch;
}

.seat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  width: 100%;
}

.seat-item {
  flex-shrink: 0;
  font-weight: var(--font-weight-semibold);
}

.empty-preview {
  width: 100%;
  height: 100%;
  min-height: 300px;
  color: var(--text-muted);
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
