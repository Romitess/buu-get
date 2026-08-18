<template>
  <q-card flat bordered class="buu-premium-card q-mb-xl room-preview-card">
    <q-card-section class="room-preview-section">
      <div class="room-preview-header">
        <div class="row items-center no-wrap">
          <q-icon name="event_seat" size="22px" class="q-mr-sm text-black" />
          <div class="text-subtitle1 text-weight-bold text-dark">{{ t('admin.examForm.cards.roomPreview') }}</div>
        </div>

        <div v-if="selectedRooms.length > 0" class="room-tabs" role="tablist">
          <button
            v-for="room in selectedRooms"
            :key="room.key"
            class="room-tab"
            :class="{ 'room-tab--active': room.key === activeRoomKey }"
            type="button"
            role="tab"
            :aria-selected="room.key === activeRoomKey"
            @click="activeRoomKey = room.key"
          >
            {{ room.label }}
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

        <div v-else-if="isLoadingData" class="room-preview-empty">
          <RoomPreviewSkeleton />
        </div>

        <div v-else class="room-preview-empty">
          <q-icon name="meeting_room" size="40px" color="grey-5" />
          <div>{{ t('admin.examForm.empty.selectLocationForSeatMap') }}</div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { CreateExamForm, ExamRoom } from 'src/composables/use-create-exam';
import type { ExamLocationOption } from 'src/services/exam.service';
import type { BackendLocation } from 'src/types/exam';
import AppExamSeatPreview from 'src/components/exam/app-exam-seat-preview.vue';
import { RoomPreviewSkeleton } from 'src/components/base/skeleton';

interface WalkwayPosition {
  type: 'row' | 'column';
  index: number;
}

type SeatStatusOption = 'available' | 'omitted' | 'broken';

interface SelectedRoom {
  key: string;
  label: string;
  slotIndex: number;
  roomIndex: number;
  option: ExamLocationOption;
}

const props = defineProps<{
  locationOptions: ExamLocationOption[];
  activeSlotIndex: number;
  isLoadingData: boolean;
}>();

const form = defineModel<CreateExamForm>('form', { required: true });
const $q = useQuasar();
const { t } = useI18n();

const activeRoomKey = ref<string | null>(null);

const selectedRooms = computed<SelectedRoom[]>(() => {
  const rooms: SelectedRoom[] = [];

  const activeSlot = form.value.timeSlots[props.activeSlotIndex];
  if (!activeSlot) return rooms;

  activeSlot.rooms.forEach((room, roomIndex) => {
    if (room.locationId === null) return;

    const option = props.locationOptions.find((location) => location.value === room.locationId);
    if (!option) return;

    rooms.push({
      key: `${props.activeSlotIndex}-${roomIndex}`,
      label:
        activeSlot.rooms.length > 1
          ? `${option.label} (${activeSlot.startTime || '--:--'}-${activeSlot.endTime || '--:--'})`
          : option.label,
      slotIndex: props.activeSlotIndex,
      roomIndex,
      option,
    });
  });

  return rooms;
});

const activeSelectedRoom = computed<SelectedRoom | null>(() => {
  return (
    selectedRooms.value.find((room) => room.key === activeRoomKey.value) ??
    selectedRooms.value[0] ??
    null
  );
});

const activeRoom = computed<ExamRoom | null>(() => {
  const selectedRoom = activeSelectedRoom.value;
  if (!selectedRoom) return null;

  return form.value.timeSlots[selectedRoom.slotIndex]?.rooms[selectedRoom.roomIndex] ?? null;
});

const activeOption = computed<ExamLocationOption | null>(
  () => activeSelectedRoom.value?.option ?? null,
);

const activeLocation = computed<BackendLocation | null>(() => activeOption.value?.raw ?? null);

const activeSeatOverrides = computed<Record<number, number>>(
  () => activeRoom.value?.seatOverrides ?? {},
);

const activeSessionSnapshot = computed(() => activeRoom.value?.sessionLocationSnapshot ?? null);

const activeRows = computed<number>(() => {
  if (activeSessionSnapshot.value?.TOTAL_ROWS) return activeSessionSnapshot.value.TOTAL_ROWS;
  if (activeLocation.value?.LOCATION_TOTAL_ROWS) return activeLocation.value.LOCATION_TOTAL_ROWS;

  return Math.max(...(activeLocation.value?.SEATS ?? []).map((seat) => seat.LS_ROW_NO), 0);
});

const activeCols = computed<number>(() => {
  if (activeSessionSnapshot.value?.TOTAL_COLS) return activeSessionSnapshot.value.TOTAL_COLS;
  if (activeLocation.value?.LOCATION_TOTAL_COLS) return activeLocation.value.LOCATION_TOTAL_COLS;

  return Math.max(...(activeLocation.value?.SEATS ?? []).map((seat) => seat.LS_COL_NO), 0);
});

const numberingDirection = computed<'horizontal' | 'vertical'>(() =>
  (activeSessionSnapshot.value?.LOCATION_SEAT_DIRECTION ??
    activeLocation.value?.LOCATION_SEAT_DIRECTION ??
    activeLocation.value?.SEAT_DIRECTION) === 'HORIZONTAL'
    ? 'horizontal'
    : 'vertical',
);

const locationAisleAfter = computed<{ after_cols: number[]; after_rows: number[] }>(() => {
  const location = activeLocation.value;
  if (!location) return { after_cols: [], after_rows: [] };

  const combined = location.LOCATION_AISLE_AFTER_COL ?? [];

  return {
    after_cols: [
      ...(location.AISLE_AFTER_COLS ?? []),
      ...combined
        .filter((item): item is { type: 'column'; index: number } =>
          typeof item === 'object' ? item.type === 'column' : false,
        )
        .map((item) => item.index),
      ...combined.filter((item): item is number => typeof item === 'number'),
    ],
    after_rows: [
      ...(location.AISLE_AFTER_ROWS ?? []),
      ...combined
        .filter((item): item is { type: 'row'; index: number } =>
          typeof item === 'object' ? item.type === 'row' : false,
        )
        .map((item) => item.index),
    ],
  };
});

const hasAisleAfter = (
  aisleAfter: { after_cols: number[]; after_rows: number[] } | null | undefined,
): aisleAfter is { after_cols: number[]; after_rows: number[] } => {
  return Boolean(
    aisleAfter && (aisleAfter.after_cols.length > 0 || aisleAfter.after_rows.length > 0),
  );
};

const activeAisleAfter = computed<{ after_cols: number[]; after_rows: number[] }>(() => {
  const snapshotAisleAfter = activeSessionSnapshot.value?.AISLE_AFTER;
  if (hasAisleAfter(snapshotAisleAfter)) return snapshotAisleAfter;

  return locationAisleAfter.value;
});

const walkwayPositions = computed<WalkwayPosition[]>(() => [
  ...activeAisleAfter.value.after_rows.map((index) => ({
    type: 'row' as const,
    index,
  })),
  ...activeAisleAfter.value.after_cols.map((index) => ({
    type: 'column' as const,
    index,
  })),
]);

const omittedSeats = computed<Set<string>>(() => {
  const seats = (activeLocation.value?.SEATS ?? [])
    .filter(
      (seat) =>
        (activeSeatOverrides.value[seat.LS_ID] ?? seat.LS_SEAT_STATUS) === 2 && seat.LS_SEAT_LABEL,
    )
    .map((seat) => seat.LS_SEAT_LABEL as string);

  return new Set(seats);
});

const brokenSeats = computed<Set<string>>(() => {
  const seats = (activeLocation.value?.SEATS ?? [])
    .filter(
      (seat) =>
        (activeSeatOverrides.value[seat.LS_ID] ?? seat.LS_SEAT_STATUS) === 1 && seat.LS_SEAT_LABEL,
    )
    .map((seat) => seat.LS_SEAT_LABEL as string);

  return new Set(seats);
});

const getSeatStatusCode = (status: SeatStatusOption): number => {
  if (status === 'broken') return 1;
  if (status === 'omitted') return 2;

  return 0;
};

const countAvailableSeats = (
  location: BackendLocation,
  seatOverrides?: Record<number, number>,
): number => {
  return (location.SEATS ?? []).filter(
    (seat) => (seatOverrides?.[seat.LS_ID] ?? seat.LS_SEAT_STATUS) === 0,
  ).length;
};

const handleSeatStatusChange = (payload: { seatIds: string[]; status: SeatStatusOption }): void => {
  const location = activeLocation.value;
  const room = activeRoom.value;
  if (!location?.SEATS?.length || !room) return;

  const nextStatusCode = getSeatStatusCode(payload.status);
  const targetSeats = location.SEATS.filter(
    (seat) => seat.LS_SEAT_LABEL !== null && payload.seatIds.includes(seat.LS_SEAT_LABEL),
  );

  if (targetSeats.length === 0) return;

  try {
    const nextOverrides = { ...(room.seatOverrides ?? {}) };
    const previousMaxSeats = countAvailableSeats(location, nextOverrides);

    targetSeats.forEach((seat) => {
      if (seat.LS_SEAT_STATUS === nextStatusCode) {
        delete nextOverrides[seat.LS_ID];
        return;
      }

      nextOverrides[seat.LS_ID] = nextStatusCode;
    });

    room.seatOverrides = nextOverrides;
    const maxSeats = countAvailableSeats(location, nextOverrides);
    if (room.seats > maxSeats) {
      room.seats = maxSeats;
    } else if (maxSeats > previousMaxSeats) {
      room.seats = Math.min(room.seats + (maxSeats - previousMaxSeats), maxSeats);
    }
  } catch (error) {
    console.error('Error updating location seat status:', error);
    $q.notify({
      type: 'negative',
      message: t('admin.examForm.notify.seatUpdateError'),
      position: 'top',
    });
  }
};

watch(
  selectedRooms,
  (rooms) => {
    if (activeRoomKey.value !== null && rooms.some((room) => room.key === activeRoomKey.value)) {
      return;
    }

    activeRoomKey.value = rooms[0]?.key ?? null;
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
