<template>
  <q-card flat bordered class="home-card full-height q-pa-lg text-center">
    <q-card-section class="q-pa-none">
      <div v-if="icon" class="q-mb-sm">
        <q-icon :name="icon" color="primary" size="md" />
      </div>
      <div class="text-h6 text-weight-bolder text-primary q-mb-sm">
        {{ title }}
      </div>
      <div class="text-body2 text-grey-8 line-height-1-5">
        {{ subtitle }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
  icon?: string;
}>();
</script>

<style scoped>
.home-card {
  border-radius: 12px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05) !important;
}
.home-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
}
.line-height-1-5 {
  line-height: 1.5;
}
</style>
