<template>
  <div class="image-upload-container">
    <!-- Preview หรือ Upload Zone -->
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

    <!-- Upload Zone (เมื่อยังไม่มีรูป) -->
    <div v-else class="upload-zone" @click="triggerFileInput">
      <q-file
        ref="fileInputRef"
        v-model="selectedFile"
        @update:model-value="handleFileSelected"
        accept=".jpg,.jpeg,.png"
        max-file-size="5242880"
        dense
        filled
        class="hidden-file-input"
      />

      <div class="upload-zone-content">
        <q-icon name="add_photo_alternate" size="48px" color="black" />
      </div>
    </div>

    <!-- Loading & Error -->
    <div v-if="isUploading" class="upload-progress">
      <q-linear-progress indeterminate color="primary" />
      <p class="text-caption text-center q-mt-sm">{{ uploadingText }}</p>
    </div>

    <div v-if="uploadError" class="upload-error q-mt-md">
      <q-banner class="bg-negative text-white rounded-borders">
        {{ uploadError }}
      </q-banner>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useImageUpload } from 'src/composables/use-image-upload';
import { useImageUrl } from 'src/composables/use-image-url';

interface Props {
  /** imagePath ที่เก็บใน database */
  modelValue: string | null;
  /** folder destination สำหรับ upload (e.g. 'profile', 'certificate') */
  folder?: string;
  /** alt text สำหรับรูป */
  alt?: string;
}

interface Emits {
  /** emit เมื่อ imagePath เปลี่ยน */
  (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  alt: 'Uploaded image',
});

const emit = defineEmits<Emits>();

const { t } = useI18n();
const fileInputRef = ref();
const selectedFile = ref<File | null>(null);

const { isUploading, uploadError, handleImageUpload } = useImageUpload({
  onSuccess: (imagePath: string) => {
    emit('update:modelValue', imagePath);
    selectedFile.value = null;
  },
});

const { displayUrl } = useImageUrl(() => props.modelValue);

const uploadingText = computed(() => t('image.upload.uploading') ?? 'Uploading...');

const triggerFileInput = (): void => {
  fileInputRef.value?.pickFiles();
};

const handleFileSelected = async (file: File | null): Promise<void> => {
  if (!file) return;

  try {
    await handleImageUpload(file, props.folder);
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
}

.hidden-file-input {
  display: none;
}

// Preview
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
  background-color: #f5f5f5;

  &:hover .preview-overlay {
    opacity: 1;
  }
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

// Upload Zone
.upload-zone {
  width: 100%;
  height: 100%;
  background-color: #e0e0e0;
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #d5d5d5;
  }
}

.upload-zone-content {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

// Progress & Error
.upload-progress {
  width: 100%;
}

.upload-error {
  width: 100%;
}
</style>
