<template>
  <q-card flat bordered class="filter-card q-mb-lg">
    <q-card-section>
      <div class="row q-col-gutter-x-md q-col-gutter-y-md items-start">
        <div class="col-12 col-sm-6 col-md-3">
          <div class="custom-label q-mb-xs">
            {{ t('admin.dailyRevenueReport.filter.startDate') }}
          </div>
          <q-input
            v-model="localFilter.startDate"
            outlined
            dense
            readonly
            bg-color="grey-2"
            class="custom-input cursor-pointer"
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

        <div class="col-12 col-sm-6 col-md-3">
          <div class="custom-label q-mb-xs">
            {{ t('admin.dailyRevenueReport.filter.endDate') }}
          </div>
          <q-input
            v-model="localFilter.endDate"
            outlined
            dense
            readonly
            bg-color="grey-2"
            class="custom-input cursor-pointer"
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

        <div class="col-12 col-sm-6 col-md-3">
          <div class="custom-label q-mb-xs">
            {{ t('admin.dailyRevenueReport.filter.department') }}
          </div>
          <AppSelect
            v-model="localFilter.department"
            :options="departmentOptions"
            outlined
            dense
            emit-value
            map-options
            clearable
            bg-color="grey-2"
            class="custom-input"
            hide-bottom-space
            placeholder="ทั้งหมด"
            @update:model-value="emitFilterChange"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <div class="custom-label q-mb-xs">
            {{ t('admin.dailyRevenueReport.filter.examName') }}
          </div>
          <q-input
            v-model="localFilter.examName"
            outlined
            dense
            bg-color="grey-2"
            class="custom-input"
            placeholder="BUU-GET 1/2026"
            hide-bottom-space
            @update:model-value="emitFilterChange"
          />
        </div>

        <template v-if="isFullMode">
          <div class="col-12 col-sm-6 col-md-3">
            <div class="custom-label q-mb-xs">
              {{ t('admin.dailyRevenueReport.filter.receiptNo') }}
            </div>
            <q-input
              v-model="localFilter.receiptNo"
              outlined
              dense
              bg-color="grey-2"
              class="custom-input"
              placeholder="XXXXXXXXXXXX"
              hide-bottom-space
              @update:model-value="emitFilterChange"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="custom-label q-mb-xs">
              {{ t('admin.dailyRevenueReport.filter.payer') }}
            </div>
            <q-input
              v-model="localFilter.payerName"
              outlined
              dense
              bg-color="grey-2"
              class="custom-input"
              placeholder="สมชาย ใจดี"
              hide-bottom-space
              @update:model-value="emitFilterChange"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="custom-label q-mb-xs">
              {{ t('admin.dailyRevenueReport.filter.payee') }}
            </div>
            <q-input
              v-model="localFilter.payeeName"
              outlined
              dense
              bg-color="grey-2"
              class="custom-input"
              placeholder="สมใจ หมายปอง"
              hide-bottom-space
              @update:model-value="emitFilterChange"
            />
          </div>
        </template>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { reactive, watch, ref, onMounted } from 'vue';
import type { QPopupProxy } from 'quasar';
import AppCalendar from 'src/components/shared/app-calendar.vue';
import AppSelect from 'src/components/base/app-select.vue';
import type { DailyRevenueFilter, DepartmentOption } from 'src/types/daily-revenue.types';
import { useI18n } from 'vue-i18n';
import { fetchFundSources } from 'src/services/finance.service';

const { t } = useI18n();

type DailyRevenueFilterMode = 'compact' | 'full';

interface Props {
  filter: DailyRevenueFilter & { receiptNo?: string; payerName?: string; payeeName?: string };
  departmentOptions?: DepartmentOption[];
  mode?: DailyRevenueFilterMode;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'filter-change', filter: DailyRevenueFilter): void;
}>();

const isFullMode = props.mode === 'full';

const startDateProxy = ref<QPopupProxy | null>(null);
const endDateProxy = ref<QPopupProxy | null>(null);

const localFilter = reactive({
  startDate: props.filter.startDate,
  endDate: props.filter.endDate,
  department: props.filter.department,
  examName: props.filter.examName,
  receiptNo: props.filter.receiptNo || '',
  payerName: props.filter.payerName || '',
  payeeName: props.filter.payeeName || '',
});

const departmentOptions = ref<DepartmentOption[]>(props.departmentOptions || []);

const loadDepartmentOptions = async () => {
  if (props.departmentOptions && props.departmentOptions.length) {
    departmentOptions.value = props.departmentOptions;
    return;
  }

  try {
    const sources = await fetchFundSources();
    const faculties = Array.from(new Set(sources.map((s) => s.FS_FACULTY).filter(Boolean)));
    departmentOptions.value = faculties.map((f) => ({ label: f, value: f }));
  } catch {
    // ignore - keep options empty
    // console.error('Failed to load fund sources');
  }
};

onMounted(() => {
  void loadDepartmentOptions();
});

// Sync props → local state when parent changes
watch(
  () => props.filter,
  (newFilter) => {
    localFilter.startDate = newFilter.startDate;
    localFilter.endDate = newFilter.endDate;
    localFilter.department = newFilter.department;
    localFilter.examName = newFilter.examName;
    localFilter.receiptNo = newFilter.receiptNo || '';
    localFilter.payerName = newFilter.payerName || '';
    localFilter.payeeName = newFilter.payeeName || '';
  },
  { deep: true },
);

const emitFilterChange = (): void => {
  emit('filter-change', { ...localFilter });
};
</script>

<style scoped lang="scss">
.filter-card {
  border-radius: 16px;
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-card) !important;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    background-color var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--detail-card-hover-shadow) !important;
    background-color: var(--detail-card-hover-bg);
  }
}

.custom-label {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
}

.custom-input {
  :deep(.q-field__control) {
    border-radius: 6px;
    border-color: #e0e0e0;
  }

  :deep(.q-field__native) {
    color: #000000; /* สีข้อความด้านใน */
  }

  /* สีของ Placeholder ให้เป็นสีเทาอ่อน */
  :deep(.q-field__native::placeholder) {
    color: #615f5f;
    opacity: 1;
  }
}
</style>
