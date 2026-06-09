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
            <q-input
              v-model="activeSlot.startTime"
              outlined
              dense
              class="custom-input"
              :class="{ 'buu-field-error': hasError(`startTime_${activeSlotIndex}`) }"
              placeholder="08:00"
              mask="##:##"
              hide-bottom-space
              :disable="locked"
              @blur="onTimeBlur('startTime')"
              @update:model-value="emit('clearFieldError', `startTime_${activeSlotIndex}`)"
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
            <q-input
              v-model="activeSlot.endTime"
              outlined
              dense
              class="custom-input"
              :class="{ 'buu-field-error': hasError(`endTime_${activeSlotIndex}`) }"
              placeholder="10:00"
              mask="##:##"
              hide-bottom-space
              :disable="locked"
              @blur="onTimeBlur('endTime')"
              @update:model-value="emit('clearFieldError', `endTime_${activeSlotIndex}`)"
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
              <q-select
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
              />
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
              <q-select
                v-model="room.proctors"
                multiple
                use-chips
                :options="proctorOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                outlined
                dense
                placeholder="เลือกผู้คุมสอบ"
                dropdown-icon="keyboard_arrow_down"
                class="custom-input"
              />
            </div>
            <div class="col-12 col-md-3" :data-field="`seats_${activeSlotIndex}_${rIdx}`">
              <div class="row no-wrap items-center">
                <div class="col">
                  <q-input
                    v-model.number="room.seats"
                    type="number"
                    outlined
                    dense
                    class="custom-input"
                    :class="{
                      'buu-field-error':
                        hasError(`seats_${activeSlotIndex}_${rIdx}`) ||
                        (room.locationId && room.seats > getLocationMaxSeats(room.locationId)),
                    }"
                    :placeholder="
                      room.locationId ? String(getLocationMaxSeats(room.locationId)) : '40'
                    "
                    min="1"
                    :max="getLocationMaxSeats(room.locationId)"
                    :disable="locked"
                    @keydown="preventNegativeAndDecimal"
                    @update:model-value="
                      (val: string | number | null) => {
                        emit('clearFieldError', `seats_${activeSlotIndex}_${rIdx}`);
                      }
                    "
                  >
                    <q-tooltip v-if="room.locationId" class="bg-primary text-body2">
                      จำนวนที่นั่งสูงสุดของสถานที่นี้คือ
                      {{ getLocationMaxSeats(room.locationId) }} ที่นั่ง
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
                v-if="room.locationId && room.seats > getLocationMaxSeats(room.locationId)"
                class="buu-error-msg"
              >
                <q-icon name="error" class="buu-error-icon" />
                เกินขอบเขตความจุที่นั่งของห้องสอบ มีที่นั่งได้ไม่เกิน
                {{ getLocationMaxSeats(room.locationId) }} ที่นั่ง ในสถานที่นี้
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
import { ref, computed } from 'vue';
import type { CreateExamForm, TimeSlot, ExamRoom } from 'src/composables/use-create-exam';
import type { ExamLocationOption } from 'src/services/exam.service';
import AppCalendar from 'src/components/shared/app-calendar.vue';
import { beToCeString, ceToBeString } from 'src/utils/thai-date';
import { MAX_EXAM_SESSIONS } from 'src/constants/exam';

const props = defineProps<{
  /** When true, disables all schedule editing (for published exams) */
  locked?: boolean;
  /** Location options from the API */
  locationOptions: ExamLocationOption[];
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

const showExamDate = ref(false);

const preventNegativeAndDecimal = (evt: KeyboardEvent) => {
  if (['-', '+', 'e', 'E', '.', ','].includes(evt.key)) {
    evt.preventDefault();
  }
};

const getLocationMaxSeats = (locationId: number | null): number => {
  if (!locationId) return 9999;
  const option = props.locationOptions.find((opt) => opt.value === locationId);
  if (!option || !option.raw) return 9999;
  if (
    option.raw.LOCATION_SEAT_CAPACITY !== undefined &&
    option.raw.LOCATION_SEAT_CAPACITY !== null
  ) {
    return option.raw.LOCATION_SEAT_CAPACITY;
  }
  const seats = option.raw.SEATS;
  if (!seats) return 0;
  return seats.filter((s) => s.LS_SEAT_STATUS !== 1).length;
};

const getAvailableLocationOptions = (roomIndex: number): ExamLocationOption[] => {
  if (!activeSlot.value) return props.locationOptions;

  const selectedByOtherRooms = new Set(
    activeSlot.value.rooms
      .filter((_, index) => index !== roomIndex)
      .map((room) => room.locationId)
      .filter((locationId): locationId is number => locationId !== null),
  );

  return props.locationOptions.filter((option) => !selectedByOtherRooms.has(option.value));
};

const onLocationChange = (room: ExamRoom, slotIdx: number, roomIdx: number) => {
  emit('clearFieldError', `locationId_${slotIdx}_${roomIdx}`);

  const maxSeats = getLocationMaxSeats(room.locationId);
  if (maxSeats > 0 && maxSeats !== 9999) {
    room.seats = maxSeats;
  }
};

const activeSlot = computed(() => form.value.timeSlots[props.activeSlotIndex]);

/** Check if a field has an error */
const hasError = (field: string): boolean => {
  return !!(props.fieldErrors && props.fieldErrors[field]);
};

const onTimeBlur = (field: 'startTime' | 'endTime') => {
  if (activeSlot.value) {
    activeSlot.value[field] = autoFormatTime(activeSlot.value[field]);
    emit('sort-time-slots');
  }
};

const getSlotLabel = (slot: TimeSlot, index: number): string => {
  const start = slot.startTime?.trim();
  const end = slot.endTime?.trim();
  if (start && end) {
    return `${start.replace(/\s/g, '')}-${end.replace(/\s/g, '')}`;
  }
  return `รอบที่ ${index + 1}`;
};

const autoFormatTime = (time: string): string => {
  if (!time) return '';
  const digits = time.replace(/\D/g, '');
  if (digits.length === 1 || digits.length === 2) {
    return `${digits.padStart(2, '0')}:00`;
  }
  if (digits.length === 3) {
    return `0${digits.substring(0, 1)}:${digits.substring(1, 3)}`;
  }
  if (digits.length >= 4) {
    return `${digits.substring(0, 2)}:${digits.substring(2, 4)}`;
  }
  return time;
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
  font-size: 13px;
}
.add-room-btn {
  border-radius: 8px;
  font-size: 13px;
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
</style>
