<template>
  <div class="q-mb-lg page-header">
    <!-- Breadcrumbs -->
    <q-breadcrumbs class="text-grey-6 q-mb-sm" active-color="black" style="font-size: 14px">
      <template v-slot:separator>
        <q-icon size="1.2em" name="chevron_right" color="grey-4" />
      </template>
      <q-breadcrumbs-el
        v-for="(item, index) in breadcrumbs"
        :key="index"
        :icon="item.icon"
        :label="item.label"
        :to="item.to"
        :class="[index === breadcrumbs.length - 1 ? 'text-black' : 'text-grey-6', 'items-center']"
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
export interface BreadcrumbItem {
  label: string;
  icon?: string | undefined;
  to?: string | object | undefined;
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
