<template>
  <q-card flat class="guideline-card shadow-2">
    <q-card-section class="row items-center no-wrap guideline-card__body">
      <q-icon :name="icon" color="primary" size="30px" class="q-mr-sm flex-shrink-0" />
      <div class="text-body1 text-grey-9 text-weight-medium line-height-1-4 guideline-card__text">
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
  width: 100%;
  height: 66px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  background: white;
  border: none !important;
  box-shadow: 0 8px 12px -4px rgba(0, 0, 0, 0.35) !important;
  transition: box-shadow 200ms cubic-bezier(0.23, 1, 0.32, 1);
}
.guideline-card:hover {
  box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.45) !important;
}
.guideline-card__body {
  width: 100%;
  padding: 10px 12px;
}
.guideline-card__text {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}
.flex-shrink-0 {
  flex-shrink: 0;
}
.line-height-1-4 {
  line-height: 1.4;
}
</style>
