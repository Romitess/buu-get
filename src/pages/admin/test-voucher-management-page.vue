<template>
  <q-page class="page-container test-voucher-management-page">
    <!-- Breadcrumbs -->
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.testVoucherManagement.pageTitle')"
      :subtitle="$t('admin.testVoucherManagement.pageDescription')"
    />

    <!-- Main Content: Two-Column Layout -->
    <div class="voucher-content-grid row q-col-gutter-lg">
      <!-- Left Column: Voucher Preview + Regulations (Scrollable) -->
      <div class="col-12 col-md-6">
        <div class="section-card section-card--scrollable">
          <h3 class="section-title">{{ $t('admin.testVoucherManagement.previewTitle') }}</h3>
          <div class="scrollable-content">
            <div class="admin-voucher-preview">
              <TestVoucherReport
                :data="voucherPreviewData"
                :regulations-en="regulationsEn"
                :regulations-th="regulationsTh"
                :show-regulations="true"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Edit Form -->
      <div class="col-12 col-md-6">
        <div class="section-card">
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
              rows="6"
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
              rows="6"
              :placeholder="$t('admin.testVoucherManagement.placeholderTh')"
              class="custom-rule-input"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-bar row justify-end q-mt-xl q-gutter-md">
      <AppButton
        :label="$t('admin.testVoucherManagement.cancelBtn')"
        color="grey-3"
        text-color="dark"
        unelevated
        class="action-btn"
        @click="handleCancel"
      />
      <AppButton
        :label="$t('admin.testVoucherManagement.saveBtn')"
        color="primary"
        unelevated
        class="action-btn action-btn--save"
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
  examType: 'ทั่วไป',
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

// Load saved data on mount
onMounted(() => {
  try {
    const savedEn = localStorage.getItem('buu-get-regulations-en');
    const savedTh = localStorage.getItem('buu-get-regulations-th');
    if (savedEn) {
      if (savedEn.startsWith('[')) {
        regulationsEn.value = JSON.parse(savedEn).join('\n');
      } else {
        regulationsEn.value = savedEn;
      }
    }
    if (savedTh) {
      if (savedTh.startsWith('[')) {
        regulationsTh.value = JSON.parse(savedTh).join('\n');
      } else {
        regulationsTh.value = savedTh;
      }
    }
  } catch (e) {
    console.error('Failed to load regulations from localStorage', e);
  }
});

// ===== Actions =====
const handleCancel = (): void => {
  router.back();
};

const handleSave = (): void => {
  try {
    localStorage.setItem('buu-get-regulations-en', regulationsEn.value);
    localStorage.setItem('buu-get-regulations-th', regulationsTh.value);
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

// ===== Section Card =====
.section-card {
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  padding: 28px;
  height: 100%;
  transition: box-shadow var(--transition-fast);
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: var(--shadow-md);
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
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: var(--neutral-100);
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--neutral-400);
    border-radius: 10px;
    &:hover {
      background: var(--neutral-500);
    }
  }
}

.section-title {
  font-family: 'Sarabun', 'Inter', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--neutral-200);
}

// ===== Voucher Preview =====
.admin-voucher-preview {
  // Override the inner component padding and background for inline display
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
    max-width: 100% !important;
  }
}

// ===== Regulations =====
.regulations-block {
  margin-top: 4px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.regulations-heading {
  font-family: 'Sarabun', 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 12px 0;
}

.regulations-heading-inline {
  font-family: 'Sarabun', 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
}

.regulations-box {
  background-color: var(--neutral-50);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-sm);
  padding: 20px 24px;
}

.regulations-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
    font-family: 'Sarabun', 'Inter', sans-serif;
    font-size: 0.875rem;
    font-weight: 400;
    color: #0f172a;
    line-height: 1.6;
    padding-left: 4px;

    &::marker {
      color: var(--primary);
      font-weight: 600;
    }
  }
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
    resize: none;
    font-family: 'Sarabun', sans-serif;
    font-size: 0.875rem;
    color: #0f172a !important;
  }
}

// ===== Action Buttons =====
.action-bar {
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.action-btn {
  min-width: 160px;
  height: 48px;
  border-radius: var(--radius-10) !important;
  font-weight: 700;
  font-size: var(--font-size-sm);
  letter-spacing: 0.3px;

  &--save {
    min-width: 180px;
  }
}

// ===== Responsive =====
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
