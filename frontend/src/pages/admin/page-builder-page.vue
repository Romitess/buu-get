<template>
  <q-page class="page-container page-builder-page">
    <div class="pb-content column">
      <AppBreadcrumbs />
      <div class="row items-center justify-between q-col-gutter-y-md q-mb-lg">
        <div class="column">
          <div class="page-title text-weight-bold">{{ $t('admin.pageBuilder.title') }}</div>
          <div class="text-subtitle1 page-subtitle q-mt-xs">
            {{ $t('admin.pageBuilder.subtitle') }}
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="column flex-center q-py-xl">
        <q-spinner color="primary" size="40px" />
      </div>

      <div v-else class="column pb-sections-list">
        <PageBuilderBannerSection v-model="bannerSection" />

        <div class="row q-col-gutter-x-lg pb-middle-row">
          <div class="col-12 col-md-6">
            <PageBuilderContentSection
              v-model="formatSection"
              :title="$t('admin.pageBuilder.testFormat')"
              :add-label="$t('admin.pageBuilder.actions.addFormat')"
              :empty-label="$t('admin.pageBuilder.empty.testFormat')"
              :edit-locale="editLocale"
            />
          </div>
          <div class="col-12 col-md-6">
            <PageBuilderContentSection
              v-model="stepSection"
              :title="$t('admin.pageBuilder.registrationSteps')"
              :add-label="$t('admin.pageBuilder.actions.addStep')"
              :empty-label="$t('admin.pageBuilder.empty.registrationSteps')"
              :edit-locale="editLocale"
            />
          </div>
        </div>

        <PageBuilderExamRulesSection
          v-model:paper="rulePaperSection"
          v-model:computer="ruleComputerSection"
          :edit-locale="editLocale"
        />

        <div class="row items-center justify-end q-gutter-x-md q-mt-sm pb-actions">
          <AppButton
            color="grey-4"
            text-color="dark"
            unelevated
            class="pb-action-btn"
            :label="$t('admin.pageBuilder.actions.cancel')"
            :disable="isSaving"
            @click="onCancel"
          />
          <AppButton
            outline
            color="primary"
            class="pb-action-btn preview-btn"
            :label="$t('admin.pageBuilder.actions.previewHome')"
            @click="onPreview"
          />
          <AppButton
            color="primary"
            class="pb-action-btn"
            :label="$t('admin.pageBuilder.actions.save')"
            :loading="isSaving"
            @click="onSave"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, watch, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppButton from 'src/components/base/app-button.vue';
import PageBuilderBannerSection from 'src/components/page-builder/page-builder-banner-section.vue';
import PageBuilderContentSection from 'src/components/page-builder/page-builder-content-section.vue';
import PageBuilderExamRulesSection from 'src/components/page-builder/page-builder-exam-rules-section.vue';
import { usePageBuilder } from 'src/composables/use-page-builder';

const $q = useQuasar();
const router = useRouter();
const { locale, t } = useI18n();

const editLocale = computed<'th' | 'en'>(() => {
  return locale.value.startsWith('en') ? 'en' : 'th';
});

const {
  isLoading,
  isSaving,
  error,
  bannerSection,
  formatSection,
  stepSection,
  rulePaperSection,
  ruleComputerSection,
  fetchPage,
  save,
} = usePageBuilder();

watch(error, (val) => {
  if (val) {
    $q.notify({ type: 'negative', message: val, position: 'top' });
  }
});

const onSave = async (): Promise<void> => {
  const ok = await save();
  if (ok) {
    $q.notify({
      type: 'positive',
      message: t('admin.pageBuilder.messages.saveSuccess'),
      position: 'top',
    });
  }
};

const onCancel = (): void => {
  void fetchPage();
};

const onPreview = (): void => {
  const { href } = router.resolve({ name: 'home' });
  window.open(href, '_blank', 'noopener');
};

onMounted(() => {
  void fetchPage();
});
</script>

<style scoped lang="scss">
.page-builder-page {
  // Override global .page-container width (clamp min 1024px) so the page never
  // forces horizontal scroll on phones / Mac / zoom — keep the 90vw feel + 1600px cap.
  width: min(90vw, 1600px);
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  // Responsive, proportionally-consistent padding across every screen size.
  padding: clamp(16px, 2.4vw, 32px);
  overflow-x: hidden;
  font-family: var(--font-family-base) !important;

  :deep(*:not(.q-icon):not(.material-icons):not(i)) {
    font-family: var(--font-family-base) !important;
  }
}

.pb-content {
  width: 100%;
  margin: 0 auto;
}

.pb-sections-list > * + * {
  margin-top: var(--space-lg);
}

.page-title {
  font-size: 25px;
  line-height: 1.3;
  color: var(--pb-heading-color);
}

.page-subtitle {
  color: var(--pb-subtitle-color);
}

.pb-action-btn {
  min-width: 150px;
  height: 52px;
  border-radius: 10px;
  font-weight: 700;
}

.preview-btn {
  color: var(--primary) !important;
  background-color: transparent !important;

  &:before {
    border: 1px solid var(--primary) !important;
  }

  &:hover {
    background-color: rgba(13, 71, 161, 0.05) !important;
  }
}

@media (max-width: 1023px) {
  .pb-middle-row > * + * {
    margin-top: var(--space-lg);
  }
}

@media (max-width: 599px) {
  .page-title {
    font-size: 22px;
  }

  // Stack action buttons full-width so 3 buttons never overflow a small screen.
  .pb-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .pb-actions .pb-action-btn {
    width: 100%;
    min-width: 0;
    margin-left: 0 !important;
  }
}
</style>
