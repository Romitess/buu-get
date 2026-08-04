<template>
  <section
    class="voucher-preview-section"
    :class="{ 'is-editing-regulations': isEditingRegulations }"
  >
    <div class="preview-heading">
      <span>{{ resolvedTitle }}</span>
      <div class="row items-center q-gutter-sm no-wrap">
        <AppButton
          v-if="allowEditRegulations && previewSide === 'back' && !isEditingRegulations"
          :label="$t('admin.testVoucherManagement.editRegulationsBtn')"
          icon="edit"
          flat
          dense
          color="primary"
          class="edit-regulations-btn"
          @click="startEditRegulations"
        />
        <div
          class="side-tabs"
          role="tablist"
          :aria-label="$t('admin.seatCandidates.voucherSideLabel')"
        >
          <button
            type="button"
            role="tab"
            :aria-selected="previewSide === 'front'"
            :class="{ active: previewSide === 'front' }"
            @click="switchSide('front')"
          >
            {{ $t('admin.seatCandidates.frontSide') }}
          </button>
          <span aria-hidden="true">|</span>
          <button
            type="button"
            role="tab"
            :aria-selected="previewSide === 'back'"
            :class="{ active: previewSide === 'back' }"
            @click="switchSide('back')"
          >
            {{ $t('admin.seatCandidates.backSide') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="isEditingRegulations" class="regulations-edit-panel">
      <div class="text-subtitle2 text-weight-bold text-dark q-mb-sm">
        {{ $t('admin.testVoucherManagement.editRegulationsTitle') }}
      </div>

      <div class="regulations-edit-block">
        <h4 class="regulations-edit-heading">
          {{ $t('admin.testVoucherManagement.regulationsEnLabel') }}
        </h4>
        <q-input
          v-model="editingRegulationsEn"
          outlined
          type="textarea"
          autogrow
          :placeholder="$t('admin.testVoucherManagement.placeholderEn')"
          class="regulations-edit-input"
        />
      </div>

      <div class="regulations-edit-block q-mt-md">
        <h4 class="regulations-edit-heading">
          {{ $t('admin.testVoucherManagement.regulationsThLabel') }}
        </h4>
        <q-input
          v-model="editingRegulationsTh"
          outlined
          type="textarea"
          autogrow
          :placeholder="$t('admin.testVoucherManagement.placeholderTh')"
          class="regulations-edit-input"
        />
      </div>

      <div class="row justify-end q-gutter-sm q-mt-md">
        <AppButton
          :label="$t('admin.testVoucherManagement.cancelBtn')"
          class="regulations-edit-action-btn cancel-btn"
          :disable="isSavingRegulations"
          @click="cancelEditRegulations"
        />
        <AppButton
          :label="$t('admin.testVoucherManagement.saveBtn')"
          color="primary"
          class="regulations-edit-action-btn"
          :loading="isSavingRegulations"
          @click="saveEditRegulations"
        />
      </div>
    </div>

    <div v-show="!isEditingRegulations" class="voucher-preview" :class="`is-${previewSide}`">
      <TestVoucherReport
        :data="voucherData"
        :show-actions="false"
        :show-voucher-card="previewSide === 'front'"
        :show-regulations="previewSide === 'back'"
        :use-image-placeholder="useImagePlaceholder"
        :regulations-en="activeRegulationsEn"
        :regulations-th="activeRegulationsTh"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import AppButton from 'src/components/base/app-button.vue';
import TestVoucherReport from 'src/components/test-voucher-report.vue';
import { getRegulations, saveRegulations } from 'src/services/exam-rule-voucher.service';
import type { VoucherData } from 'src/types/voucher';

const props = withDefaults(
  defineProps<{
    voucherData: VoucherData;
    useImagePlaceholder?: boolean;
    title?: string;
    regulationsEn?: string | string[];
    regulationsTh?: string | string[];
    /** อนุญาตแก้ Test Regulations จากด้านหลังใบ (บันทึก template จริง) */
    allowEditRegulations?: boolean;
  }>(),
  {
    useImagePlaceholder: false,
    allowEditRegulations: true,
  },
);

const emit = defineEmits<{
  (e: 'update:editingRegulations', value: boolean): void;
}>();

const { t } = useI18n();
const $q = useQuasar();

const resolvedTitle = computed(() => props.title ?? t('admin.seatCandidates.voucherTitle'));

const previewSide = ref<'front' | 'back'>('front');
const isEditingRegulations = ref(false);
const isSavingRegulations = ref(false);
const loadedRegulationsEn = ref(t('admin.testVoucherManagement.defaultRegulationsEn'));
const loadedRegulationsTh = ref(t('admin.testVoucherManagement.defaultRegulationsTh'));
const editingRegulationsEn = ref('');
const editingRegulationsTh = ref('');

const setEditingRegulations = (value: boolean): void => {
  isEditingRegulations.value = value;
  emit('update:editingRegulations', value);
};
const normalizeRegulations = (value?: string | string[] | null): string => {
  if (Array.isArray(value)) {
    return value.join('\n').trim();
  }
  return (value ?? '').trim();
};

const activeRegulationsEn = computed((): string => {
  const fromProp = normalizeRegulations(props.regulationsEn);
  if (fromProp) return fromProp;
  return loadedRegulationsEn.value;
});

const activeRegulationsTh = computed((): string => {
  const fromProp = normalizeRegulations(props.regulationsTh);
  if (fromProp) return fromProp;
  return loadedRegulationsTh.value;
});

const applyDefaultRegulations = (): void => {
  loadedRegulationsEn.value = t('admin.testVoucherManagement.defaultRegulationsEn');
  loadedRegulationsTh.value = t('admin.testVoucherManagement.defaultRegulationsTh');
};

const loadRegulations = async (): Promise<void> => {
  // ถ้า parent ส่ง prop มาแล้ว ไม่ต้องโหลดซ้ำ
  if (normalizeRegulations(props.regulationsEn) || normalizeRegulations(props.regulationsTh)) {
    loadedRegulationsEn.value = normalizeRegulations(props.regulationsEn);
    loadedRegulationsTh.value = normalizeRegulations(props.regulationsTh);
    return;
  }

  try {
    const data = await getRegulations();
    loadedRegulationsEn.value =
      data.regulationsEn?.trim() || t('admin.testVoucherManagement.defaultRegulationsEn');
    loadedRegulationsTh.value =
      data.regulationsTh?.trim() || t('admin.testVoucherManagement.defaultRegulationsTh');
  } catch (error) {
    console.error('Failed to load voucher regulations in preview:', error);
    applyDefaultRegulations();
  }
};

const switchSide = (side: 'front' | 'back'): void => {
  if (isEditingRegulations.value && side === 'front') {
    cancelEditRegulations();
  }
  previewSide.value = side;
};

const startEditRegulations = (): void => {
  editingRegulationsEn.value = activeRegulationsEn.value;
  editingRegulationsTh.value = activeRegulationsTh.value;
  setEditingRegulations(true);
};

const cancelEditRegulations = (): void => {
  setEditingRegulations(false);
  editingRegulationsEn.value = '';
  editingRegulationsTh.value = '';
};

const saveEditRegulations = async (): Promise<void> => {
  try {
    isSavingRegulations.value = true;
    const saved = await saveRegulations({
      regulationsEn: editingRegulationsEn.value,
      regulationsTh: editingRegulationsTh.value,
    });
    loadedRegulationsEn.value = saved.regulationsEn?.trim() || editingRegulationsEn.value.trim();
    loadedRegulationsTh.value = saved.regulationsTh?.trim() || editingRegulationsTh.value.trim();
    setEditingRegulations(false);
    editingRegulationsEn.value = '';
    editingRegulationsTh.value = '';
    $q.notify({
      type: 'positive',
      message: t('admin.testVoucherManagement.notifications.saveSuccess'),
      position: 'top',
    });
  } catch (error) {
    console.error('Failed to save voucher regulations from preview:', error);
    $q.notify({
      type: 'negative',
      message: t('admin.testVoucherManagement.notifications.saveError'),
      position: 'top',
    });
  } finally {
    isSavingRegulations.value = false;
  }
};

onMounted(() => {
  void loadRegulations();
});

watch(
  () => [props.regulationsEn, props.regulationsTh] as const,
  () => {
    const en = normalizeRegulations(props.regulationsEn);
    const th = normalizeRegulations(props.regulationsTh);
    if (en) loadedRegulationsEn.value = en;
    if (th) loadedRegulationsTh.value = th;
  },
);
</script>

<style scoped lang="scss">
.voucher-preview-section {
  margin-top: 24px;
}

.preview-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
}

.edit-regulations-btn {
  font-size: 13px !important;
  font-weight: 600 !important;
  min-height: 32px !important;
}

.side-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #aaaaaa;

  button {
    padding: 0 0 2px;
    border: 0;
    border-bottom: 1px solid transparent;
    background: transparent;
    color: #aaaaaa;
    font: inherit;
    cursor: pointer;
  }

  button.active {
    border-bottom-color: #111111;
    color: #111111;
    font-weight: 600;
  }
}

.regulations-edit-panel {
  margin-top: 8px;
  border: 1.5px solid #cbd5e1;
  border-radius: 12px;
  background: #ffffff;
  padding: 16px;
}

.regulations-edit-heading {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.regulations-edit-input {
  :deep(.q-field__control) {
    border-radius: 8px;
  }

  :deep(textarea) {
    min-height: 120px;
    line-height: 1.45;
  }
}

.regulations-edit-action-btn {
  min-width: 140px !important;
  height: 40px !important;
  border-radius: 10px !important;
  font-weight: 600 !important;
}

.cancel-btn {
  background-color: var(--neutral-gray-light, #e5e5e5) !important;
  color: var(--text-primary, #111111) !important;
  box-shadow: none !important;
}

.voucher-preview {
  height: 380px;
  margin-top: 3px;
  border: 1px solid #222222;
  border-radius: 14px;
  overflow: hidden;
  background: #f0f4f8;

  :deep(.page-container-test) {
    width: 100%;
    height: 100%;
    min-height: 0;
    padding: 0;
    display: block;
  }

  :deep(.voucher-wrapper) {
    width: 100%;
    height: 100%;
    max-width: none;
    margin: 0;
    padding: 0;
  }

  :deep(.voucher-card),
  :deep(.regulations-block) {
    width: 100%;
    margin: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background: #f0f4f8;
  }

  :deep(.voucher-card) {
    width: 100%;
    height: 100%;
    min-height: 0;
    padding: 8px;
  }

  &.is-front :deep(.voucher-header),
  &.is-front :deep(.voucher-body),
  &.is-front :deep(.voucher-footer) {
    background: transparent;
  }

  &.is-front :deep(.voucher-header) {
    grid-template-columns: 190px minmax(0, 1fr);
    min-height: 74px;
    padding: 10px 28px 10px 48px;
  }

  &.is-front :deep(.header-logo) {
    width: 170px;
  }

  &.is-front :deep(.header-title) {
    font-size: 17px !important;
  }

  &.is-front :deep(.header-subtitle) {
    font-size: 16px !important;
    color: var(--Gray, #676767) !important;
  }

  &.is-front :deep(.voucher-body) {
    min-height: 225px;
    padding: 14px 28px 6px 48px;
    display: flex;
    align-items: center;
  }

  &.is-front :deep(.content-container) {
    width: 100%;
    grid-template-columns: 120px minmax(0, 1fr);
    column-gap: 32px;
  }

  &.is-front :deep(.profile-photo-wrapper) {
    width: 120px;
    height: 144px;
  }

  &.is-front :deep(.signature-line) {
    width: 120px;
    margin-top: 38px;
  }

  &.is-front :deep(.details-grid) {
    grid-template-columns: minmax(0, 1.15fr) minmax(122px, 0.85fr);
    grid-auto-rows: minmax(42px, auto);
    column-gap: 30px;
  }

  &.is-front :deep(.info-label) {
    font-size: 13px !important;
    color: var(--Gray, #676767) !important;
  }

  &.is-front :deep(.info-value) {
    font-size: clamp(12px, 1.55vw, 16px) !important;
    white-space: normal !important;
    overflow-wrap: break-word;
    line-height: 1.25;
  }

  &.is-front :deep(.venue-value) {
    white-space: normal !important;
    line-height: 1.25 !important;
  }

  &.is-front :deep(.name-value) {
    display: block !important;
    white-space: normal !important;
    overflow: hidden !important;
    overflow-wrap: break-word !important;
    word-break: normal !important;
    line-height: 1.2 !important;
  }

  &.is-front :deep(.voucher-footer) {
    padding: 5px 20px 12px;
  }

  &.is-front :deep(.barcode-svg) {
    width: 290px;
    height: 40px;
  }

  &.is-front :deep(.watermark-bg) {
    left: 56%;
    top: 47%;
  }

  :deep(.regulations-block) {
    margin-top: 0 !important;
    height: 100%;
  }

  :deep(.regulations-box) {
    height: 100%;
    min-height: 0;
    border: 0;
    border-radius: 0;
    padding: 0;
    background: transparent;
  }

  :deep(.watermark-bg) {
    font-family: 'Outfit', var(--font-family-base);
    font-size: 205px;
    font-style: normal;
    font-weight: 800;
    line-height: 100%;
    letter-spacing: 0;
    vertical-align: middle;
    color: #1e89e50d;
  }

  &.is-back :deep(.regulations-content-wrapper) {
    height: 100%;
    box-sizing: border-box;
    padding: 16px 28px 14px;
    overflow: hidden;
    background: transparent;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  &.is-back :deep(.regulations-box) {
    box-shadow: none !important;
    background: transparent !important;
    background-image: none !important;
  }

  &.is-back :deep(.watermark-bg) {
    left: 56% !important;
    top: 52%;
  }

  &.is-back :deep(.regulations-heading-inline) {
    margin: 0 0 2px 0 !important;
    font-size: 14px;
    line-height: 1.2;
  }

  &.is-back :deep(.regulations-heading-inline.q-mt-md) {
    margin-top: 5px !important;
  }

  &.is-back :deep(.regulations-text-content) {
    font-size: 13px;
    line-height: 1.24;
    margin-top: 0 !important;
  }

  &.is-back :deep(.regulations-text-content.q-mb-md) {
    margin-bottom: 4px !important;
  }
}
</style>
