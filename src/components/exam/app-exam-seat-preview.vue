<template>
  <div class="exam-seat-preview">
    <!-- Legend -->
    <div class="q-mb-md">
      <AppSeatLegend :items="legendItems" />
    </div>

    <!-- Divider -->
    <div class="teacher-desk-divider row items-center justify-center q-mb-lg">
      <div class="teacher-line"></div>
      <div class="q-px-md bg-grey-2 rounded-borders text-weight-medium teacher-desk-label">
        Teacher's Desk & Projector Screen
      </div>
      <div class="teacher-line"></div>
    </div>

    <!-- Seat Preview Container -->
    <div class="seat-preview-content">
      <div v-if="totalSeats > 0" class="seat-grid-wrapper" :style="{ gap: seatStyle.rowGap }">
        <!-- Render each row separately to lock position -->
        <div
          v-for="(rowSeats, rowIndex) in seatsByRow"
          :key="rowIndex"
          class="seat-row"
          :style="{ gap: seatStyle.colGap }"
        >
          <template v-for="(seat, colIndex) in rowSeats" :key="seat.id">
            <!-- Aisle Gap between left/right halves -->
            <div
              v-if="
                props.splitLeftRight &&
                colIndex === Math.ceil(rowSeats.length / 2) &&
                rowSeats.length > 1
              "
              class="aisle-gap"
              :style="{ width: seatStyle.aisleWidth, height: seatStyle.height }"
            ></div>

            <div class="seat-item">
              <div
                class="seat-box"
                :class="{ 'is-broken': brokenSeats.has(seat.id) }"
                :style="{
                  width: seatStyle.width,
                  height: seatStyle.height,
                  fontSize: seatStyle.fontSize,
                }"
                @click="handleSeatClick(seat.id)"
              >
                <span v-if="!brokenSeats.has(seat.id)" class="seat-label">{{ seat.id }}</span>
                <div v-if="brokenSeats.has(seat.id)" class="broken-overlay">
                  <q-icon name="block" class="broken-icon" />
                </div>
              </div>
            </div>
          </template>
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
import { ref, computed } from 'vue';
import AppSeatLegend from './app-seat-legend.vue';
import AppSeatBrokenDialog from './app-seat-broken-dialog.vue';

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

const confirmBrokenSeat = (seatId: string) => {
  brokenSeats.value.add(seatId);
};

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

  const containerWidth = 850;
  const scale = Math.max(32, Math.min(64, (containerWidth - aisleWidth) / cols - 12));
  const colGap = Math.max(8, Math.min(24, scale * 0.3));
  const rowGap = Math.max(8, Math.min(56, (500 - rows * scale) / (rows - 1 || 1)));

  return {
    width: `${scale}px`,
    height: `${scale}px`,
    fontSize: `${Math.max(12, scale * 0.35)}px`,
    rowGap: `${rowGap}px`,
    colGap: `${colGap}px`,
    aisleWidth: `${aisleWidth}px`,
  };
});
</script>

<style scoped lang="scss">
.exam-seat-preview {
  width: 100%;
}

.teacher-desk-divider {
  .q-separator {
    opacity: 0.5;
  }
}

.teacher-desk-label {
  color: var(--buu-brown);
  padding-top: 6px;
  padding-bottom: 6px;
}

.teacher-line {
  width: 180px;
  height: 4px;
  background: var(--teacher-desk-line);
}

.seat-preview-content {
  background: transparent;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: visible;
  padding-top: 16px;
  padding-bottom: 32px;
}

.seat-grid-wrapper {
  display: flex;
  flex-direction: column;
  width: fit-content;
  align-items: center;
}

.seat-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  width: fit-content;
}

.seat-item {
  flex-shrink: 0;
}

.aisle-gap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 2px;
    border-left: 2px dashed var(--q-primary, #1976d2);
    opacity: 0.35;
  }
}

.seat-box {
  background-color: var(--surface-card);
  border: 1px solid var(--secondary);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;

  &:hover {
    background-color: var(--surface-page);
  }

  &.is-broken {
    background-color: var(--seat-broken-bg);
    border-color: var(--seat-broken-bg);
    cursor: pointer;
  }
}

.seat-label {
  position: relative;
  z-index: 1;
}

.broken-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.broken-icon {
  font-size: 28px;
  color: var(--text-on-primary);
}

.empty-preview {
  width: 100%;
  height: 100%;
  min-height: 300px;
  color: var(--text-muted);
}
</style>
