<template>
  <q-page class="home-page q-pb-xl">
    <!-- Top Carousel Branding -->
    <div class="q-py-lg">
      <div class="container">
        <InfoCarousel />
      </div>
    </div>

    <!-- Main Informational Content -->
    <div class="container">
      <HomeMainContent />
    </div>

    <FooterCredits variant="white" />
  </q-page>
</template>

<script setup lang="ts">
import InfoCarousel from 'src/components/home/carousel/info-carousel.vue';
import HomeMainContent from 'src/components/home/home-main-content.vue';
import FooterCredits from 'src/components/footer/footer-credits.vue';
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
</style>
