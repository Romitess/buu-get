<template>
  <div class="contact-column">
    <!-- กลุ่มบน: ข้อมูลการศึกษา -->
    <div class="contact-top-group">
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
    </div>

    <!-- กลุ่มล่าง: 4 ฟิลด์ที่จะตรงกับกลุ่ม Identity ของฝั่งซ้าย -->
    <div class="contact-bottom-group">
      <!-- ─── ชื่อสถานศึกษา ─── -->
      <AppFormField
        v-model="institution"
        :label="t('profile.institution')"
        :placeholder="t('profile.institutionPlaceholder')"
        :rules="[(val) => true]"
        reserve-bottom-space
      />

      <!-- ─── ที่อยู่สำหรับจัดส่งเอกสาร ─── -->
      <div class="manual-field-wrapper">
        <div class="field-label-row text-body2 text-weight-medium q-mb-xs">
          <div>
            {{ t('profile.address') }}
            <span class="text-negative">*</span>
          </div>
          <q-checkbox
            v-if="showAddressCheckbox"
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
        type="tel"
        :label="t('profile.phone')"
        :placeholder="t('profile.phonePlaceholder')"
        :required="true"
        :rules="[(val) => !!val || t('profile.requiredPhone')]"
        reserve-bottom-space
        maxlength="10"
      />

      <!-- ─── อีเมล (แสดงเฉพาะ ThaiD path) ─── -->
      <div v-if="showEmailField" class="manual-field-wrapper">
        <div class="field-label-row text-body2 text-weight-medium q-mb-xs">
          <div>
            {{ t('profile.email') }}
            <span class="text-negative">*</span>
          </div>
          <div class="email-helper text-caption text-weight-regular">
            {{ tr('profile.emailOtpHelper', 'ระบบจะส่งรหัส OTP ไปยังอีเมลของคุณเพื่อยืนยันตัวตน') }}
          </div>
        </div>
        <q-input
          :model-value="email"
          :placeholder="t('profile.emailPlaceholder')"
          outlined
          dense
          :rules="[
            (val) => !!val || t('profile.requiredEmail'),
            (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'รูปแบบอีเมลไม่ถูกต้อง',
          ]"
          lazy-rules
          :hide-bottom-space="false"
          class="custom-input"
          @update:model-value="(val) => emit('update:email', String(val ?? ''))"
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
  showEmailField?: boolean;
  showAddressCheckbox?: boolean;
}>();

const emit = defineEmits<{
  'update:email': [value: string];
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
  gap: 12px;
}

.contact-top-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-bottom-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-label-row {
  display: flex;
  align-items: flex-end; // Baseline the text to the input box
  justify-content: space-between;
  gap: 12px;
  min-height: 32px;
}

// Deep select AppFormField labels to ensure perfect symmetry
:deep(.contact-bottom-group > div > .text-body2) {
  min-height: 32px;
  display: flex;
  align-items: flex-end;
}

.id-card-address-checkbox {
  margin-top: -2px; // Align checkbox baseline with label text
  color: #777;
  font-size: 13px;
  white-space: nowrap;
}

.email-helper {
  margin-top: 2px; // Align helper baseline with label text
  color: #666;
  font-size: 13px;
  line-height: 1.3;
  text-align: right;
}

.calendar-menu {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

@media (max-width: 900px) {
  .contact-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .contact-top-group,
  .contact-bottom-group {
    grid-column: auto;
    grid-row: auto;
  }
}

@media (max-width: 600px) {
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
