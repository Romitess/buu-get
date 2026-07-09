<template>
  <q-skeleton
    type="circle"
    :size="size"
    animation="wave"
    class="avatar-skeleton skeleton-root"
    :aria-busy="true"
    :aria-label="ariaLabel"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  size?: string;
}

withDefaults(defineProps<Props>(), {
  size: '120px',
});

const { t } = useI18n();
const ariaLabel = computed(() => t('components.skeleton.loading'));
</script>
