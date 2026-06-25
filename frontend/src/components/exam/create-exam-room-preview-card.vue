<template>
  <q-card flat bordered class="buu-premium-card q-mb-xl room-preview-card">
    <q-card-section class="room-preview-section">
      <div class="room-preview-header">
        <div class="row items-center no-wrap">
          <q-icon name="event_seat" size="22px" class="q-mr-sm text-black" />
          <div class="text-subtitle1 text-weight-bold text-dark">แก้ไขข้อมูลห้องสอบ</div>
        </div>

        <div v-if="selectedLocations.length > 0" class="room-tabs" role="tablist">
          <button
            v-for="location in selectedLocations"
            :key="location.value"
            class="room-tab"
            :class="{ 'room-tab--active': location.value === activeLocationId }"
            type="button"
            role="tab"
            :aria-selected="location.value === activeLocationId"
            @click="activeLocationId = location.value"
          >
            {{ location.label }}
          </button>
        </div>
      </div>

      <div class="room-preview-shell">
        <AppExamSeatPreview
          v-if="activeLocation"
          :rows="activeRows"
          :cols="activeCols"
          :walkway-positions="walkwayPositions"
          :numbering-direction="numberingDirection"
          :omitted-seats="omittedSeats"
          :broken-seats="brokenSeats"
          :show-seat-guides="true"
          :show-footer-hint="true"
          :scroll-header-with-content="true"
          @seat-status-change="handleSeatStatusChange"
        />

        <div v-else class="room-preview-empty">
          <q-icon name="meeting_room" size="40px" color="grey-5" />
          <div>เลือกสถานที่สอบในกำหนดการสอบเพื่อแสดงผังที่นั่ง</div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { CreateExamForm } from 'src/composables/use-create-exam';
import type { ExamLocationOption } from 'src/services/exam.service';
import type { BackendLocation } from 'src/types/exam';
import AppExamSeatPreview from 'src/components/exam/app-exam-seat-preview.vue';
import { updateSeatStatus } from 'src/services/location.service';

interface WalkwayPosition {
  type: 'row' | 'column';
  index: number;
}

type SeatStatusOption = 'available' | 'omitted' | 'broken';

const props = defineProps<{
  locationOptions: ExamLocationOption[];
}>();

const form = defineModel<CreateExamForm>('form', { required: true });
const $q = useQuasar();

const activeLocationId = ref<number | null>(null);

const selectedLocationIds = computed<number[]>(() => {
  const ids: number[] = [];

  form.value.timeSlots.forEach((slot) => {
    slot.rooms.forEach((room) => {
      if (room.locationId !== null && !ids.includes(room.locationId)) {
        ids.push(room.locationId);
      }
    });
  });

  return ids;
});

const selectedLocations = computed<ExamLocationOption[]>(() =>
  selectedLocationIds.value
    .map((id) => props.locationOptions.find((location) => location.value === id))
    .filter((location): location is ExamLocationOption => Boolean(location)),
);

const activeOption = computed<ExamLocationOption | null>(() => {
  return (
    selectedLocations.value.find((location) => location.value === activeLocationId.value) ??
    selectedLocations.value[0] ??
    null
  );
});

const activeLocation = computed<BackendLocation | null>(() => activeOption.value?.raw ?? null);

const activeRows = computed<number>(() => {
  if (activeLocation.value?.LOCATION_TOTAL_ROWS) return activeLocation.value.LOCATION_TOTAL_ROWS;

  return Math.max(...(activeLocation.value?.SEATS ?? []).map((seat) => seat.LS_ROW_NO), 0);
});

const activeCols = computed<number>(() => {
  if (activeLocation.value?.LOCATION_TOTAL_COLS) return activeLocation.value.LOCATION_TOTAL_COLS;

  return Math.max(...(activeLocation.value?.SEATS ?? []).map((seat) => seat.LS_COL_NO), 0);
});

const numberingDirection = computed<'horizontal' | 'vertical'>(() =>
  activeLocation.value?.SEAT_DIRECTION === 'HORIZONTAL' ? 'horizontal' : 'vertical',
);

const walkwayPositions = computed<WalkwayPosition[]>(() => [
  ...(activeLocation.value?.AISLE_AFTER_ROWS ?? []).map((index) => ({
    type: 'row' as const,
    index,
  })),
  ...(activeLocation.value?.AISLE_AFTER_COLS ?? []).map((index) => ({
    type: 'column' as const,
    index,
  })),
]);

const omittedSeats = computed<Set<string>>(() => {
  const seats = (activeLocation.value?.SEATS ?? [])
    .filter((seat) => seat.LS_SEAT_STATUS === 2 && seat.LS_SEAT_LABEL)
    .map((seat) => seat.LS_SEAT_LABEL as string);

  return new Set(seats);
});

const brokenSeats = computed<Set<string>>(() => {
  const seats = (activeLocation.value?.SEATS ?? [])
    .filter((seat) => seat.LS_SEAT_STATUS === 1 && seat.LS_SEAT_LABEL)
    .map((seat) => seat.LS_SEAT_LABEL as string);

  return new Set(seats);
});

const getSeatStatusCode = (status: SeatStatusOption): number => {
  if (status === 'broken') return 1;
  if (status === 'omitted') return 2;

  return 0;
};

const handleSeatStatusChange = async (payload: {
  seatIds: string[];
  status: SeatStatusOption;
}): Promise<void> => {
  const location = activeLocation.value;
  if (!location?.SEATS?.length) return;

  const nextStatusCode = getSeatStatusCode(payload.status);
  const targetSeats = location.SEATS.filter(
    (seat) => seat.LS_SEAT_LABEL !== null && payload.seatIds.includes(seat.LS_SEAT_LABEL),
  );

  if (targetSeats.length === 0) return;

  try {
    await Promise.all(targetSeats.map((seat) => updateSeatStatus(seat.LS_ID, nextStatusCode)));
    targetSeats.forEach((seat) => {
      seat.LS_SEAT_STATUS = nextStatusCode;
    });
  } catch (error) {
    console.error('Error updating location seat status:', error);
    $q.notify({
      type: 'negative',
      message: 'ไม่สามารถอัปเดตสถานะที่นั่งได้',
      position: 'top',
    });
  }
};

watch(
  selectedLocationIds,
  (ids) => {
    if (activeLocationId.value !== null && ids.includes(activeLocationId.value)) return;

    activeLocationId.value = ids[0] ?? null;
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.room-preview-card {
  overflow: hidden;
}

.room-preview-section {
  padding: 12px 36px 32px;
}

.room-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: -2px;
  margin-bottom: 12px;
}

.room-tabs {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  max-width: min(54%, 560px);
  overflow-x: auto;
  padding: 2px 6px 6px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.room-tab {
  min-width: 198px;
  max-width: 220px;
  height: 46px;
  padding: 0 14px;
  border: 0;
  border-left: 1px solid var(--border-color);
  background: #d0d0d0;
  color: #777777;
  font-family: var(--font-family-base);
  font-size: 16px;
  font-weight: 700;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  box-shadow:
    -3px 0 4px -3px #00000040,
    3px 0 4px -3px #00000040;
}

.room-tab--active {
  background: #ffffff;
  color: #111111;
  border-radius: 6px 6px 0 0;
  box-shadow:
    -3px 0 4px -3px #00000040,
    3px 0 4px -3px #00000040;
}

.room-preview-shell {
  position: relative;
  height: 650px;
  min-height: 650px;
  border: 1px solid #ededed;
  border-top: 0;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 8px 6px -6px #00000040;
  padding: 24px 34px 18px;
  overflow: hidden;

  :deep(.exam-seat-preview) {
    position: relative;
    z-index: 1;
    min-height: 0;
  }

  :deep(.seat-preview-content) {
    padding-top: 14px;
  }
}

.room-preview-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 15px;
}

@media (max-width: 1023px) {
  .room-preview-section {
    padding: 20px;
  }

  .room-preview-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }

  .room-tabs {
    width: 100%;
    max-width: 100%;
  }

  .room-preview-shell {
    height: 520px;
    min-height: 520px;
    padding: 18px 14px;
  }
}
</style>
