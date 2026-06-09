<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="receipt-information-card">
      <q-btn
        icon="close"
        flat
        round
        dense
        class="absolute-top-right close-btn"
        @click="closeDialog"
      />

      <h2 class="dialog-title">{{ t('exam.history.receiptForm.title') }}</h2>

      <section class="exam-summary">
        <div class="summary-title">{{ t('exam.history.receiptForm.examDetails') }}</div>
        <div class="summary-details">
          <div class="summary-item summary-subject">
            <strong class="summary-label">{{ t('exam.history.receiptForm.subject') }}:</strong>
            <span class="summary-value">{{ examTitle }}</span>
          </div>
          <div class="summary-meta">
            <span class="summary-item">
              <strong class="summary-label">{{ t('exam.history.receiptForm.fee') }}:</strong>
              <span class="summary-value">{{ formattedAmount }}</span>
            </span>
            <span class="summary-item">
              <strong class="summary-label">
                {{ t('exam.history.receiptForm.paymentPeriod') }}:
              </strong>
              <span class="summary-value">{{ paymentDeadline || '-' }}</span>
            </span>
          </div>
        </div>
      </section>

      <q-form ref="receiptFormRef" class="receipt-form" @submit.prevent="submitForm">
        <label class="field-group">
          <span>{{ identityLabel }}</span>
          <q-input
            v-model="form.taxId"
            outlined
            dense
            lazy-rules
            :maxlength="isForeignUser ? 9 : 13"
            :placeholder="identityPlaceholder"
            :rules="identityRules"
            @update:model-value="sanitizeIdentity"
          />
        </label>

        <label class="field-group">
          <span>{{ t('exam.history.receiptForm.fullNameLabel') }}</span>
          <q-input
            v-model="form.fullName"
            outlined
            dense
            lazy-rules
            :placeholder="profilePlaceholders.fullName"
            :rules="fullNameRules"
            @update:model-value="sanitizeFullName"
          />
        </label>

        <label class="field-group">
          <span>{{ t('exam.history.receiptForm.phoneLabel') }}</span>
          <q-input
            v-model="form.phone"
            outlined
            dense
            lazy-rules
            maxlength="10"
            :placeholder="profilePlaceholders.phone"
            :rules="phoneRules"
            @update:model-value="sanitizePhone"
          />
        </label>

        <label class="field-group">
          <span>{{ t('exam.history.receiptForm.addressLabel') }}</span>
          <q-input
            v-model="form.address"
            type="textarea"
            outlined
            dense
            lazy-rules
            :placeholder="profilePlaceholders.address"
            :rules="requiredRules"
          />
        </label>

        <div class="dialog-actions">
          <AppButton
            type="button"
            :label="t('exam.history.receiptForm.cancel')"
            class="cancel-btn"
            @click="closeDialog"
          />
          <AppButton
            type="submit"
            :label="t('exam.history.receiptForm.confirm')"
            class="confirm-btn"
          />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QForm } from 'quasar';
import AppButton from 'src/components/base/app-button.vue';
import type { ReceiptInformation } from 'src/types/receipt-information';

const props = defineProps<{
  modelValue: boolean;
  examTitle: string;
  amount: number;
  paymentDeadline?: string;
  initialValue: ReceiptInformation;
  isForeignUser?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', value: ReceiptInformation): void;
}>();

const { t, locale } = useI18n();
const receiptFormRef = ref<QForm | null>(null);
const emptyForm = (): ReceiptInformation => ({
  taxId: '',
  fullName: '',
  phone: '',
  address: '',
});
const form = reactive<ReceiptInformation>(emptyForm());

const profilePlaceholders = computed<ReceiptInformation>(() => ({
  taxId: identityPlaceholder.value,
  fullName: t('exam.history.receiptForm.fullNamePlaceholder'),
  phone: t('exam.history.receiptForm.phonePlaceholder'),
  address: t('exam.history.receiptForm.addressPlaceholder'),
}));

const identityLabel = computed(() =>
  props.isForeignUser
    ? t('exam.history.receiptForm.passportLabel')
    : t('exam.history.receiptForm.taxIdLabel'),
);
const identityPlaceholder = computed(() =>
  props.isForeignUser
    ? t('exam.history.receiptForm.passportPlaceholder')
    : t('exam.history.receiptForm.taxIdPlaceholder'),
);
const requiredRules = computed(() => [
  (value: string) => Boolean(value?.trim()) || t('exam.history.receiptForm.required'),
]);
const identityRules = computed(() => [
  ...requiredRules.value,
  (value: string) =>
    props.isForeignUser
      ? /^[A-Za-z0-9]{1,9}$/.test(value) || t('exam.history.receiptForm.passportInvalid')
      : /^\d{13}$/.test(value) || t('exam.history.receiptForm.nationalIdInvalid'),
]);
const fullNameRules = computed(() => [
  ...requiredRules.value,
  (value: string) => /^[\p{L}\s'-]+$/u.test(value) || t('exam.history.receiptForm.fullNameInvalid'),
]);
const phoneRules = computed(() => [
  ...requiredRules.value,
  (value: string) => /^\d{10}$/.test(value) || t('exam.history.receiptForm.phoneInvalid'),
]);

const sanitizeIdentity = (value: string | number | null): void => {
  const text = String(value ?? '');
  form.taxId = props.isForeignUser
    ? text.replace(/[^A-Za-z0-9]/g, '').slice(0, 9)
    : text.replace(/\D/g, '').slice(0, 13);
};

const sanitizeFullName = (value: string | number | null): void => {
  form.fullName = String(value ?? '').replace(/[^\p{L}\s'-]/gu, '');
};

const sanitizePhone = (value: string | number | null): void => {
  form.phone = String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 10);
};

const formattedAmount = computed(() => {
  const currency = t('exam.history.receiptForm.currency');
  return `${props.amount.toLocaleString(locale.value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
});

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) Object.assign(form, emptyForm());
  },
);

const closeDialog = (): void => emit('update:modelValue', false);

const submitForm = async (): Promise<void> => {
  const isValid = await receiptFormRef.value?.validate();
  if (!isValid) return;

  emit('confirm', {
    taxId: form.taxId.trim(),
    fullName: form.fullName.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
  });
};
</script>

<style scoped lang="scss">
.receipt-information-card {
  width: min(604px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 32px;
  border-radius: 12px;
  background: var(--surface-card);
}

.close-btn {
  margin: 10px;
  color: var(--text-muted);
}

.dialog-title {
  margin: 4px 0 16px;
  font-size: 22px;
  line-height: 1.35;
}

.exam-summary {
  display: grid;
  gap: 8px;
  padding: 14px 20px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  text-align: left;
}

.summary-title {
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  font-family: 'Sarabun', sans-serif;
}

.summary-details {
  width: fit-content;
  max-width: 100%;
  margin-inline: auto;
  display: grid;
  gap: 8px;
}

.summary-meta {
  display: flex;
  flex-wrap: nowrap;
  align-items: baseline;
  justify-content: flex-start;
  gap: 8px 18px;
}

.summary-subject {
  justify-content: flex-start;
}

.summary-meta > span {
  white-space: nowrap;
}

.summary-item {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  font-family: 'Sarabun', sans-serif;
  font-size: 16px;
  line-height: 1;
}

.summary-label {
  color: #000000;
  font-weight: 500;
  font-style: normal;
  line-height: 1;
  letter-spacing: 0;
}

.summary-value {
  color: #000000;
  font-weight: 400;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.receipt-form {
  display: grid;
  gap: 6px;
  margin-top: 22px;
}

.field-group {
  display: grid;
  gap: 6px;
  font-size: 15px;
  font-weight: 500;
}

.field-group :deep(.q-field--error .q-field__bottom) {
  color: var(--negative);
}

.field-group :deep(.q-field__control) {
  border-radius: 12px;
}

.field-group :deep(.q-field__native::placeholder) {
  color: #0000004d;
  opacity: 1;
}

.field-group :deep(.q-field__input::placeholder) {
  color: #0000004d;
  opacity: 1;
}

.field-group :deep(textarea) {
  min-height: 96px;
  resize: vertical;
}

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
}

.cancel-btn,
.confirm-btn {
  width: 168px;
  min-height: 48px;
  border-radius: 8px;
  font-weight: 700;
}

.cancel-btn {
  background: #dddddd !important;
  color: var(--text-primary) !important;
  box-shadow: none !important;

  :deep(.q-btn),
  :deep(.q-btn::before) {
    background: #dddddd !important;
    color: var(--text-primary) !important;
    box-shadow: none !important;
  }

  :deep(.q-focus-helper) {
    display: none;
  }

  &:hover,
  &:focus,
  &:active {
    background: #d2d2d2 !important;
    box-shadow: none !important;
  }
}

.confirm-btn {
  background: var(--primary) !important;
  color: var(--text-on-primary) !important;
}

@media (max-width: 599px) {
  .receipt-information-card {
    padding: 24px 18px;
  }

  .summary-meta,
  .dialog-actions {
    flex-direction: column;
  }

  .summary-details {
    width: 100%;
  }

  .summary-meta > span {
    white-space: normal;
  }

  .cancel-btn,
  .confirm-btn {
    width: 100%;
  }
}
</style>
