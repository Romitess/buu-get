<template>
  <q-card-section
    class="branding-section column justify-center full-height q-pt-md q-pb-lg q-pr-lg q-pl-xl"
  >
    <div class="text-overline text-primary text-weight-bold q-mb-xs">
      {{ overline }}
    </div>
    <div class="text-h4 text-md-h2 text-weight-bolder text-dark line-height-1">
      {{ title }}
    </div>
    <div class="text-h4 text-md-h3 text-weight-bold text-primary q-mb-md line-height-1">
      {{ subtitle }}
    </div>

    <q-card-section class="q-py-xs q-pl-md border-left-primary q-mb-lg font-sarabun">
      <div class="text-body1 text-dark ellipsis">
        {{ description1 }}
      </div>
      <div class="text-body1 text-dark ellipsis">
        {{ description2 }}
      </div>
    </q-card-section>

    <div class="column q-gutter-y-sm">
      <div class="row items-center">
        <q-icon :name="info1Icon" color="primary" size="sm" class="q-mr-md" />
        <div class="text-subtitle2 text-grey-9 text-weight-medium">
          {{ info1 }}
        </div>
      </div>

      <div class="row items-center">
        <q-icon :name="info2Icon" color="primary" size="sm" class="q-mr-md" />
        <div class="text-subtitle2 text-grey-9 text-weight-medium">
          {{ info2 }}
        </div>
      </div>
    </div>
  </q-card-section>
</template>

<script setup lang="ts">
defineProps<{
  overline: string;
  title: string;
  subtitle: string;
  description1: string;
  description2: string;
  info1: string;
  info1Icon: string;
  info2: string;
  info2Icon: string;
}>();
</script>

<style scoped>
.branding-section {
  min-height: 300px;
}
.border-left-primary {
  border-left: 1px solid var(--q-primary);
}
.line-height-1 {
  line-height: 1.1;
}
.font-sarabun {
  font-family: 'Sarabun', sans-serif !important;
  letter-spacing: -0.02em;
}
</style>
