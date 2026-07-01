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

interface BreadcrumbItem {
  label: string;
  icon?: string;
  to?: string;
}

const resolveRouteValue = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return resolveRouteValue(value[0]);
  }

  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
};

const removeUnresolvedQueryParams = (path: string): string => {
  const queryStartIndex = path.indexOf('?');
  if (queryStartIndex === -1) {
    return path;
  }

  const pathname = path.slice(0, queryStartIndex);
  const queryString = path.slice(queryStartIndex + 1);
  const searchParams = new URLSearchParams(queryString);

  Array.from(searchParams.entries()).forEach(([key, value]) => {
    if (/:[A-Za-z0-9_]+/.test(value)) {
      searchParams.delete(key);
    }
  });

  const resolvedQueryString = searchParams.toString();
  return resolvedQueryString ? `${pathname}?${resolvedQueryString}` : pathname;
};

const resolveBreadcrumbPath = (path: string): string => {
  const routeValues = new Map<string, string>();

  Object.entries(route.params).forEach(([key, value]) => {
    const resolvedValue = resolveRouteValue(value);
    if (resolvedValue !== undefined) {
      routeValues.set(key, resolvedValue);
    }
  });

  Object.entries(route.query).forEach(([key, value]) => {
    const resolvedValue = resolveRouteValue(value);
    if (resolvedValue !== undefined) {
      routeValues.set(key, resolvedValue);
    }
  });

  const resolvedPath = Array.from(routeValues.entries()).reduce(
    (resolvedPath, [key, value]) => resolvedPath.split(`:${key}`).join(encodeURIComponent(value)),
    path,
  );

  return removeUnresolvedQueryParams(resolvedPath);
};

const breadcrumbs = computed(() => {
  const metaBreadcrumbs = route.meta.breadcrumb as BreadcrumbItem[] | undefined;
  if (!metaBreadcrumbs) return [];

  return metaBreadcrumbs.map((b, index) => {
    const resolvedPath = b.to ? resolveBreadcrumbPath(b.to) : undefined;

    return {
      label: b.label,
      icon: b.icon,
      to: index === metaBreadcrumbs.length - 1 ? undefined : resolvedPath,
    };
  });
});
</script>
