<template>
  <q-dialog
    v-model="model"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    @show="onShow"
    @hide="onHide"
  >
    <q-card class="bg-grey-1 column no-wrap">
      <q-bar class="bg-primary text-white q-py-lg">
        <div class="text-subtitle1 text-weight-bold">
          {{ $t('admin.pageBuilder.previewTitle') }}
        </div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section class="q-pa-none scroll col">
        <div v-if="renderContent" class="home-page q-pb-xl">
          <!-- Top Carousel Branding -->
          <div class="q-pt-lg q-pb-none">
            <div class="preview-container-home">
              <InfoCarousel :preview-mode="true" :preview-banners="props.bannerSection?.boxes || []" />
            </div>
          </div>
          <!-- Available Exam Rounds Table -->
          <div class="preview-container-home">
            <AvailableExamRoundsTable />
          </div>
          <!-- Main Informational Content -->
          <div class="preview-container-home">
            <HomeMainContent
              :preview-mode="true"
              :format-section="props.formatSection"
              :step-section="props.stepSection"
              :rule-paper-section="props.rulePaperSection"
              :rule-computer-section="props.ruleComputerSection"
            />
          </div>
        </div>
        <div v-else class="fit row flex-center q-py-xl">
          <CardGridSkeleton :sections="2" :count="2" cols="col-12" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import InfoCarousel from 'src/components/home/carousel/info-carousel.vue';
import AvailableExamRoundsTable from 'src/components/home/available-exam-rounds-table.vue';
import HomeMainContent from 'src/components/home/home-main-content.vue';
import { CardGridSkeleton } from 'src/components/base/skeleton';
import type {
  BannerBoxContent,
  ContentBoxContent,
  ExamRuleBoxContent,
  EditorSection,
} from 'src/types/page-builder.types';

interface Props {
  bannerSection: EditorSection<BannerBoxContent> | null;
  formatSection: EditorSection<ContentBoxContent> | null;
  stepSection: EditorSection<ContentBoxContent> | null;
  rulePaperSection: EditorSection<ExamRuleBoxContent> | null;
  ruleComputerSection: EditorSection<ExamRuleBoxContent> | null;
}

const props = defineProps<Props>();

const model = defineModel<boolean>({ required: true });

const renderContent = ref(false);

const onShow = (): void => {
  renderContent.value = true;
};

const onHide = (): void => {
  renderContent.value = false;
};
</script>

<style scoped lang="scss">
.preview-container-home {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}
</style>
