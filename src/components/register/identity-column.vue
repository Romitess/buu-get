<template>
  <div class="identity-column">
    <!-- ─── Photo Section (Top) ─── -->
    <div class="identity-top-group">
      <div class="photo-section">
        <!-- Upload Box -->
        <div class="photo-upload-cell">
          <ImageUpload
            v-model="profileImage"
            folder="/user_images"
            :alt="t('profile.photoRequirementsTitle')"
            class="photo-upload-box"
          />
        </div>
        <!-- Requirements Box -->
        <div class="requirements-cell">
          <div class="requirements-card bg-white">
            <div class="requirements-title">
              {{ t('profile.photoRequirementsTitle') }}
            </div>
            <div class="requirements-content">
              <div class="requirements-copy">
                <ul class="requirements-list">
                  <li>{{ t('profile.photoReq1') }}</li>
                  <li>{{ t('profile.photoReq2') }}</li>
                  <li>{{ t('profile.photoReq3') }}</li>
                  <li>{{ t('profile.photoReq4') }}</li>
                  <li>{{ t('profile.photoReq5') }}</li>
                  <li>{{ t('profile.photoReq6') }}</li>
                </ul>
              </div>
              <div class="requirements-sample">
                <div class="sample-photo-container">
                  <img
                    src="/sample-img.png"
                    :alt="t('profile.samplePhotoAlt')"
                    class="sample-photo-img"
                  />
                </div>
                <div class="sample-photo-text">
                  {{ t('profile.samplePhoto') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Identity Fields (Bottom 4) ─── -->
    <div class="identity-bottom-group">
      <!-- ─── Thai: เลขบัตรประจำตัวประชาชน / Foreigner: Passport Number ─── -->
      <AppFormField
        v-if="isThai"
        v-model="nationalId"
        :label="t('profile.nationalId')"
        :placeholder="t('profile.nationalIdPlaceholder')"
        :readonly="isEditMode"
        :required="true"
        :rules="[(val) => !!val || t('profile.requiredNationalId')]"
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
        @update:model-value="onTitleTHChange"
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
.identity-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: var(--font-family-base);
}

.identity-bottom-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// Deep select AppFormField labels to ensure perfect symmetry
:deep(.identity-bottom-group > div > .text-body2) {
  min-height: 32px;
  display: flex;
  align-items: flex-end;
}

.photo-section {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 18px;
}

.photo-upload-cell,
.requirements-cell {
  min-width: 0;
}

.photo-upload-box {
  width: 100%;
  height: 282px;
  border-radius: var(--radius-sm);
}

.requirements-card {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  min-height: 282px;
  padding: 34px 28px 20px;
}

.requirements-title {
  margin-bottom: 14px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.requirements-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 138px;
  align-items: center;
  gap: 22px;
}

.requirements-copy {
  min-width: 0;
}

.requirements-list {
  margin: 0;
  list-style-type: none;
  padding-left: 0;
  font-size: 14px;
  line-height: 1.65;
}

.requirements-sample {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sample-photo-text {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.2;
}

.sample-photo-container {
  width: 138px;
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

@media (max-width: 1200px) {
  .photo-section {
    grid-template-columns: 180px minmax(0, 1fr);
  }

  .photo-upload-box,
  .requirements-card {
    height: 220px;
    min-height: 220px;
  }

  .requirements-card {
    padding: 18px 16px 14px;
  }

  .requirements-content {
    grid-template-columns: minmax(0, 1fr) 96px;
    gap: 14px;
  }

  .requirements-list {
    font-size: 11px;
  }

  .sample-photo-container {
    width: 96px;
  }
}

@media (max-width: 900px) {
  .identity-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .identity-top-group,
  .identity-bottom-group {
    grid-column: auto;
    grid-row: auto;
  }
}

@media (max-width: 600px) {
  .photo-section {
    grid-template-columns: 1fr;
  }

  .photo-upload-box {
    max-width: 240px;
  }
}
</style>
