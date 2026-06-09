<template>
  <!-- ─── (1,2) วันเกิด / ระดับการศึกษา / คณะ-สาขา ─── -->
  <div class="education-section">
    <!-- 1. วันเดือนปีเกิด -->
    <div class="relative-position">
      <AppFormField
        v-model="birthdate"
        type="date"
        :label="t('profile.birthdate')"
        :placeholder="t('profile.birthdatePlaceholder')"
        :required="true"
        :rules="[(val) => !!val || t('profile.requiredBirthdate')]"
        reserve-bottom-space
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
              v-model="birthdate"
              :max-date="yesterdayString"
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
      :placeholder="t('profile.education')"
      reserve-bottom-space
    />

    <!-- ─── คณะ/สาขาวิชา ─── -->
    <AppFormField
      v-model="faculty"
      :label="t('profile.faculty')"
      :placeholder="t('profile.facultyPlaceholder')"
      reserve-bottom-space
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppFormField from 'src/components/base/app-form-field.vue';
import AppCalendar from 'src/components/shared/app-calendar.vue';

const { t } = useI18n();
const showCalendar = ref(false);

const yesterdayString = computed(() => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
});

const birthdate = defineModel<string>('birthdate', { required: true });
const educationLevel = defineModel<string>('educationLevel', { required: true });
const faculty = defineModel<string>('faculty', { required: true });

const educationOptions = computed(() => [
  { label: t('profile.eduHighSchool'), value: 'มัธยมศึกษา' },
  { label: t('profile.eduBachelor'), value: 'ปริญญาตรี' },
  { label: t('profile.eduMaster'), value: 'ปริญญาโท' },
  { label: t('profile.eduDoctor'), value: 'ปริญญาเอก' },
]);
</script>

<style scoped lang="scss">
.education-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: var(--font-family-base);
}

.calendar-menu {
  border-radius: var(--radius-lg);
  overflow: hidden;
}
</style>
