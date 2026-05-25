<template>
  <div class="exam-seat-preview">
    <!-- Legend -->
    <div class="q-mb-md">
      <AppSeatLegend :items="legendItems" />
    </div>

    <!-- Divider -->
    <div class="teacher-desk-divider row items-center q-mb-md">
      <q-separator class="col" color="red-2" size="4px" />
      <div class="text-grey-7 q-px-md bg-grey-2 rounded-borders">
        Teacher's Desk & Projector Screen
      </div>
      <q-separator class="col" color="red-2" size="4px" />
    </div>

    <!-- Seat Preview Container -->
    <div class="seat-preview-content">
      <div v-if="totalSeats > 0" class="seat-grid-wrapper">
        <!-- Render each row separately to lock position -->
        <div v-for="(rowSeats, rowIndex) in seatsByRow" :key="rowIndex" class="seat-row">
          <div v-for="seat in rowSeats" :key="seat.id" class="seat-item">
            <div class="seat-box" :style="seatSize">{{ seat.id }}</div>
          </div>
        </div>
      </div>
      <div v-else class="empty-preview column flex-center">
        <q-icon name="event_seat" size="48px" color="grey-6" />
        <div class="text-body2 text-grey-6 q-mt-md">{{ placeholderText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppSeatLegend from './app-seat-legend.vue';

interface Props {
  rows?: number;
  cols?: number;
  placeholderText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 0,
  cols: 0,
  placeholderText: 'จำนวนที่นั่งทั้งหมด',
});

const MAX_SEATS = Infinity;

const legendItems = [
  { label: 'ที่นั่งว่าง', dotClass: 'available' },
  { label: 'ชำรุด', dotClass: 'broken' },
];

const totalSeats = computed(() => {
  const total = (props.rows || 0) * (props.cols || 0);
  return Math.min(total, MAX_SEATS);
});

const seatsByRow = computed(() => {
  const rows: Array<Array<{ id: string }>> = [];
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const numRows = props.rows || 0;
  const numCols = props.cols || 0;

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

const seatSize = computed(() => {
  const total = (props.rows || 0) * (props.cols || 0);
  const cols = props.cols || 1;

  // ถ้า <= 40 แสดงเต็มปกติ
  if (total <= 40) {
    return {
      width: '48px',
      height: '48px',
      fontSize: '14px',
      padding: '8px',
      gap: '6px',
    };
  }

  // ถ้า > 40 ให้ zoom out โดยคำนวณให้พอดีกรอบ
  // กรอบกว้างประมาณ 1150px (100% - padding)
  // ต้องพอดี cols ที่นั่ง
  const containerWidth = 1150;
  const gapSize = 4;
  const totalGapWidth = gapSize * (cols - 1);
  const availableWidth = containerWidth - totalGapWidth;
  const seatWidth = availableWidth / cols;

  const scale = Math.max(32, Math.min(48, seatWidth));

  return {
    width: scale + 'px',
    height: scale + 'px',
    fontSize: Math.round(scale * 0.25) + 'px',
    padding: Math.round(scale * 0.15) + 'px',
    gap: '4px',
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

.seat-preview-content {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  width: 100%;
  height: 300px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  box-shadow: none;
  overflow-y: scroll;
  overflow-x: hidden;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.seat-grid-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: fit-content;
  min-width: fit-content;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 24px;
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

.seat-box {
  background-color: #ffffff;
  border: 1px solid var(--secondary, #1e89e5);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--secondary, #1e89e5);
  cursor: default;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background-color: #f5f5f5;
  }
}

.empty-preview {
  width: 100%;
  height: 100%;
  min-height: 300px;
  color: #999999;
}
</style>
