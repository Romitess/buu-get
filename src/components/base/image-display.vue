<template>
  <div class="image-display-container" :style="{ ...imageSizeStyle }">
    <!-- Image -->
    <img
      :src="isImageAvailable ? displayUrl : defaultUserImage"
      :alt="alt"
      class="image"
      :class="{ 'default-user-avatar': !isImageAvailable }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useImageUrl } from 'src/composables/use-image-url';
import defaultUserImage from 'src/assets/img/user-image.jpg';

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

const { displayUrl, isImageAvailable } = useImageUrl(() => props.imagePath);

const imageSizeStyle = computed(() => ({
  width: props.width,
  height: props.height,
  borderRadius: props.borderRadius,
}));
</script>

<style scoped lang="scss">
.image-display-container {
  overflow: hidden;
  position: relative;
}

.image {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  object-fit: v-bind(objectFit);
  display: block;
  border-radius: inherit;

  &.default-user-avatar {
    transform: translate(-50%, -50%) scale(1.25); /* Zoom and crop the default user image to remove white padding */
  }
}
</style>
