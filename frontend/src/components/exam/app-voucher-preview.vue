<template>
  <section class="voucher-preview-section">
    <div class="preview-heading">
      <span>{{ title }}</span>
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
          @click="previewSide = 'front'"
        >
          {{ $t('admin.seatCandidates.frontSide') }}
        </button>
        <span aria-hidden="true">|</span>
        <button
          type="button"
          role="tab"
          :aria-selected="previewSide === 'back'"
          :class="{ active: previewSide === 'back' }"
          @click="previewSide = 'back'"
        >
          {{ $t('admin.seatCandidates.backSide') }}
        </button>
      </div>
    </div>

    <div class="voucher-preview" :class="`is-${previewSide}`">
      <TestVoucherReport
        :data="voucherData"
        :show-actions="false"
        :show-voucher-card="previewSide === 'front'"
        :show-regulations="previewSide === 'back'"
        :use-image-placeholder="useImagePlaceholder"
        :regulations-en="regulationsEn"
        :regulations-th="regulationsTh"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import TestVoucherReport from 'src/components/test-voucher-report.vue';
import type { VoucherData } from 'src/types/voucher';

const props = withDefaults(
  defineProps<{
    voucherData: VoucherData;
    useImagePlaceholder?: boolean;
    title?: string;
    regulationsEn?: string | string[];
    regulationsTh?: string | string[];
  }>(),
  {
    useImagePlaceholder: false,
  },
);

const { t } = useI18n();
const title = props.title ?? t('admin.seatCandidates.voucherTitle');
const previewSide = ref<'front' | 'back'>('front');
</script>

<style scoped lang="scss">
.voucher-preview-section {
  margin-top: 24px;
}

.preview-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  font-size: 14px;
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
    left: 64%;
    top: 40%;
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

  &.is-back :deep(.watermark-bg) {
    left: 48% !important;
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
