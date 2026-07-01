<template>
  <div class="q-mb-lg page-header">
    <div class="text-h5 text-weight-bold text-dark q-mb-md page-title-size">
      {{ title }}
    </div>
    <div v-if="subtitle" class="text-grey-7 subtitle-text-size">
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
<style scoped lang="scss">
.page-title-size {
  font-size: var(--font-size-h1);
}
.subtitle-text-size {
  font-size: var(--font-size-md);
}
</style>
