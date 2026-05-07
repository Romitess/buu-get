<template>
  <div class="q-gutter-y-sm">
    <!-- ─── Thai: เลขบัตรประจำตัวประชาชน / Foreigner: Passport Number ─── -->
    <AppFormField
      v-if="isThai"
      v-model="nationalId"
      :label="t('profile.nationalId')"
      :placeholder="t('profile.nationalIdPlaceholder')"
      :readonly="isEditMode"
      :rules="[(val) => !!val || t('profile.requiredNationalId')]"
    />
    <AppFormField
      v-else
      v-model="nationalId"
      :label="t('profile.passportNo')"
      :placeholder="t('profile.passportPlaceholder')"
      :readonly="isEditMode"
      :rules="[(val) => !!val || t('profile.requiredNationalId')]"
    />

    <!-- ─── Thai: คำนำหน้า (ไทย) / Foreigner: Nationality ─── -->
    <AppFormField
      v-if="isThai"
      v-model="titleTH"
      type="select"
      :label="t('profile.prefix')"
      :options="TITLE_TH_OPTIONS"
      @update:model-value="onTitleTHChange"
      :rules="[(val) => !!val || t('profile.requiredPrefix')]"
    />
    <AppFormField
      v-else
      v-model="country"
      :label="t('profile.nationality')"
      placeholder="American"
    />

    <!-- ─── Thai: ชื่อ-นามสกุล (ไทย) — ซ่อนสำหรับต่างชาติ ─── -->
    <AppFormField
      v-if="isThai"
      v-model="fullName"
      :label="t('profile.fullName')"
      :rules="[(val) => !!val || t('profile.requiredFullName')]"
    />

    <!-- ─── Prefixes (EN) ─── -->
    <AppFormField
      v-if="isThai"
      v-model="titleEN"
      :label="t('profile.prefixEn')"
      readonly
      input-class="bg-grey-2"
    />
    <AppFormField
      v-else
      v-model="titleEN"
      type="select"
      :label="t('profile.prefixEn')"
      :options="TITLE_EN_OPTIONS"
      :rules="[(val) => !!val || t('profile.requiredPrefixEn')]"
    />

    <!-- ─── Full Name (EN) ─── -->
    <AppFormField
      v-model="englishName"
      :label="t('profile.fullNameEn')"
      :placeholder="t('profile.fullNameEnPlaceholder')"
      :rules="[(val) => !!val || t('profile.requiredFullNameEn')]"
    />

    <!-- ─── วันเกิด / Date of Birth ─── -->
    <AppFormField
      v-model="birthdate"
      type="date"
      :label="t('profile.birthdate')"
      :rules="[(val) => !!val || t('profile.requiredBirthdate')]"
    />

    <!-- ─── ระดับการศึกษา / Highest Education ─── -->
    <AppFormField
      v-model="educationLevel"
      type="select"
      :label="t('profile.education')"
      :options="educationOptions"
      :rules="[(val) => !!val || t('profile.requiredEducation')]"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { TITLE_TH_OPTIONS, TITLE_EN_OPTIONS } from 'src/utils/form-options';
import AppFormField from 'src/components/base/app-form-field.vue';

const { t } = useI18n();

defineProps<{
  isThai: boolean;
  isEditMode: boolean;
}>();

const emit = defineEmits(['title-th-change']);

const nationalId = defineModel<string>('nationalId', { required: true });
const country = defineModel<string>('country', { required: true });
const titleTH = defineModel<string>('titleTH', { required: true });
const fullName = defineModel<string>('fullName', { required: true });
const titleEN = defineModel<string>('titleEN', { required: true });
const englishName = defineModel<string>('englishName', { required: true });
const birthdate = defineModel<string>('birthdate', { required: true });
const educationLevel = defineModel<string>('educationLevel', { required: true });

const onTitleTHChange = (): void => {
  emit('title-th-change');
};

const educationOptions = computed(() => [
  { label: t('profile.eduHighSchool'), value: 'มัธยมศึกษา' },
  { label: t('profile.eduBachelor'), value: 'ปริญญาตรี' },
  { label: t('profile.eduMaster'), value: 'ปริญญาโท' },
  { label: t('profile.eduDoctor'), value: 'ปริญญาเอก' },
]);
</script>
