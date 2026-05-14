<template>
  <q-card flat bordered class="guideline-card full-height shadow-1">
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
  border-radius: 8px;
  background: white;
  border-color: rgba(var(--q-primary), 0.3) !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05) !important;
  transition: all 0.3s ease;
}
.guideline-card:hover {
  border-color: var(--q-primary) !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08) !important;
}
.line-height-1-4 {
  line-height: 1.4;
}
</style>
