<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="text-center passcode-card">
      <q-btn
        icon="close"
        flat
        round
        dense
        v-close-popup
        class="absolute-top-right text-grey-6 close-btn"
        size="md"
      />

      <div class="q-mt-sm q-mb-md flex flex-center">
        <div class="lock-icon-container flex flex-center">
          <q-icon name="lock" size="32px" color="dark" />
        </div>
      </div>

      <div class="text-h6 text-weight-bold q-mb-sm text-dark-title">
        {{ title || $t('examSchedule.passcodeDialog.title') }}
      </div>
      <div class="text-caption q-mb-lg subtitle-text">
        {{ subtitle || $t('examSchedule.passcodeDialog.subtitle') }}
      </div>

      <q-input
        v-model="passcode"
        outlined
        dense
        :type="isPasswordVisible ? 'text' : 'password'"
        class="q-mb-lg passcode-input"
        :placeholder="placeholderText || $t('examSchedule.passcodeDialog.placeholder')"
      >
        <template v-slot:append>
          <q-icon
            :name="isPasswordVisible ? 'visibility' : 'visibility_off'"
            class="cursor-pointer"
            color="grey-8"
            @click="togglePasswordVisibility"
          />
        </template>
      </q-input>

      <AppButton
        :label="confirmBtnText || $t('examSchedule.passcodeDialog.confirm')"
        class="full-width q-mb-md confirm-btn"
        @click="confirmPasscode"
      />

      <div class="footer-text flex flex-center">
        <q-icon name="help_outline" size="16px" class="q-mr-xs" />
        {{ footerSupportText || $t('examSchedule.passcodeDialog.footerSupport') }}
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppButton from 'src/components/base/app-button.vue';

interface Props {
  title?: string;
  subtitle?: string;
  placeholderText?: string;
  confirmBtnText?: string;
  footerSupportText?: string;
}

withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  placeholderText: '',
  confirmBtnText: '',
  footerSupportText: '',
});

const isOpen = ref<boolean>(false);
const passcode = ref<string>('');
const isPasswordVisible = ref<boolean>(false);

const emit = defineEmits<{
  (e: 'confirm', passcode: string): void;
}>();

const togglePasswordVisibility = (): void => {
  isPasswordVisible.value = !isPasswordVisible.value;
};

const openDialog = (): void => {
  isOpen.value = true;
  passcode.value = '';
  isPasswordVisible.value = false;
};

const closeDialog = (): void => {
  isOpen.value = false;
};

const confirmPasscode = (): void => {
  emit('confirm', passcode.value);
  closeDialog();
};

defineExpose({
  openDialog,
  closeDialog,
});
</script>

<style scoped>
.passcode-card {
  width: 440px;
  max-width: 95vw;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.close-btn {
  top: 16px;
  right: 16px;
}

.lock-icon-container {
  background-color: var(--neutral-200);
  width: 64px;
  height: 64px;
  border-radius: 16px;
}

.text-dark-title {
  font-size: 22px;
  color: var(--text-primary);
}

.subtitle-text {
  font-size: 15px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.passcode-input :deep(.q-field__control) {
  border-radius: 8px;
  height: 52px;
}

.passcode-input :deep(.q-field__append) {
  padding-right: 12px;
  height: 100%;
  display: flex;
  align-items: center;
}

.passcode-input :deep(input::placeholder) {
  letter-spacing: 3px;
  color: var(--text-placeholder);
  font-size: 20px;
}

.confirm-btn {
  height: 52px;
  font-weight: 500;
  font-size: 16px;
}

.footer-text {
  font-size: 14px;
  color: var(--text-muted);
}

@media (max-width: 600px) {
  .passcode-card {
    padding: 16px 12px;
    border-radius: 12px;
    width: 95vw;
  }

  .text-dark-title {
    font-size: 16px;
  }

  .subtitle-text {
    font-size: 11px;
    white-space: nowrap;
    letter-spacing: -0.02em;
  }

  .lock-icon-container {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }

  .confirm-btn,
  .passcode-input :deep(.q-field__control) {
    height: 40px;
  }
}
</style>
