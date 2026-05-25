<template>
  <div class="image-display-container">
    <!-- Image -->
    <img
      v-if="isImageAvailable"
      :src="displayUrl"
      :alt="alt"
      class="image"
      :style="{ ...imageSizeStyle }"
    />

    <!-- Placeholder (ไม่มีรูป) -->
    <div v-else class="image-placeholder" :style="{ ...imageSizeStyle }">
      <q-icon name="image" size="48px" color="grey-6" />
      <p class="text-caption text-grey-6">{{ placeholderText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useImageUrl } from 'src/composables/use-image-url';

interface Props {
  /** imagePath ที่เก็บใน database */
  imagePath: string | null | undefined;
  /** alt text สำหรับรูป */
  alt?: string;
  /** width ของรูป (e.g. '200px', '100%') */
  width?: string;
  /** height ของรูป (e.g. '200px', 'auto') */
  height?: string;
  /** object-fit style (e.g. 'cover', 'contain') */
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  /** border-radius */
  borderRadius?: string;
}

const props = withDefaults(defineProps<Props>(), {
  alt: 'Image',
  width: '100%',
  height: 'auto',
  objectFit: 'cover',
  borderRadius: '8px',
});

const { t } = useI18n();

const { displayUrl, isImageAvailable } = useImageUrl(props.imagePath);

const placeholderText = computed(() => t('image.display.placeholder') ?? 'No image available');

const imageSizeStyle = computed(() => ({
  width: props.width,
  height: props.height,
  borderRadius: props.borderRadius,
}));
</script>

<style scoped lang="scss">
.image-display-container {
  display: inline-block;
}

.image {
  object-fit: v-bind(objectFit);
  display: block;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
}
</style>
