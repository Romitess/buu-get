<template>
  <div
    class="upload-zone"
    :class="{
      'upload-zone--dragover': isDragOver,
      'upload-zone--has-file': !!fileName,
    }"
    @dragover.prevent="isDragOver = true"
    @dragleave.prevent="isDragOver = false"
    @drop.prevent="onDrop"
  >
    <!-- Uploaded File Display -->
    <div v-if="fileName" class="uploaded-file column items-center q-gutter-y-sm">
      <q-icon name="description" size="48px" color="positive" />
      <div class="text-weight-medium text-dark file-name">{{ fileName }}</div>
      <div class="text-caption text-grey-6">{{ fileSizeLabel }}</div>
      <q-btn flat dense icon="close" color="negative" class="remove-btn" @click.stop="handleRemove">
        <q-tooltip>{{ removeLabel }}</q-tooltip>
      </q-btn>
    </div>

    <!-- Empty Drop Zone -->
    <label v-else class="drop-label column items-center q-gutter-y-xs">
      <q-icon name="download" size="48px" color="primary" />
      <span class="text-weight-medium text-grey-8">{{ label }}</span>
      <span v-if="hint" class="text-caption text-grey-5">{{ hint }}</span>
      <input
        ref="fileInputRef"
        type="file"
        :accept="accept"
        class="hidden-input"
        @change="onFileSelected"
      />
    </label>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  /** Label text displayed inside the upload zone */
  label?: string;
  /** Hint text displayed below the label */
  hint?: string;
  /** Accepted file types (e.g. '.csv,.xlsx') */
  accept?: string;
  /** Tooltip for the remove button */
  removeLabel?: string;
  /** Max file size in bytes (default: 10MB) */
  maxSizeBytes?: number;
}

const props = withDefaults(defineProps<Props>(), {
  label: 'อัปโหลดไฟล์การชำระเงิน',
  hint: 'รองรับไฟล์ .csv, .xlsx (ขนาดไม่เกิน 10MB)',
  accept: '.csv,.xlsx,.xls',
  removeLabel: 'ลบไฟล์',
  maxSizeBytes: 10 * 1024 * 1024,
});

const emit = defineEmits<{
  (e: 'file-selected', file: File): void;
  (e: 'file-removed'): void;
  (e: 'error', message: string): void;
}>();

const isDragOver = ref(false);
const fileName = ref<string | null>(null);
const fileSize = ref(0);
const fileInputRef = ref<HTMLInputElement | null>(null);

const fileSizeLabel = computed((): string => {
  if (fileSize.value === 0) return '';
  const kb = fileSize.value / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
});

const processFile = (file: File): void => {
  if (file.size > props.maxSizeBytes) {
    emit('error', `ขนาดไฟล์เกิน ${(props.maxSizeBytes / 1024 / 1024).toFixed(0)} MB`);
    return;
  }
  fileName.value = file.name;
  fileSize.value = file.size;
  emit('file-selected', file);
};

const onFileSelected = (event: Event): void => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) processFile(file);
};

const onDrop = (event: DragEvent): void => {
  isDragOver.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) processFile(file);
};

const handleRemove = (): void => {
  fileName.value = null;
  fileSize.value = 0;
  if (fileInputRef.value) fileInputRef.value.value = '';
  emit('file-removed');
};

/** Allow parent to reset the component */
defineExpose({ reset: handleRemove });
</script>

<style scoped lang="scss">
.upload-zone {
  position: relative;
  border: 2px dashed var(--neutral-gray-light, #ccc);
  border-radius: var(--radius-md, 12px);
  background-color: var(--surface-page, #fafbfc);
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  cursor: pointer;

  &--dragover {
    border-color: var(--primary);
    background-color: rgba(13, 71, 161, 0.04);
  }

  &--has-file {
    border-style: solid;
    border-color: var(--positive, #21ba45);
    background-color: rgba(33, 186, 69, 0.03);
    cursor: default;
  }

  &:hover:not(.upload-zone--has-file) {
    border-color: var(--primary);
    background-color: rgba(13, 71, 161, 0.02);
  }
}

.drop-label {
  cursor: pointer;
  padding: 24px;
  text-align: center;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hidden-input {
  display: none;
}

.uploaded-file {
  padding: 24px;
  text-align: center;
}

.file-name {
  word-break: break-all;
  max-width: 400px;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
}
</style>
