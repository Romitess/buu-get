<template>
  <q-card flat bordered class="filter-card q-mb-lg">
    <q-card-section>
      <div class="row q-col-gutter-x-md q-col-gutter-y-md items-start">
        <template v-if="mode === 'usage'">
          <div class="col-12 col-sm-6 col-md-3">
            <div class="custom-label q-mb-xs">
              {{ t('admin.dailyRevenueReport.filter.fiscalYear') }}
            </div>
            <q-input
              v-model="localFilter.fiscalYear"
              outlined
              dense
              bg-color="grey-2"
              class="custom-input"
              hide-bottom-space
              @update:model-value="emitFilterChange"
            />
          </div>
        </template>

        <template v-if="mode === 'application'">
          <div class="col-12 col-sm-6 col-md-3">
            <div class="custom-label q-mb-xs">
              {{ t('admin.dailyRevenueReport.filter.receiptDate') }}
            </div>
            <DateField v-model="localFilter.receiptDate" @change="emitFilterChange" />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <div class="custom-label q-mb-xs">
              {{ t('admin.dailyRevenueReport.filter.paidDate') }}
            </div>
            <DateField v-model="localFilter.paidDate" @change="emitFilterChange" />
          </div>
        </template>

        <template v-else>
          <div class="col-12 col-sm-6 col-md-3">
            <div class="custom-label q-mb-xs">
              {{ t('admin.dailyRevenueReport.filter.startDate') }}
              <span v-if="mode === 'daily'" class="text-negative">*</span>
            </div>
            <DateField v-model="localFilter.startDate" @change="emitFilterChange" />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <div class="custom-label q-mb-xs">
              {{ t('admin.dailyRevenueReport.filter.endDate') }}
              <span v-if="mode === 'daily'" class="text-negative">*</span>
            </div>
            <DateField v-model="localFilter.endDate" @change="emitFilterChange" />
          </div>
        </template>

        <div class="col-12 col-sm-6 col-md-3">
          <div class="custom-label q-mb-xs">
            {{ t('admin.dailyRevenueReport.filter.fundSource') }}
          </div>
          <q-select
            v-model="localFilter.fundSourceId"
            outlined
            dense
            clearable
            emit-value
            map-options
            bg-color="grey-2"
            class="custom-input"
            :options="fundSourceOptions"
            hide-bottom-space
            @update:model-value="emitFilterChange"
          />
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <div class="custom-label q-mb-xs">
            {{
              mode === 'daily'
                ? t('admin.dailyRevenueReport.filter.examNameOrRound')
                : t('admin.dailyRevenueReport.filter.examName')
            }}
          </div>
          <q-input
            v-model="localFilter.examName"
            outlined
            dense
            bg-color="grey-2"
            class="custom-input"
            :placeholder="
              mode === 'daily'
                ? t('admin.dailyRevenueReport.filter.placeholders.examNameOrRound')
                : t('admin.dailyRevenueReport.filter.placeholders.examName')
            "
            hide-bottom-space
            @update:model-value="emitFilterChange"
          />
        </div>

        <template v-if="mode === 'usage'">
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
              :placeholder="t('admin.dailyRevenueReport.filter.placeholders.receiptNo')"
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
              :placeholder="t('admin.dailyRevenueReport.filter.placeholders.payer')"
              hide-bottom-space
              @update:model-value="emitFilterChange"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <div class="custom-label q-mb-xs">
              {{ t('admin.dailyRevenueReport.filter.payee') }}
            </div>
            <q-input
              v-model="localFilter.collectorName"
              outlined
              dense
              bg-color="grey-2"
              class="custom-input"
              :placeholder="t('admin.dailyRevenueReport.filter.placeholders.payee')"
              hide-bottom-space
              @update:model-value="emitFilterChange"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <div class="custom-label q-mb-xs">
              {{ t('admin.dailyRevenueReport.filter.status') }}
            </div>
            <q-select
              v-model="localFilter.status"
              outlined
              dense
              emit-value
              map-options
              bg-color="grey-2"
              class="custom-input"
              :options="statusOptions"
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
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import DateField from './finance-report-date-field.vue';
import { fetchFundSources } from 'src/services/finance.service';
import {
  emptyFinanceReportFilter,
  type FinanceReportFilter,
} from 'src/types/finance-report.types';

type FilterMode = 'daily' | 'application' | 'usage';

interface Props {
  filter: FinanceReportFilter;
  mode: FilterMode;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'filter-change', filter: FinanceReportFilter): void;
}>();

const { t, locale } = useI18n();
const fundSources = ref<Awaited<ReturnType<typeof fetchFundSources>>>([]);

const localFilter = reactive<FinanceReportFilter>({
  ...emptyFinanceReportFilter(),
  ...props.filter,
});

watch(
  () => props.filter,
  (next) => {
    Object.assign(localFilter, next);
  },
  { deep: true },
);

const fundSourceOptions = computed(() =>
  fundSources.value.map((source) => ({
    label: `${source.FS_ACCOUNT_CODE} ${source.FS_NAME}`,
    value: source.FS_ID,
  })),
);

const statusOptions = computed(() => {
  void locale.value;
  return [
    { label: t('admin.dailyRevenueReport.filter.statusAll'), value: '' },
    { label: t('admin.dailyRevenueReport.filter.statusIssued'), value: 'issued' },
    { label: t('admin.dailyRevenueReport.filter.statusVoided'), value: 'voided' },
  ];
});

const emitFilterChange = (): void => {
  emit('filter-change', { ...localFilter });
};

onMounted(async () => {
  try {
    fundSources.value = await fetchFundSources();
  } catch {
    fundSources.value = [];
  }
});
</script>

<style scoped lang="scss">
.filter-card {
  border-radius: 16px;
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-card) !important;
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
    color: #000000;
  }

  :deep(.q-field__native::placeholder) {
    color: #615f5f;
    opacity: 1;
  }
}
</style>
