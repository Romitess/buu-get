<template>
  <div class="q-gutter-y-sm">
    <!-- ─── Photo Upload Section ─── -->
    <div class="row q-col-gutter-sm q-mb-sm">
      <!-- Upload Box -->
      <div class="col-12 col-sm-4">
        <ImageUpload
          v-model="profileImage"
          folder="/user_images"
          :alt="t('profile.photoRequirementsTitle')"
          class="photo-upload-box"
        />
      </div>
      <!-- Requirements Box -->
      <div class="col-12 col-sm-8">
        <div class="requirements-card border rounded-borders q-pa-sm full-height bg-white">
          <div class="text-center text-weight-medium q-mb-xs text-subtitle2">
            {{ t('profile.photoRequirementsTitle') }}
          </div>
          <div class="row items-center">
            <div class="col-8">
              <ul class="requirements-list q-my-none text-caption">
                <li>{{ t('profile.photoReq1') }}</li>
                <li>{{ t('profile.photoReq2') }}</li>
                <li>{{ t('profile.photoReq3') }}</li>
                <li>{{ t('profile.photoReq4') }}</li>
                <li>{{ t('profile.photoReq5') }}</li>
                <li>{{ t('profile.photoReq6') }}</li>
              </ul>
            </div>
            <div class="col-4 flex column flex-center">
              <div class="sample-photo-container">
                <img
                  src="/sample-img.png"
                  :alt="t('profile.samplePhotoAlt')"
                  class="sample-photo-img"
                />
              </div>
              <div class="sample-photo-text text-caption q-mt-xs">
                {{ t('profile.samplePhoto') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Thai: เลขบัตรประจำตัวประชาชน / Foreigner: Passport Number ─── -->
    <AppFormField
      v-if="isThai"
      v-model="nationalId"
      :label="t('profile.nationalId')"
      :placeholder="t('profile.nationalIdPlaceholder')"
      :readonly="isEditMode"
      :rules="[(val) => !!val || t('profile.requiredNationalId')]"
      maxlength="13"
    />
    <AppFormField
      v-else
      v-model="nationalId"
      :label="t('profile.passportNo')"
      :placeholder="t('profile.passportPlaceholder')"
      :readonly="isEditMode"
      :rules="[(val) => !!val || t('profile.requiredNationalId')]"
    />

    <!-- ─── Nationality (Foreigner Only) ─── -->
    <AppFormField
      v-if="!isThai"
      v-model="country"
      :label="t('profile.nationality')"
      :placeholder="t('profile.nationalityPlaceholder')"
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
      @update:model-value="onTitleTHChange"
      :rules="[(val) => !!val || t('profile.requiredPrefix')]"
    />

    <!-- ─── Thai: ชื่อ-นามสกุล (ไทย) — ซ่อนสำหรับต่างชาติ ─── -->
    <AppFormField
      v-if="isThai"
      v-model="fullName"
      :label="t('profile.fullName')"
      :rules="[(val) => !!val || t('profile.requiredFullName')]"
    />

    <!-- ─── Full Name (EN) ─── -->
    <AppFormField
      v-model="englishName"
      :label="t('profile.fullNameEn')"
      :placeholder="t('profile.fullNameEnPlaceholder')"
      :rules="[(val) => !!val || t('profile.requiredFullNameEn')]"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { TITLE_TH_OPTIONS } from 'src/utils/form-options';
import AppFormField from 'src/components/base/app-form-field.vue';
import ImageUpload from 'src/components/base/image-upload.vue';

const { t } = useI18n();

defineProps<{
  isThai: boolean;
  isEditMode: boolean;
}>();

const emit = defineEmits(['title-th-change']);

const profileImage = defineModel<string>('profileImage', { required: true });
const nationalId = defineModel<string>('nationalId', { required: true });
const country = defineModel<string>('country', { required: true });
const titleTH = defineModel<string>('titleTH', { required: true });
const fullName = defineModel<string>('fullName', { required: true });
const englishName = defineModel<string>('englishName', { required: true });

const onTitleTHChange = (): void => {
  emit('title-th-change');
};
</script>

<style scoped lang="scss">
.photo-upload-box {
  aspect-ratio: 0.9 / 1;
  border-radius: var(--radius-sm);
}

.requirements-card {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.requirements-list {
  line-height: 1.35;
  list-style-type: none;
  padding-left: 0;
  font-size: 13.5px;
}

.sample-photo-text {
  font-size: 10px;
}

.sample-photo-container {
  width: 82px;
  aspect-ratio: 4 / 5;
  border-radius: var(--radius-xs);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.sample-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
