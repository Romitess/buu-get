<template>
  <q-dialog v-model="internalValue" :maximized="$q.screen.xs" persistent>
    <q-card class="request-fix-dialog">
      <header class="q-px-lg q-pt-lg q-pb-md relative-position">
        <h2 class="text-h5 text-weight-bold dashboard-header q-ma-none">
          {{ $t('admin.registrantManagement.detail.requestFixDialog.title') }}
        </h2>
        <p class="text-subtitle2 text-grey-7 q-mt-xs q-ma-none">
          {{ $t('admin.registrantManagement.detail.requestFixDialog.subtitle') }}
        </p>
        <q-btn
          v-if="$q.screen.xs"
          icon="close"
          flat
          round
          dense
          v-close-popup
          class="absolute-top-right q-mt-md q-mr-md text-grey-7"
        />
      </header>

      <q-separator class="dashboard-divider" />

      <section class="dialog-content q-px-lg q-pt-lg q-pb-none scroll">
        <div class="profile-info-block row items-center q-pa-md q-mb-lg no-wrap-sm">
          <q-avatar
            color="primary"
            text-color="white"
            size="48px"
            class="q-mr-md text-weight-bold flex-shrink-0"
          >
            {{ initials }}
          </q-avatar>
          <div class="column overflow-hidden">
            <div class="text-subtitle1 text-weight-bold text-dark ellipsis">{{ fullName }}</div>
            <div class="text-caption text-grey-7 ellipsis">
              {{
                $t('admin.registrantManagement.detail.requestFixDialog.regInfo', {
                  regId,
                  examDate,
                })
              }}
            </div>
          </div>
        </div>

        <div class="q-mb-md">
          <label class="field-label q-mb-xs block">
            {{ $t('admin.registrantManagement.detail.requestFixDialog.deadlineLabel') }}
            <span class="text-negative">*</span>
          </label>
          <AppLabeledInput
            v-model="form.fixDeadline"
            readonly
            :placeholder="`${examDate}`"
            @click="datePicker?.show()"
          >
            <template #prepend>
              <q-icon name="event" class="cursor-pointer" color="grey-7" size="20px" />
            </template>
            <q-popup-proxy ref="datePicker" transition-show="scale" transition-hide="scale">
              <q-date v-model="form.fixDeadline" mask="DD MMM YYYY">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </AppLabeledInput>
          <p class="text-caption text-grey-5 q-mt-xs q-ma-none">
            {{ $t('admin.registrantManagement.detail.requestFixDialog.deadlineNote') }}
          </p>
        </div>

        <div class="column q-gutter-y-sm q-mb-md">
          <q-checkbox
            v-for="option in reasonOptions"
            :key="option.val"
            v-model="form.reasons"
            :val="option.val"
            :label="option.label"
            class="custom-checkbox"
            dense
            size="32px"
          />
        </div>

        <div class="q-mb-lg">
          <label class="field-label q-mb-xs block">
            {{ $t('admin.registrantManagement.detail.requestFixDialog.notesLabel') }}
            <span class="text-weight-light text-grey-5">{{
              $t('admin.registrantManagement.detail.requestFixDialog.optionalLabel')
            }}</span>
          </label>
          <q-input
            v-model="form.notes"
            type="textarea"
            outlined
            dense
            autogrow
            :placeholder="t('admin.registrantManagement.detail.requestFixDialog.notesPlaceholder')"
            class="custom-input"
            maxlength="300"
          />
          <div class="row justify-end q-mt-xs">
            <div class="text-caption text-grey-5">{{ form.notes.length }} / 300</div>
          </div>
        </div>
      </section>

      <q-separator v-if="$q.screen.xs" class="dashboard-divider" />

      <q-card-actions
        :align="$q.screen.xs ? 'center' : 'right'"
        class="action-section q-px-lg q-pb-lg q-pt-md"
      >
        <AppButton
          :label="$t('admin.registrantManagement.detail.actions.cancel')"
          outline
          color="grey-4"
          text-color="grey-7"
          class="bg-white border-grey action-btn"
          @click="internalValue = false"
        />
        <AppButton
          :label="$t('admin.registrantManagement.detail.requestFixDialog.submit')"
          color="primary"
          icon="send"
          class="action-btn"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppButton from 'src/components/base/app-button.vue';
import AppLabeledInput from 'src/components/base/app-labeled-input.vue';

interface Props {
  modelValue: boolean;
  fullName: string;
  regId: string;
  examDate: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue', 'submit']);
const $q = useQuasar();
const { t } = useI18n();

const internalValue = ref(props.modelValue);

interface PopupProxy {
  show: () => void;
  hide: () => void;
}
const datePicker = ref<PopupProxy | null>(null);

const form = ref({
  fixDeadline: '',
  reasons: [] as string[],
  notes: '',
});

const reasonOptions = computed(() => [
  { val: 'photo', label: t('admin.registrantManagement.detail.requestFixDialog.reasons.photo') },
  { val: 'info', label: t('admin.registrantManagement.detail.requestFixDialog.reasons.info') },
  { val: 'other', label: t('admin.registrantManagement.detail.requestFixDialog.reasons.other') },
]);

watch(
  () => props.modelValue,
  (val) => {
    internalValue.value = val;
    if (val) {
      form.value = {
        fixDeadline: props.examDate || '',
        reasons: [],
        notes: '',
      };
    }
  },
);

watch(internalValue, (val) => {
  emit('update:modelValue', val);
});

const initials = computed(() => {
  const unknownName = t('admin.registrantManagement.detail.errors.unknownName');
  if (!props.fullName || props.fullName === unknownName || props.fullName === 'ไม่ทราบชื่อ')
    return '??';
  const parts = props.fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    const firstPart = parts[0];
    const lastPart = parts[parts.length - 1];
    if (firstPart && lastPart) {
      return (firstPart[0] || '') + (lastPart[0] || '');
    }
  }
  return props.fullName.substring(0, 2);
});

const isFormValid = computed(() => {
  return form.value.reasons.length > 0;
});

const handleSubmit = (): void => {
  if (!isFormValid.value) {
    $q.notify({
      type: 'warning',
      message: t('admin.registrantManagement.detail.requestFixDialog.validationError'),
      position: 'top',
    });
    return;
  }

  emit('submit', { ...form.value });
  internalValue.value = false;
};
</script>

<style scoped lang="scss">
.request-fix-dialog {
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  width: 500px;
  max-width: 95vw;
  border-radius: 16px;

  @media (max-width: $breakpoint-xs-max) {
    width: 100%;
    max-width: 100vw;
    border-radius: 0;
    height: 100%;
  }
}

.dashboard-header {
  color: var(--dashboard-header-text);
}

.dashboard-divider {
  height: 1.2px;
  background-color: var(--dashboard-divider-color);
}

.dialog-content {
  @media (max-width: $breakpoint-xs-max) {
    max-height: none;
    flex-grow: 1;
  }
}

.profile-info-block {
  background: #f0f7ff;
  border: 1.5px solid #bbdefb;
  border-radius: 12px;
  flex-wrap: nowrap;
}

.field-label {
  font-size: 1rem;
  font-weight: 700;
  color: #212121;
}

.custom-input {
  :deep(.q-field__control) {
    border-radius: 10px;
    background-color: #fcfcfc;
    transition: all 0.3s ease;

    &:before {
      border: 1px solid #eeeeee !important;
      border-style: solid !important;
    }

    &:hover:before {
      border-color: #e0e0e0 !important;
    }
  }

  :deep(.q-field__native) {
    font-weight: 500;
    color: #424242;
  }
}

.custom-checkbox {
  border: 1px solid #eeeeee;
  border-radius: 8px;
  padding: 6px 12px;
  width: 100%;
  transition: all 0.2s ease;
  background-color: #ffffff;

  &:hover {
    background-color: #fcfcfc;
    border-color: #e0e0e0;
  }

  :deep(.q-checkbox__inner) {
    font-size: 28px;
  }

  :deep(.q-checkbox__label) {
    font-weight: 500;
    color: #424242;
    font-size: 0.95rem;
  }
}

.action-section {
  gap: 12px;
}

.action-btn {
  min-width: 140px;
  height: 48px;
  font-weight: 700;
  border-radius: 10px;

  @media (max-width: $breakpoint-xs-max) {
    width: 100%;
    min-width: 100%;
    margin-left: 0 !important;

    &:nth-child(2) {
      order: 1;
    }
    &:nth-child(1) {
      order: 2;
    }
  }
}

.border-grey {
  border: 1px solid #e0e0e0 !important;
}

.text-dark {
  color: #212121 !important;
}

.flex-shrink-0 {
  flex-shrink: 0;
}
</style>
