<template>
  <!-- ─── (2,1) ข้อมูลตัวตน 4 ฟิลด์ (ต่างกันตามไทย / ต่างชาติ) ─── -->
  <div class="identity-fields">
    <!-- ─── Thai: เลขบัตรประจำตัวประชาชน / Foreigner: Passport Number ─── -->
    <AppFormField
      v-if="isThai"
      v-model="nationalId"
      :label="t('profile.nationalId')"
      :placeholder="t('profile.nationalIdPlaceholder')"
      :readonly="isEditMode"
      :required="true"
      :rules="nationalIdRules"
      mask="#-####-#####-##-#"
      unmasked-value
      reserve-bottom-space
    />
    <AppFormField
      v-else
      v-model="nationalId"
      :label="t('profile.passportNo')"
      :placeholder="t('profile.passportPlaceholder')"
      :readonly="isEditMode"
      :required="true"
      :rules="[(val) => !!val || t('profile.requiredNationalId')]"
      reserve-bottom-space
    />

    <!-- ─── Nationality (Foreigner Only) ─── -->
    <AppFormField
      v-if="!isThai"
      v-model="country"
      :label="t('profile.nationality')"
      :placeholder="t('profile.nationalityPlaceholder')"
      :required="true"
      :rules="[(val) => !!val || t('profile.required')]"
      reserve-bottom-space
    />

    <!-- ─── Prefix (คำนำหน้า) ─── -->
    <AppFormField
      v-model="titleTH"
      type="select"
      :label="t('profile.prefix')"
      :options="
        TITLE_TH_OPTIONS.map((opt) => ({
          label: t(`profile.prefixes.${opt.i18nKey}`),
          value: opt.value,
        }))
      "
      @update:modelValue="onTitleTHChange"
      :required="true"
      :rules="[(val) => !!val || t('profile.requiredPrefix')]"
      reserve-bottom-space
    />

    <!-- ─── Thai: ชื่อ-นามสกุล (ไทย) — ซ่อนสำหรับต่างชาติ ─── -->
    <AppFormField
      v-if="isThai"
      v-model="fullName"
      :label="t('profile.fullName')"
      :required="true"
      :rules="[(val) => !!val || t('profile.requiredFullName')]"
      reserve-bottom-space
    />

    <!-- ─── Full Name (EN) ─── -->
    <AppFormField
      v-model="englishName"
      :label="t('profile.fullNameEn')"
      :placeholder="t('profile.fullNameEnPlaceholder')"
      :required="true"
      :rules="[(val) => !!val || t('profile.requiredFullNameEn')]"
      reserve-bottom-space
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { TITLE_TH_OPTIONS } from 'src/utils/form-options';
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
const englishName = defineModel<string>('englishName', { required: true });

const onTitleTHChange = (): void => {
  emit('title-th-change');
};

// ─── Validation: เลขบัตรประชาชน (ต้องครบ 13 หลัก, ตัวเลขเท่านั้น) ───
const NATIONAL_ID_LENGTH = 13;

const nationalIdRules = [
  // ห้ามว่าง
  (val: string | number | null | undefined) => !!val || t('profile.requiredNationalId'),
  // ต้องเป็นตัวเลข 0-9 เท่านั้น
  (val: string | number | null | undefined) =>
    /^\d+$/.test(String(val ?? '')) || t('profile.nationalIdDigitsOnly'),
  // ต้องมีความยาว 13 หลักพอดี
  (val: string | number | null | undefined) =>
    String(val ?? '').length === NATIONAL_ID_LENGTH || t('profile.nationalIdLength'),
];
</script>

<style scoped lang="scss">
.identity-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: var(--font-family-base);
}

// Deep select AppFormField labels to ensure perfect symmetry
:deep(.identity-fields > div > .text-body2) {
  min-height: 32px;
  display: flex;
  align-items: flex-end;
}
</style>
