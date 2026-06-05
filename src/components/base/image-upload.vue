<template>
  <div class="image-upload-container">
    <q-file
      ref="fileInputRef"
      v-model="selectedFile"
      @update:model-value="handleFileSelected"
      accept=".jpg,.jpeg"
      max-file-size="5242880"
      dense
      filled
      class="hidden-file-input"
      style="display: none"
    />

    <div v-if="displayUrl" class="preview-wrapper">
      <div class="preview-image-container">
        <img :src="displayUrl" :alt="alt" class="preview-image" />
        <div class="preview-overlay">
          <q-btn
            flat
            dense
            round
            icon="edit"
            size="md"
            color="white"
            class="preview-edit-btn"
            @click="triggerFileInput"
          />
          <q-btn
            flat
            dense
            round
            icon="close"
            size="md"
            color="white"
            class="preview-delete-btn"
            @click="handleDelete"
          />
        </div>
      </div>
    </div>

    <div v-else class="upload-zone" @click="triggerFileInput">
      <div class="upload-zone-content">
        <q-icon name="add_photo_alternate" size="48px" color="black" />
      </div>
    </div>

    <div v-if="isUploading" class="upload-progress">
      <q-linear-progress indeterminate color="primary" />
      <p class="text-caption text-center q-mt-sm">{{ uploadingText }}</p>
    </div>

    <q-dialog v-model="showCropDialog" persistent>
      <AppImageCropper
        :image-src="cropImageSrc"
        :file-type="cropFileType"
        @confirm="onCropConfirm"
        @cancel="showCropDialog = false"
      />
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useImageUpload } from 'src/composables/use-image-upload';
import { useImageUrl } from 'src/composables/use-image-url';
import AppImageCropper from 'src/components/shared/app-image-cropper.vue';

interface Props {
  modelValue: string | null;
  folder?: string;
  alt?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  alt: 'Uploaded image',
});

const emit = defineEmits<Emits>();

const { t } = useI18n();
const $q = useQuasar();
const fileInputRef = ref();
const selectedFile = ref<File | null>(null);

const showCropDialog = ref(false);
const cropImageSrc = ref('');
const cropFileType = ref('image/jpeg');

const { isUploading, handleImageUpload } = useImageUpload({
  onSuccess: (imagePath: string) => {
    emit('update:modelValue', imagePath);
    selectedFile.value = null;
  },
  onError: (error: Error) => {
    $q.notify({
      type: 'negative',
      message: error.message || 'อัปโหลดรูปภาพไม่สำเร็จ',
      position: 'top',
    });
  },
});

const { displayUrl } = useImageUrl(() => props.modelValue);

const uploadingText = computed(() => t('image.upload.uploading') ?? 'Uploading...');

const triggerFileInput = (): void => {
  // Reset selected file first so same file can be re-selected
  selectedFile.value = null;
  fileInputRef.value?.pickFiles();
};

const handleFileSelected = (file: File | null): void => {
  if (!file) return;

  // Validate JPG/JPEG format only
  const isJpg =
    file.type === 'image/jpeg' ||
    file.name.toLowerCase().endsWith('.jpg') ||
    file.name.toLowerCase().endsWith('.jpeg');
  if (!isJpg) {
    $q.notify({
      type: 'negative',
      message: 'กรุณาอัปโหลดรูปภาพนามสกุล JPG หรือ JPEG เท่านั้น',
      position: 'top',
    });
    selectedFile.value = null;
    return;
  }

  // Validate minimum file size (40 KB)
  const minSize = 40 * 1024;
  if (file.size < minSize) {
    $q.notify({
      type: 'negative',
      message: 'ขนาดไฟล์ต้องมีขนาดไม่ต่ำกว่า 40 KB',
      position: 'top',
    });
    selectedFile.value = null;
    return;
  }

  cropFileType.value = 'image/jpeg';

  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result) {
      cropImageSrc.value = e.target.result as string;
      showCropDialog.value = true;
    }
  };
  reader.readAsDataURL(file);

  // Reset selectedFile so the same file can be picked again next time
  selectedFile.value = null;
};

const onCropConfirm = async (croppedFile: File): Promise<void> => {
  showCropDialog.value = false;
  try {
    await handleImageUpload(croppedFile, props.folder);
  } catch (error) {
    console.error('Error uploading image:', error);
  }
};

const handleDelete = (): void => {
  emit('update:modelValue', '');
};
</script>

<style scoped lang="scss">
.image-upload-container {
  width: 100%;
  height: 100%;
  aspect-ratio: 0.9 / 1;
  border-radius: inherit;
}

.hidden-file-input {
  display: none;
}

.preview-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.preview-image-container {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  overflow: hidden;
  background-color: var(--surface-page);

  &:hover .preview-overlay {
    opacity: 1;
  }
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-zone {
  width: 100%;
  height: 100%;
  background-color: var(--neutral-gray-light);
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: var(--neutral-200);
  }
}

.upload-zone-content {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.upload-progress {
  width: 100%;
}
</style>
