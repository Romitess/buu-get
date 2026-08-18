<template>
  <q-page class="page-container surface-page-bg">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('navigation.editLocation')"
      :subtitle="$t('admin.locationManagement.createPage.subtitle')"
    />

    <div class="row q-col-gutter-md location-create-layout items-stretch">
      <div class="col-12 col-md-auto form-panel">
        <div class="form-card">
          <div class="form-section">
            <div class="row items-center q-mb-sm">
              <q-icon name="info_outline" size="sm" class="section-heading-icon q-mr-sm" />
              <div class="text-h6 text-weight-bold text-black">
                {{ $t('admin.locationManagement.createPage.sections.roomInfo') }}
              </div>
            </div>
            <q-separator class="q-mb-md" color="grey-4" />

            <div class="q-gutter-y-md q-mb-md q-pt-sm">
              <div>
                <div class="buu-label-muted q-mb-xs">
                  {{ $t('admin.locationManagement.createPage.fields.roomName') }}
                </div>
                <q-input
                  v-model="roomName"
                  outlined
                  dense
                  :placeholder="$t('admin.locationManagement.createPage.placeholders.roomName')"
                  class="buu-input-muted"
                  :error="!!formErrors.roomName"
                  :error-message="formErrors.roomName"
                  @update:model-value="clearFieldError('roomName')"
                />
              </div>

              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-7">
                  <div class="buu-label-muted q-mb-xs">
                    {{ $t('admin.locationManagement.createPage.fields.building') }}
                  </div>
                  <q-input
                    v-model="building"
                    outlined
                    dense
                    :placeholder="$t('admin.locationManagement.createPage.placeholders.building')"
                    class="buu-input-muted"
                    :error="!!formErrors.building"
                    :error-message="formErrors.building"
                    @update:model-value="clearFieldError('building')"
                  />
                </div>

                <div class="col-12 col-sm-5">
                  <div class="buu-label-muted q-mb-xs">
                    {{ $t('admin.locationManagement.createPage.fields.floor') }}
                  </div>
                  <q-input
                    v-model="floor"
                    type="number"
                    outlined
                    dense
                    :placeholder="$t('admin.locationManagement.createPage.placeholders.floor')"
                    class="buu-input-muted"
                    :error="!!formErrors.floor"
                    :error-message="formErrors.floor"
                    @update:model-value="clearFieldError('floor')"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="row items-center q-mb-xs">
              <q-icon name="grid_view" size="sm" class="section-heading-icon q-mr-sm" />
              <div class="text-h6 text-weight-bold text-black">
                {{ $t('admin.locationManagement.createPage.sections.seatLayout') }}
              </div>
            </div>
            <q-separator class="q-mb-md" color="grey-4" />

            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-6">
                <div class="buu-label-muted q-mb-xs">
                  {{ $t('admin.locationManagement.createPage.fields.rows') }}
                </div>
                <q-input
                  v-model.number="rows"
                  type="number"
                  outlined
                  dense
                  :placeholder="$t('admin.locationManagement.createPage.placeholders.rows')"
                  class="buu-input-muted"
                  :error="!!formErrors.rows"
                  :error-message="formErrors.rows"
                  min="1"
                  :max="MAX_SEAT_LAYOUT_SIZE"
                  @update:model-value="
                    (val) => {
                      rows = clampSeatLayoutValue(val);
                      clearFieldError('rows');
                    }
                  "
                />
              </div>
              <div class="col-6">
                <div class="buu-label-muted q-mb-xs">
                  {{ $t('admin.locationManagement.createPage.fields.cols') }}
                </div>
                <q-input
                  v-model.number="cols"
                  type="number"
                  outlined
                  dense
                  :placeholder="$t('admin.locationManagement.createPage.placeholders.cols')"
                  class="buu-input-muted"
                  :error="!!formErrors.cols"
                  :error-message="formErrors.cols"
                  min="1"
                  :max="MAX_SEAT_LAYOUT_SIZE"
                  @update:model-value="
                    (val) => {
                      cols = clampSeatLayoutValue(val);
                      clearFieldError('cols');
                    }
                  "
                />
              </div>
            </div>

            <div class="layout-setting-panel">
              <div class="seat-direction-row">
                <div class="seat-direction-label">
                  {{ $t('admin.locationManagement.createPage.fields.seatNumberDirection') }}
                </div>
                <q-btn-toggle
                  v-model="seatNumberDirection"
                  dense
                  unelevated
                  toggle-color="primary"
                  toggle-text-color="white"
                  color="grey-3"
                  text-color="dark"
                  :options="seatDirectionOptions"
                  class="layout-direction-toggle"
                />
              </div>
            </div>

            <AppLocationWalkwayControls
              :positions="selectedWalkwayPositions"
              :numbering-direction="seatNumberDirection"
              @add="isWalkwayDialogOpen = true"
              @remove="removeWalkwayPosition"
            />

            <div class="total-seats-box rounded-borders total-seats-offset">
              <div class="total-seats-content">
                <div class="total-seats-value text-primary text-weight-bold">{{ totalSeats }}</div>
                <div class="total-seats-label">
                  {{ $t('admin.locationManagement.createPage.totalSeats') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AppLocationSeatPreviewPanel
        ref="seatPreviewRef"
        :rows="rows"
        :cols="cols"
        :split-left-right="splitLeftRight"
        :walkway-positions="selectedWalkwayPositions"
        :numbering-direction="seatNumberDirection"
        :is-saving="isSaving"
        @save="handleSave"
      />
    </div>

    <AppWalkwayPositionDialog
      v-model="isWalkwayDialogOpen"
      :rows="normalizedRows"
      :cols="normalizedCols"
      :numbering-direction="seatNumberDirection"
      :selected-positions="selectedWalkwayPositionValues"
      @confirm="handleWalkwayConfirm"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppLocationSeatPreviewPanel from 'src/components/exam/app-location-seat-preview-panel.vue';
import AppLocationWalkwayControls from 'src/components/exam/app-location-walkway-controls.vue';
import AppWalkwayPositionDialog from 'src/components/exam/app-walkway-position-dialog.vue';
import { api } from 'src/boot/axios';
import {
  fetchLocationById,
  fetchLocationSeats,
  updateLocation,
  type LocationAislePositionPayload,
  type BackendLocationSeat,
} from 'src/services/location.service';
import { useRouteResource } from 'src/composables/use-route-resource';
import type { BackendLocation } from 'src/types/exam';
import { isRequestCanceled } from 'src/services/exam.service';

const MAX_SEAT_LAYOUT_SIZE = 25;

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();

const locationId = computed(() => {
  const raw = route.params.locationId;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
});

const { data: locationResource, error: locationLoadError } = useRouteResource<{
  data: BackendLocation & { SEATS: BackendLocationSeat[] };
  seats: BackendLocationSeat[];
}>({
  owningParams: ['locationId'],
  fetcher: async ({ signal, params }) => {
    const id = Number(params.locationId);
    const [data, seats] = await Promise.all([
      fetchLocationById(id, { signal }),
      fetchLocationSeats(id, { signal }),
    ]);
    return { data, seats };
  },
});

const roomName = ref('');
const floor = ref<number | null>(null);
const building = ref('');
const rows = ref<number | null>(null);
const cols = ref<number | null>(null);
const seatNumberDirection = ref<'horizontal' | 'vertical'>('vertical');
const isSaving = ref(false);
const isWalkwayDialogOpen = ref(false);
const seatPreviewRef = ref<InstanceType<typeof AppLocationSeatPreviewPanel> | null>(null);

interface WalkwayPosition {
  type: 'row' | 'column';
  index: number;
}

const selectedWalkwayPositions = ref<WalkwayPosition[]>([]);

interface LocationFormErrors {
  roomName?: string;
  building?: string;
  floor?: string;
  rows?: string;
  cols?: string;
}

const formErrors = ref<LocationFormErrors>({});

const seatDirectionOptions = [
  {
    label: t('admin.locationManagement.createPage.fields.horizontalDirection'),
    value: 'horizontal',
  },
  {
    label: t('admin.locationManagement.createPage.fields.verticalDirection'),
    value: 'vertical',
  },
];

const totalSeats = computed(() => {
  return (rows.value || 0) * (cols.value || 0);
});

const normalizedRows = computed(() => rows.value || 0);
const normalizedCols = computed(() => cols.value || 0);
const splitLeftRight = computed(() => selectedWalkwayPositions.value.length > 0);
const selectedWalkwayPositionValues = computed(() =>
  selectedWalkwayPositions.value.map(
    (position) => `${position.type === 'row' ? 'row' : 'col'}-${position.index}`,
  ),
);

const locationAislePositions = computed<LocationAislePositionPayload[]>(() =>
  [...selectedWalkwayPositions.value]
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'row' ? -1 : 1;
      return a.index - b.index;
    })
    .map((position) => ({ type: position.type, index: position.index })),
);

const clampSeatLayoutValue = (value: unknown): number | null => {
  if (value === '' || value === null || value === undefined) return null;

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;

  return Math.min(MAX_SEAT_LAYOUT_SIZE, Math.max(1, Math.floor(numericValue)));
};

const clearFieldError = (field: keyof LocationFormErrors): void => {
  if (!formErrors.value[field]) return;

  formErrors.value = {
    ...formErrors.value,
    [field]: undefined,
  };
};

const isBlank = (value: string | number | null | undefined): boolean =>
  value === null || value === undefined || String(value).trim() === '';

const validateForm = (): boolean => {
  const errors: LocationFormErrors = {};

  if (isBlank(roomName.value)) {
    errors.roomName = 'กรุณากรอกชื่อห้องสอบ';
  }

  if (isBlank(building.value)) {
    errors.building = 'กรุณากรอกสถานที่/อาคาร';
  }

  if (isBlank(floor.value)) {
    errors.floor = 'กรุณากรอกชั้นที่สอบ';
  }

  if (!rows.value || rows.value < 1) {
    errors.rows = 'กรุณากรอกแถว (Rows)';
  } else if (rows.value > MAX_SEAT_LAYOUT_SIZE) {
    errors.rows = t('admin.locationManagement.createPage.validation.layoutLimit', {
      max: MAX_SEAT_LAYOUT_SIZE,
    });
  }

  if (!cols.value || cols.value < 1) {
    errors.cols = 'กรุณากรอกคอลัมน์ (Cols)';
  } else if (cols.value > MAX_SEAT_LAYOUT_SIZE) {
    errors.cols = t('admin.locationManagement.createPage.validation.layoutLimit', {
      max: MAX_SEAT_LAYOUT_SIZE,
    });
  }

  formErrors.value = errors;

  return Object.keys(errors).length === 0;
};

const parseWalkwayPosition = (positionValue: string): WalkwayPosition | null => {
  const [typeValue, indexValue] = positionValue.split('-');
  const parsedIndex = Number(indexValue);

  if ((typeValue !== 'row' && typeValue !== 'col') || !Number.isInteger(parsedIndex)) return null;

  return {
    type: typeValue === 'row' ? 'row' : 'column',
    index: parsedIndex,
  };
};

const handleWalkwayConfirm = (positionValues: string[]): void => {
  selectedWalkwayPositions.value = positionValues
    .map(parseWalkwayPosition)
    .filter((position): position is WalkwayPosition => position !== null);
};

const removeWalkwayPosition = (position: WalkwayPosition): void => {
  selectedWalkwayPositions.value = selectedWalkwayPositions.value.filter(
    (item) => !(item.type === position.type && item.index === position.index),
  );
};

const buildSeatStatuses = (): Record<string, number> => {
  return seatPreviewRef.value?.getSeatStatuses() ?? {};
};

const applyLoadedLocation = async (
  data: BackendLocation & { SEATS: BackendLocationSeat[] },
  seats: BackendLocationSeat[],
): Promise<void> => {
  const maxSeatRow = Math.max(0, ...seats.map((seat) => seat.LS_ROW_NO));
  const maxSeatCol = Math.max(0, ...seats.map((seat) => seat.LS_COL_NO));

  roomName.value = data.LOCATION_ROOM_NO || '';
  floor.value = data.LOCATION_FLOOR_NO ?? null;
  building.value = data.LOCATION_NAME || '';
  rows.value = data.LOCATION_TOTAL_ROWS ?? (maxSeatRow > 0 ? maxSeatRow : null);
  cols.value = data.LOCATION_TOTAL_COLS ?? (maxSeatCol > 0 ? maxSeatCol : null);
  seatNumberDirection.value = data.SEAT_DIRECTION === 'HORIZONTAL' ? 'horizontal' : 'vertical';
  selectedWalkwayPositions.value = [
    ...(data.AISLE_AFTER_ROWS ?? []).map((index) => ({ type: 'row' as const, index })),
    ...(data.AISLE_AFTER_COLS ?? []).map((index) => ({ type: 'column' as const, index })),
  ];

  await nextTick();
  if (seatPreviewRef.value) {
    const loadedBrokenSeats = new Set<string>();
    const loadedOmittedSeats = new Set<string>();
    const loadedSeats = seats.length > 0 ? seats : (data.SEATS ?? []);

    loadedSeats.forEach((seat) => {
      if (seat.LS_SEAT_STATUS === 1 && seat.LS_SEAT_LABEL) {
        loadedBrokenSeats.add(seat.LS_SEAT_LABEL);
      }
      if (seat.LS_SEAT_STATUS === 2 && seat.LS_SEAT_LABEL) {
        loadedOmittedSeats.add(seat.LS_SEAT_LABEL);
      }
    });

    seatPreviewRef.value.setSeatStatusSets({
      brokenSeats: loadedBrokenSeats,
      omittedSeats: loadedOmittedSeats,
    });
  }
};

watch(locationResource, (payload) => {
  if (!payload) return;
  void applyLoadedLocation(payload.data, payload.seats);
});

watch(locationLoadError, (err) => {
  if (!err || isRequestCanceled(err)) return;
  console.error('Error loading location:', err);
  $q.notify({
    type: 'negative',
    message: 'ไม่สามารถโหลดข้อมูลห้องสอบได้',
    position: 'top',
  });
  void router.push({ name: 'admin-location-management' });
});

const handleSave = async (): Promise<void> => {
  if (!validateForm()) {
    return;
  }

  isSaving.value = true;

  try {
    await updateLocation(locationId.value, {
      LOCATION_NAME: building.value.trim(),
      LOCATION_ROOM_NO: roomName.value.trim() || undefined,
      LOCATION_FLOOR_NO:
        floor.value !== null && String(floor.value).trim() !== '' ? Number(floor.value) : undefined,
      LOCATION_TOTAL_ROWS: Number(rows.value),
      LOCATION_TOTAL_COLS: Number(cols.value),
      LOCATION_SEAT_CAPACITY: Number(totalSeats.value),
      LOCATION_SEAT_DIRECTION:
        seatNumberDirection.value === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL',
      LOCATION_AISLE_AFTER_COL: locationAislePositions.value,
    });

    await api.post(`/exam-location-seats/generate/${locationId.value}`, {
      seatStatuses: buildSeatStatuses(),
    });

    $q.notify({
      type: 'positive',
      message: t('admin.locationManagement.notifications.updateSuccess'),
      position: 'top',
    });
    void router.push({ name: 'admin-location-management' });
  } catch (error) {
    console.error('Error updating location:', error);
    $q.notify({
      type: 'negative',
      message: t('admin.locationManagement.notifications.updateError'),
      position: 'top',
    });
  } finally {
    isSaving.value = false;
  }
};

</script>

<style scoped lang="scss">
@media (max-width: 1023px) {
  .page-container {
    width: 100% !important;
    min-width: 0 !important;
  }
}

.surface-page-bg {
  background-color: var(--surface-page);
}

.location-create-layout {
  margin-top: calc(var(--space-sm) * -1);
}

.form-panel {
  display: flex;
  justify-content: flex-start;
}

.total-seats-box {
  background-color: var(--location-total-seats-bg);
}

.total-seats-offset {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: min(352px, 100%);
  height: 96px;
  margin-top: 12px;
  margin-bottom: 0;
  margin-inline: auto;
  padding: 16px;
  gap: 10px;
  border-radius: 12px;
  flex-shrink: 0;
}

.total-seats-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  min-height: 64px;
  border-radius: 12px;
  gap: 4px;
  opacity: 1;
  transform: translateY(-4px);
}

.total-seats-value {
  font-size: 32px;
  line-height: 36px;
}

.total-seats-label {
  font-family: 'Sarabun', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0;
  text-align: center;
  color: #4b5563;
}

.layout-setting-panel {
  width: min(352px, 100%);
  height: 62px;
  min-height: 62px;
  background: #f3f4f6;
  border: 1px solid #dedede;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.seat-direction-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.seat-direction-label {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  line-height: 1.35;
  white-space: nowrap;
}

.layout-direction-toggle {
  width: 131px;
  min-width: 131px;
  height: 36px;
  min-height: 36px;
  padding: 3px;
  border-radius: 12px;
  background: #dddddd;

  :deep(.q-btn) {
    min-height: 30px;
    min-width: 61px;
    padding-inline: 8px;
    border-radius: 9px;
    font-weight: var(--font-weight-semibold);
    font-size: 13px;
    white-space: nowrap;
  }

  :deep(.q-btn:not(.bg-primary)) {
    background: #dddddd !important;
  }

  :deep(.q-btn.bg-primary) {
    background: #ffffff !important;
    color: var(--primary) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  }
}

.walkway-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 6px;
  margin-top: 18px;
}

.walkway-control-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  min-height: 41px;
}

.walkway-chip-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  flex: 0 1 auto;
  width: max-content;
  min-width: 0;
  max-width: calc(100% - 124px);
  overflow: visible;
  height: 41px;
  padding-bottom: 2px;
  scrollbar-width: none;
  scrollbar-gutter: stable;

  &::-webkit-scrollbar {
    display: none;
    height: 0;
  }
}

.walkway-chip-row--scroll {
  height: 53px;
  overflow-x: auto;
  padding-bottom: 12px;
  scrollbar-width: thin;

  &::-webkit-scrollbar-thumb {
    background: #8d8d8d;
    border-radius: 999px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar {
    display: block;
    height: 4px;
  }
}

.walkway-chip {
  box-sizing: border-box;
  min-width: 0;
  flex: 0 0 102px;
  width: 102px;
  height: 39px;
  min-height: 39px;
  margin: 0;
  padding: 0 6px;
  border-radius: 12px;
  border: 1px solid #dddddd;
  background: #ffffff;
  color: #111111;
  font-family: 'Sarabun', sans-serif;
  font-size: 12px;
  font-weight: 400;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.walkway-chip-label {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
  white-space: nowrap;
}

.walkway-chip-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 8px;
  height: 20px;
  color: #000000;
  font-family: Arial, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 18px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  appearance: none;
}

.walkway-add-btn {
  width: 120px;
  flex: 0 0 120px;
  min-width: 0;
  height: 39px;
  min-height: 39px;
  padding: 0 8px;
  gap: 0;
  border-radius: 12px;
  color: var(--primary, #0d47a1);
  background: #ffffff;

  &::before {
    border: 1px solid var(--primary, #0d47a1);
  }

  :deep(.q-btn__content) {
    gap: 4px;
    flex-wrap: nowrap;
    justify-content: center;
    width: 100%;
  }

  :deep(.q-icon) {
    font-size: 18px;
    color: var(--primary, #0d47a1);
  }

  :deep(.q-icon.on-left) {
    margin-right: 0;
  }

  :deep(.block) {
    color: var(--primary, #0d47a1);
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
  }
}

.section-heading-icon {
  color: var(--Black, #000000);
}

.form-card,
.preview-card {
  width: 100%;
  height: 760px;
  max-height: 760px;
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-card);

  @media (max-width: 1023px) {
    height: auto !important;
    max-height: none !important;
  }
}

.form-card {
  max-width: 400px;
  padding: var(--space-lg) var(--space-lg) 32px;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  justify-content: flex-start;

  @media (max-width: 1023px) {
    max-width: 100% !important;
  }
}

.buu-input-muted {
  :deep(.q-field__bottom) {
    min-height: 20px;
    padding-top: 4px;
  }
}

.preview-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.preview-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;

  @media (max-width: 1023px) {
    height: 500px !important;
    max-height: 500px !important;
  }
}

.preview-scroll {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: var(--space-xs);

  :deep(.seat-preview-content) {
    padding-bottom: var(--space-md);
  }

  :deep(.seat-preview-content--scroll) {
    padding-right: var(--space-sm);
  }

  :deep(.empty-preview) {
    min-height: 240px;
  }
}

.preview-actions {
  flex-shrink: 0;
  margin-top: var(--space-md);
  padding-bottom: var(--space-xs);
}

@media (min-width: 1024px) {
  .form-panel {
    flex: 0 0 calc(400px + var(--space-xl));
    max-width: calc(400px + var(--space-xl));
  }
}
</style>
