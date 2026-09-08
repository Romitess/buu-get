<template>
  <q-page class="page-container check-in-rooms-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="t('admin.checkIn.rooms.pageTitle')"
      :subtitle="t('admin.checkIn.rooms.pageSubtitle')"
    />

    <div class="row q-col-gutter-md q-mb-lg items-end">
      <div v-if="canPickDate" class="col-12 col-sm-5 col-md-4 col-lg-3">
        <div class="date-field-label q-mb-xs">{{ t('admin.checkIn.rooms.dateLabel') }}</div>
        <q-input
          :model-value="selectedDateDisplay"
          outlined
          dense
          readonly
          class="date-field cursor-pointer"
          hide-bottom-space
          :aria-label="t('admin.checkIn.rooms.dateLabel')"
          @click="showDatePicker = true"
        >
          <template #append>
            <q-icon
              name="calendar_today"
              class="cursor-pointer"
              size="xs"
              color="grey-8"
              :aria-label="t('admin.checkIn.rooms.dateLabel')"
              @click.stop="showDatePicker = true"
            />
            <q-menu
              v-model="showDatePicker"
              anchor="bottom left"
              self="top left"
              class="shadow-5 date-picker-menu"
            >
              <AppCalendar
                :model-value="selectedDate"
                @update:model-value="selectedDate = $event"
                @click-date="showDatePicker = false"
              />
            </q-menu>
          </template>
        </q-input>
      </div>
      <div class="col">
        <SearchBar
          v-model="searchQuery"
          :placeholder="t('admin.checkIn.rooms.searchPlaceholder')"
        />
      </div>
    </div>

    <div v-if="isLoading" class="row q-col-gutter-md">
      <div v-for="n in 3" :key="`room-skel-${n}`" class="col-12 col-md-6 col-lg-4">
        <q-skeleton height="180px" />
      </div>
    </div>

    <q-banner v-else-if="filteredRooms.length === 0" rounded class="bg-grey-2">
      {{ t('admin.checkIn.rooms.empty') }}
    </q-banner>

    <div v-else class="row q-col-gutter-md">
      <div v-for="room in filteredRooms" :key="room.slId" class="col-12 col-md-6 col-lg-4">
        <q-card flat bordered class="room-card">
          <q-card-section>
            <div class="text-weight-bold text-subtitle1">{{ room.examName }}</div>
            <div class="text-grey-8 q-mt-xs">{{ formatSessionTime(room) }}</div>
            <div class="q-mt-sm">{{ formatRoomLabel(room) }}</div>
            <div v-if="room.proctorNames.length" class="text-grey-7 q-mt-xs">
              {{ t('admin.checkIn.rooms.proctors') }}: {{ room.proctorNames.join(', ') }}
            </div>
            <div class="q-mt-sm text-weight-medium">
              {{
                t('admin.checkIn.rooms.attendedCount', {
                  attended: room.attendedCount,
                  total: room.totalCount,
                })
              }}
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <AppButton
              color="primary"
              :label="
                room.activeStationCasId
                  ? t('admin.checkIn.rooms.resumeScan')
                  : t('admin.checkIn.rooms.openScan')
              "
              @click="requestOpenRoom(room)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="isConfirmOpen" persistent>
      <q-card class="confirm-card">
        <q-card-section>
          <div class="text-h6">{{ t('admin.checkIn.rooms.confirmTitle') }}</div>
          <p class="q-mt-sm text-grey-8">{{ t('admin.checkIn.rooms.confirmHint') }}</p>
          <template v-if="pendingRoom">
            <div class="text-weight-bold">{{ pendingRoom.examName }}</div>
            <div>{{ formatSessionTime(pendingRoom) }}</div>
            <div>{{ formatRoomLabel(pendingRoom) }}</div>
            <div>
              {{
                t('admin.checkIn.rooms.attendedCount', {
                  attended: pendingRoom.attendedCount,
                  total: pendingRoom.totalCount,
                })
              }}
            </div>
          </template>
        </q-card-section>
        <q-card-actions align="right">
          <AppButton
            flat
            :label="t('admin.checkIn.rooms.cancel')"
            :disable="isOpening"
            @click="cancelConfirm"
          />
          <AppButton
            color="primary"
            :label="t('admin.checkIn.rooms.confirmStart')"
            :loading="isOpening"
            @click="confirmOpenRoom"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppButton from 'src/components/base/app-button.vue';
import AppCalendar from 'src/components/shared/app-calendar.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import { useCheckInRooms } from 'src/composables/use-check-in-rooms';

const { t } = useI18n();
const showDatePicker = ref(false);
const {
  filteredRooms,
  isLoading,
  searchQuery,
  selectedDate,
  selectedDateDisplay,
  canPickDate,
  pendingRoom,
  isConfirmOpen,
  isOpening,
  loadRooms,
  formatRoomLabel,
  formatSessionTime,
  requestOpenRoom,
  cancelConfirm,
  confirmOpenRoom,
} = useCheckInRooms();

onMounted(() => {
  void loadRooms();
});
</script>

<style scoped lang="scss">
.date-field-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #616161;
}

.date-field {
  :deep(.q-field__control) {
    border-radius: 8px;
    background-color: #ffffff;
  }

  :deep(.q-field__native) {
    font-weight: 500;
    color: #424242;
  }
}

.date-picker-menu {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.room-card {
  height: 100%;
  border-radius: 12px;
}

.confirm-card {
  min-width: min(420px, calc(100vw - 32px));
}
</style>
