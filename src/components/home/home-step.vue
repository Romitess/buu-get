<template>
  <div class="home-step">
    <div class="row items-center q-mb-md no-wrap">
      <div class="text-h3 text-weight-bolder text-primary q-mr-md line-height-1">
        {{ number }}
      </div>
      <div class="step-line bg-grey-4 full-width"></div>
    </div>
    <div class="text-subtitle1 text-weight-bolder text-dark q-mb-xs">
      {{ title }}
    </div>
    <div class="text-caption text-grey-7 line-height-1-4">
      {{ description }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  number: string;
  title: string;
  description: string;
}>();
</script>

<style scoped>
.step-line {
  height: 2px;
}
.line-height-1 {
  line-height: 1;
}
.line-height-1-4 {
  line-height: 1.4;
}
</style>
