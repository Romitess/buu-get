<template>
  <q-card flat bordered class="exam-report-filter q-mb-lg">
    <q-card-section>
      <div class="row items-end q-col-gutter-md filter-grid">
        <!-- ช่วงเริ่มต้น -->
        <div class="col-12 col-md">
          <div class="custom-label q-mb-xs">{{ t('admin.examReport.filter.fromYear') }}</div>
          <AppSelect
            v-model="localFilter.fromYear"
            :options="yearOptions"
            outlined
            dense
            emit-value
            map-options
            clearable
            bg-color="white"
            dropdown-icon="keyboard_arrow_down"
            class="custom-input"
            hide-bottom-space
            :placeholder="t('admin.examReport.filter.placeholders.year')"
          />
        </div>

        <div class="col-12 col-md">
          <div class="custom-label q-mb-xs">{{ t('admin.examReport.filter.fromMonth') }}</div>
          <AppSelect
            v-model="localFilter.fromMonth"
            :options="monthOptions"
            outlined
            dense
            emit-value
            map-options
            clearable
            bg-color="white"
            dropdown-icon="keyboard_arrow_down"
            class="custom-input"
            hide-bottom-space
            :placeholder="t('admin.examReport.filter.placeholders.month')"
          />
        </div>

        <div class="col-12 col-md">
          <div class="custom-label q-mb-xs">{{ t('admin.examReport.filter.fromRound') }}</div>
          <AppSelect
            v-model="localFilter.fromRound"
            :options="roundOptions"
            outlined
            dense
            emit-value
            map-options
            clearable
            bg-color="white"
            dropdown-icon="keyboard_arrow_down"
            class="custom-input"
            hide-bottom-space
            :placeholder="t('admin.examReport.filter.placeholders.round')"
          />
        </div>

        <!-- คั่นช่วง -->
        <div class="col-auto column justify-center range-separator">-</div>

        <!-- ช่วงสิ้นสุด -->
        <div class="col-12 col-md">
          <div class="custom-label q-mb-xs">{{ t('admin.examReport.filter.toYear') }}</div>
          <AppSelect
            v-model="localFilter.toYear"
            :options="yearOptions"
            outlined
            dense
            emit-value
            map-options
            clearable
            bg-color="white"
            dropdown-icon="keyboard_arrow_down"
            class="custom-input"
            hide-bottom-space
            :placeholder="t('admin.examReport.filter.placeholders.year')"
          />
        </div>

        <div class="col-12 col-md">
          <div class="custom-label q-mb-xs">{{ t('admin.examReport.filter.toMonth') }}</div>
          <AppSelect
            v-model="localFilter.toMonth"
            :options="monthOptions"
            outlined
            dense
            emit-value
            map-options
            clearable
            bg-color="white"
            dropdown-icon="keyboard_arrow_down"
            class="custom-input"
            hide-bottom-space
            :placeholder="t('admin.examReport.filter.placeholders.month')"
          />
        </div>

        <div class="col-12 col-md">
          <div class="custom-label q-mb-xs">{{ t('admin.examReport.filter.toRound') }}</div>
          <AppSelect
            v-model="localFilter.toRound"
            :options="roundOptions"
            outlined
            dense
            emit-value
            map-options
            clearable
            bg-color="white"
            dropdown-icon="keyboard_arrow_down"
            class="custom-input"
            hide-bottom-space
            :placeholder="t('admin.examReport.filter.placeholders.round')"
          />
        </div>

        <!-- ปุ่มกรองข้อมูล -->
        <div class="col-12 col-md-auto">
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="filter_alt"
            class="filter-btn full-width"
            :label="t('admin.examReport.filter.apply')"
            @click="emitFilter"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppSelect from 'src/components/base/app-select.vue';
import type { ExamReportFilter, ExamReportOption } from 'src/types/exam-report.types';

const { t } = useI18n();

interface Props {
  filter: ExamReportFilter;
  yearOptions: ExamReportOption[];
  monthOptions: ExamReportOption[];
  roundOptions: ExamReportOption[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'filter-change', filter: ExamReportFilter): void;
}>();

const localFilter = reactive<ExamReportFilter>({ ...props.filter });

watch(
  () => props.filter,
  (newFilter) => {
    Object.assign(localFilter, newFilter);
  },
  { deep: true },
);

const emitFilter = (): void => {
  emit('filter-change', { ...localFilter });
};
</script>

<style scoped lang="scss">
.exam-report-filter {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--exam-report-card-shadow) !important;
}

.custom-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 600;
}

.custom-input {
  :deep(.q-field__control) {
    border-radius: var(--radius-md);
  }
}

.range-separator {
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  font-weight: 600;
  padding-bottom: 6px;
}

.filter-btn {
  border-radius: var(--radius-sm);
  height: 40px;
  font-weight: 600;
}
</style>
