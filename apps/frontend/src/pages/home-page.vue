<template>
  <q-page class="home-page q-pb-xl">
    <!-- Top Carousel Branding -->
    <div class="q-pt-lg q-pb-none">
      <div class="container">
        <InfoCarousel
          :preview-mode="true"
          :preview-banners="banners"
          :loading="isLoading"
        />
      </div>
    </div>
    <!-- Available Exam Rounds Table -->
    <div class="container">
      <AvailableExamRoundsTable @select="handleExamSelect" />
    </div>
    <!-- Main Informational Content -->
    <div class="container">
      <HomeMainContent
        :format-section="formatSection"
        :step-section="stepSection"
        :rule-paper-section="rulePaperSection"
        :rule-computer-section="ruleComputerSection"
        :loading="isLoading"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import InfoCarousel from 'src/components/home/carousel/info-carousel.vue';
import HomeMainContent from 'src/components/home/home-main-content.vue';
import AvailableExamRoundsTable from 'src/components/home/available-exam-rounds-table.vue';
import { getHomepage } from 'src/services/page-builder.service';
import { PageSectionType } from 'src/types/page-builder.types';
import type { BannerBoxContent, PageSectionContent } from 'src/types/page-builder.types';

const isLoading = ref(true);
const banners = ref<BannerBoxContent[]>([]);
const formatSection = ref<PageSectionContent | null>(null);
const stepSection = ref<PageSectionContent | null>(null);
const rulePaperSection = ref<PageSectionContent | null>(null);
const ruleComputerSection = ref<PageSectionContent | null>(null);

const handleExamSelect = (): void => {
  // Event emitted when user selects an exam round
  // Navigation is handled by the AvailableExamRoundsTable component
};

onMounted(async () => {
  isLoading.value = true;
  try {
    const response = await getHomepage();
    if (response?.PCF_CONTENT?.sections) {
      const sections = response.PCF_CONTENT.sections;

      const bannerSec = sections.find((s) => s.type === PageSectionType.BANNER);
      if (bannerSec && bannerSec.active !== false) {
        banners.value = (bannerSec.boxes as BannerBoxContent[]).filter(
          (b) => b.active !== false && b.imagePath,
        );
      }

      formatSection.value = sections.find((s) => s.type === PageSectionType.CARD) || null;
      stepSection.value = sections.find((s) => s.type === PageSectionType.STEP) || null;

      const ruleSections = sections.filter((s) => s.type === PageSectionType.EXAM_RULE);
      rulePaperSection.value = ruleSections[0] || null;
      ruleComputerSection.value = ruleSections[1] || null;
    }
  } catch (error) {
    console.error('Failed to load homepage config:', error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}
</style>
