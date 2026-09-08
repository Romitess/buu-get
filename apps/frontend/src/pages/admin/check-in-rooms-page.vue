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

    <q-dialog
      v-model="isConfirmOpen"
      persistent
      :position="isCompactDialog ? 'bottom' : undefined"
    >
      <q-card class="confirm-card" :class="{ 'confirm-card--sheet': isCompactDialog }">
        <q-card-section class="confirm-card__header">
          <div class="confirm-card__icon" aria-hidden="true">
            <q-icon name="meeting_room" size="28px" />
          </div>
          <div class="confirm-card__heading">
            <div class="confirm-card__title">{{ t('admin.checkIn.rooms.confirmTitle') }}</div>
            <p class="confirm-card__hint">{{ t('admin.checkIn.rooms.confirmHint') }}</p>
          </div>
        </q-card-section>

        <q-card-section v-if="pendingRoom && pendingHero" class="confirm-card__body">
          <div class="confirm-hero">
            <div class="confirm-hero__label">{{ t('admin.checkIn.rooms.factRoom') }}</div>
            <div class="confirm-hero__title">{{ pendingHero.title }}</div>
            <div v-if="pendingHero.subtitle" class="confirm-hero__subtitle">
              {{ pendingHero.subtitle }}
            </div>
          </div>

          <dl class="confirm-meta">
            <div class="confirm-meta__row">
              <dt>
                <q-icon name="assignment" size="18px" />
                {{ t('admin.checkIn.rooms.factExam') }}
              </dt>
              <dd>{{ pendingRoom.examName }}</dd>
            </div>
            <div class="confirm-meta__row">
              <dt>
                <q-icon name="schedule" size="18px" />
                {{ t('admin.checkIn.rooms.factTime') }}
              </dt>
              <dd>{{ formatSessionTime(pendingRoom) }}</dd>
            </div>
            <div class="confirm-meta__row">
              <dt>
                <q-icon name="groups" size="18px" />
                {{ t('admin.checkIn.rooms.factCount') }}
              </dt>
              <dd>
                {{
                  t('admin.checkIn.rooms.attendedCount', {
                    attended: pendingRoom.attendedCount,
                    total: pendingRoom.totalCount,
                  })
                }}
              </dd>
            </div>
          </dl>
        </q-card-section>

        <q-card-actions class="confirm-card__actions">
          <AppButton
            outline
            class="confirm-card__btn"
            :label="t('admin.checkIn.rooms.cancel')"
            :disable="isOpening"
            @click="cancelConfirm"
          />
          <AppButton
            color="primary"
            icon="qr_code_scanner"
            class="confirm-card__btn confirm-card__btn--primary"
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
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppButton from 'src/components/base/app-button.vue';
import AppCalendar from 'src/components/shared/app-calendar.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import { useCheckInRooms } from 'src/composables/use-check-in-rooms';

const { t } = useI18n();
const $q = useQuasar();
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
  formatRoomHero,
  formatSessionTime,
  requestOpenRoom,
  cancelConfirm,
  confirmOpenRoom,
} = useCheckInRooms();

onMounted(() => {
  void loadRooms();
});

const isCompactDialog = computed(() => $q.screen.lt.sm);
const pendingHero = computed(() => (pendingRoom.value ? formatRoomHero(pendingRoom.value) : null));
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
  width: min(440px, calc(100vw - 24px));
  border-radius: 20px;
  overflow: hidden;

  &--sheet {
    width: 100%;
    max-width: 100%;
    border-radius: 20px 20px 0 0;
  }

  &__header {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding-bottom: 4px;
  }

  &__icon {
    flex: 0 0 auto;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: var(--badge-primary-bg);
    color: var(--primary);
  }

  &__heading {
    min-width: 0;
    flex: 1;
  }

  &__title {
    font-size: 1.2rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--text-primary);
  }

  &__hint {
    margin: 4px 0 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  &__body {
    display: grid;
    gap: 12px;
    padding-top: 4px;
    padding-bottom: 4px;
  }

  &__actions {
    display: flex;
    flex-direction: column-reverse;
    gap: 8px;
    padding: 8px 16px calc(16px + env(safe-area-inset-bottom, 0px));

    @media (min-width: 600px) {
      flex-direction: row;
      justify-content: flex-end;
      padding-bottom: 16px;
    }
  }

  &__btn {
    min-height: 48px;
    width: 100%;

    @media (min-width: 600px) {
      width: auto;
      min-width: 140px;
    }
  }
}

.confirm-hero {
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--badge-primary-bg);

  &__label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--primary);
  }

  &__title {
    margin-top: 4px;
    font-size: 1.35rem;
    font-weight: 800;
    line-height: 1.25;
    color: var(--text-primary);
  }

  &__subtitle {
    margin-top: 4px;
    font-size: 0.9rem;
    line-height: 1.4;
    color: var(--text-secondary);
  }
}

.confirm-meta {
  margin: 0;
  display: grid;
  gap: 2px;
  padding: 4px 4px 0;

  &__row {
    display: grid;
    grid-template-columns: minmax(92px, 34%) 1fr;
    gap: 12px;
    align-items: start;
    padding: 8px 4px;
    border-bottom: 1px solid #eef2f6;

    &:last-child {
      border-bottom: 0;
    }
  }

  dt {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.8rem;
    font-weight: 500;
  }

  dd {
    margin: 0;
    color: var(--text-primary);
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.35;
    word-break: break-word;
  }
}
</style>
