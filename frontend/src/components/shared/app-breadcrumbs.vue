<template>
  <q-breadcrumbs class="text-grey-6 q-mb-lg" active-color="black" style="font-size: 15px">
    <template v-slot:separator>
      <q-icon size="1.2em" name="chevron_right" color="grey-5" />
    </template>

    <q-breadcrumbs-el
      v-for="(item, index) in breadcrumbs"
      :key="index"
      :to="item.to"
      :class="[index === breadcrumbs.length - 1 ? 'text-black' : 'text-grey-6']"
    >
      <div
        class="row items-center no-wrap breadcrumb-content"
        :class="{ 'active-item': index === breadcrumbs.length - 1 }"
      >
        <q-icon v-if="item.icon" :name="item.icon" size="18px" class="q-mr-sm" />
        <span class="breadcrumb-label">{{ $te(item.label) ? $t(item.label) : item.label }}</span>
      </div>
    </q-breadcrumbs-el>
  </q-breadcrumbs>
</template>

<style scoped>
.breadcrumb-content {
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.breadcrumb-content:hover {
  opacity: 0.8;
}

.breadcrumb-label {
  font-weight: 500;
}

.active-item {
  cursor: default;
}
.active-item:hover {
  opacity: 1;
}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const breadcrumbs = computed(() => {
  const metaBreadcrumbs = route.meta.breadcrumb as Array<{
    label: string;
    icon?: string;
    to?: string;
  }>;
  if (!metaBreadcrumbs) return [];

  return metaBreadcrumbs.map((b, index) => {
    let resolvedPath = b.to;
    if (resolvedPath) {
      resolvedPath = Object.keys(route.params).reduce(
        (acc, param) => acc.replace(`:${param}`, String(route.params[param])),
        resolvedPath,
      );
    }

    return {
      label: b.label,
      icon: b.icon,
      to: index === metaBreadcrumbs.length - 1 ? undefined : resolvedPath,
    };
  });
});
</script>
