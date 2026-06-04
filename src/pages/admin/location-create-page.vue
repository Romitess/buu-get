<template>
  <q-page class="page-container surface-page-bg">
    <!-- Header -->
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.locationManagement.createPage.title')"
      :subtitle="$t('admin.locationManagement.createPage.subtitle')"
    />

    <div class="row q-col-gutter-md location-create-layout items-stretch">
      <!-- Left Panel: Form Settings -->
      <div class="col-12 col-md-4">
        <div class="form-card">
          <div class="form-section">
            <div class="row items-center q-mb-sm">
              <q-icon name="info_outline" color="primary" size="sm" class="q-mr-sm" />
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
                  hide-bottom-space
                />
              </div>

              <div>
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
                  hide-bottom-space
                />
              </div>

              <div>
                <div class="buu-label-muted q-mb-xs">
                  {{ $t('admin.locationManagement.createPage.fields.building') }}
                </div>
                <q-input
                  v-model="building"
                  outlined
                  dense
                  :placeholder="$t('admin.locationManagement.createPage.placeholders.building')"
                  class="buu-input-muted"
                  hide-bottom-space
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="row items-center q-mb-xs">
              <q-icon name="grid_view" color="primary" size="sm" class="q-mr-sm" />
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
                  hide-bottom-space
                  min="1"
                  :max="MAX_SEAT_LAYOUT_SIZE"
                  @update:model-value="(val) => (rows = clampSeatLayoutValue(val))"
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
                  hide-bottom-space
                  min="1"
                  :max="MAX_SEAT_LAYOUT_SIZE"
                  @update:model-value="(val) => (cols = clampSeatLayoutValue(val))"
                />
              </div>
            </div>

            <!-- Split Toggle -->
            <div
              class="bg-grey-2 rounded-borders q-mb-md row items-center justify-between"
              style="padding: 12px 16px"
            >
              <span class="text-body2 text-dark font-weight-medium">
                {{ $t('admin.locationManagement.createPage.fields.splitLeftRight') }}
              </span>
              <q-toggle v-model="splitLeftRight" class="buu-toggle-muted" color="primary" />
            </div>

            <!-- Total Seats Box -->
            <div class="total-seats-box column flex-center rounded-borders" style="padding: 16px">
              <div class="text-primary text-h4 text-weight-bold">{{ totalSeats }}</div>
              <div class="text-caption text-grey-8">
                {{ $t('admin.locationManagement.createPage.totalSeats') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Preview & Save -->
      <div class="col-12 col-md-8 preview-panel">
        <div class="buu-premium-card preview-card q-pa-md">
          <div class="preview-scroll">
            <AppExamSeatPreview
              ref="seatPreviewRef"
              :rows="rows"
              :cols="cols"
              :split-left-right="splitLeftRight"
            />
          </div>
        </div>

        <!-- Save Button -->
        <div class="row justify-end preview-actions">
          <AppButton
            :label="$t('admin.locationManagement.createPage.actions.save')"
            color="primary"
            class="text-weight-bold q-px-xl"
            style="border-radius: 8px; min-width: 140px"
            :loading="isSaving"
            :disable="isSaving"
            @click="handleSave"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppButton from 'src/components/base/app-button.vue';
import AppExamSeatPreview from 'src/components/exam/app-exam-seat-preview.vue';
import { createLocationWithSeats, updateSeatStatus } from 'src/services/location.service';

const MAX_SEAT_LAYOUT_SIZE = 25;

const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();

const roomName = ref('');
const floor = ref<number | null>(null);
const building = ref('');
const rows = ref<number | null>(null);
const cols = ref<number | null>(null);
const splitLeftRight = ref(false);
const isSaving = ref(false);
const seatPreviewRef = ref<InstanceType<typeof AppExamSeatPreview> | null>(null);

const totalSeats = computed(() => {
  return (rows.value || 0) * (cols.value || 0);
});

const clampSeatLayoutValue = (value: unknown): number | null => {
  if (value === '' || value === null || value === undefined) return null;

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;

  return Math.min(MAX_SEAT_LAYOUT_SIZE, Math.max(1, Math.floor(numericValue)));
};

const handleSave = async (): Promise<void> => {
  if (!roomName.value.trim()) {
    $q.notify({
      type: 'warning',
      message: t('admin.locationManagement.createPage.validation.roomNameRequired'),
      position: 'top',
    });
    return;
  }

  if (!rows.value || rows.value < 1 || !cols.value || cols.value < 1) {
    $q.notify({
      type: 'warning',
      message: t('admin.locationManagement.createPage.validation.layoutRequired'),
      position: 'top',
    });
    return;
  }

  if (rows.value > MAX_SEAT_LAYOUT_SIZE || cols.value > MAX_SEAT_LAYOUT_SIZE) {
    $q.notify({
      type: 'warning',
      message: t('admin.locationManagement.createPage.validation.layoutLimit', {
        max: MAX_SEAT_LAYOUT_SIZE,
      }),
      position: 'top',
    });
    return;
  }

  isSaving.value = true;

  try {
    const { seats } = await createLocationWithSeats({
      LOCATION_NAME: building.value.trim(),
      LOCATION_ROOM_NO: roomName.value.trim() || undefined,
      LOCATION_FLOOR_NO:
        floor.value !== null && String(floor.value).trim() !== '' ? Number(floor.value) : undefined,
      LOCATION_TOTAL_ROWS: Number(rows.value),
      LOCATION_TOTAL_COLS: Number(cols.value),
      LOCATION_SEAT_CAPACITY: Number(totalSeats.value),
      SEAT_LABEL_FORMAT: 'ROW_COL',
      LOCATION_IS_SPLIT: splitLeftRight.value ? 1 : 0,
    });

    const brokenSeatLabels = seatPreviewRef.value?.brokenSeats ?? new Set<string>();
    if (brokenSeatLabels.size > 0) {
      const brokenSeatIds = seats
        .filter((seat) => seat.LS_SEAT_LABEL !== null && brokenSeatLabels.has(seat.LS_SEAT_LABEL))
        .map((seat) => seat.LS_ID);

      await Promise.all(brokenSeatIds.map((id) => updateSeatStatus(id, 1)));
    }

    $q.notify({
      type: 'positive',
      message: t('admin.locationManagement.notifications.createSuccess'),
      position: 'top',
    });
    void router.push({ name: 'admin-location-management' });
  } catch (error) {
    console.error('Error creating location:', error);
    $q.notify({
      type: 'negative',
      message: t('admin.locationManagement.notifications.createError'),
      position: 'top',
    });
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped lang="scss">
.surface-page-bg {
  background-color: var(--surface-page);
}

.location-create-layout {
  margin-top: calc(var(--space-sm) * -1);
}

.total-seats-box {
  background-color: var(--location-total-seats-bg);
}

.form-card,
.preview-card {
  width: 100%;
  height: 669px;
  max-height: 669px;
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-card);
}

.form-card {
  max-width: 400px;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  justify-content: flex-start;
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
}

.preview-scroll {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: var(--space-xs);

  :deep(.seat-preview-content) {
    padding-bottom: var(--space-md);
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
</style>
