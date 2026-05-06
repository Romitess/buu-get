<template>
  <div class="q-gutter-y-md">
    <!-- ─── คณะ/สาขาวิชา ─── -->
    <div>
      <div class="text-body2 text-weight-medium q-mb-xs">{{ t('profile.faculty') }}</div>
      <q-input
        v-model="faculty"
        :placeholder="t('profile.facultyPlaceholder')"
        outlined
        dense
        class="custom-input"
      />
    </div>

    <!-- ─── ชื่อสถานศึกษา ─── -->
    <div>
      <div class="text-body2 text-weight-medium q-mb-xs">{{ t('profile.institution') }}</div>
      <q-input
        v-model="institution"
        :placeholder="t('profile.institutionPlaceholder')"
        outlined
        dense
        class="custom-input"
      />
    </div>

    <!-- ─── ที่อยู่สำหรับจัดส่งเอกสาร ─── -->
    <div>
      <div class="text-body2 text-weight-medium q-mb-xs">{{ t('profile.address') }}</div>
      <q-input
        v-model="address"
        type="textarea"
        :placeholder="t('profile.addressPlaceholder')"
        outlined
        dense
        rows="3"
        class="custom-input"
      />
    </div>

    <!-- ─── จังหวัด ─── -->
    <div>
      <div class="text-body2 text-weight-medium q-mb-xs">{{ t('profile.province') }}</div>
      <q-input
        v-model="province"
        :placeholder="t('profile.provincePlaceholder')"
        outlined
        dense
        class="custom-input"
      />
    </div>

    <!-- ─── รหัสไปรษณีย์ ─── -->
    <div>
      <div class="text-body2 text-weight-medium q-mb-xs">{{ t('profile.zipCode') }}</div>
      <q-input
        v-model="zipCode"
        :placeholder="t('profile.zipCodePlaceholder')"
        outlined
        dense
        class="custom-input"
      />
    </div>

    <!-- ─── เบอร์โทรศัพท์ ─── -->
    <div>
      <div class="text-body2 text-weight-medium q-mb-xs">{{ t('profile.phone') }}</div>
      <q-input
        v-model="phone"
        type="tel"
        :placeholder="t('profile.phonePlaceholder')"
        outlined
        dense
        :rules="[(val) => !!val || t('profile.requiredPhone')]"
        class="custom-input"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const faculty = defineModel<string>('faculty', { required: true });
const institution = defineModel<string>('institution', { required: true });
const address = defineModel<string>('address', { required: true });
const province = defineModel<string>('province', { required: true });
const zipCode = defineModel<string>('zipCode', { required: true });
const phone = defineModel<string>('phone', { required: true });
</script>
