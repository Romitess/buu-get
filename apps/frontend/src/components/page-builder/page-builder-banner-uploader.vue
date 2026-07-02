<template>
  <q-card
    flat
    class="banner-uploader column flex-center text-center cursor-pointer"
    @click="pickFile"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <q-file
      ref="fileInputRef"
      v-model="selectedFile"
      accept=".jpg,.jpeg,.png"
      max-file-size="5242880"
      class="hidden"
      @update:model-value="onFileSelected"
    />

    <q-icon name="cloud_upload" size="100px" color="grey-9" />
    <div class="text-h6 text-weight-bold q-mt-sm">
      {{ $t('admin.pageBuilder.actions.addBanner') }}
    </div>
    <div class="text-body1 text-grey-9 q-mt-xs">
      {{ $t('admin.pageBuilder.uploadHint') }}
    </div>
    <div class="text-caption text-grey-7 q-mt-xs">
      {{ $t('admin.pageBuilder.uploadSizeTip') }}
    </div>

    <q-inner-loading :showing="isUploading" :label="$t('admin.pageBuilder.uploading')" />

    <q-dialog v-model="showCropDialog" persistent>
      <AppImageCropper
        :image-src="cropImageSrc"
        file-type="image/jpeg"
        :crop-width="cropWidth"
        :crop-height="cropHeight"
        :output-width="outputWidth"
        :output-height="outputHeight"
        show-preview
        @confirm="onCropConfirm"
        @cancel="showCropDialog = false"
      />
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QFile, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppImageCropper from 'src/components/shared/app-image-cropper.vue';
import { useImageUpload } from 'src/composables/use-image-upload';

interface Props {
  cropWidth?: number;
  cropHeight?: number;
  outputWidth?: number;
  outputHeight?: number;
}

withDefaults(defineProps<Props>(), {
  cropWidth: 900,
  cropHeight: 180,
  outputWidth: 1500,
  outputHeight: 300,
});

const emit = defineEmits<{ (e: 'uploaded', imagePath: string): void }>();

const $q = useQuasar();
const { t } = useI18n();
const fileInputRef = ref<QFile | null>(null);
const selectedFile = ref<File | null>(null);
const showCropDialog = ref(false);
const cropImageSrc = ref('');

const { isUploading, handleImageUpload } = useImageUpload({
  onSuccess: (imagePath: string) => {
    emit('uploaded', imagePath);
    selectedFile.value = null;
  },
  onError: (uploadError: Error) => {
    $q.notify({
      type: 'negative',
      message: uploadError.message || t('admin.pageBuilder.messages.uploadFailed'),
      position: 'top',
    });
  },
});

const pickFile = (): void => {
  selectedFile.value = null;
  fileInputRef.value?.pickFiles();
};

const validateAndPreview = (file: File): void => {
  const isImage =
    file.type === 'image/jpeg' || file.type === 'image/png' || /\.(jpe?g|png)$/i.test(file.name);
  if (!isImage) {
    $q.notify({
      type: 'negative',
      message: t('admin.pageBuilder.messages.invalidFormat'),
      position: 'top',
    });
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    if (event.target?.result) {
      cropImageSrc.value = event.target.result as string;
      showCropDialog.value = true;
    }
  };
  reader.readAsDataURL(file);
};

const onFileSelected = (file: File | null): void => {
  if (file) validateAndPreview(file);
  selectedFile.value = null;
};

const onDrop = (event: DragEvent): void => {
  const file = event.dataTransfer?.files?.[0];
  if (file) validateAndPreview(file);
};

const onCropConfirm = async (croppedFile: File): Promise<void> => {
  showCropDialog.value = false;
  await handleImageUpload(croppedFile, 'page-builder');
};
</script>

<style scoped lang="scss">
.banner-uploader {
  position: relative;
  height: 100%;
  min-height: 288px;
  padding: 24px;
  border-radius: var(--radius-md);
  border: 2px dashed var(--neutral-300, #cbd5e1);
  background-color: var(--pb-uploader-bg);
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--pb-uploader-hover-bg);
    border-color: var(--primary);
  }

  @media (max-width: 1023px) {
    min-height: 200px;
    padding: 16px;
  }
}

.hidden {
  display: none;
}
</style>
