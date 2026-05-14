<template>
  <div class="q-mb-lg page-header">
    <!-- Title & Subtitle -->
    <div class="text-h5 text-weight-bold text-dark q-mb-xs">{{ title }}</div>
    <div v-if="subtitle" class="text-grey-6" style="font-size: 14px">
      {{ subtitle }}
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Props for AppPageHeader.
 */
defineProps<{
  /** Main title of the page. */
  title: string;
  /** Optional subtitle providing additional context. */
  subtitle?: string;
}>();
</script>
