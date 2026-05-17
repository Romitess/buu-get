<template>
  <q-layout view="hHh Lpr lFf">
    <AppHeader v-if="!route.meta.hideHeader" />

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer>
      <FooterCredits :variant="(route.meta.footerVariant as 'primary' | 'white') || 'white'" />
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import AppHeader from 'src/components/header/app-header.vue';
import FooterCredits from 'src/components/footer/footer-credits.vue';

const route = useRoute();
</script>
