<template>
  <q-page class="page-container score-criteria-management-page">
    <!-- Breadcrumbs -->
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.scoreCriteriaManagement.pageTitle')"
      :subtitle="$t('admin.scoreCriteriaManagement.pageDescription')"
    />

    <!-- Main Content: Two-Column Layout -->
    <div class="score-criteria-grid row q-col-gutter-lg">
      <!-- Left Column: Certificate Preview (Scrollable) -->
      <div class="col-12 col-md-6">
        <div class="section-card section-card--scrollable">
          <h3 class="section-title">{{ $t('admin.scoreCriteriaManagement.previewTitle') }}</h3>
          <div class="scrollable-content">
            <div class="admin-cert-preview">
              <CertificatePreviewReport :band-rules="bandRules" />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Edit Form -->
      <div class="col-12 col-md-6">
        <div class="section-card">
          <h3 class="section-title">{{ $t('admin.scoreCriteriaManagement.editTitle') }}</h3>

          <!-- Table Header -->
          <div
            class="row items-center q-col-gutter-sm table-header-row text-weight-bold q-mb-sm text-grey-8"
          >
            <div class="col-auto text-center" style="width: 24px"></div>
            <div class="col-2 text-center">{{ $t('admin.scoreCriteriaManagement.colBand') }}</div>
            <div class="col-3 text-center">{{ $t('admin.scoreCriteriaManagement.colScore') }}</div>
            <div class="col-2 text-center">{{ $t('admin.scoreCriteriaManagement.colCefr') }}</div>
            <div class="col text-center">
              {{ $t('admin.scoreCriteriaManagement.colDescriptor') }}
            </div>
            <div class="col-auto" style="width: 40px"></div>
          </div>

          <!-- List of Band Rules -->
          <div class="band-rules-list">
            <div
              v-for="(rule, index) in bandRules"
              :key="rule.id"
              class="row items-center q-col-gutter-sm rule-row q-mb-md"
            >
              <!-- Row Index -->
              <div class="col-auto text-weight-bold text-grey-7 text-center" style="width: 24px">
                {{ index + 1 }}
              </div>

              <!-- Band Input -->
              <div class="col-2">
                <q-input v-model="rule.band" outlined dense class="buu-input-muted text-center" />
              </div>

              <!-- Score Range (Min - Max) -->
              <div class="col-3 row items-center no-wrap">
                <q-input
                  v-model.number="rule.minScore"
                  type="number"
                  outlined
                  dense
                  class="buu-input-muted text-center col"
                />
                <span class="q-mx-xs text-grey-6">-</span>
                <q-input
                  v-model.number="rule.maxScore"
                  type="number"
                  outlined
                  dense
                  class="buu-input-muted text-center col"
                />
              </div>

              <!-- CEFR Input -->
              <div class="col-2">
                <q-input v-model="rule.cefr" outlined dense class="buu-input-muted text-center" />
              </div>

              <!-- Performance Descriptor Input -->
              <div class="col">
                <q-input
                  v-model="rule.descriptor"
                  outlined
                  dense
                  type="textarea"
                  rows="1"
                  class="buu-input-muted custom-textarea"
                  autogrow
                />
              </div>

              <!-- Delete Button -->
              <div class="col-auto" style="width: 40px">
                <q-btn flat round dense color="negative" icon="delete" @click="removeBand(index)" />
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-if="!bandRules.length"
              class="text-center q-py-lg text-grey-5 border-dashed rounded-lg"
            >
              No band rules defined. Click the "+" button to add one.
            </div>

            <!-- Add Row Button -->
            <q-btn
              flat
              icon="add"
              color="grey-7"
              class="full-width q-py-sm q-mt-sm add-row-btn"
              @click="addBand"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-bar row justify-end q-mt-xl q-gutter-md">
      <AppButton
        :label="$t('admin.scoreCriteriaManagement.cancelBtn')"
        color="grey-3"
        text-color="dark"
        unelevated
        class="action-btn"
        @click="handleCancel"
      />
      <AppButton
        :label="$t('admin.scoreCriteriaManagement.saveBtn')"
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
import CertificatePreviewReport from 'src/components/certificate-preview-report.vue';
import type { BandRule } from 'src/components/certificate-preview-report.vue';

const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();

// ===== Reactive State for Band Rules =====
const bandRules = ref<BandRule[]>([]);

// ===== Mock Defaults matching image =====
const defaultBandRules: BandRule[] = [
  {
    id: '1',
    band: '1',
    minScore: 40,
    maxScore: 49,
    cefr: 'A2',
    descriptor:
      'Can understand short, simple texts on familiar matters of a concrete type which consist of high frequency every day or job-related language.',
  },
  {
    id: '2',
    band: '2',
    minScore: 50,
    maxScore: 59,
    cefr: 'A2',
    descriptor:
      'Can understand short, simple texts on familiar matters of a concrete type which consist of high frequency every day or job-related language.',
  },
  {
    id: '3',
    band: '3',
    minScore: 60,
    maxScore: 69,
    cefr: 'B1',
    descriptor:
      'Can read straightforward factual texts on subjects related to his/her field and interest with a satisfactory level of comprehension.',
  },
  {
    id: '4',
    band: '4',
    minScore: 70,
    maxScore: 79,
    cefr: 'B1',
    descriptor:
      'Can read straightforward factual texts on subjects related to his/her field and interest with a satisfactory level of comprehension.',
  },
  {
    id: '5',
    band: '5',
    minScore: 80,
    maxScore: 100,
    cefr: 'B2',
    descriptor:
      'Can read with a large degree of independence, adapting style and speed of reading to different texts and purposes, and using appropriate reference sources selectively. Has a broad active reading vocabulary, but may experience some difficulty with low frequency idioms.',
  },
];

// Load rules on mount
onMounted(() => {
  try {
    const savedRules = localStorage.getItem('buu-get-band-rules');
    if (savedRules) {
      bandRules.value = JSON.parse(savedRules);
    } else {
      bandRules.value = JSON.parse(JSON.stringify(defaultBandRules));
    }
  } catch (e) {
    console.error('Failed to load band rules from localStorage', e);
    bandRules.value = JSON.parse(JSON.stringify(defaultBandRules));
  }
});

// ===== Actions =====
const addBand = (): void => {
  const nextMinScore = bandRules.value.length
    ? Math.min(100, bandRules.value[bandRules.value.length - 1].maxScore + 1)
    : 0;
  const nextMaxScore = Math.min(100, nextMinScore + 9);

  bandRules.value.push({
    id: String(Date.now()),
    band: String(bandRules.value.length + 1),
    minScore: nextMinScore,
    maxScore: nextMaxScore,
    cefr: 'B2',
    descriptor: 'New performance descriptor text...',
  });
};

const removeBand = (index: number): void => {
  bandRules.value.splice(index, 1);
};

const handleCancel = (): void => {
  router.back();
};

const handleSave = (): void => {
  try {
    localStorage.setItem('buu-get-band-rules', JSON.stringify(bandRules.value));
    $q.notify({
      type: 'positive',
      message: t('admin.scoreCriteriaManagement.notifications.saveSuccess'),
      position: 'top',
    });
  } catch (e) {
    console.error(e);
    $q.notify({
      type: 'negative',
      message: t('admin.scoreCriteriaManagement.notifications.saveError'),
      position: 'top',
    });
  }
};
</script>

<style scoped lang="scss">
.score-criteria-management-page {
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

.table-header-row {
  font-family: 'Sarabun', 'Inter', sans-serif;
  font-size: 0.85rem;
}

.band-rules-list {
  flex: 1;
  overflow-y: auto;
}

.rule-row {
  align-items: center;
}

.add-row-btn {
  background-color: var(--neutral-100);
  border-radius: 8px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--neutral-200);
  }
}

.custom-textarea {
  :deep(.q-field__control) {
    min-height: 39px !important;
    height: auto !important;
  }

  :deep(.q-field__native) {
    min-height: unset !important;
    padding: 6px 0 !important;
    line-height: 1.3 !important;
  }
}

.admin-cert-preview {
  :deep(.page-container-test) {
    padding: 0 !important;
    min-height: auto !important;
    background-color: transparent !important;
    align-items: stretch !important;
  }

  :deep(.no-print) {
    display: none !important;
  }

  :deep(.report-wrapper) {
    max-width: 100% !important;
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

.border-dashed {
  border: 1.5px dashed var(--neutral-300);
}

.rounded-lg {
  border-radius: 8px;
}

// ===== Responsive =====
@media (max-width: 1023px) {
  .score-criteria-grid {
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
