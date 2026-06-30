<template>
  <q-card class="cropper-card shadow-5" :style="{ '--cropper-max-width': cropperMaxWidth }">
    <q-card-section class="q-pb-none row items-center justify-between">
      <div class="text-h6 text-weight-bold text-dark">
        {{ $t('components.imageCropper.title') }}
      </div>
      <q-btn icon="close" flat round dense v-close-popup />
    </q-card-section>

    <q-card-section class="flex column items-center q-py-lg">
      <div
        class="crop-area-container"
        :style="containerStyle"
        @mousedown="startDrag"
        @touchstart="startDrag"
      >
        <img
          ref="imageRef"
          :src="imageSrc"
          :style="imageStyle"
          @load="onImageLoaded"
          class="crop-image"
          draggable="false"
          alt="To Crop"
        />
        <div
          class="crop-card-mask"
          :class="{ 'is-circular': props.circular }"
          :style="maskStyle"
        ></div>
      </div>

      <div class="slider-container row items-center q-mt-md" :style="{ width: sliderWidth }">
        <q-icon name="zoom_out" size="sm" class="text-grey-6 q-mr-sm" />
        <q-slider
          v-model="zoom"
          :min="1"
          :max="3"
          :step="0.01"
          color="primary"
          class="col"
          @update:model-value="onZoomChanged"
        />
        <q-icon name="zoom_in" size="sm" class="text-grey-6 q-ml-sm" />
      </div>
      <div class="text-caption text-grey-6 q-mt-xs text-center">
        {{ $t('components.imageCropper.hint') }}
      </div>

      <!-- Live Preview for Banner -->
      <div v-if="props.showPreview" class="preview-section q-mt-lg column items-center full-width">
        <div class="text-subtitle2 text-weight-bold text-grey-8 q-mb-sm text-center">
          {{ $t('components.imageCropper.livePreview') }}
        </div>
        <div class="preview-container" :style="previewContainerStyle">
          <div class="preview-crop-box" :style="previewCropBoxStyle">
            <img
              :src="imageSrc"
              :style="imageStyle"
              class="preview-image"
              draggable="false"
              alt="Cropped Preview"
            />
          </div>
        </div>
      </div>
    </q-card-section>

    <q-card-actions align="right" class="q-px-md q-pb-md">
      <q-btn
        flat
        :label="$t('components.imageCropper.cancel')"
        color="grey-7"
        class="text-weight-bold action-btn"
        v-close-popup
      />
      <q-btn
        unelevated
        :label="$t('components.imageCropper.save')"
        color="primary"
        class="text-weight-bold action-btn"
        @click="confirmCrop"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

interface Props {
  imageSrc: string;
  fileType?: string;
  circular?: boolean;
  /** ขนาดกรอบ crop (px) — ถ้าไม่ระบุใช้ค่าเริ่มต้นตามโหมด circular/portrait */
  cropWidth?: number;
  cropHeight?: number;
  /** ขนาดรูปผลลัพธ์ (px) — ถ้าไม่ระบุใช้ค่าเริ่มต้น */
  outputWidth?: number;
  outputHeight?: number;
  showPreview?: boolean;
}

interface Emits {
  (e: 'confirm', file: File): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  fileType: 'image/png',
  circular: false,
  showPreview: false,
});
const emit = defineEmits<Emits>();

const imageRef = ref<HTMLImageElement | null>(null);
const zoom = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);

const imgNaturalWidth = ref(0);
const imgNaturalHeight = ref(0);

const getViewportWidth = () => {
  return typeof window !== 'undefined' ? window.innerWidth : 1024;
};

const windowWidth = ref(getViewportWidth());

const handleResize = () => {
  windowWidth.value = getViewportWidth();
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

const cropBoxWidth = computed(() => {
  if (props.cropWidth) {
    const margin = 60;
    const maxWidth = windowWidth.value - margin;
    return Math.max(100, Math.min(props.cropWidth, maxWidth));
  }
  return props.circular ? 220 : 180;
});

const cropBoxHeight = computed(() => {
  if (props.cropWidth && props.cropHeight) {
    const ratio = props.cropHeight / props.cropWidth;
    return cropBoxWidth.value * ratio;
  }
  return props.circular ? 220 : 240;
});

const cropperMaxWidth = computed(() => {
  if (props.cropWidth) {
    const margin = 80;
    const maxWidth = windowWidth.value - 20;
    return `${Math.max(200, Math.min(props.cropWidth + margin, maxWidth))}px`;
  }
  return '400px';
});

const sliderWidth = computed(() => {
  return `${cropBoxWidth.value}px`;
});

const imageStyle = computed(() => {
  if (!imgNaturalWidth.value || !imgNaturalHeight.value) return {};

  const baseScale = Math.max(
    cropBoxWidth.value / imgNaturalWidth.value,
    cropBoxHeight.value / imgNaturalHeight.value,
  );
  const baseWidth = imgNaturalWidth.value * baseScale;
  const baseHeight = imgNaturalHeight.value * baseScale;

  const w = baseWidth * zoom.value;
  const h = baseHeight * zoom.value;

  return {
    width: `${w}px`,
    height: `${h}px`,
    transform: `translate(calc(-50% + ${offsetX.value}px), calc(-50% + ${offsetY.value}px))`,
  };
});

const maskStyle = computed(() => {
  return {
    width: `${cropBoxWidth.value}px`,
    height: `${cropBoxHeight.value}px`,
  };
});

// ปรับขนาด container ให้พอดีกรอบ crop เฉพาะเมื่อกำหนดขนาดเอง (เช่น banner)
// ถ้าไม่ระบุ ใช้ค่าเริ่มต้นจาก scss (300x300) เพื่อไม่กระทบหน้าสมัคร/โปรไฟล์
const containerStyle = computed(() => {
  if (props.cropWidth || props.cropHeight) {
    const extraWidth = 40;
    // On small screens, keep the container height smaller.
    // On desktop, keep a minimum height of 350px so that narrow banner crops show context.
    const minHeight = windowWidth.value < 600 ? 200 : 350;
    const extraHeight = Math.max(40, minHeight - cropBoxHeight.value);
    return {
      width: `${cropBoxWidth.value + extraWidth}px`,
      height: `${cropBoxHeight.value + extraHeight}px`,
    };
  }
  return {};
});

const previewCropBoxStyle = computed(() => {
  return {
    width: `${cropBoxWidth.value}px`,
    height: `${cropBoxHeight.value}px`,
  };
});

const previewContainerStyle = computed(() => {
  return {
    maxWidth: `${cropBoxWidth.value}px`,
    width: '100%',
  };
});

const onImageLoaded = () => {
  if (!imageRef.value) return;
  imgNaturalWidth.value = imageRef.value.naturalWidth;
  imgNaturalHeight.value = imageRef.value.naturalHeight;
  offsetX.value = 0;
  offsetY.value = 0;
  zoom.value = 1;
};

const clampOffsets = (x: number, y: number, z: number) => {
  if (!imgNaturalWidth.value || !imgNaturalHeight.value) return { x, y };

  const baseScale = Math.max(
    cropBoxWidth.value / imgNaturalWidth.value,
    cropBoxHeight.value / imgNaturalHeight.value,
  );
  const baseWidth = imgNaturalWidth.value * baseScale;
  const baseHeight = imgNaturalHeight.value * baseScale;

  const sw = baseWidth * z;
  const sh = baseHeight * z;

  const maxX = Math.max(0, (sw - cropBoxWidth.value) / 2);
  const maxY = Math.max(0, (sh - cropBoxHeight.value) / 2);

  return {
    x: Math.max(-maxX, Math.min(maxX, x)),
    y: Math.max(-maxY, Math.min(maxY, y)),
  };
};

const onZoomChanged = (val: number | null) => {
  const currentZoom = val || 1;
  const clamped = clampOffsets(offsetX.value, offsetY.value, currentZoom);
  offsetX.value = clamped.x;
  offsetY.value = clamped.y;
};

let isDragging = false;
let startPointerX = 0;
let startPointerY = 0;
let startOffsetX = 0;
let startOffsetY = 0;

const startDrag = (event: MouseEvent | TouchEvent) => {
  isDragging = true;

  const pointer = 'touches' in event ? event.touches[0] : event;
  if (!pointer) return;
  startPointerX = pointer.clientX;
  startPointerY = pointer.clientY;

  startOffsetX = offsetX.value;
  startOffsetY = offsetY.value;

  if ('touches' in event) {
    window.addEventListener('touchmove', handleDrag, { passive: false });
    window.addEventListener('touchend', stopDrag);
  } else {
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', stopDrag);
  }
};

const handleDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging) return;
  if (event.cancelable) event.preventDefault();

  const pointer = 'touches' in event ? event.touches[0] : event;
  if (!pointer) return;
  const dx = pointer.clientX - startPointerX;
  const dy = pointer.clientY - startPointerY;

  const clamped = clampOffsets(startOffsetX + dx, startOffsetY + dy, zoom.value);
  offsetX.value = clamped.x;
  offsetY.value = clamped.y;
};

const stopDrag = () => {
  isDragging = false;
  window.removeEventListener('mousemove', handleDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchmove', handleDrag);
  window.removeEventListener('touchend', stopDrag);
};

const confirmCrop = () => {
  const img = imageRef.value;
  if (!img || !imgNaturalWidth.value || !imgNaturalHeight.value) return;

  const outputWidth = props.outputWidth ?? (props.circular ? 400 : 300);
  const outputHeight = props.outputHeight ?? (props.circular ? 400 : 400);
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // JPEG can't store transparency, so transparent PNG areas (or any region the
  // image doesn't cover) would flatten to black. Paint a white background first.
  if (props.fileType !== 'image/png') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputWidth, outputHeight);
  }

  const canvasScale = outputWidth / cropBoxWidth.value;
  const baseScale = Math.max(
    cropBoxWidth.value / imgNaturalWidth.value,
    cropBoxHeight.value / imgNaturalHeight.value,
  );
  const drawW = imgNaturalWidth.value * baseScale * zoom.value * canvasScale;
  const drawH = imgNaturalHeight.value * baseScale * zoom.value * canvasScale;

  const dx = outputWidth / 2 + offsetX.value * canvasScale - drawW / 2;
  const dy = outputHeight / 2 + offsetY.value * canvasScale - drawH / 2;

  ctx.drawImage(img, dx, dy, drawW, drawH);

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const fileName = props.fileType === 'image/jpeg' ? 'avatar.jpg' : 'avatar.png';
      const file = new File([blob], fileName, { type: props.fileType });
      emit('confirm', file);
    },
    props.fileType,
    props.fileType === 'image/jpeg' ? 0.9 : undefined,
  );
};
</script>

<style scoped lang="scss">
.cropper-card {
  width: 100%;
  max-width: var(--cropper-max-width, 400px);
  border-radius: 16px;
  background: var(--surface-card);
}

.crop-area-container {
  position: relative;
  width: 300px;
  height: 300px;
  overflow: hidden;
  background: var(--surface-page);
  border-radius: 12px;
  cursor: grab;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
}

.crop-image {
  position: absolute;
  top: 50%;
  left: 50%;
  max-width: none;
  max-height: none;
  pointer-events: none;
}

.crop-card-mask {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  border: 2px dashed rgba(255, 255, 255, 0.85);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
  box-sizing: border-box;
  border-radius: 4px;
  transition: border-radius 0.3s ease;

  &.is-circular {
    border-radius: 50%;
  }
}

.slider-container {
  width: 100%;
}

.action-btn {
  width: 90px;
  border-radius: 8px;
}

.preview-section {
  width: 100%;
}

.preview-container {
  border: 2px solid rgba(13, 71, 161, 0.8); /* matching primary color overlay border on homepage */
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 20px -10px rgba(0, 0, 0, 0.3);
  background-color: #fff;
}

.preview-crop-box {
  position: relative;
  overflow: hidden;
}

.preview-image {
  position: absolute;
  top: 50%;
  left: 50%;
  max-width: none;
  max-height: none;
  pointer-events: none;
}
</style>
