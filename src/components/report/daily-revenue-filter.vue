<template>
  <q-card flat bordered class="filter-card q-mb-lg">
    <q-card-section>
      <div class="row q-col-gutter-md items-end">
        <!-- วันที่เริ่มต้น -->
        <div class="col-12 col-sm-6 col-md-3">
          <div class="buu-label-muted q-mb-xs">
            {{ $t('admin.dailyRevenueReport.filter.startDate') }}
          </div>
          <q-input
            v-model="localFilter.startDate"
            outlined
            dense
            readonly
            class="buu-input-muted cursor-pointer"
            hide-bottom-space
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy
                  ref="startDateProxy"
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <AppCalendar
                    v-model="localFilter.startDate"
                    @click-date="
                      () => {
                        startDateProxy?.hide();
                        emitFilterChange();
                      }
                    "
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <!-- ถึงวันที่ -->
        <div class="col-12 col-sm-6 col-md-3">
          <div class="buu-label-muted q-mb-xs">
            {{ $t('admin.dailyRevenueReport.filter.endDate') }}
          </div>
          <q-input
            v-model="localFilter.endDate"
            outlined
            dense
            readonly
            class="buu-input-muted cursor-pointer"
            hide-bottom-space
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy
                  ref="endDateProxy"
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <AppCalendar
                    v-model="localFilter.endDate"
                    @click-date="
                      () => {
                        endDateProxy?.hide();
                        emitFilterChange();
                      }
                    "
                  />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>

        <!-- ส่วนงาน -->
        <div class="col-12 col-sm-6 col-md-3">
          <div class="buu-label-muted q-mb-xs">
            {{ $t('admin.dailyRevenueReport.filter.department') }}
          </div>
          <q-select
            v-model="localFilter.department"
            :options="departmentOptions"
            outlined
            dense
            emit-value
            map-options
            clearable
            class="buu-input-muted"
            hide-bottom-space
            @update:model-value="emitFilterChange"
          />
        </div>

        <!-- ชื่อการสอบ -->
        <div class="col-12 col-sm-6 col-md-3">
          <div class="buu-label-muted q-mb-xs">
            {{ $t('admin.dailyRevenueReport.filter.examName') }}
          </div>
          <q-input
            v-model="localFilter.examName"
            outlined
            dense
            class="buu-input-muted"
            hide-bottom-space
            @update:model-value="emitFilterChange"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { reactive, watch, ref } from 'vue';
import type { QPopupProxy } from 'quasar';
import AppCalendar from 'src/components/shared/app-calendar.vue';
import type { DailyRevenueFilter, DepartmentOption } from 'src/types/daily-revenue.types';

interface Props {
  filter: DailyRevenueFilter;
  departmentOptions: DepartmentOption[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'filter-change', filter: DailyRevenueFilter): void;
}>();

const startDateProxy = ref<QPopupProxy | null>(null);
const endDateProxy = ref<QPopupProxy | null>(null);

const localFilter = reactive<DailyRevenueFilter>({
  startDate: props.filter.startDate,
  endDate: props.filter.endDate,
  department: props.filter.department,
  examName: props.filter.examName,
});

// Sync props → local state when parent changes
watch(
  () => props.filter,
  (newFilter) => {
    localFilter.startDate = newFilter.startDate;
    localFilter.endDate = newFilter.endDate;
    localFilter.department = newFilter.department;
    localFilter.examName = newFilter.examName;
  },
  { deep: true },
);

const emitFilterChange = (): void => {
  emit('filter-change', { ...localFilter });
};
</script>

<style scoped lang="scss">
.filter-card {
  background: var(--surface-card);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-card);
}
</style>
