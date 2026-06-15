<template>
  <div>
    <!-- Save Button Trigger -->
    <q-btn
      :label="t('admin.finSaveTranscription.btnLabel')"
      unelevated
      :disable="disabled"
      class="btn-save-trigger full-width"
      :class="{ 'btn-disabled': disabled }"
      @click="showConfirm = true"
    />

    <!-- Confirm Dialog -->
    <q-dialog v-model="showConfirm" persistent>
      <q-card class="confirm-dialog-card">
        <!-- Close Button & Title -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-bold dialog-title">
            {{ t('admin.finSaveTranscription.confirmTitle') }}
          </div>
          <q-btn
            icon="close"
            flat
            round
            dense
            v-close-popup
            class="text-grey-6"
            :disable="isLoading"
          />
        </div>

        <!-- Confirm Message -->
        <div class="text-center q-my-lg message-text">
          {{ t('admin.finSaveTranscription.confirmMessage') }}
        </div>

        <!-- Action Buttons -->
        <div class="row justify-center q-gutter-x-md q-mt-lg">
          <q-btn
            :label="t('profile.cancel')"
            unelevated
            v-close-popup
            class="btn-dialog-cancel text-weight-bold"
            :disable="isLoading"
          />
          <q-btn
            :label="t('admin.finSaveTranscription.confirmBtn')"
            unelevated
            @click="onConfirm"
            class="btn-dialog-confirm text-weight-bold"
            :loading="isLoading"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- Success Dialog -->
    <q-dialog v-model="showSuccess" persistent>
      <q-card class="success-dialog-card">
        <!-- Close Button & Title -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-bold dialog-title">
            {{ t('admin.finSaveTranscription.successTitle') }}
          </div>
          <q-btn icon="close" flat round dense @click="onSuccessClose" class="text-grey-6" />
        </div>

        <!-- Success Message -->
        <div class="text-center q-my-lg message-text">
          {{ t('admin.finSaveTranscription.successMessage') }}
        </div>

        <!-- Full width OK Button -->
        <div class="row q-mt-lg">
          <q-btn
            :label="t('admin.finSaveTranscription.okBtn')"
            unelevated
            @click="onSuccessClose"
            class="btn-dialog-ok text-weight-bold full-width"
          />
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { PaymentRow } from 'src/types/exam.types';
import { updateEnrollmentStatus } from 'src/services/enrollment.service';
import { updateTransactionByErmId } from 'src/services/transaction.service';

const props = defineProps<{
  disabled?: boolean;
  rows?: PaymentRow[];
}>();

const { t } = useI18n();
const router = useRouter();
const showConfirm = ref(false);
const showSuccess = ref(false);
const isLoading = ref(false);

const onConfirm = async () => {
  isLoading.value = true;
  try {
    if (props.rows) {
      // Process all matched rows to update enrollment status to PAID (1) and transaction match status to APPROVED (1)
      const promises = props.rows
        .filter((row) => row.db_ref2)
        .flatMap((row) => {
          const ermId = Number(row.db_ref2);
          return [
            updateEnrollmentStatus(ermId, { ERM_STATUS: 1 }),
            updateTransactionByErmId(ermId, { TRANX_MATCH_STATUS: 1 }),
          ];
        });

      await Promise.all(promises);
    }
    showConfirm.value = false;
    showSuccess.value = true;
  } catch (err) {
    console.error('Failed to save transcription payment statuses:', err);
  } finally {
    isLoading.value = false;
  }
};

const onSuccessClose = () => {
  showSuccess.value = false;
  void router.push('/admin/payment-import');
};
</script>

<style scoped lang="scss">
.btn-save-trigger {
  background-color: var(--primary) !important;
  color: white !important;
  border-radius: var(--radius-sm);
  height: 48px;
  font-size: 1rem;
  transition: all 0.3s ease;

  &.btn-disabled {
    background-color: var(--neutral-200) !important;
    color: var(--neutral-400) !important;
    cursor: not-allowed;
  }

  &:not(.btn-disabled):hover {
    background-color: var(--primary-dark) !important;
  }
}

.confirm-dialog-card,
.success-dialog-card {
  width: 450px;
  max-width: 90vw;
  border-radius: var(--radius-lg);
  padding: 24px 32px;
  box-shadow: var(--shadow-lg);
}

.dialog-title {
  color: var(--text-primary);
  font-size: 1.15rem;
}

.message-text {
  font-size: 1.05rem;
  color: var(--text-primary);
  font-weight: 500;
}

.btn-dialog-cancel {
  background-color: var(--neutral-200) !important;
  color: var(--neutral-600) !important;
  width: 120px;
  height: 40px;
  border-radius: var(--radius-sm);
  text-transform: none;
}

.btn-dialog-confirm {
  background-color: var(--primary) !important;
  color: white !important;
  width: 120px;
  height: 40px;
  border-radius: var(--radius-sm);
  text-transform: none;

  &:hover {
    background-color: var(--primary-dark) !important;
  }
}

.btn-dialog-ok {
  background-color: var(--primary) !important;
  color: white !important;
  height: 44px;
  border-radius: var(--radius-sm);
  text-transform: none;
  font-size: 1rem;

  &:hover {
    background-color: var(--primary-dark) !important;
  }
}
</style>
