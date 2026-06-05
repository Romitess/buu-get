<template>
  <div class="image-upload-container">
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

.upload-error {
  width: 100%;
}
</style>
