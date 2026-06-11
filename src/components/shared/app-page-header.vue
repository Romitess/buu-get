<template>
  <div class="q-mb-lg page-header">
    <div class="text-h5 text-weight-bold text-dark q-mb-md" style="font-size: 28px">
      {{ title }}
    </div>
    <div v-if="subtitle" class="text-grey-7" style="font-size: 18px">
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
