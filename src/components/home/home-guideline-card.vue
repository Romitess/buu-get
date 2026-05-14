<template>
  <q-card flat class="guideline-card full-height shadow-2">
    <q-card-section class="row items-center no-wrap q-pa-md">
      <q-avatar
        size="40px"
        font-size="20px"
        color="blue-1"
        text-color="primary"
        :icon="icon"
        class="q-mr-md"
      />
      <div class="text-body2 text-grey-9 text-weight-medium line-height-1-4">
        {{ text }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  text: string;
}>();
</script>

<style scoped>
.guideline-card {
  max-width: 570px;
  margin: 0 auto;
  border-radius: 8px;
  background: white;
  border: none !important;
  box-shadow: 0 8px 12px -4px rgba(0, 0, 0, 0.35) !important;
  transition: all 0.3s ease;
}
.guideline-card:hover {
  box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.45) !important;
}
.line-height-1-4 {
  line-height: 1.4;
}
</style>
