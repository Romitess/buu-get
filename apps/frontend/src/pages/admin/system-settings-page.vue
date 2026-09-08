<template>
  <q-page class="page-container system-settings-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.systemSettings.pageTitle')"
      :subtitle="$t('admin.systemSettings.pageDescription')"
    />

    <q-banner v-if="error" dense rounded class="bg-negative text-white q-mb-md">
      {{ error }}
    </q-banner>

    <q-tabs
      v-model="activeGroup"
      dense
      class="text-primary q-mb-md"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
    >
      <q-tab
        v-for="group in groups"
        :key="group"
        :name="group"
        :label="$t(`admin.systemSettings.groups.${group}`)"
      />
    </q-tabs>

    <q-card flat bordered>
      <q-card-section>
        <div v-if="isLoading" class="row justify-center q-pa-lg">
          <q-spinner color="primary" size="40px" />
        </div>

        <q-list v-else separator>
          <q-item
            v-for="item in filteredSettings"
            :key="item.key"
            :class="{ 'setting-item--wide': isWideControl(item.key) }"
          >
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ item.descriptionTh }}
              </q-item-label>
            </q-item-section>
            <q-item-section
              side
              :class="
                isWideControl(item.key)
                  ? 'setting-input-section setting-input-section--wide'
                  : 'setting-input-section'
              "
            >
              <app-select
                v-if="item.key === 'exam.defaultType'"
                :model-value="draftValues[item.key] ?? ''"
                :options="examTypeOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                dense
                outlined
                dropdown-icon="keyboard_arrow_down"
                :disable="isSaving"
                class="setting-input"
                @update:model-value="setDraft(item.key, $event)"
              />
              <app-select
                v-else-if="item.key === 'exam.defaultFormat'"
                :model-value="draftValues[item.key] ?? ''"
                :options="examFormatOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                dense
                outlined
                dropdown-icon="keyboard_arrow_down"
                :disable="isSaving"
                class="setting-input"
                @update:model-value="setDraft(item.key, $event)"
              />
              <app-time-picker
                v-else-if="
                  item.key === 'exam.defaultSessionStart' ||
                  item.key === 'exam.defaultSessionEnd'
                "
                :model-value="draftValues[item.key] ?? ''"
                dense
                outlined
                hide-bottom-space
                :disable="isSaving"
                class="setting-input"
                @update:model-value="setDraft(item.key, $event)"
              />
              <q-input
                v-else-if="isNumericType(item.type)"
                :model-value="draftValues[item.key] ?? ''"
                dense
                outlined
                type="number"
                :min="numericBounds(item.key)?.min"
                :max="numericBounds(item.key)?.max"
                :disable="isSaving"
                class="setting-input"
                @update:model-value="setDraft(item.key, $event)"
              />
              <q-input
                v-else-if="item.key === 'org.supportEmail'"
                :model-value="draftValues[item.key] ?? ''"
                dense
                outlined
                type="email"
                :disable="isSaving"
                class="setting-input"
                @update:model-value="setDraft(item.key, $event)"
              />
              <q-input
                v-else-if="
                  item.key === 'org.addressTh' || item.key === 'org.addressEn'
                "
                :model-value="draftValues[item.key] ?? ''"
                dense
                outlined
                type="textarea"
                autogrow
                :disable="isSaving"
                class="setting-input setting-input--textarea"
                @update:model-value="setDraft(item.key, $event)"
              />
              <q-input
                v-else
                :model-value="draftValues[item.key] ?? ''"
                dense
                outlined
                type="text"
                :disable="isSaving"
                class="setting-input"
                @update:model-value="setDraft(item.key, $event)"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <AppButton
          color="primary"
          :label="$t('admin.systemSettings.actions.save')"
          :loading="isSaving"
          :disable="isLoading || !hasChanges"
          @click="handleSave"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppButton from 'src/components/base/app-button.vue';
import AppSelect from 'src/components/base/app-select.vue';
import AppTimePicker from 'src/components/base/app-time-picker.vue';
import {
  EXAM_FORMAT_COMPUTER,
  EXAM_FORMAT_PAPER,
  EXAM_TYPE_GENERAL,
  EXAM_TYPE_SPECIAL,
} from 'src/constants/exam';
import {
  fetchSystemSettings,
  updateSystemSettings,
  type SystemSettingItem,
} from 'src/services/system-settings.service';

const GROUP_ORDER = ['exam', 'payment', 'certificate', 'org', 'email'] as const;

/** min/max จาก catalog backend — ใช้จำกัด input number ฝั่ง UI */
const NUMERIC_BOUNDS: Record<string, { min?: number; max?: number }> = {
  'exam.defaultFeeThb': { min: 0, max: 1_000_000 },
  'exam.passcodeLength': { min: 4, max: 16 },
  'payment.sessionTtlMinutes': { min: 1, max: 120 },
  'payment.defaultPcId': { min: 1 },
  'certificate.validityYears': { min: 1, max: 20 },
};

const WIDE_KEYS = new Set(['org.addressTh', 'org.addressEn']);

const $q = useQuasar();
const { t } = useI18n();

const isLoading = ref(false);
const isSaving = ref(false);
const error = ref<string | null>(null);
const settings = ref<SystemSettingItem[]>([]);
const draftValues = reactive<Record<string, string>>({});
const activeGroup = ref<(typeof GROUP_ORDER)[number]>('exam');

const examTypeOptions = computed(() => [
  { label: t('examSchedule.examType.general'), value: EXAM_TYPE_GENERAL },
  { label: t('examSchedule.examType.special'), value: EXAM_TYPE_SPECIAL },
]);

const examFormatOptions = computed(() => [
  { label: t('examSchedule.examFormat.computer'), value: EXAM_FORMAT_COMPUTER },
  { label: t('examSchedule.examFormat.paper'), value: EXAM_FORMAT_PAPER },
]);

const groups = computed(() =>
  GROUP_ORDER.filter((group) => settings.value.some((item) => item.group === group)),
);

const filteredSettings = computed(() =>
  settings.value.filter((item) => item.group === activeGroup.value),
);

const hasChanges = computed(() =>
  settings.value.some((item) => (draftValues[item.key] ?? '') !== item.value),
);

function isNumericType(type: string): boolean {
  return type === 'number' || type === 'integer';
}

function isWideControl(key: string): boolean {
  return WIDE_KEYS.has(key);
}

function numericBounds(key: string): { min?: number; max?: number } | undefined {
  return NUMERIC_BOUNDS[key];
}

function setDraft(key: string, value: unknown): void {
  if (value == null) {
    draftValues[key] = '';
    return;
  }
  draftValues[key] = String(value);
}

function applyDraft(items: SystemSettingItem[]): void {
  settings.value = items;
  for (const key of Object.keys(draftValues)) {
    delete draftValues[key];
  }
  for (const item of items) {
    draftValues[item.key] = item.value;
  }
  if (!groups.value.includes(activeGroup.value) && groups.value[0]) {
    activeGroup.value = groups.value[0];
  }
}

async function loadSettings(): Promise<void> {
  isLoading.value = true;
  error.value = null;
  try {
    const items = await fetchSystemSettings();
    applyDraft(items);
  } catch (err: unknown) {
    error.value =
      err instanceof Error ? err.message : t('admin.systemSettings.errors.loadFailed');
  } finally {
    isLoading.value = false;
  }
}

async function handleSave(): Promise<void> {
  const changed = settings.value
    .filter((item) => (draftValues[item.key] ?? '') !== item.value)
    .map((item) => ({
      key: item.key,
      value: String(draftValues[item.key] ?? '').trim(),
    }));

  if (changed.length === 0) {
    return;
  }

  isSaving.value = true;
  error.value = null;
  try {
    const items = await updateSystemSettings(changed);
    applyDraft(items);
    $q.notify({
      type: 'positive',
      message: t('admin.systemSettings.messages.saved'),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : t('admin.systemSettings.errors.saveFailed');
    error.value = message;
    $q.notify({ type: 'negative', message });
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  void loadSettings();
});
</script>

<style scoped lang="scss">
.setting-input-section {
  min-width: 220px;
}

.setting-input-section--wide {
  min-width: min(420px, 55vw);
  width: min(420px, 55vw);
}

.setting-input {
  width: 220px;
}

.setting-input--textarea {
  width: 100%;
  min-width: 280px;
}

.setting-item--wide {
  :deep(.q-item__section--main) {
    flex: 1 1 auto;
  }
}
</style>
