<template>
  <q-item class="q-pa-sm block">
    <q-item-section>
      <q-separator color="dark" style="width: 24px; height: 2px" class="q-mb-sm" />
      <q-item-label overline class="text-grey-7 text-weight-bold">
        {{ label }}
      </q-item-label>
      <q-item-label class="text-h6 text-weight-bolder text-dark">
        {{ value }}
      </q-item-label>
      <q-item-label caption class="text-grey-6">
        {{ description }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  description: string;
}>();
</script>

<style scoped>
.stat-item {
  min-width: 140px;
}
</style>
