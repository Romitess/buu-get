<template>
  <q-page class="home-page q-pb-xl">
    <!-- Top Carousel Branding -->
    <div class="q-pt-lg q-pb-none">
      <div class="container">
        <InfoCarousel />
      </div>
    </div>
    <!-- Available Exam Rounds Table -->
    <div class="container">
      <AvailableExamRoundsTable @select="handleExamSelect" />
    </div>
    <!-- Main Informational Content -->
    <div class="container">
      <HomeMainContent />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import InfoCarousel from 'src/components/home/carousel/info-carousel.vue';
import HomeMainContent from 'src/components/home/home-main-content.vue';
import AvailableExamRoundsTable from 'src/components/home/available-exam-rounds-table.vue';

const handleExamSelect = (): void => {
  // Event emitted when user selects an exam round
  // Navigation is handled by the AvailableExamRoundsTable component
};
</script>

<style scoped>
.container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}
</style>
