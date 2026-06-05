<template>
  <q-card class="cropper-card shadow-5">
    <q-card-section class="q-pb-none row items-center justify-between">
      <div class="text-h6 text-weight-bold text-dark">ปรับแต่งรูปภาพ</div>
      <q-btn icon="close" flat round dense v-close-popup />
    </q-card-section>

    <q-card-section class="flex column items-center q-py-lg">
      <div class="crop-area-container" @mousedown="startDrag" @touchstart="startDrag">
        <img
          ref="imageRef"
          :src="imageSrc"
          :style="imageStyle"
          @load="onImageLoaded"
          class="crop-image"
          draggable="false"
          alt="To Crop"
        />
        <div class="crop-circle-mask"></div>
      </div>

      <div class="slider-container row items-center q-mt-md">
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
      <div class="text-caption text-grey-6 q-mt-xs">
        ลากเพื่อจัดตำแหน่ง และปรับแถบเพื่อซูมรูปภาพ
      </div>
    </q-card-section>

    <q-card-actions align="right" class="q-px-md q-pb-md">
      <q-btn flat label="ยกเลิก" color="grey-7" class="text-weight-bold action-btn" v-close-popup />
      <q-btn
        unelevated
        label="บันทึก"
        color="primary"
        class="text-weight-bold action-btn"
        @click="confirmCrop"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  imageSrc: string;
  fileType?: string;
}

interface Emits {
  (e: 'confirm', file: File): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  fileType: 'image/png',
});
const emit = defineEmits<Emits>();

const imageRef = ref<HTMLImageElement | null>(null);
const zoom = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);

const imgNaturalWidth = ref(0);
const imgNaturalHeight = ref(0);

const cropBoxSize = 240;

const imageStyle = computed(() => {
  if (!imgNaturalWidth.value || !imgNaturalHeight.value) return {};

  const baseScale = cropBoxSize / Math.min(imgNaturalWidth.value, imgNaturalHeight.value);
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

  const baseScale = cropBoxSize / Math.min(imgNaturalWidth.value, imgNaturalHeight.value);
  const baseWidth = imgNaturalWidth.value * baseScale;
  const baseHeight = imgNaturalHeight.value * baseScale;

  const sw = baseWidth * z;
  const sh = baseHeight * z;

  const maxX = Math.max(0, (sw - cropBoxSize) / 2);
  const maxY = Math.max(0, (sh - cropBoxSize) / 2);

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

  const outputSize = 400;
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const canvasScale = outputSize / cropBoxSize;
  const baseScale = cropBoxSize / Math.min(imgNaturalWidth.value, imgNaturalHeight.value);
  const drawW = imgNaturalWidth.value * baseScale * zoom.value * canvasScale;
  const drawH = imgNaturalHeight.value * baseScale * zoom.value * canvasScale;

  const dx = outputSize / 2 + offsetX.value * canvasScale - drawW / 2;
  const dy = outputSize / 2 + offsetY.value * canvasScale - drawH / 2;

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
  max-width: 400px;
  border-radius: 16px;
  background: white;
}

.crop-area-container {
  position: relative;
  width: 300px;
  height: 300px;
  overflow: hidden;
  background: #f5f5f5;
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

.crop-circle-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: radial-gradient(circle at center, transparent 120px, rgba(0, 0, 0, 0.5) 120px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-sizing: border-box;
}

.slider-container {
  width: 280px;
}

.action-btn {
  width: 90px;
  border-radius: 8px;
}
</style>
