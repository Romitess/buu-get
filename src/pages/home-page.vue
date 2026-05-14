<template>
  <q-page class="home-page q-pb-xl">
    <!-- Top Carousel Branding -->
    <div class="q-pt-lg q-pb-none">
      <div class="container">
        <InfoCarousel />
      </div>
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
</script>

<style scoped>
.container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}
</style>
