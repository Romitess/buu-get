<template>
  <q-item
    clickable
    :tag="isExternal ? 'a' : undefined"
    :target="isExternal ? '_blank' : undefined"
    :href="isExternal ? link : undefined"
    :to="!isExternal ? link : undefined"
  >
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption v-if="caption">{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface EssentialLinkProps {
  title: string;
  caption?: string;
  link?: string;
  icon?: string;
}

const props = withDefaults(defineProps<EssentialLinkProps>(), {
  caption: '',
  link: '#',
  icon: '',
});

const isExternal = computed<boolean>(() => !!props.link?.startsWith('http'));
</script>
