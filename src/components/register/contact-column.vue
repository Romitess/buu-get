<template>
  <div class="contact-column">
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
            <AppCalendar v-model="birthdate" @click-date="showCalendar = false" />
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
      :required="true"
      :rules="[(val) => !!val || t('profile.requiredEducation')]"
      reserve-bottom-space
    />

    <!-- ─── คณะ/สาขาวิชา ─── -->
    <AppFormField
      v-model="faculty"
      :label="t('profile.faculty')"
      :placeholder="t('profile.facultyPlaceholder')"
      reserve-bottom-space
    />

    <div class="contact-lower-group">
      <!-- ─── ชื่อสถานศึกษา ─── -->
      <AppFormField
        v-model="institution"
        :label="t('profile.institution')"
        :placeholder="t('profile.institutionPlaceholder')"
        reserve-bottom-space
      />

      <!-- ─── ที่อยู่สำหรับจัดส่งเอกสาร ─── -->
      <div class="address-field">
        <div class="field-label-row">
          <div class="text-body2 text-weight-medium">
            {{ t('profile.address') }}
            <span class="text-negative">*</span>
          </div>
          <q-checkbox
            v-model="useIdCardAddress"
            dense
            size="sm"
            class="id-card-address-checkbox"
            :label="tr('profile.useIdCardAddress', 'ใช้ที่อยู่ตามบัตรประชาชน')"
          />
        </div>
        <q-input
          v-model="address"
          :placeholder="t('profile.addressPlaceholder')"
          outlined
          dense
          :rules="[(val) => !!val || t('profile.required')]"
          :hide-bottom-space="false"
          class="custom-input"
        />
      </div>

      <!-- ─── เบอร์โทรศัพท์ ─── -->
      <AppFormField
        v-model="phone"
        class="phone-field"
        type="tel"
        :label="t('profile.phone')"
        :placeholder="t('profile.phonePlaceholder')"
        :required="true"
        :rules="[(val) => !!val || t('profile.requiredPhone')]"
        reserve-bottom-space
        maxlength="10"
      />

      <div>
        <div class="field-label-row">
          <div class="text-body2 text-weight-medium">
            {{ t('profile.email') }}
            <span class="text-negative">*</span>
          </div>
          <div class="email-helper">
            {{ tr('profile.emailOtpHelper', 'ระบบจะส่งรหัส OTP ไปยังอีเมลของคุณเพื่อยืนยันตัวตน') }}
          </div>
        </div>
        <q-input
          :model-value="email"
          :placeholder="t('profile.emailPlaceholder')"
          outlined
          dense
          readonly
          :hide-bottom-space="false"
          class="custom-input"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppFormField from 'src/components/base/app-form-field.vue';
import AppCalendar from 'src/components/shared/app-calendar.vue';

const i18n = useI18n();
const { t } = i18n;
const showCalendar = ref(false);
const useIdCardAddress = ref(false);

const tr = (key: string, fallback: string): string => (i18n.te(key) ? t(key) : fallback);

defineProps<{
  email: string;
}>();

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
.contact-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.id-card-address-checkbox {
  color: #777;
  font-size: 13px;
  white-space: nowrap;
}

.phone-field {
  margin-top: 14px;
  margin-bottom: -10px;
}

.email-helper {
  color: #666;
  font-size: 13px;
  line-height: 1.3;
  text-align: right;
}

.address-field {
  margin-top: 14px;
  margin-bottom: -6px;
}

.contact-lower-group {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 15px;
}

.calendar-menu {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

@media (max-width: 1200px) {
  .contact-lower-group {
    gap: 14px;
    margin-top: 11px;
  }
}

@media (max-width: 600px) {
  .contact-lower-group {
    margin-top: 0;
  }

  .field-label-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .email-helper {
    text-align: left;
  }
}
</style>
