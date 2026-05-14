<template>
  <div class="home-step column">
    <div class="row items-center no-wrap q-mb-md">
      <div class="text-h4 text-weight-bolder text-primary line-height-1">
        {{ number }}
      </div>
      <div v-if="!isLast" class="step-line bg-grey-4 q-mx-md full-width"></div>
    </div>
    <div class="step-content">
      <div class="text-subtitle1 text-weight-bolder text-dark q-mb-xs">
        {{ title }}
      </div>
      <div class="text-caption text-grey-8 line-height-1-4">
        {{ description }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  number: string;
  title: string;
  description: string;
  isLast?: boolean;
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
.home-step {
  height: 100%;
}
</style>
