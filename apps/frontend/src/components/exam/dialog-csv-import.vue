<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="dialog-csv-card">
      <q-card-section class="row items-center q-pb-none header-section">
        <div class="dialog-heading">{{ t('admin.examForm.dialogs.csvImport.title') }}</div>
        <q-space />
        <q-btn
          unelevated
          dense
          no-caps
          :label="t('admin.examForm.dialogs.csvImport.sampleFile')"
          class="sample-btn"
          @click="$emit('download-sample')"
        />
        <q-btn icon="close" flat round dense v-close-popup class="close-btn q-ml-sm" />
      </q-card-section>

      <q-card-section class="q-pt-md body-section">
        <div
          class="csv-upload-zone"
          :class="{ 'csv-upload-zone--dragover': isDragOver }"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="onDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept=".csv,.xlsx,.xls"
            class="hidden-file-input"
            @change="onFileChange"
          />
          <div class="csv-upload-zone__content column items-center">
            <q-icon name="cloud_upload" class="upload-icon" />
            <div class="upload-main-text">{{ t('admin.examForm.dialogs.csvImport.dragDrop') }}</div>
            <div class="upload-hint-text">{{ t('admin.examForm.dialogs.csvImport.hint') }}</div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'file-selected', file: File): void;
  (e: 'download-sample'): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);

const triggerFileInput = (): void => {
  fileInputRef.value?.click();
};

const processFile = (file: File): void => {
  if (file.size > MAX_FILE_SIZE) {
    console.error('File exceeds 10MB limit');
    return;
  }
  emit('file-selected', file);
  emit('update:modelValue', false);
};

const onFileChange = (event: Event): void => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) processFile(file);
  if (input) input.value = '';
};

const onDrop = (event: DragEvent): void => {
  isDragOver.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) processFile(file);
};
</script>

<style scoped lang="scss">
.dialog-csv-card {
  width: 100%;
  max-width: 720px;
  border-radius: 16px;
  background: var(--surface-card);
  box-shadow: var(--dialog-shadow);
}

.header-section {
  padding: 24px 28px 0 28px;
}

.dialog-heading {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-primary);
}

.sample-btn {
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  text-transform: none;
  color: var(--text-primary);
  background-color: #ededed;
  padding: 6px 20px;
  min-height: 38px;

  &:hover {
    background-color: #e0e0e0;
  }
}

.close-btn {
  color: var(--text-secondary);
}

.body-section {
  padding: 16px 28px 28px 28px;
}

.csv-upload-zone {
  position: relative;
  width: 100%;
  min-height: 280px;
  border-radius: 12px;
  background-color: #e8f4fd;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%236db6e3' stroke-width='2' stroke-dasharray='10%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e");

  &--dragover {
    background-color: #d4ecfa;
    background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%230D47A1' stroke-width='2.5' stroke-dasharray='10%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e");
  }

  &:hover:not(.csv-upload-zone--dragover) {
    background-color: #ddf0fb;
  }

  &__content {
    padding: 32px 24px;
    pointer-events: none;
  }
}

.hidden-file-input {
  display: none;
}

.upload-icon {
  font-size: 72px !important;
  color: #37474f;
  margin-bottom: 16px;
}

.upload-main-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 6px;
}

.upload-hint-text {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
  text-align: center;
}

@media (max-width: 600px) {
  .dialog-csv-card {
    width: 95vw;
    border-radius: 12px;
  }

  .header-section,
  .body-section {
    padding-left: 16px;
    padding-right: 16px;
  }

  .csv-upload-zone {
    min-height: 200px;
  }

  .upload-icon {
    font-size: 56px !important;
  }

  .upload-main-text {
    font-size: 14px;
  }
}
</style>
