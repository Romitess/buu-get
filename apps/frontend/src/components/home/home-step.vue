<template>
  <div class="home-step column">
    <div class="row items-center no-wrap q-mb-md">
      <div class="text-h4 text-weight-bolder text-primary line-height-1">
        {{ number }}
      </div>
      <div class="step-line bg-grey-6 col"></div>
    </div>
    <div class="step-content">
      <div class="text-subtitle1 text-weight-bold text-dark q-mb-xs">
        {{ title }}
      </div>
      <div class="text-caption text-grey-8 line-height-1-4 text-weight-regular">
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
  height: 1px;
  margin-left: 20px;
  margin-right: 20px;
}
.line-height-1 {
  line-height: 1;
}
.line-height-1-4 {
  line-height: 1.4;
}
.home-step {
  height: 100%;
  max-width: 220px;
  margin: 0 auto;
}
</style>
