<template>
  <q-page class="page-container location-management-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.locationManagement.pageTitle')"
      :subtitle="$t('admin.locationManagement.pageDescription')"
    />

    <div class="row items-center q-mb-lg q-gutter-x-md">
      <div class="col">
        <SearchBar v-model="searchQuery" />
      </div>
      <AppButton
        icon="add"
        :label="$t('admin.locationManagement.createLocation')"
        color="primary"
        class="create-location-btn text-weight-bold"
        @click="$router.push({ name: 'admin-create-location' })"
      />
    </div>

    <BaseTable
      :columns="columns"
      :rows="filteredLocations"
      :loading="isLoading"
      :pagination="pagination"
      @request="onRequest"
    >
      <template v-slot:body-cell-tools="{ row }">
        <div class="row justify-center q-gutter-x-sm no-wrap">
          <q-btn
            unelevated
            dense
            color="blue-2"
            text-color="grey-10"
            icon="edit"
            class="action-btn"
            @click="navigateToEdit(row.LOCATION_ID)"
          >
            <q-tooltip class="bg-secondary text-white text-caption">
              {{ $t('admin.locationManagement.table.tooltips.edit') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            unelevated
            dense
            color="negative"
            text-color="white"
            icon="delete"
            class="action-btn"
            @click="confirmDelete(row)"
          >
            <q-tooltip class="bg-negative text-white text-caption">
              {{ $t('admin.locationManagement.table.tooltips.delete') }}
            </q-tooltip>
          </q-btn>
        </div>
      </template>
    </BaseTable>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, type QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import AppButton from 'src/components/base/app-button.vue';
import type { BackendLocation } from 'src/types/exam';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import * as locationService from 'src/services/location.service';

const $q = useQuasar();
const { t } = useI18n();
const router = useRouter();

const isLoading = ref(false);
const searchQuery = ref('');
const locations = ref<BackendLocation[]>([]);

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
    align: 'center',
    style: 'width: 20%',
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
    align: 'center',
    style: 'width: 42%',
  },
  {
    name: 'capacity',
    label: t('admin.locationManagement.table.columns.capacity'),
    field: 'capacity',
    align: 'center',
    style: 'width: 10%',
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
  return locations.value.map((loc, idx) => ({
    ...loc,
    index: idx + 1,
    floor: loc.LOCATION_FLOOR_NO ?? parseFloor(loc.LOCATION_ROOM_NO),
    capacity: loc.LOCATION_SEAT_CAPACITY ?? parseCapacity(loc.LOCATION_ROOM_NO),
  }));
});

const filteredLocations = computed(() => {
  const all = locationsWithComputedData.value;
  if (!searchQuery.value) return all;
  const query = searchQuery.value.toLowerCase();
  return all.filter(
    (l) =>
      l.LOCATION_NAME.toLowerCase().includes(query) ||
      (l.LOCATION_ROOM_NO && l.LOCATION_ROOM_NO.toLowerCase().includes(query)),
  );
});

const fetchData = async () => {
  isLoading.value = true;
  try {
    const data = await locationService.fetchLocations();
    locations.value = data;
    pagination.value.rowsNumber = data.length;
  } catch {
    $q.notify({
      type: 'negative',
      message: t('admin.locationManagement.notifications.loadError'),
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
};

const onRequest = (props: TableRequestProps) => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

const navigateToEdit = (id: number) => {
  void router.push({
    name: 'admin-edit-location',
    params: { locationId: String(id) },
  });
};

const confirmDelete = (row: BackendLocation) => {
  $q.dialog({
    title: t('admin.locationManagement.dialogs.deleteTitle'),
    message: t('admin.locationManagement.dialogs.deleteMessage'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      isLoading.value = true;
      try {
        await locationService.deleteLocation(row.LOCATION_ID);
        $q.notify({
          type: 'positive',
          message: t('admin.locationManagement.notifications.deleteSuccess'),
          position: 'top',
        });
        await fetchData();
      } catch {
        $q.notify({
          type: 'negative',
          message: t('admin.locationManagement.notifications.deleteError'),
          position: 'top',
        });
      } finally {
        isLoading.value = false;
      }
    })();
  });
};

onMounted(() => {
  void fetchData();
});
</script>

<style scoped lang="scss">
.create-location-btn {
  border-radius: var(--radius-10) !important;
  height: 40px;
  padding: 0 24px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 6px !important;
  font-size: 14px;
  transition: background-color var(--transition-fast);
}

.form-dialog-card {
  border-radius: var(--radius-md) !important;
}
</style>
