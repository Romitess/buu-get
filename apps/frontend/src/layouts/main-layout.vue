<template>
  <q-layout view="hHh Lpr lFf">
    <AppHeader v-if="!route.meta.hideHeader" />

    <!-- Admin/Staff Sidebar (Drawer) -->
    <AppSidebar v-if="showAdminDrawer && !route.meta.hideDrawer" />

    <q-page-container :class="{ 'has-bottom-nav': showBottomNav }">
      <router-view />
    </q-page-container>

    <CandidateBottomNav />

    <q-footer v-if="!showBottomNav">
      <FooterCredits :variant="(route.meta.footerVariant as 'primary' | 'white') || 'white'" />
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import AppHeader from 'src/components/header/app-header.vue';
import AppSidebar from 'src/components/header/app-sidebar.vue';
import FooterCredits from 'src/components/footer/footer-credits.vue';
import CandidateBottomNav from 'src/components/header/candidate-bottom-nav.vue';
import { useNavigation } from 'src/composables/use-navigation';

const route = useRoute();
const $q = useQuasar();
const { showAdminDrawer } = useNavigation();

const showBottomNav = computed(() => {
  return (
    $q.screen.lt.md &&
    !showAdminDrawer.value &&
    !route.meta.hideHeader &&
    !route.meta.hideDrawer
  );
});
</script>

<style scoped lang="scss">
.has-bottom-nav {
  padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
}
</style>
