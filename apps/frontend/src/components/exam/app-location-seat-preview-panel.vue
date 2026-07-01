<template>
  <div class="col-12 col-md preview-panel">
    <div class="buu-premium-card preview-card q-pa-md">
      <div class="preview-scroll">
        <AppExamSeatPreview
          ref="seatPreviewRef"
          :rows="props.rows"
          :cols="props.cols"
          :split-left-right="props.splitLeftRight"
          :walkway-positions="props.walkwayPositions"
          :numbering-direction="props.numberingDirection"
          :show-seat-guides="true"
          :show-footer-hint="true"
        />
      </div>
    </div>

    <div class="row justify-end preview-actions">
      <AppButton
        :label="t('admin.locationManagement.createPage.actions.save')"
        color="primary"
        class="text-weight-bold q-px-xl"
        style="border-radius: 8px; min-width: 140px"
        :loading="props.isSaving"
        :disable="props.isSaving"
        @click="emit('save')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from 'src/components/base/app-button.vue';
import AppExamSeatPreview from 'src/components/exam/app-exam-seat-preview.vue';

interface WalkwayPosition {
  type: 'row' | 'column';
  index: number;
}

interface Props {
  rows: number | null;
  cols: number | null;
  splitLeftRight: boolean;
  walkwayPositions: WalkwayPosition[];
  numberingDirection: 'horizontal' | 'vertical';
  isSaving: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 0,
  cols: 0,
  splitLeftRight: false,
  walkwayPositions: () => [],
  numberingDirection: 'vertical',
  isSaving: false,
});
const emit = defineEmits<{
  (e: 'save'): void;
}>();
const { t } = useI18n();
const seatPreviewRef = ref<InstanceType<typeof AppExamSeatPreview> | null>(null);

const setSeatStatusSets = (statuses: {
  brokenSeats?: Iterable<string>;
  omittedSeats?: Iterable<string>;
}): void => {
  seatPreviewRef.value?.setSeatStatusSets(statuses);
};

const getSeatStatuses = (): Record<string, number> => {
  return seatPreviewRef.value?.getSeatStatuses() ?? {};
};

defineExpose({
  setSeatStatusSets,
  getSeatStatuses,
});
</script>

<style scoped lang="scss">
.preview-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.preview-card {
  width: 100%;
  height: 760px;
  max-height: 760px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-card);
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
</style>
