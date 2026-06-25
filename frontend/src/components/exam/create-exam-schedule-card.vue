<template>
  <q-card flat bordered class="buu-premium-card q-mb-xl">
    <q-card-section>
      <!-- Header Row: Title + Add Button -->
      <div class="row items-center justify-between q-mb-md section-header">
        <div class="row items-center no-wrap">
          <q-icon name="calendar_today" size="20px" class="q-mr-sm text-dark" />
          <div class="text-subtitle1 text-weight-bold text-dark">กำหนดการสอบ</div>
        </div>
        <q-btn
          v-if="!locked"
          label="เพิ่มรอบเวลาสอบ"
          color="primary"
          outline
          dense
          icon="add_circle"
          class="q-px-md add-slot-btn"
          :disabled="form.timeSlots.length >= MAX_EXAM_SESSIONS"
          @click="$emit('add-time-slot')"
        />
      </div>

      <!-- Time Slot Tabs -->
      <div class="slot-tabs-row q-mb-lg">
        <div
          v-for="(slot, index) in form.timeSlots"
          :key="index"
          class="slot-tab"
          :class="{ 'slot-tab--active': activeSlotIndex === index }"
          @click="$emit('update:activeSlotIndex', index)"
        >
          <span class="slot-tab__label">
            {{ getSlotLabel(slot, index) }}
          </span>
          <q-icon
            v-if="!locked && form.timeSlots.length > 1"
            name="close"
            size="14px"
            class="slot-tab__close"
            @click.stop="$emit('remove-time-slot', index)"
          />
        </div>
      </div>

      <!-- Active Slot Content -->
      <div v-if="activeSlot" class="active-slot-content">
        <!-- Date and Time Row -->
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-md-6" data-field="examDate">
            <div class="buu-label-muted q-mb-xs">วันที่สอบ</div>
            <q-input
              v-model="form.examDate"
              outlined
              dense
              class="custom-input cursor-pointer"
              :class="{ 'buu-field-error': hasError('examDate') }"
              readonly
              :disable="locked"
              hide-bottom-space
              @click="!locked && (showExamDate = true)"
            >
              <template v-slot:append>
                <template v-if="!locked">
                  <q-icon
                    name="calendar_today"
                    class="cursor-pointer"
                    size="xs"
                    color="grey-8"
                    @click.stop="showExamDate = true"
                  />
                  <q-menu
                    v-model="showExamDate"
                    anchor="bottom left"
                    self="top left"
                    class="shadow-5 calendar-menu"
                  >
                    <AppCalendar
                      :model-value="beToCeString(form.examDate)"
                      @update:model-value="
                        (val: string) => {
                          form.examDate = ceToBeString(val);
                          emit('clearFieldError', 'examDate');
                        }
                      "
                      @click-date="showExamDate = false"
                    />
                  </q-menu>
                </template>
                <q-icon v-else name="lock" size="xs" color="grey-5" />
              </template>
            </q-input>
            <div v-if="hasError('examDate')" :key="`examDate-${shakeKey}`" class="buu-error-msg">
              <q-icon name="error" class="buu-error-icon" />
              {{ fieldErrors!.examDate }}
            </div>
            <div
              v-if="dateErrors?.examDate"
              class="text-caption text-negative q-mt-xs row items-center no-wrap"
            >
              <q-icon name="error" size="14px" class="q-mr-xs" />
              {{ dateErrors.examDate }}
            </div>
          </div>
          <div class="col-6 col-md-3" :data-field="`startTime_${activeSlotIndex}`">
            <div class="buu-label-muted q-mb-xs">เวลาเริ่ม</div>
            <app-time-picker
              v-model="activeSlot.startTime"
              outlined
              dense
              class="custom-input"
              :class="{ 'buu-field-error': hasError(`startTime_${activeSlotIndex}`) }"
              placeholder="08:00"
              hide-bottom-space
              :disable="locked"
              @select="onTimeSelected('startTime')"
            />
            <div
              v-if="hasError(`startTime_${activeSlotIndex}`)"
              :key="`startTime-${shakeKey}`"
              class="buu-error-msg"
            >
              <q-icon name="error" class="buu-error-icon" />
              {{ fieldErrors![`startTime_${activeSlotIndex}`] }}
            </div>
          </div>
          <div class="col-6 col-md-3" :data-field="`endTime_${activeSlotIndex}`">
            <div class="buu-label-muted q-mb-xs">เวลาสิ้นสุด</div>
            <app-time-picker
              v-model="activeSlot.endTime"
              outlined
              dense
              class="custom-input"
              :class="{ 'buu-field-error': hasError(`endTime_${activeSlotIndex}`) }"
              placeholder="10:00"
              hide-bottom-space
              :disable="locked"
              @select="onTimeSelected('endTime')"
            />
            <div
              v-if="hasError(`endTime_${activeSlotIndex}`)"
              :key="`endTime-${shakeKey}`"
              class="buu-error-msg"
            >
              <q-icon name="error" class="buu-error-icon" />
              {{ fieldErrors![`endTime_${activeSlotIndex}`] }}
            </div>
          </div>
        </div>

        <!-- Rooms Section -->
        <div class="rooms-section">
          <div class="row items-center justify-between q-mb-sm">
            <div class="rooms-title">สถานที่สอบ ผู้คุมสอบ และจำนวนที่นั่ง</div>
            <q-btn
              v-if="!locked"
              label="เพิ่มห้องสอบ"
              color="primary"
              unelevated
              dense
              class="q-px-md add-room-btn"
              @click="$emit('add-room', activeSlotIndex)"
            />
          </div>

          <!-- Room Header -->
          <div class="room-header row q-col-gutter-sm q-mb-xs">
            <div class="col-12 col-md-6">
              <span class="buu-label-muted">สถานที่สอบ</span>
            </div>
            <div class="col-12 col-md-3">
              <span class="buu-label-muted">ผู้คุมสอบ</span>
            </div>
            <div class="col-12 col-md-3">
              <span class="buu-label-muted">จำนวนที่นั่ง</span>
            </div>
          </div>

          <!-- Room Rows -->
          <div
            v-for="(room, rIdx) in activeSlot.rooms"
            :key="rIdx"
            class="row items-start q-col-gutter-sm q-mb-sm"
          >
            <div class="col-12 col-md-6" :data-field="`locationId_${activeSlotIndex}_${rIdx}`">
              <app-select
                v-model="room.locationId"
                :options="getAvailableLocationOptions(rIdx)"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                outlined
                dense
                placeholder="เลือกสถานที่สอบ"
                dropdown-icon="keyboard_arrow_down"
                class="custom-input"
                :class="{ 'buu-field-error': hasError(`locationId_${activeSlotIndex}_${rIdx}`) }"
                :disable="locked"
                @update:model-value="onLocationChange(room, activeSlotIndex, rIdx)"
              >
                <template v-slot:option="scope">
                  <q-item
                    v-bind="scope.itemProps"
                    :disable="!!scope.opt.disable"
                    :class="{ 'location-disabled': scope.opt.disable }"
                  >
                    <q-item-section>
                      <q-item-label :class="{ 'text-grey-5': scope.opt.disable }">
                        {{ scope.opt.label }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section v-if="scope.opt.disable" side>
                      <q-badge
                        v-if="scope.opt.isSelectedByOther"
                        color="blue-2"
                        text-color="blue-9"
                        label="เลือกแล้ว"
                      />
                      <q-badge v-else color="orange-3" text-color="orange-9" label="ไม่ว่าง" />
                    </q-item-section>
                  </q-item>
                </template>
              </app-select>
              <div
                v-if="hasError(`locationId_${activeSlotIndex}_${rIdx}`)"
                :key="`loc-${rIdx}-${shakeKey}`"
                class="buu-error-msg"
              >
                <q-icon name="error" class="buu-error-icon" />
                {{ fieldErrors![`locationId_${activeSlotIndex}_${rIdx}`] }}
              </div>
            </div>
            <div class="col-12 col-md-3">
              <app-select
                v-model="room.proctors"
                multiple
                use-chips
                use-input
                new-value-mode="add-unique"
                :options="filteredProctors"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                outlined
                dense
                placeholder=""
                dropdown-icon="keyboard_arrow_down"
                class="custom-input proctors-select"
                :class="`proctors-select-${rIdx}`"
                input-debounce="0"
                @filter="filterProctors"
                @popup-show="scrollProctorsToRight(rIdx)"
                @popup-hide="scrollProctorsToLeft(rIdx)"
                @input-value="scrollProctorsToRight(rIdx)"
                @focus="scrollProctorsToRight(rIdx)"
                @blur="scrollProctorsToLeft(rIdx)"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>
                        {{
                          typeof scope.opt === 'object' && scope.opt ? scope.opt.label : scope.opt
                        }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section v-if="scope.selected" side>
                      <q-icon name="check" color="primary" size="20px" />
                    </q-item-section>
                  </q-item>
                </template>
              </app-select>
            </div>
            <div class="col-12 col-md-3" :data-field="`seats_${activeSlotIndex}_${rIdx}`">
              <div class="row no-wrap items-center">
                <div class="col">
                  <q-input
                    v-model.number="room.seats"
                    type="number"
                    outlined
                    dense
                    class="custom-input seats-input"
                    :class="{
                      'buu-field-error':
                        hasError(`seats_${activeSlotIndex}_${rIdx}`) ||
                        (room.locationId && room.seats > getRoomMaxSeats(room)),
                    }"
                    :placeholder="
                      room.locationId ? String(getRoomMaxSeats(room)) : DEFAULT_SEATS_PLACEHOLDER
                    "
                    min="1"
                    :max="getRoomMaxSeats(room)"
                    :disable="locked"
                    @keydown="preventNegativeAndDecimal"
                    @update:model-value="
                      (val: string | number | null) => {
                        emit('clearFieldError', `seats_${activeSlotIndex}_${rIdx}`);
                        clampRoomSeats(room, val);
                      }
                    "
                  >
                    <q-tooltip v-if="room.locationId" class="bg-grey-8 text-body2">
                      จำนวนที่นั่งสูงสุดตามผังที่แก้ไขคือ {{ getRoomMaxSeats(room) }} ที่นั่ง
                    </q-tooltip>
                  </q-input>
                </div>
                <div
                  v-if="!locked && activeSlot.rooms.length > 1"
                  class="col-auto q-ml-sm"
                  style="width: 24px"
                >
                  <q-icon
                    name="delete"
                    class="cursor-pointer"
                    size="sm"
                    color="dark"
                    @click="$emit('remove-room', activeSlotIndex, rIdx)"
                  />
                </div>
              </div>
              <div
                v-if="room.locationId && room.seats > getRoomMaxSeats(room)"
                class="buu-error-msg"
              >
                <q-icon name="error" class="buu-error-icon" />
                จำนวนที่นั่งเกินผังที่แก้ไข มีที่นั่งใช้ได้ไม่เกิน
                {{ getRoomMaxSeats(room) }} ที่นั่ง
              </div>
              <div
                v-else-if="hasError(`seats_${activeSlotIndex}_${rIdx}`)"
                :key="`seats-${rIdx}-${shakeKey}`"
                class="buu-error-msg"
              >
                <q-icon name="error" class="buu-error-icon" />
                {{ fieldErrors![`seats_${activeSlotIndex}_${rIdx}`] }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { CreateExamForm, TimeSlot, ExamRoom } from 'src/composables/use-create-exam';
import type { ExamLocationOption } from 'src/services/exam.service';
import AppCalendar from 'src/components/shared/app-calendar.vue';
import AppSelect from 'src/components/base/app-select.vue';
import AppTimePicker from 'src/components/base/app-time-picker.vue';
import { beToCeString, ceToBeString } from 'src/utils/thai-date';
import { MAX_EXAM_SESSIONS } from 'src/constants/exam';

const props = defineProps<{
  /** When true, disables all schedule editing (for published exams) */
  locked?: boolean;
  /** Location options from the API */
  locationOptions: ExamLocationOption[];
  /** Location IDs occupied by other exams on the same date+time */
  occupiedLocationIds?: Set<number>;
  /** Proctor options (from API) */
  proctorOptions: { label: string; value: string }[];
  /** Currently active slot tab index */
  activeSlotIndex: number;
  /** Date validation errors */
  dateErrors?: Record<string, string>;
  /** Field-level validation errors */
  fieldErrors?: Record<string, string>;
  /** Key to re-trigger shake animation */
  shakeKey?: number;
}>();

const form = defineModel<CreateExamForm>('form', { required: true });

const emit = defineEmits([
  'add-time-slot',
  'remove-time-slot',
  'add-room',
  'remove-room',
  'update:activeSlotIndex',
  'sort-time-slots',
  'clearFieldError',
]);

const DEFAULT_SEATS_PLACEHOLDER = '40';
const DEFAULT_MAX_SEATS = 9999;
const SEAT_STATUS_UNAVAILABLE_1 = 1;
const SEAT_STATUS_UNAVAILABLE_2 = 2;
const SCROLL_DELAY_MS = 50;

const showExamDate = ref(false);

const filteredProctors = ref<{ label: string; value: string }[]>([]);

watch(
  () => props.proctorOptions,
  (newVal) => {
    filteredProctors.value = newVal;
  },
  { immediate: true },
);

const filterProctors = (val: string, update: (callback: () => void) => void): void => {
  if (val === '') {
    update(() => {
      filteredProctors.value = props.proctorOptions;
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    filteredProctors.value = props.proctorOptions.filter((v) =>
      v.label.toLowerCase().includes(needle),
    );
  });
};

const scrollProctorsToLeft = (rIdx: number): void => {
  setTimeout(() => {
    const el = document.querySelector(`.proctors-select-${rIdx} .q-field__native`);
    if (el) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, SCROLL_DELAY_MS);
};

const scrollProctorsToRight = (rIdx: number): void => {
  setTimeout(() => {
    const el = document.querySelector(`.proctors-select-${rIdx} .q-field__native`);
    if (el) {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    }
  }, SCROLL_DELAY_MS);
};

const preventNegativeAndDecimal = (evt: KeyboardEvent): void => {
  if (['-', '+', 'e', 'E', '.', ','].includes(evt.key)) {
    evt.preventDefault();
  }
};

const getLocationMaxSeats = (locationId: number | null): number => {
  if (!locationId) return DEFAULT_MAX_SEATS;
  const option = props.locationOptions.find((opt) => opt.value === locationId);
  if (!option || !option.raw) return DEFAULT_MAX_SEATS;
  const seats = option.raw.SEATS;
  if (seats) {
    return seats.filter(
      (seat) =>
        seat.LS_SEAT_STATUS !== SEAT_STATUS_UNAVAILABLE_1 &&
        seat.LS_SEAT_STATUS !== SEAT_STATUS_UNAVAILABLE_2,
    ).length;
  }
  if (
    option.raw.LOCATION_SEAT_CAPACITY !== undefined &&
    option.raw.LOCATION_SEAT_CAPACITY !== null
  ) {
    return option.raw.LOCATION_SEAT_CAPACITY;
  }
  return 0;
};

const getRoomMaxSeats = (room: ExamRoom): number => {
  if (!room.locationId) return DEFAULT_MAX_SEATS;
  const option = props.locationOptions.find((opt) => opt.value === room.locationId);
  if (!option?.raw) return DEFAULT_MAX_SEATS;
  const seats = option.raw.SEATS;

  if (seats) {
    return seats.filter((seat) => {
      const status = room.seatOverrides?.[seat.LS_ID] ?? seat.LS_SEAT_STATUS;
      return status !== SEAT_STATUS_UNAVAILABLE_1 && status !== SEAT_STATUS_UNAVAILABLE_2;
    }).length;
  }

  return getLocationMaxSeats(room.locationId);
};

const clampRoomSeats = (room: ExamRoom, value: string | number | null): void => {
  const maxSeats = getRoomMaxSeats(room);
  const numericValue = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);

  if (!Number.isFinite(numericValue)) return;
  if (numericValue < 1) {
    room.seats = 1;
    return;
  }

  if (numericValue > maxSeats) {
    room.seats = maxSeats;
  }
};

const getAvailableLocationOptions = (
  roomIndex: number,
): (ExamLocationOption & { disable?: boolean; isSelectedByOther?: boolean })[] => {
  if (!activeSlot.value) return props.locationOptions;

  // Location IDs ที่ห้องอื่นใน slot เดียวกันเลือกไว้แล้ว
  const selectedByOtherRooms = new Set(
    activeSlot.value.rooms
      .filter((_, index) => index !== roomIndex)
      .map((room) => room.locationId)
      .filter((locationId): locationId is number => locationId !== null),
  );

  const occupied = props.occupiedLocationIds ?? new Set<number>();

  return props.locationOptions.map((option) => {
    const isSelectedByOther = selectedByOtherRooms.has(option.value);
    const isOccupied = occupied.has(option.value);
    return {
      ...option,
      disable: isOccupied || isSelectedByOther,
      isSelectedByOther,
    };
  });
};

const onLocationChange = (room: ExamRoom, slotIdx: number, roomIdx: number): void => {
  emit('clearFieldError', `locationId_${slotIdx}_${roomIdx}`);
  room.seatOverrides = {};
  delete room.sessionLocationSnapshot;

  const maxSeats = getLocationMaxSeats(room.locationId);
  if (maxSeats > 0 && maxSeats !== DEFAULT_MAX_SEATS) {
    room.seats = maxSeats;
  }
};

const activeSlot = computed(() => form.value.timeSlots[props.activeSlotIndex]);

/** Check if a field has an error */
const hasError = (field: string): boolean => {
  return !!(props.fieldErrors && props.fieldErrors[field]);
};

const onTimeSelected = (field: 'startTime' | 'endTime'): void => {
  emit('clearFieldError', `${field}_${props.activeSlotIndex}`);
  emit('sort-time-slots');
};

const getSlotLabel = (slot: TimeSlot, index: number): string => {
  const start = slot.startTime?.trim();
  const end = slot.endTime?.trim();
  if (start && end) {
    return `${start.replace(/\s/g, '')}-${end.replace(/\s/g, '')}`;
  }
  return `รอบที่ ${index + 1}`;
};
</script>

<style scoped>
.section-header {
  gap: 2px;
}
.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}
.add-slot-btn {
  border-radius: 8px;
}
.add-room-btn {
  border-radius: 8px;
}

/* Active Slot Container */
.active-slot-content {
  background-color: var(--neutral-100);
  border-radius: var(--radius-sm);
  padding: 24px;
}

/* Time Slot Tabs */
.slot-tabs-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  border-bottom: 1px solid var(--neutral-200);
}
.slot-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.slot-tab:hover {
  color: var(--primary);
}
.slot-tab--active {
  color: var(--primary);
  font-weight: 600;
  border-bottom: 2px solid var(--primary);
}
.slot-tab__label {
  white-space: nowrap;
}
.slot-tab__close {
  color: var(--text-primary);
  cursor: pointer;
  transition: color 0.15s;
}
.slot-tab__close:hover {
  color: var(--negative);
}

/* Rooms Section */
.rooms-section {
  padding-top: 8px;
}
.rooms-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}
/* Field Styles */
.custom-input :deep(.q-field__control) {
  border-radius: var(--radius-sm);
  background-color: var(--surface-card);
}
.custom-input :deep(.q-field__control::before) {
  border-color: var(--neutral-200);
}
.calendar-menu {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.location-disabled {
  background-color: var(--neutral-100) !important;
  cursor: not-allowed !important;
  opacity: 0.8;
}

.proctors-select :deep(.q-field__native) {
  flex-flow: row nowrap !important;
  align-items: center !important;
  gap: 4px;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.proctors-select :deep(.q-field__native)::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.proctors-select :deep(.q-chip) {
  flex: 0 0 auto !important;
  margin: 2px 0 !important;
  max-width: none !important;
}
.proctors-select:not(.q-field--focused):not(.app-select--open) :deep(.q-field__input) {
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  opacity: 0 !important;
}
.proctors-select :deep(.q-field__input) {
  min-width: 80px !important;
  max-width: 150px !important;
  flex: 1 1 auto !important;
}
</style>
