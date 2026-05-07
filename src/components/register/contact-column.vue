<template>
  <div class="q-gutter-y-sm">
    <!-- ─── คณะ/สาขาวิชา ─── -->
    <AppFormField
      v-model="faculty"
      :label="t('profile.faculty')"
      :placeholder="t('profile.facultyPlaceholder')"
    />

    <!-- ─── ชื่อสถานศึกษา ─── -->
    <AppFormField
      v-model="institution"
      :label="t('profile.institution')"
      :placeholder="t('profile.institutionPlaceholder')"
    />

    <!-- ─── ที่อยู่สำหรับจัดส่งเอกสาร ─── -->
    <AppFormField
      v-model="address"
      type="textarea"
      :label="t('profile.address')"
      :placeholder="t('profile.addressPlaceholder')"
    />

    <!-- ─── จังหวัด ─── -->
    <AppFormField
      v-model="province"
      :label="t('profile.province')"
      :placeholder="t('profile.provincePlaceholder')"
    />

    <!-- ─── รหัสไปรษณีย์ ─── -->
    <AppFormField
      v-model="zipCode"
      :label="t('profile.zipCode')"
      :placeholder="t('profile.zipCodePlaceholder')"
    />

    <!-- ─── เบอร์โทรศัพท์ ─── -->
    <AppFormField
      v-model="phone"
      type="tel"
      :label="t('profile.phone')"
      :placeholder="t('profile.phonePlaceholder')"
      :rules="[(val) => !!val || t('profile.requiredPhone')]"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AppFormField from 'src/components/base/app-form-field.vue';

const { t } = useI18n();

const faculty = defineModel<string>('faculty', { required: true });
const institution = defineModel<string>('institution', { required: true });
const address = defineModel<string>('address', { required: true });
const province = defineModel<string>('province', { required: true });
const zipCode = defineModel<string>('zipCode', { required: true });
const phone = defineModel<string>('phone', { required: true });
</script>
