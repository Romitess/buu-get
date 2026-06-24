<template>
  <q-page class="page-container page-builder-page">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6 text-weight-bold">จัดการหน้าแรก</div>
      <q-btn
        color="primary"
        icon="save"
        label="บันทึก"
        :loading="isSaving"
        unelevated
        @click="onSave"
      />
    </div>

    <div v-if="isLoading" class="column items-center q-py-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else class="column q-gutter-y-md">
      <PageBuilderBannerSection
        v-model="bannerSection"
        @add="addBanner"
        @remove="(i) => removeBox(bannerSection, i)"
        @move="(from, to) => moveBox(bannerSection, from, to)"
      />
      <PageBuilderCardSection
        v-model="cardSection"
        @add="addCard"
        @remove="(i) => removeBox(cardSection, i)"
        @move="(from, to) => moveBox(cardSection, from, to)"
      />
      <PageBuilderExamRuleSection
        v-model="examRuleSection"
        @add="addExamRule"
        @remove="(i) => removeBox(examRuleSection, i)"
        @move="(from, to) => moveBox(examRuleSection, from, to)"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import PageBuilderBannerSection from 'src/components/page-builder/page-builder-banner-section.vue';
import PageBuilderCardSection from 'src/components/page-builder/page-builder-card-section.vue';
import PageBuilderExamRuleSection from 'src/components/page-builder/page-builder-exam-rule-section.vue';
import { usePageBuilder } from 'src/composables/use-page-builder';

const $q = useQuasar();

const {
  isLoading,
  isSaving,
  error,
  bannerSection,
  cardSection,
  examRuleSection,
  fetchPage,
  save,
  addBanner,
  addCard,
  addExamRule,
  removeBox,
  moveBox,
} = usePageBuilder();

watch(error, (val) => {
  if (val) {
    $q.notify({ type: 'negative', message: val, position: 'top' });
  }
});

const onSave = async (): Promise<void> => {
  const ok = await save();
  if (ok) {
    $q.notify({ type: 'positive', message: 'บันทึกหน้าแรกสำเร็จ', position: 'top' });
  }
};

onMounted(() => {
  void fetchPage();
});
</script>

<style scoped lang="scss">
.page-builder-page {
  overflow-x: hidden;
}
</style>
