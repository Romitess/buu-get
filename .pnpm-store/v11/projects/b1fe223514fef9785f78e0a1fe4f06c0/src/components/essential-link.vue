<template>
  <q-item
    clickable
    :tag="isExternal ? 'a' : undefined"
    :target="isExternal ? '_blank' : undefined"
    :href="isExternal ? path || link : undefined"
    :to="!isExternal ? path || link : undefined"
  >
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ label || title }}</q-item-label>
      <q-item-label caption v-if="caption">{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface EssentialLinkProps {
  label?: string; // New standard
  title?: string; // Legacy support
  caption?: string;
  path?: string; // New standard
  link?: string; // Legacy support
  icon?: string;
}

const props = withDefaults(defineProps<EssentialLinkProps>(), {
  label: '',
  title: '',
  caption: '',
  path: '',
  link: '',
  icon: '',
});

const isExternal = computed<boolean>(() => {
  const target = props.path || props.link || '';
  return !!target.startsWith('http');
});
</script>
