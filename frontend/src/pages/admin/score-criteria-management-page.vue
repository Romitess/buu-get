<template>
  <q-page class="page-container score-criteria-management-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.scoreCriteriaManagement.pageTitle')"
      :subtitle="$t('admin.scoreCriteriaManagement.pageDescription')"
    />

    <div class="score-criteria-grid row q-col-gutter-lg">
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

      <div class="col-12 col-md-6">
        <div class="section-card">
          <h3 class="section-title">{{ $t('admin.scoreCriteriaManagement.editTitle') }}</h3>

          <div
            class="row items-center table-header-row text-weight-bold q-mb-sm text-grey-8 no-wrap"
          >
            <div style="width: 24px; margin-right: 8px"></div>
            <div class="text-center" style="width: 50px; margin-right: 12px">
              {{ $t('admin.scoreCriteriaManagement.colBand') }}
            </div>
            <div class="text-center" style="width: 140px; margin-right: 12px">
              {{ $t('admin.scoreCriteriaManagement.colScore') }}
            </div>
            <div class="text-center" style="width: 60px; margin-right: 12px">
              {{ $t('admin.scoreCriteriaManagement.colCefr') }}
            </div>
            <div class="text-center col" style="margin-right: 12px">
              {{ $t('admin.scoreCriteriaManagement.colDescriptor') }}
            </div>
            <div style="width: 40px"></div>
          </div>

          <div class="band-rules-list">
            <div
              v-for="(rule, index) in bandRules"
              :key="rule.id"
              class="row items-center rule-row q-mb-md no-wrap"
            >
              <div
                class="text-weight-bold text-grey-7 text-center"
                style="width: 24px; margin-right: 8px"
              >
                {{ index + 1 }}
              </div>

              <div style="width: 50px; margin-right: 12px">
                <q-input
                  v-model="rule.band"
                  outlined
                  dense
                  class="buu-input-muted"
                  input-class="text-center"
                />
              </div>

              <div class="row items-center no-wrap" style="width: 140px; margin-right: 12px">
                <q-input
                  v-model.number="rule.minScore"
                  type="number"
                  outlined
                  dense
                  class="buu-input-muted col"
                  input-class="text-center"
                />
                <span class="q-mx-xs text-grey-6">-</span>
                <q-input
                  v-model.number="rule.maxScore"
                  type="number"
                  outlined
                  dense
                  class="buu-input-muted col"
                  input-class="text-center"
                />
              </div>

              <div style="width: 60px; margin-right: 12px">
                <q-input
                  v-model="rule.cefr"
                  outlined
                  dense
                  class="buu-input-muted"
                  input-class="text-center"
                />
              </div>

              <div class="col" style="margin-right: 12px">
                <q-input
                  v-model="rule.descriptor"
                  outlined
                  dense
                  type="text"
                  class="buu-input-muted"
                />
              </div>

              <div style="width: 40px">
                <q-btn flat round dense color="negative" icon="delete" @click="removeBand(index)" />
              </div>
            </div>

            <div
              v-if="!bandRules.length"
              class="text-center q-py-lg text-grey-5 border-dashed rounded-lg"
            >
              No band rules defined. Click the "+" button to add one.
            </div>

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

    <div class="action-bar row justify-end q-mt-xl q-gutter-md">
      <AppButton
        :label="$t('admin.scoreCriteriaManagement.cancelBtn')"
        color="grey-4"
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
import { getBandRules, saveBandRules } from 'src/services/score-criteria.service';

// ===== ⚙️ Configuration & Constants (No Hard-coding) =====
const LOCAL_STORAGE_KEY = 'buu-get-band-rules';
const SCORE_MAX_LIMIT = 100;
const DEFAULT_SCORE_GAP = 9;

const DEFAULT_NEW_BAND: Omit<BandRule, 'id' | 'band' | 'minScore' | 'maxScore'> = {
  cefr: 'B2',
  descriptor: 'New performance descriptor text...',
};

const DEFAULT_BAND_RULES: BandRule[] = [
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

const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();

// ===== 📦 Reactive State =====
const bandRules = ref<BandRule[]>([]);

// ===== 🔄 Lifecycle Hooks — ดึงจาก API ก่อน, fallback ไป localStorage =====
onMounted(async () => {
  try {
    const data = await getBandRules();
    if (data.bandRules && data.bandRules.length > 0) {
      bandRules.value = data.bandRules;
    } else {
      // API ยังไม่มีข้อมูล — ใช้ค่า default
      bandRules.value = JSON.parse(JSON.stringify(DEFAULT_BAND_RULES));
    }
  } catch {
    // Fallback: อ่านจาก localStorage กรณี API ไม่พร้อม
    try {
      const savedRules = localStorage.getItem(LOCAL_STORAGE_KEY);
      bandRules.value = savedRules
        ? JSON.parse(savedRules)
        : JSON.parse(JSON.stringify(DEFAULT_BAND_RULES));
    } catch (e) {
      console.error('Failed to load band rules from localStorage', e);
      bandRules.value = JSON.parse(JSON.stringify(DEFAULT_BAND_RULES));
    }
  }
});

// ===== ⚡ Actions =====
const addBand = (): void => {
  const lastRule = bandRules.value[bandRules.value.length - 1];

  // คำนวณช่วงคะแนนโดยเช็คจากแถวล่าสุด (ถ้าไม่มีแถวก่อนหน้า จะเริ่มต้นที่ 0)
  const nextMinScore = lastRule ? Math.min(SCORE_MAX_LIMIT, lastRule.maxScore + 1) : 0;

  const nextMaxScore = Math.min(SCORE_MAX_LIMIT, nextMinScore + DEFAULT_SCORE_GAP);

  bandRules.value.push({
    id: String(Date.now()),
    band: String(bandRules.value.length + 1),
    minScore: nextMinScore,
    maxScore: nextMaxScore,
    ...DEFAULT_NEW_BAND,
  });
};

const removeBand = (index: number): void => {
  bandRules.value.splice(index, 1);
};

const handleCancel = (): void => {
  router.back();
};

const handleSave = async (): Promise<void> => {
  try {
    await saveBandRules(bandRules.value);
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
