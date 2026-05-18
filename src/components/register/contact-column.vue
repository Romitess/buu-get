<template>
  <div class="q-gutter-y-sm">
    <!-- ─── วันเกิด / Date of Birth ─── -->
    <div class="relative-position">
      <AppFormField
        v-model="birthdate"
        type="date"
        :label="t('profile.birthdate')"
        :rules="[(val) => !!val || t('profile.requiredBirthdate')]"
        @dblclick="showCalendar = true"
      >
        <!-- ไอคอนปฏิทินเรียกปฏิทินใหม่ -->
        <template #append-inner>
          <q-menu
            v-model="showCalendar"
            anchor="top left"
            self="bottom left"
            class="shadow-5 calendar-menu"
          >
            <AppCalendar
              :model-value="birthdate"
              @update:model-value="(val) => (birthdate = val)"
              @click-date="showCalendar = false"
            />
          </q-menu>
        </template>
      </AppFormField>
    </div>

    <!-- ─── ระดับการศึกษา / Highest Education ─── -->
    <AppFormField
      v-model="educationLevel"
      type="select"
      :label="t('profile.education')"
      :options="educationOptions"
      :rules="[(val) => !!val || t('profile.requiredEducation')]"
    />

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

    <!-- ─── เบอร์โทรศัพท์ ─── -->
    <AppFormField
      v-model="phone"
      type="tel"
      :label="t('profile.phone')"
      :placeholder="t('profile.phonePlaceholder')"
      :rules="[(val) => !!val || t('profile.requiredPhone')]"
      maxlength="10"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppFormField from 'src/components/base/app-form-field.vue';
import AppCalendar from 'src/components/app-calendar.vue';

const { t } = useI18n();
const showCalendar = ref(false);

const birthdate = defineModel<string>('birthdate', { required: true });
const educationLevel = defineModel<string>('educationLevel', { required: true });
const faculty = defineModel<string>('faculty', { required: true });
const institution = defineModel<string>('institution', { required: true });
const address = defineModel<string>('address', { required: true });
const phone = defineModel<string>('phone', { required: true });

const educationOptions = computed(() => [
  { label: t('profile.eduHighSchool'), value: 'มัธยมศึกษา' },
  { label: t('profile.eduBachelor'), value: 'ปริญญาตรี' },
  { label: t('profile.eduMaster'), value: 'ปริญญาโท' },
  { label: t('profile.eduDoctor'), value: 'ปริญญาเอก' },
]);
</script>

<style scoped lang="scss">
.calendar-menu {
  border-radius: var(--radius-lg);
  overflow: hidden;
}
</style>
