<template>
  <q-page class="page-container test-voucher-management-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.testVoucherManagement.pageTitle')"
      :subtitle="$t('admin.testVoucherManagement.pageDescription')"
    />

    <div class="voucher-content-grid row q-col-gutter-lg">
      <div class="col-12 col-md-6">
        <q-card class="section-card section-card--scrollable">
          <h3 class="section-title">{{ $t('admin.testVoucherManagement.previewTitle') }}</h3>
          <div class="scrollable-content">
            <div class="admin-voucher-preview">
              <TestVoucherReport
                :data="voucherPreviewData"
                :regulations-en="regulationsEn"
                :regulations-th="regulationsTh"
                :show-regulations="true"
                :use-image-placeholder="true"
              />
            </div>
          </div>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card class="section-card">
          <h3 class="section-title">{{ $t('admin.testVoucherManagement.editTitle') }}</h3>

          <!-- Test Regulations (English) -->
          <div class="regulations-block">
            <h4 class="regulations-heading">
              {{ $t('admin.testVoucherManagement.regulationsEnLabel') }}
            </h4>
            <q-input
              v-model="regulationsEn"
              outlined
              type="textarea"
              :placeholder="$t('admin.testVoucherManagement.placeholderEn')"
              class="custom-rule-input"
            />
          </div>

          <!-- ข้อปฏิบัติสำหรับผู้เข้าสอบ (Thai) -->
          <div class="regulations-block q-mt-lg">
            <h4 class="regulations-heading">
              {{ $t('admin.testVoucherManagement.regulationsThLabel') }}
            </h4>
            <q-input
              v-model="regulationsTh"
              outlined
              type="textarea"
              :placeholder="$t('admin.testVoucherManagement.placeholderTh')"
              class="custom-rule-input"
            />
          </div>
        </q-card>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-bar row justify-end q-mt-lg q-gutter-md">
      <AppButton
        :label="$t('admin.testVoucherManagement.cancelBtn')"
        color="grey-4"
        text-color="dark"
        unelevated
        class="action-btn"
        @click="handleCancel"
      />
      <AppButton
        :label="$t('admin.testVoucherManagement.saveBtn')"
        color="primary"
        unelevated
        class="action-btn"
        @click="handleSave"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppButton from 'src/components/base/app-button.vue';
import TestVoucherReport from 'src/components/test-voucher-report.vue';
import type { VoucherData } from 'src/types/voucher';
import { getRegulations, saveRegulations } from 'src/services/exam-rule-voucher.service';

const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();

// ===== Voucher Preview Data =====
const voucherPreviewData = ref<VoucherData>({
  id: 1,
  fullName: 'Mr. Somdream Jaidee',
  studentId: 'XXXXXXXX',
  examName: 'BUU-GET : Burapha University\u2019s Graduate English Test',
  examDate: 'XX May XXXX',
  examTime: '08.00 AM - 10.00 AM',
  examType: 'General',
  location: 'QS1, Burapha University',
  seatNo: 'A1',
  voucherNo: 'ENG2026-001',
  citizenId: 'X-XXXX-XXXXX-XX-X',
  testSession: 'X/XXXX',
});

// ===== Test Regulations (English) =====
const regulationsEn = ref<string>(t('admin.testVoucherManagement.defaultRegulationsEn'));

// ===== ข้อปฏิบัติสำหรับผู้เข้าสอบ (Thai) =====
const regulationsTh = ref<string>(t('admin.testVoucherManagement.defaultRegulationsTh'));

// Load regulations from API
onMounted(async () => {
  try {
    const data = await getRegulations();
    if (data.regulationsEn) {
      regulationsEn.value = data.regulationsEn.trim();
    }
    if (data.regulationsTh) {
      regulationsTh.value = data.regulationsTh.trim();
    }
  } catch (error) {
    console.error('Failed to load voucher regulations', error);
  }
});

// ===== Actions =====
const handleCancel = (): void => {
  router.back();
};

const handleSave = async (): Promise<void> => {
  try {
    await saveRegulations({
      regulationsEn: regulationsEn.value,
      regulationsTh: regulationsTh.value,
    });
    $q.notify({
      type: 'positive',
      message: t('admin.testVoucherManagement.notifications.saveSuccess'),
      position: 'top',
    });
  } catch (e) {
    console.error(e);
    $q.notify({
      type: 'negative',
      message: t('admin.testVoucherManagement.notifications.saveError'),
      position: 'top',
    });
  }
};
</script>

<style scoped lang="scss">
.test-voucher-management-page {
  padding-top: 16px;
  padding-bottom: 32px;

  @media (min-height: 900px) {
    padding-top: 24px;
    padding-bottom: 48px;
  }
}

.voucher-content-grid {
  & > div {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
}

.section-card {
  background: #ffffff;
  border-radius: var(--radius-lg);
  border: none;
  box-shadow: 0px 4px 4px 0px #00000040 !important;
  padding: 28px;
  height: 100%;
  transition: box-shadow var(--transition-fast);
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0px 4px 4px 0px #00000040;
  }

  &--scrollable {
    display: flex;
    flex-direction: column;
    max-height: 820px;

    .section-title {
      flex-shrink: 0;
    }
  }
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: #595959;
    border-radius: 10px;
    &:hover {
      background: #444444;
    }
  }
}

.section-title {
  font-family: 'Sarabun', 'Inter', sans-serif;
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 20px 0;
}

.admin-voucher-preview {
  padding: 0 4px;

  :deep(.page-container-test) {
    padding: 0 !important;
    min-height: auto !important;
    background-color: transparent !important;
    align-items: stretch !important;
  }

  :deep(.no-print) {
    display: none !important;
  }

  :deep(.voucher-wrapper) {
    max-width: 98% !important;
    margin: 0 auto !important;
  }

  :deep(.voucher-body) {
    padding-left: 48px !important;
    padding-right: 28px !important;
  }

  :deep(.details-grid) {
    column-gap: 16px !important;
  }

  :deep(.info-value) {
    font-size: 13.5px !important;
    white-space: normal !important;
    overflow-wrap: break-word !important;
    line-height: 1.25 !important;
  }

  :deep(.name-value) {
    white-space: normal !important;
    overflow-wrap: break-word !important;
    line-height: 1.25 !important;
  }

  :deep(.venue-value) {
    white-space: normal !important;
    overflow-wrap: break-word !important;
    line-height: 1.25 !important;
  }
}

.regulations-block {
  margin-top: 4px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.regulations-heading {
  font-family: 'Sarabun', 'Inter', sans-serif;
  font-size: 1.2rem;
  font-weight: 500;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.custom-rule-input {
  flex: 1;
  display: flex;
  flex-direction: column;

  :deep(.q-field__inner) {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  :deep(.q-field__control) {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    background-color: #ffffff;
    transition: all 0.2s ease;
    padding-top: 12px !important;
    padding-bottom: 12px !important;

    &:before {
      border: 1px solid var(--neutral-200, #e2e8f0) !important;
      border-style: solid !important;
    }

    &:hover:before {
      border-color: var(--neutral-400, #cbd5e1) !important;
    }

    &.q-field__focused:before {
      border-color: var(--primary) !important;
    }
  }

  :deep(.q-field__control-container) {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  :deep(.q-field__native) {
    flex: 1;
    height: 100% !important;
    resize: none;
    font-family: 'Sarabun', sans-serif;
    font-size: 1.05rem;
    color: #0f172a !important;
    line-height: 1.65 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }
}

.action-bar {
  padding-top: 0;
  border-top: none;
}

.action-btn {
  min-width: 160px;
  height: 48px;
  border-radius: var(--radius-10) !important;
  font-weight: 700;
  font-size: var(--font-size-sm);
  letter-spacing: 0.3px;
}

@media (max-width: 1023px) {
  .voucher-content-grid {
    flex-direction: column;
  }
}

@media (max-width: 599px) {
  .section-card {
    padding: 20px 16px;
  }

  .action-btn {
    min-width: 100% !important;
  }

  .action-bar {
    flex-direction: column;
  }
}
</style>
