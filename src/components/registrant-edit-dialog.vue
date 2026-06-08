<template>
  <div>
    <q-dialog v-model="internalValue" persistent>
      <q-card style="width: 900px; max-width: 95vw; border-radius: 16px">
        <q-card-section class="row items-center justify-between q-px-xl q-pt-lg q-pb-none">
          <div class="text-h6 text-weight-bold text-black">
            {{ $t('admin.registrantManagement.detail.editDialog.title') }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-px-xl q-py-md">
          <div class="edit-card-border q-pa-lg">
            <div class="row items-center q-mb-md">
              <q-icon name="person_outline" size="24px" color="black" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold text-black">
                {{ $t('admin.registrantManagement.detail.editDialog.registrantInfo') }}
              </div>
            </div>

            <q-form ref="formRef">
              <div class="row q-col-gutter-x-xl q-col-gutter-y-md">
                <div class="col-12 col-md-6">
                  <div class="q-mb-sm">
                    <label class="input-label">{{ $t('profile.nationalId') }}</label>
                    <q-input
                      v-model="form.userNationalId"
                      outlined
                      dense
                      mask="#-####-#####-##-#"
                      unmasked-value
                      bg-color="white"
                      class="custom-input"
                      :rules="[
                        (val) => !!val || $t('profile.requiredNationalId'),
                        (val) => !val || val.length === 13 || $t('profile.invalidNationalId'),
                      ]"
                      hide-bottom-space
                    />
                  </div>

                  <div class="q-mb-sm">
                    <label class="input-label">{{ $t('profile.prefix') }}</label>
                    <q-select
                      v-model="form.userTitleTh"
                      :options="titleOptions"
                      emit-value
                      map-options
                      outlined
                      dense
                      dropdown-icon="expand_more"
                      bg-color="white"
                      class="custom-input"
                      :rules="[(val) => !!val || $t('profile.requiredPrefix')]"
                      hide-bottom-space
                    />
                  </div>

                  <div class="q-mb-sm">
                    <label class="input-label">{{ $t('profile.fullName') }}</label>
                    <q-input
                      v-model="form.userFullnameTh"
                      outlined
                      dense
                      bg-color="white"
                      class="custom-input"
                      :rules="[(val) => !!val || $t('profile.requiredFullName')]"
                      hide-bottom-space
                    />
                  </div>

                  <div class="q-mb-sm">
                    <label class="input-label">{{ $t('profile.fullNameEn') }}</label>
                    <q-input
                      v-model="form.userFullnameEn"
                      outlined
                      dense
                      bg-color="white"
                      class="custom-input"
                      :rules="[(val) => !!val || $t('profile.requiredFullNameEn')]"
                      hide-bottom-space
                    />
                  </div>

                  <div class="q-mb-sm relative-position">
                    <label class="input-label">{{ $t('profile.birthdate') }}</label>
                    <q-input
                      v-model="birthdateDisplay"
                      outlined
                      dense
                      bg-color="white"
                      readonly
                      class="cursor-pointer custom-input"
                      :rules="[(val) => !!val || $t('profile.requiredBirthdate')]"
                      hide-bottom-space
                      @click="showCalendar = true"
                    >
                      <template v-slot:append>
                        <q-icon
                          name="calendar_today"
                          class="cursor-pointer"
                          size="xs"
                          @click.stop="showCalendar = true"
                        />
                        <q-menu
                          v-model="showCalendar"
                          anchor="bottom left"
                          self="top left"
                          class="shadow-5 calendar-menu"
                        >
                          <AppCalendar
                            :model-value="form.userDateOfBirth"
                            @update:model-value="(val) => (form.userDateOfBirth = val)"
                            @click-date="showCalendar = false"
                          />
                        </q-menu>
                      </template>
                    </q-input>
                  </div>
                </div>

                <div class="col-12 col-md-6">
                  <div class="q-mb-sm">
                    <label class="input-label">{{ $t('profile.education') }}</label>
                    <q-select
                      v-model="form.userEducation"
                      :options="educationOptions"
                      outlined
                      dense
                      dropdown-icon="expand_more"
                      bg-color="white"
                      class="custom-input"
                      :rules="[(val) => !!val || $t('profile.requiredEducation')]"
                      hide-bottom-space
                    />
                  </div>

                  <div class="q-mb-sm">
                    <label class="input-label">{{ $t('profile.faculty') }}</label>
                    <q-input
                      v-model="form.userFaculty"
                      outlined
                      dense
                      bg-color="white"
                      class="custom-input"
                      :rules="[(val) => !!val || $t('profile.required')]"
                      hide-bottom-space
                    />
                  </div>

                  <div class="q-mb-sm">
                    <label class="input-label">{{ $t('profile.institution') }}</label>
                    <q-input
                      v-model="form.userInstitution"
                      outlined
                      dense
                      bg-color="white"
                      class="custom-input"
                      :rules="[(val) => !!val || $t('profile.required')]"
                      hide-bottom-space
                    />
                  </div>

                  <div class="q-mb-sm">
                    <label class="input-label">{{ $t('profile.address') }}</label>
                    <q-input
                      v-model="form.userAddress"
                      outlined
                      dense
                      bg-color="white"
                      class="custom-input address-input"
                      type="textarea"
                      rows="3"
                      :rules="[(val) => !!val || $t('profile.required')]"
                      hide-bottom-space
                    />
                  </div>

                  <div class="q-mb-sm">
                    <label class="input-label">{{ $t('profile.phone') }}</label>
                    <q-input
                      v-model="form.userPhone"
                      outlined
                      dense
                      mask="###-###-####"
                      bg-color="white"
                      class="custom-input"
                      :rules="[
                        (val) => !!val || $t('profile.requiredPhone'),
                        (val) =>
                          !val ||
                          val.replace(/\D/g, '').length === 10 ||
                          $t('profile.invalidPhone'),
                      ]"
                      hide-bottom-space
                    />
                  </div>
                </div>
              </div>
            </q-form>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-px-xl q-pb-xl q-pt-none q-gutter-md">
          <AppButton
            :label="$t('admin.registrantManagement.detail.editDialog.reset')"
            color="grey-3"
            text-color="dark"
            style="min-width: 120px; border-radius: 8px"
            @click="resetForm"
          />
          <AppButton
            :label="$t('admin.registrantManagement.detail.editDialog.save')"
            color="primary"
            style="min-width: 120px; border-radius: 8px"
            @click="onSaveClick"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showConfirmDialog" persistent>
      <q-card style="width: 440px; border-radius: 12px; padding: 8px">
        <q-card-section class="row items-center q-pb-none justify-between">
          <div class="text-subtitle1 text-weight-bold text-black">
            {{ $t('admin.registrantManagement.detail.editDialog.confirmSaveTitle') }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-py-md text-center">
          <div class="text-body1 text-grey-8 q-my-md">
            {{ $t('admin.registrantManagement.detail.editDialog.confirmSaveMessage') }}
          </div>
        </q-card-section>

        <q-card-actions align="center" class="q-pt-none q-pb-md q-gutter-md">
          <AppButton
            :label="$t('admin.registrantManagement.detail.editDialog.cancel')"
            color="grey-3"
            text-color="dark"
            style="min-width: 100px; border-radius: 8px"
            @click="showConfirmDialog = false"
          />
          <AppButton
            :label="$t('admin.registrantManagement.detail.editDialog.confirm')"
            color="primary"
            style="min-width: 100px; border-radius: 8px"
            @click="onConfirmSave"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { QForm } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppButton from 'src/components/base/app-button.vue';
import AppCalendar from 'src/components/shared/app-calendar.vue';
import { TITLE_TH_OPTIONS, EDUCATION_LEVEL_OPTIONS } from 'src/utils/form-options';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';

interface Props {
  modelValue: boolean;
  enrollment: BackendEnrollmentDetail | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue', 'save']);
const $q = useQuasar();
const { t } = useI18n();

const internalValue = ref(props.modelValue);
const showCalendar = ref(false);
const showConfirmDialog = ref(false);
const formRef = ref<QForm | null>(null);

const form = ref({
  userNationalId: '',
  userTitleTh: '',
  userFullnameTh: '',
  userFullnameEn: '',
  userDateOfBirth: '',
  userEducation: '',
  userFaculty: '',
  userInstitution: '',
  userAddress: '',
  userPhone: '',
});

const titleOptions = computed(() =>
  TITLE_TH_OPTIONS.map((opt) => ({
    label: opt.label,
    value: opt.value,
  })),
);

const educationOptions = computed(() => EDUCATION_LEVEL_OPTIONS);

const birthdateDisplay = computed<string>({
  get(): string {
    if (!form.value.userDateOfBirth) return '';
    const datePart = form.value.userDateOfBirth.split('T')[0];
    if (datePart) {
      const parts = datePart.split('-');
      if (parts.length === 3) {
        const yearStr = parts[0];
        const month = parts[1];
        const day = parts[2];
        if (yearStr && month && day) {
          const year = parseInt(yearStr, 10);
          const beYear = year + 543;
          return `${day}/${month}/${beYear}`;
        }
      }
    }
    return form.value.userDateOfBirth;
  },
  set(val: string): void {
    if (!val) {
      form.value.userDateOfBirth = '';
      return;
    }
    const parts = val.split('/');
    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      const yearStr = parts[2];
      if (day && month && yearStr) {
        const beYear = parseInt(yearStr, 10);
        const ceYear = beYear - 543;
        form.value.userDateOfBirth = `${ceYear}-${month}-${day}`;
      }
    } else {
      form.value.userDateOfBirth = val;
    }
  },
});

const initialForm = ref({
  userNationalId: '',
  userTitleTh: '',
  userFullnameTh: '',
  userFullnameEn: '',
  userDateOfBirth: '',
  userEducation: '',
  userFaculty: '',
  userInstitution: '',
  userAddress: '',
  userPhone: '',
});

const initForm = () => {
  if (props.enrollment) {
    const profile = props.enrollment.USER?.PROFILE;
    const user = props.enrollment.USER;
    const data = {
      userNationalId: user?.USER_NATIONAL_ID || '',
      userTitleTh: profile?.userTitleTh || '',
      userFullnameTh: profile?.userFullnameTh || '',
      userFullnameEn: profile?.userFullnameEn || '',
      userDateOfBirth: profile?.userDateOfBirth || '',
      userEducation: profile?.userEducation || '',
      userFaculty: profile?.userFaculty || '',
      userInstitution: profile?.userInstitution || '',
      userAddress: profile?.userAddress || '',
      userPhone: profile?.userPhone || '',
    };
    form.value = { ...data };
    initialForm.value = { ...data };
  }
};

const isFormChanged = computed(() => {
  const sanitize = (val: string | null | undefined) => (val || '').replace(/[- ]/g, '').trim();
  const sanitizeDate = (val: string | null | undefined) => {
    if (!val) return '';
    return val.split('T')[0] || '';
  };
  const trimStr = (val: string | null | undefined) => (val || '').trim();

  return (
    sanitize(form.value.userNationalId) !== sanitize(initialForm.value.userNationalId) ||
    trimStr(form.value.userTitleTh) !== trimStr(initialForm.value.userTitleTh) ||
    trimStr(form.value.userFullnameTh) !== trimStr(initialForm.value.userFullnameTh) ||
    trimStr(form.value.userFullnameEn) !== trimStr(initialForm.value.userFullnameEn) ||
    sanitizeDate(form.value.userDateOfBirth) !== sanitizeDate(initialForm.value.userDateOfBirth) ||
    trimStr(form.value.userEducation) !== trimStr(initialForm.value.userEducation) ||
    trimStr(form.value.userFaculty) !== trimStr(initialForm.value.userFaculty) ||
    trimStr(form.value.userInstitution) !== trimStr(initialForm.value.userInstitution) ||
    trimStr(form.value.userAddress) !== trimStr(initialForm.value.userAddress) ||
    sanitize(form.value.userPhone) !== sanitize(initialForm.value.userPhone)
  );
});

watch(
  () => props.modelValue,
  (val) => {
    internalValue.value = val;
    if (val) {
      initForm();
    }
  },
);

watch(internalValue, (val) => {
  emit('update:modelValue', val);
});

const resetForm = () => {
  initForm();
};

const onSaveClick = async () => {
  const isValid = await formRef.value?.validate();
  if (isValid) {
    if (!isFormChanged.value) {
      $q.notify({
        type: 'warning',
        message: t('admin.registrantManagement.detail.editDialog.noChanges'),
        position: 'top',
      });
      return;
    }
    showConfirmDialog.value = true;
  } else {
    $q.notify({
      type: 'negative',
      message: t('admin.registrantManagement.detail.editDialog.invalidForm'),
      position: 'top',
    });
  }
};

const onConfirmSave = () => {
  showConfirmDialog.value = false;
  emit('save', { ...form.value });
  internalValue.value = false;
};
</script>

<style scoped lang="scss">
.edit-card-border {
  border: 1px solid var(--neutral-gray-light);
  border-radius: 12px;
  background-color: var(--neutral-50);
}

.input-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 4px;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 10px !important;
}

:deep(.address-input .q-field__control) {
  height: 110px !important;
}

.calendar-menu {
  border-radius: 12px;
  overflow: hidden;
}
</style>
