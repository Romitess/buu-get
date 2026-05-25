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
    <div v-else class="upload-zone">
      <q-file
        ref="fileInputRef"
        v-model="selectedFile"
        @update:model-value="handleFileSelected"
        accept=".jpg,.jpeg"
        max-file-size="5242880"
        dense
        filled
        class="hidden-file-input"
      />

      <div class="upload-zone-content" @click="triggerFileInput">
        <q-icon name="add" size="32px" color="white" />
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
  /** width ของ component */
  width?: string;
  /** height ของ component */
  height?: string;
  /** border-radius */
  borderRadius?: string;
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

const { displayUrl } = useImageUrl(props.modelValue);

const uploadingText = computed(() => t('image.upload.uploading') ?? 'Uploading...');

const triggerFileInput = (): void => {
  fileInputRef.value?.$el.querySelector('input[type="file"]')?.click();
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
}

.hidden-file-input {
  display: none;
}

// Preview
.preview-wrapper {
  position: relative;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}

.preview-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
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
  border: 2px dashed var(--q-primary);
  border-radius: 8px;
  padding: 32px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: rgba(var(--q-primary-rgb), 0.05);

  &:hover {
    background-color: rgba(var(--q-primary-rgb), 0.1);
    border-color: var(--q-primary-light);
  }
}

.upload-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
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
