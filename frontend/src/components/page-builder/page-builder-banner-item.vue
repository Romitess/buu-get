<template>
  <q-card flat bordered class="banner-item row items-center no-wrap">
    <q-icon name="drag_indicator" size="24px" color="grey-8" class="banner-item__handle" />

    <q-img
      :src="displayUrl"
      :alt="alt"
      class="banner-item__image col"
      ratio="5"
      fit="cover"
    >
      <template #error>
        <q-icon name="broken_image" size="32px" color="grey-5" class="absolute-center" />
      </template>
    </q-img>

    <q-btn
      flat
      round
      dense
      icon="delete"
      color="grey-9"
      class="banner-item__delete"
      @click="emit('remove')"
    />
  </q-card>
</template>

<script setup lang="ts">
import { toRef } from 'vue';
import { useImageUrl } from 'src/composables/use-image-url';

interface Props {
  imagePath: string;
  alt?: string;
}

const props = withDefaults(defineProps<Props>(), { alt: 'banner' });

const emit = defineEmits<{ (e: 'remove'): void }>();

const { displayUrl } = useImageUrl(toRef(props, 'imagePath'));
</script>

<style scoped lang="scss">
.banner-item {
  width: 100%;
  height: auto;
  padding: 12px 14px 12px 8px;
  border-radius: 12px;
  gap: 12px;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.banner-item__image {
  border-radius: 8px;
  border: 1px solid var(--neutral-200, #e2e8f0);
  overflow: hidden;
  min-width: 0;
}

.banner-item__handle {
  flex: 0 0 auto;
}

.banner-item__delete {
  flex: 0 0 auto;
}
</style>
