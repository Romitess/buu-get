<template>
  <div class="q-mb-lg page-header">
    <!-- Breadcrumbs -->
    <q-breadcrumbs class="text-grey-6 q-mb-sm" active-color="dark" style="font-size: 13px">
      <template v-slot:separator>
        <q-icon size="1.2em" name="chevron_right" color="grey-5" />
      </template>
      <q-breadcrumbs-el
        v-for="(item, index) in breadcrumbs"
        :key="index"
        :icon="item.icon"
        :label="item.label"
        :to="item.to"
        :class="{ 'text-weight-bold': index === breadcrumbs.length - 1 }"
      />
    </q-breadcrumbs>

    <!-- Title & Subtitle -->
    <div class="text-h5 text-weight-bold text-dark q-mb-xs">{{ title }}</div>
    <div v-if="subtitle" class="text-grey-6" style="font-size: 14px">
      {{ subtitle }}
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Interface for breadcrumb items.
 */
interface BreadcrumbItem {
  label: string;
  icon?: string;
  to?: string | object;
}

/**
 * Props for AppPageHeader.
 */
defineProps<{
  /** Array of breadcrumb items to display. */
  breadcrumbs: BreadcrumbItem[];
  /** Main title of the page. */
  title: string;
  /** Optional subtitle providing additional context. */
  subtitle?: string;
}>();
</script>

<style scoped>
.page-header {
  /* You can add specific header styling here if needed */
}
</style>
