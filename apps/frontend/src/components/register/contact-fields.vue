<template>
  <!-- ─── (2,2) สถานศึกษา / ที่อยู่จัดส่ง / เบอร์โทร (+ ThaiD: checkbox + อีเมล OTP) ─── -->
  <div class="contact-fields">
    <!-- ─── ชื่อสถานศึกษา ─── -->
    <AppFormField
      v-model="institution"
      :label="t('profile.institution')"
      :placeholder="t('profile.institutionPlaceholder')"
      :rules="[() => true]"
      reserve-bottom-space
    />

    <!-- ─── ที่อยู่สำหรับจัดส่งเอกสาร ─── -->
    <div class="manual-field-wrapper address-wrapper">
      <div class="field-label-row text-body2 text-weight-medium q-mb-xs field-label">
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
        :type="!showEmailField ? 'textarea' : 'text'"
        :placeholder="t('profile.addressPlaceholder')"
        outlined
        dense
        lazy-rules
        :rules="[
          (val) => !!String(val ?? '').trim() || t('profile.requiredAddress'),
        ]"
        :hide-bottom-space="false"
        class="custom-input"
        :class="{ 'expanded-address': !showEmailField }"
      />
    </div>

    <!-- ─── เบอร์โทรศัพท์ ─── -->
    <AppFormField
      v-model="phone"
      type="tel"
      :label="t('profile.phone')"
      :placeholder="t('profile.phonePlaceholder')"
      :required="true"
      :rules="[(val: string | number | null | undefined) => !!val || t('profile.requiredPhone')]"
      reserve-bottom-space
      mask="###-###-####"
      unmasked-value
    />

    <!-- ─── อีเมล (แสดงเฉพาะ ThaiD path) ─── -->
    <div v-if="showEmailField" class="manual-field-wrapper email-wrapper">
      <div class="field-label-row text-body2 text-weight-medium q-mb-xs field-label">
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
          (val) =>
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ||
            tr('profile.invalidEmail', 'รูปแบบอีเมลไม่ถูกต้อง'),
        ]"
        lazy-rules
        :hide-bottom-space="false"
        class="custom-input"
        @update:model-value="(val) => emit('update:email', String(val ?? ''))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppFormField from 'src/components/base/app-form-field.vue';

const i18n = useI18n();
const { t } = i18n;
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

const institution = defineModel<string>('institution', { required: true });
const address = defineModel<string | null>('address', { required: true });
const phone = defineModel<string>('phone', { required: true });
</script>

<style scoped lang="scss">
.contact-fields {
  display: flex;
  flex-direction: column;
  gap: 12px; // ให้เท่ากับ identity-fields (2,1)
  font-family: var(--font-family-base);
}

.field-label-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  min-height: 21px;
}

// Deep select AppFormField labels to ensure perfect symmetry
:deep(.contact-fields > div > .text-body2) {
  min-height: 32px;
  display: flex;
  align-items: flex-end;
}

.address-wrapper,
.email-wrapper {
  margin-top: -3px;
}

.id-card-address-checkbox {
  margin-top: -2px;
  color: #777;
  font-size: 13px;
  white-space: nowrap;
}

.email-helper {
  margin-top: 2px;
  color: #666;
  font-size: 13px;
  line-height: 1.3;
  text-align: right;
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

.expanded-address {
  :deep(.q-field__control) {
    height: 135px !important;
    align-items: flex-start;
  }
  :deep(textarea) {
    resize: none;
    padding-top: 5px;
    min-height: 95px;
  }
}
</style>
