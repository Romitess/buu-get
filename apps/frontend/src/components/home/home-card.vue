<template>
  <q-card class="home-card full-height q-py-md q-pr-md q-pl-lg text-left q-mx-auto">
    <q-card-section class="q-pa-none">
      <div class="row items-center no-wrap">
        <div v-if="icon" class="q-mb-sm q-mr-md col-auto">
          <q-icon :name="icon" color="primary" size="md" />
        </div>
        <div class="text-h6 text-weight-bolder text-primary q-mb-sm col">
          {{ title }}
        </div>
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
  width: 80%;
  border-radius: 12px;
  box-shadow: 0 8px 12px -4px rgba(0, 0, 0, 0.3) !important;
  transition:
    transform 200ms cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 200ms cubic-bezier(0.23, 1, 0.32, 1);
}
.home-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 16px -4px rgba(0, 0, 0, 0.4) !important;
}
.line-height-1-5 {
  line-height: 1.5;
}
</style>
