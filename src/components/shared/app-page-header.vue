<template>
  <div class="q-mb-lg page-header">
    <div class="text-h5 text-weight-bold text-dark q-mb-xs">{{ title }}</div>
    <div v-if="subtitle" class="text-grey-6" style="font-size: 14px">
      {{ subtitle }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>
