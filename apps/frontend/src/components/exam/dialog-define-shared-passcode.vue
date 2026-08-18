<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="dialog-define-shared-passcode-card">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div class="text-h6 text-weight-bold dialog-title">{{ t('admin.examForm.dialogs.sharedPasscode.title') }}</div>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <div class="text-body2 text-grey-7 q-mb-md">
          {{ t('admin.examForm.dialogs.sharedPasscode.description') }}
        </div>

        <div class="buu-label-muted q-mb-xs">{{ t('admin.examForm.dialogs.sharedPasscode.label') }}</div>
        <q-input
          v-model="passcode"
          outlined
          dense
          bg-color="white"
          maxlength="6"
          :placeholder="t('admin.examForm.dialogs.sharedPasscode.placeholder')"
          hide-bottom-space
          class="passcode-input buu-input-muted"
          :class="{ 'buu-field-error': !!errorMessage }"
          @update:model-value="onInput"
          @keyup.enter="onConfirm"
        >
          <template #append>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              :label="t('admin.examForm.dialogs.sharedPasscode.randomize')"
              class="randomize-btn"
              @click="onRandomize"
            />
          </template>
        </q-input>
        <div v-if="errorMessage" class="buu-error-msg q-mt-xs">
          <q-icon name="error" class="buu-error-icon" />
          {{ errorMessage }}
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md q-pt-none q-gutter-sm">
        <q-btn flat no-caps :label="t('profile.cancel')" class="dialog-btn cancel-btn" v-close-popup />
        <q-btn
          unelevated
          no-caps
          color="primary"
          :label="t('profile.confirm')"
          class="dialog-btn confirm-btn"
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  PASSCODE_LENGTH,
  PASSCODE_PATTERN,
  generateRandomAlphanumericPasscode,
  normalizeExamPasscode,
} from 'src/constants/exam';

const { t } = useI18n();

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', passcode: string): void;
}>();

const passcode = ref('');
const errorMessage = ref('');

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      passcode.value = '';
      errorMessage.value = '';
    }
  },
);

const onInput = (value: string | number | null): void => {
  const raw = String(value ?? '');
  passcode.value = raw.replace(/[^A-Za-z0-9]/g, '').slice(0, PASSCODE_LENGTH);
  errorMessage.value = '';
};

const onRandomize = (): void => {
  passcode.value = generateRandomAlphanumericPasscode();
  errorMessage.value = '';
};

const onConfirm = (): void => {
  const normalized = normalizeExamPasscode(passcode.value);
  if (!PASSCODE_PATTERN.test(normalized)) {
    errorMessage.value = t('admin.examForm.dialogs.sharedPasscode.invalidFormat');
    return;
  }

  emit('confirm', normalized);
  emit('update:modelValue', false);
};
</script>

<style scoped lang="scss">
.dialog-define-shared-passcode-card {
  width: 100%;
  max-width: 420px;
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  box-shadow: var(--dialog-shadow);
}

.dialog-title {
  color: var(--primary);
  letter-spacing: 0.02em;
}

.passcode-input {
  :deep(.q-field__control) {
    border-radius: var(--radius-md) !important;
  }

  :deep(input) {
    letter-spacing: 0.12em;
    font-weight: 600;
    text-transform: uppercase;
  }
}

.randomize-btn {
  border-radius: var(--radius-md);
}

.dialog-btn {
  min-width: 96px;
  min-height: 40px;
  padding: 0 20px;
  font-weight: 600;
  border-radius: var(--radius-md) !important;
  text-transform: none;
}

.cancel-btn {
  background-color: var(--neutral-100);
  color: var(--text-primary);
}

.confirm-btn {
  min-width: 96px;
}
</style>
