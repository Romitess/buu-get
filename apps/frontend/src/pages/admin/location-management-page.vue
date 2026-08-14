<template>
  <q-page class="page-container location-management-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.locationManagement.pageTitle')"
      :subtitle="$t('admin.locationManagement.pageDescription')"
    />

    <div class="row q-col-gutter-md items-center q-mb-lg">
      <div class="col-12 col-sm">
        <SearchBar v-model="searchQuery" />
      </div>
      <div class="col-12 col-sm-auto text-right">
        <AppButton
          icon="add"
          :label="$t('admin.locationManagement.createLocation')"
          color="primary"
          class="create-location-btn text-weight-bold"
          @click="$router.push({ name: 'admin-create-location' })"
        />
      </div>
    </div>

    <q-banner v-if="error" class="bg-red-1 text-red-9 q-mb-md rounded-borders shadow-1">
      <template v-slot:avatar>
        <q-icon name="warning" color="negative" />
      </template>
      {{ error }}
      <template v-slot:action>
        <q-btn flat color="negative" :label="$t('examSchedule.retry')" @click="fetchData" />
      </template>
    </q-banner>

    <BaseTable
      :columns="columns"
      :rows="locationsWithComputedData"
      :loading="isLoading"
      :pagination="pagination"
      is-server-side
      @request="onRequest"
    >
      <template v-slot:body-cell-tools="{ row }">
        <div class="row justify-center q-gutter-x-sm no-wrap">
          <ActionButton
            icon="edit"
            color="secondary"
            :tooltip="$t('admin.locationManagement.table.tooltips.edit')"
            @click="navigateToEdit(row.LOCATION_ID)"
          />
          <ActionButton
            icon="delete"
            color="negative"
            :tooltip="$t('admin.locationManagement.table.tooltips.delete')"
            @click="confirmDelete(row)"
          />
        </div>
      </template>
    </BaseTable>

    <DialogDeleteConfirm
      v-model="isDeleteConfirmOpen"
      :title="$t('admin.locationManagement.dialogs.deleteTitle')"
      :message="$t('admin.locationManagement.dialogs.deleteMessage')"
      :confirm-label="$t('profile.confirm')"
      :cancel-label="$t('profile.cancel')"
      :loading="isDeleting"
      @confirm="handleDeleteConfirm"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QTableColumn, debounce } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import AppButton from 'src/components/base/app-button.vue';
import DialogDeleteConfirm from 'src/components/exam/dialog-delete-confirm.vue';
import type { BackendLocation } from 'src/types/exam';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import * as locationService from 'src/services/location.service';
import { isRequestCanceled } from 'src/services/exam.service';

const $q = useQuasar();
const { t } = useI18n();
const router = useRouter();

const isLoading = ref(false);
const searchQuery = ref('');
const locations = ref<BackendLocation[]>([]);
const error = ref<string | null>(null);
const isDeleteConfirmOpen = ref(false);
const locationToDelete = ref<BackendLocation | null>(null);
const isDeleting = ref(false);
let abortController: AbortController | null = null;

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const parseFloor = (roomNo: string | undefined | null): number => {
  if (!roomNo) return 1;
  const match = roomNo.match(/\d+/g);
  if (match && match.length > 0) {
    const lastNum = match[match.length - 1];
    if (lastNum && lastNum.length >= 3) {
      return parseInt(lastNum.substring(0, 1)) || 1;
    }
    if (lastNum) {
      return parseInt(lastNum) || 1;
    }
  }
  return 1;
};

const parseCapacity = (roomNo: string | undefined | null): number => {
  if (!roomNo) return 60;
  const floor = parseFloor(roomNo);
  return floor === 1 ? 40 : 60;
};

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'index',
    label: t('admin.locationManagement.table.columns.index'),
    field: 'index',
    align: 'center',
    style: 'width: 8%',
  },
  {
    name: 'roomName',
    label: t('admin.locationManagement.table.columns.roomName'),
    field: 'LOCATION_ROOM_NO',
    align: 'left',
    style: 'width: 24%; padding-left: 128px;',
    format: (val: string | null | undefined) => val || '-',
  },
  {
    name: 'floor',
    label: t('admin.locationManagement.table.columns.floor'),
    field: 'floor',
    align: 'center',
    style: 'width: 8%',
  },
  {
    name: 'locationName',
    label: t('admin.locationManagement.table.columns.locationName'),
    field: 'LOCATION_NAME',
    align: 'left',
    style: 'width: 36%; padding-left: 96px;',
  },
  {
    name: 'capacity',
    label: t('admin.locationManagement.table.columns.capacity'),
    field: 'capacity',
    align: 'center',
    style: 'width: 12%',
  },
  {
    name: 'tools',
    label: t('admin.locationManagement.table.columns.tools'),
    field: 'tools',
    align: 'center',
    style: 'width: 12%',
  },
]);

const locationsWithComputedData = computed(() => {
  const pageOffset = (pagination.value.page - 1) * pagination.value.rowsPerPage;
  return locations.value.map((loc, idx) => ({
    ...loc,
    index: pageOffset + idx + 1,
    floor: loc.LOCATION_FLOOR_NO ?? parseFloor(loc.LOCATION_ROOM_NO),
    capacity:
      loc.SEATS?.filter((seat) => seat.LS_SEAT_STATUS !== 1 && seat.LS_SEAT_STATUS !== 2).length ??
      loc.LOCATION_SEAT_CAPACITY ??
      parseCapacity(loc.LOCATION_ROOM_NO),
  }));
});

const fetchData = async (): Promise<void> => {
  abortController?.abort();
  abortController = new AbortController();
  const { signal } = abortController;
  isLoading.value = true;
  error.value = null;
  try {
    const result = await locationService.fetchLocationsPage({
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,
      search: searchQuery.value,
      signal,
    });
    locations.value = result.data;
    pagination.value.rowsNumber = result.total;
  } catch (err) {
    if (isRequestCanceled(err) || signal.aborted) return;
    error.value = t('admin.locationManagement.notifications.loadError');
  } finally {
    if (!signal.aborted) {
      isLoading.value = false;
    }
  }
};

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  void fetchData();
};

const debouncedSearch = debounce(() => {
  pagination.value.page = 1;
  void fetchData();
}, 400);

watch(searchQuery, () => {
  void debouncedSearch();
});

const navigateToEdit = (id: number) => {
  void router.push({
    name: 'admin-edit-location',
    params: { locationId: String(id) },
  });
};

const confirmDelete = (row: BackendLocation) => {
  locationToDelete.value = row;
  isDeleteConfirmOpen.value = true;
};

const handleDeleteConfirm = async () => {
  if (!locationToDelete.value) return;
  isDeleting.value = true;
  try {
    await locationService.deleteLocation(locationToDelete.value.LOCATION_ID);
    $q.notify({
      type: 'positive',
      message: t('admin.locationManagement.notifications.deleteSuccess'),
      position: 'top',
    });
    await fetchData();
    isDeleteConfirmOpen.value = false;
  } catch {
    $q.notify({
      type: 'negative',
      message: t('admin.locationManagement.notifications.deleteError'),
      position: 'top',
    });
  } finally {
    isDeleting.value = false;
    locationToDelete.value = null;
  }
};

onMounted(() => {
  void fetchData();
});
</script>

<style scoped lang="scss">
@media (max-width: 1023px) {
  .page-container {
    width: 100% !important;
    min-width: 0 !important;
  }
}

.create-location-btn {
  border-radius: var(--radius-10) !important;
  height: 40px;
  padding: 0 24px;

  @media (max-width: $breakpoint-xs-max) {
    width: 100%;
  }
}

.form-dialog-card {
  border-radius: var(--radius-md) !important;
}
</style>
