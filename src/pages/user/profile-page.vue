<template>
  <div class="page-container profile-page q-pa-lg">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('profile.pageTitleEdit')"
      :subtitle="$t('profile.pageSubtitleEdit')"
    />

    <Transition name="fade">
      <div
        v-if="isFromEmail || userStore.currentUser?.remark"
        class="q-mb-md q-pa-md row no-wrap items-center fix-alert-banner shadow-sm"
      >
        <q-icon name="report_problem" color="warning" size="md" class="q-mr-md" />
        <div>
          <div class="text-weight-bold text-subtitle1 text-warning q-mb-xs">
            {{ $t('profile.fixAlertTitle') }}
          </div>
          <div class="text-body2 text-grey-8">
            {{
              userStore.currentUser?.remark
                ? `${$t('profile.fixReasonLabel')} ${userStore.currentUser.remark}`
                : $t('profile.fixAlertDesc')
            }}
          </div>
        </div>
      </div>
    </Transition>

    <q-form ref="formRef">
      <q-card class="user-profile-card q-pa-lg q-mb-md" flat>
        <div class="row q-col-gutter-xl">
          <div class="col-12 col-md-3 flex column flex-center relative-position">
            <div class="avatar-container q-mb-md cursor-pointer" @click="triggerFileInput">
              <q-avatar size="160px" class="profile-avatar">
                <img :src="avatarSrc" alt="Avatar" class="profile-avatar-img" />
                <q-inner-loading :showing="isUploading">
                  <q-spinner-gears size="50px" color="primary" />
                </q-inner-loading>
              </q-avatar>
              <q-btn
                round
                color="grey-3"
                text-color="dark"
                icon="edit"
                size="sm"
                class="avatar-edit-btn"
                unelevated
                :loading="isUploading"
                @click.stop="triggerFileInput"
              />
              <q-file
                ref="fileInputRef"
                v-model="selectedFile"
                @update:model-value="handleFileSelected"
                accept=".jpg,.jpeg,.png"
                max-file-size="5242880"
                style="display: none"
              />
            </div>
            <div class="text-weight-medium text-body1">
              {{ $t('profile.testTakerId') }}:
              {{ userStore.currentUser?.nationalId || '66100001' }}
            </div>
          </div>

          <div class="col-12 col-md-9">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <div class="row justify-between items-center q-mb-xs">
                  <label class="form-label"
                    >{{ $t('profile.email') }} <span class="text-negative">*</span></label
                  >
                  <a
                    href="#"
                    @click.prevent="showPasswordDialog = true"
                    class="text-primary text-caption text-weight-medium no-wrap"
                    style="text-decoration: none"
                  >
                    {{ $t('profile.pageTitleEditPassword') }}
                  </a>
                </div>
                <q-input v-model="formData.email" outlined dense bg-color="white" />
              </div>
              <div class="col-12 col-md-6 relative-position">
                <label class="form-label"
                  >{{ $t('profile.prefix') }} <span class="text-negative">*</span></label
                >
                <q-select
                  ref="titleSelectRef"
                  v-model="formData.title"
                  :options="titleOptions"
                  outlined
                  dense
                  bg-color="white"
                  dropdown-icon="expand_more"
                  emit-value
                  map-options
                  lazy-rules
                  :rules="[(val) => !!val || $t('profile.requiredPrefix')]"
                  hide-bottom-space
                />
              </div>

              <!-- Row 2 -->
              <div class="col-12 col-md-6 relative-position">
                <label class="form-label"
                  >{{ $t('profile.nationalId') }} <span class="text-negative">*</span></label
                >
                <q-input
                  ref="nationalIdInputRef"
                  v-model="formData.nationalId"
                  outlined
                  dense
                  bg-color="white"
                  mask="#-####-#####-##-#"
                  unmasked-value
                  lazy-rules
                  :rules="[
                    (val) => !!val || $t('profile.requiredNationalId'),
                    (val) => !val || val.length === 13 || $t('profile.invalidNationalId'),
                  ]"
                  hide-bottom-space
                />
              </div>
              <div class="col-12 col-md-6 relative-position">
                <label class="form-label"
                  >{{ $t('profile.fullName') }} <span class="text-negative">*</span></label
                >
                <q-input
                  ref="fullNameTHInputRef"
                  v-model="formData.fullNameTH"
                  outlined
                  dense
                  bg-color="white"
                  lazy-rules
                  :rules="[(val) => !!val || $t('profile.requiredFullName')]"
                  hide-bottom-space
                />
              </div>

              <!-- Row 3 -->
              <div class="col-12 col-md-6 relative-position">
                <label class="form-label"
                  >{{ $t('profile.birthdate') }} <span class="text-negative">*</span></label
                >
                <q-input
                  ref="birthdateInputRef"
                  v-model="birthdateDisplay"
                  outlined
                  dense
                  bg-color="white"
                  readonly
                  class="cursor-pointer"
                  @click="showCalendar = true"
                  lazy-rules
                  :rules="[(val) => !!val || $t('profile.requiredBirthdate')]"
                  hide-bottom-space
                >
                  <template v-slot:append>
                    <q-icon
                      name="calendar_today"
                      class="cursor-pointer"
                      size="xs"
                      @click.stop="showCalendar = true"
                    />
                    <q-menu
                      v-model="showCalendar"
                      anchor="bottom left"
                      self="top left"
                      class="shadow-5 calendar-menu"
                    >
                      <AppCalendar
                        :model-value="formData.birthdate"
                        @update:model-value="(val: string) => (formData.birthdate = val)"
                        @click-date="showCalendar = false"
                      />
                    </q-menu>
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-md-6 relative-position">
                <label class="form-label"
                  >{{ $t('profile.fullNameEn') }} <span class="text-negative">*</span></label
                >
                <q-input
                  ref="fullNameENInputRef"
                  v-model="formData.fullNameEN"
                  outlined
                  dense
                  bg-color="white"
                  lazy-rules
                  :rules="[(val) => !!val || $t('profile.requiredFullNameEn')]"
                  hide-bottom-space
                />
              </div>
            </div>
          </div>
        </div>
      </q-card>

      <!-- Card 2: Contact & Education Info -->
      <q-card class="user-profile-card q-pa-lg q-mb-md" flat>
        <div class="row q-col-gutter-xl">
          <!-- Left Column: Education, Faculty, Institution -->
          <div class="col-12 col-md-6">
            <div class="q-mb-md relative-position">
              <label class="form-label">{{ $t('profile.education') }}</label>
              <q-select
                ref="educationLevelSelectRef"
                v-model="formData.educationLevel"
                :options="educationOptions"
                outlined
                dense
                bg-color="white"
                dropdown-icon="expand_more"
                emit-value
                map-options
              />
            </div>
            <div class="q-mb-md relative-position">
              <label class="form-label">{{ $t('profile.faculty') }}</label>
              <q-input
                ref="facultyInputRef"
                v-model="formData.faculty"
                outlined
                dense
                bg-color="white"
              />
            </div>
            <div class="relative-position">
              <label class="form-label">{{ $t('profile.institution') }}</label>
              <q-input
                ref="institutionInputRef"
                v-model="formData.institution"
                outlined
                dense
                bg-color="white"
              />
            </div>
          </div>

          <!-- Right Column: Address, Phone -->
          <div class="col-12 col-md-6">
            <div class="q-mb-md relative-position">
              <label class="form-label"
                >{{ $t('profile.address') }} <span class="text-negative">*</span></label
              >
              <q-input
                ref="addressInputRef"
                v-model="formData.address"
                type="textarea"
                outlined
                dense
                bg-color="white"
                class="address-textarea"
                input-style="resize: none;"
                lazy-rules
                :rules="[(val) => !!val || $t('profile.required')]"
                hide-bottom-space
              />
            </div>
            <div class="relative-position">
              <label class="form-label"
                >{{ $t('profile.phone') }} <span class="text-negative">*</span></label
              >
              <q-input
                ref="phoneInputRef"
                v-model="formData.phone"
                outlined
                dense
                bg-color="white"
                mask="###-###-####"
                unmasked-value
                lazy-rules
                :rules="[
                  (val) => !!val || $t('profile.requiredPhone'),
                  (val) =>
                    !val || val.replace(/\D/g, '').length === 10 || $t('profile.invalidPhone'),
                ]"
                hide-bottom-space
              />
            </div>
          </div>
        </div>
      </q-card>
    </q-form>

    <!-- Action Buttons -->
    <div class="row justify-end q-gutter-md">
      <q-btn
        unelevated
        :label="$t('profile.cancel')"
        color="grey-3"
        text-color="dark"
        class="action-btn text-weight-bold"
        @click="onCancel"
      />
      <q-btn
        unelevated
        :label="$t('profile.save')"
        color="primary"
        class="action-btn text-weight-bold"
        @click="onSave"
      />
    </div>

    <!-- Password Dialog -->
    <q-dialog v-model="showPasswordDialog" persistent>
      <q-card style="min-width: 400px; border-radius: 16px; padding: 12px">
        <q-card-section class="row items-center q-pb-none justify-between">
          <div class="text-h6 text-weight-bold">
            {{ $t('profile.pageTitleEditPassword') }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-py-md">
          <div class="q-mb-md">
            <label class="form-label"
              >{{ $t('profile.currentPassword') }} <span class="text-negative">*</span></label
            >
            <q-input
              v-model="currentPassword"
              type="password"
              outlined
              dense
              bg-color="white"
              placeholder=""
            />
          </div>
          <div class="q-mb-md">
            <label class="form-label"
              >{{ $t('profile.newPassword') }} <span class="text-negative">*</span></label
            >
            <q-input
              v-model="newPassword"
              type="password"
              outlined
              dense
              bg-color="white"
              placeholder=""
            />
          </div>
        </q-card-section>

        <q-card-actions align="center" class="q-pt-none q-pb-md">
          <q-btn
            unelevated
            :label="$t('profile.cancel')"
            color="grey-3"
            text-color="dark"
            style="border-radius: 8px; width: 120px"
            class="text-weight-bold"
            v-close-popup
          />
          <q-btn
            unelevated
            :label="$t('profile.confirm')"
            color="primary"
            style="border-radius: 8px; width: 120px"
            class="text-weight-bold"
            @click="onSavePassword"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showCropDialog" persistent>
      <AppImageCropper
        :image-src="cropImageSrc"
        :file-type="cropFileType"
        @confirm="onCropConfirm"
      />
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { ComputedRef, WritableComputedRef } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from 'src/stores/user.store';
import { useQuasar } from 'quasar';
import type { QForm } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppCalendar from 'src/components/shared/app-calendar.vue';
import { TITLE_TH_OPTIONS, EDUCATION_LEVEL_OPTIONS } from 'src/utils/form-options';
import AppImageCropper from 'src/components/shared/app-image-cropper.vue';
import * as userService from 'src/services/user.service';
import { useImageUpload } from 'src/composables/use-image-upload';
import defaultUserImage from 'src/assets/img/user-image.jpg';
import { getImageUrl } from 'src/services/image.service';
import { api } from 'src/boot/axios';
import { useFocusFirstInvalidField } from 'src/composables/use-focus-first-invalid-field';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const $q = useQuasar();
const { t } = useI18n();

const isFromEmail: ComputedRef<boolean> = computed<boolean>(() => route.query.from === 'email');

const showPasswordDialog = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const showCalendar = ref(false);
const showCropDialog = ref(false);
const cropImageSrc = ref('');
const cropFileType = ref('image/png');

const formRef = ref<QForm | null>(null);
const { validateAndFocusFirstInvalid } = useFocusFirstInvalidField(formRef);
const fileInputRef = ref();
const selectedFile = ref<File | null>(null);

const titleSelectRef = ref();
const nationalIdInputRef = ref();
const fullNameTHInputRef = ref();
const birthdateInputRef = ref();
const fullNameENInputRef = ref();
const educationLevelSelectRef = ref();
const facultyInputRef = ref();
const institutionInputRef = ref();
const addressInputRef = ref();
const phoneInputRef = ref();

const avatarSrc = computed<string>(() => {
  const path = formData.value.userImagePath;
  if (path) {
    return getImageUrl(path);
  }
  return defaultUserImage;
});

const { isUploading, handleImageUpload } = useImageUpload({
  onSuccess: (imagePath: string) => {
    formData.value.userImagePath = imagePath;
    selectedFile.value = null;
    $q.notify({
      type: 'positive',
      message: t('profile.uploadSuccess'),
      position: 'top',
    });
  },
  onError: (err) => {
    $q.notify({
      type: 'negative',
      message: err.message || t('profile.uploadError'),
      position: 'top',
    });
  },
});

const triggerFileInput = (): void => {
  fileInputRef.value?.pickFiles();
};

const handleFileSelected = (file: File | null): void => {
  if (!file) return;
  cropFileType.value = file.type;
  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result) {
      cropImageSrc.value = e.target.result as string;
      showCropDialog.value = true;
      selectedFile.value = null;
    }
  };
  reader.readAsDataURL(file);
};

const onCropConfirm = async (croppedFile: File): Promise<void> => {
  showCropDialog.value = false;
  try {
    await handleImageUpload(croppedFile, '/user_images');
  } catch (error) {
    console.error('Error uploading image:', error);
  }
};

interface ProfileFormData {
  email: string;
  title: string;
  nationalId: string;
  fullNameTH: string;
  birthdate: string;
  fullNameEN: string;
  educationLevel: string;
  faculty: string;
  institution: string;
  address: string;
  phone: string;
  userImagePath?: string | undefined;
}

const formData = ref<ProfileFormData>({
  email: '',
  title: TITLE_TH_OPTIONS[0].value,
  nationalId: '',
  fullNameTH: '',
  birthdate: '',
  fullNameEN: '',
  educationLevel: EDUCATION_LEVEL_OPTIONS[1],
  faculty: '',
  institution: '',
  address: '',
  phone: '',
  userImagePath: undefined,
});

const titleOptions: ComputedRef<{ label: string; value: string }[]> = computed<
  { label: string; value: string }[]
>(() =>
  TITLE_TH_OPTIONS.map((opt) => ({
    label: t(`profile.prefixes.${opt.i18nKey}`),
    value: opt.value,
  })),
);

const educationOptions: ComputedRef<{ label: string; value: string }[]> = computed<
  { label: string; value: string }[]
>(() => [
  { label: t('profile.eduHighSchool'), value: EDUCATION_LEVEL_OPTIONS[0] },
  { label: t('profile.eduBachelor'), value: EDUCATION_LEVEL_OPTIONS[1] },
  { label: t('profile.eduMaster'), value: EDUCATION_LEVEL_OPTIONS[2] },
  { label: t('profile.eduDoctor'), value: EDUCATION_LEVEL_OPTIONS[3] },
]);

const birthdateDisplay: WritableComputedRef<string> = computed<string>({
  get(): string {
    if (!formData.value.birthdate) return '';
    const parts = formData.value.birthdate.split('-');
    if (parts.length === 3) {
      const yearStr = parts[0];
      const month = parts[1];
      const day = parts[2];
      if (yearStr && month && day) {
        const year = parseInt(yearStr, 10);
        const beYear = year + 543;
        return `${day}/${month}/${beYear}`;
      }
    }
    if (formData.value.birthdate.includes('/')) {
      return formData.value.birthdate;
    }
    return formData.value.birthdate;
  },
  set(val: string): void {
    if (!val) {
      formData.value.birthdate = '';
      return;
    }
    const parts = val.split('/');
    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      const yearStr = parts[2];
      if (day && month && yearStr) {
        const beYear = parseInt(yearStr, 10);
        const ceYear = beYear - 543;
        formData.value.birthdate = `${ceYear}-${month}-${day}`;
      }
    } else {
      formData.value.birthdate = val;
    }
  },
});

onMounted((): void => {
  const user = userStore.currentUser;
  if (user) {
    formData.value = {
      email: user.email || '',
      title: user.titleTH || TITLE_TH_OPTIONS[0].value,
      nationalId: user.nationalId || '',
      fullNameTH: user.fullNameTH || '',
      birthdate: user.birthdate || '',
      fullNameEN: user.fullNameEN || '',
      educationLevel: user.educationLevel || EDUCATION_LEVEL_OPTIONS[1],
      faculty: user.faculty || '',
      institution: user.institution || '',
      address: user.address || '',
      phone: user.phone || '',
      userImagePath: user.userImagePath || undefined,
    };
  }
});

const onCancel = (): void => {
  void router.push('/');
};

const onSave = async (): Promise<void> => {
  const isValid = await validateAndFocusFirstInvalid();
  if (!isValid) {
    $q.notify({
      type: 'negative',
      message:
        t('admin.registrantManagement.detail.editDialog.invalidForm') ||
        'กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง',
      position: 'top',
    });
    return;
  }

  const token = userStore.accessToken || localStorage.getItem('access_token');
  if (!token) {
    $q.notify({
      type: 'negative',
      message: t('profile.requireLogin'),
      position: 'top',
    });
    return;
  }

  try {
    userStore.isLoadingGlobal = true;
    userStore.loadingText = t('profile.savingData');

    await userService.updateProfile(token, {
      userTitleTh: formData.value.title,
      userFullnameTh: formData.value.fullNameTH,
      userFullnameEn: formData.value.fullNameEN,
      userDateOfBirth: formData.value.birthdate || undefined,
      userPhone: formData.value.phone,
      userEducation: formData.value.educationLevel,
      userFaculty: formData.value.faculty,
      userInstitution: formData.value.institution,
      userAddress: formData.value.address,
      isFromEmail: isFromEmail.value,
      userImagePath: formData.value.userImagePath,
      userNationalId: formData.value.nationalId,
    });

    if (
      formData.value.userImagePath &&
      formData.value.userImagePath !== userStore.currentUser?.userImagePath
    ) {
      try {
        await api.patch(
          '/user-image/me',
          { userImageUrl: formData.value.userImagePath },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (imgErr) {
        console.warn('Failed to save image via /user-image/me (endpoint might not exist):', imgErr);
      }
    }

    await userStore.initialize();

    $q.notify({
      type: 'positive',
      message: t('profile.dialogUpdateSuccess'),
      position: 'top',
    });
  } catch (err) {
    console.error('Save profile failed:', err);
    $q.notify({
      type: 'negative',
      message: t('profile.saveError'),
      position: 'top',
    });
  } finally {
    userStore.isLoadingGlobal = false;
  }
};

const onSavePassword = (): void => {
  if (!currentPassword.value || !newPassword.value) {
    $q.notify({
      type: 'negative',
      message: t('profile.required'),
      position: 'top',
    });
    return;
  }

  $q.notify({
    type: 'positive',
    message: t('profile.dialogUpdateSuccess'),
    position: 'top',
  });

  currentPassword.value = '';
  newPassword.value = '';
  showPasswordDialog.value = false;
};
</script>

<style scoped lang="scss">
.user-profile-card {
  border-radius: 16px !important;
  border: 1px solid var(--neutral-gray-light) !important;
  box-shadow: none !important;
  background-color: var(--surface-card) !important;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 12px !important;
}

.avatar-container {
  position: relative;
  display: inline-block;
}

.profile-avatar {
  border: 4px solid var(--surface-card);
  box-shadow: none !important;
  background-color: transparent !important;
  overflow: hidden;
}

.profile-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 12px;
  border: 2px solid white;
  box-shadow: none !important;
}

.form-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.action-btn {
  width: 120px;
  border-radius: 6px;
}

.calendar-menu {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.fix-alert-banner {
  background: linear-gradient(
    135deg,
    var(--alert-warning-bg-start) 0%,
    var(--alert-warning-bg-end) 100%
  );
  border: 1px solid var(--alert-warning-border);
  border-radius: 12px;
  box-shadow: 0 4px 12px var(--alert-warning-shadow);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:deep(.address-textarea .q-field__control) {
  height: 118px !important;
  min-height: 118px !important;
}

@keyframes border-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--negative-rgb), 0.3);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(var(--negative-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--negative-rgb), 0);
  }
}

:deep(.highlighted-field .q-field__control) {
  border: 2px solid var(--negative) !important;
  background-color: rgba(var(--negative-rgb), 0.015) !important;
  box-shadow: 0 0 0 0 rgba(var(--negative-rgb), 0.2) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: border-pulse 2.5s infinite;
}

:deep(.highlighted-field.q-field--focused .q-field__control) {
  border-color: var(--negative) !important;
  box-shadow: 0 0 0 4px rgba(var(--negative-rgb), 0.15) !important;
  background-color: rgba(var(--negative-rgb), 0.03) !important;
  animation: none !important;
}

.avatar-container.highlighted-field {
  .profile-avatar {
    border: 4px solid var(--negative) !important;
    box-shadow: 0 0 16px rgba(var(--negative-rgb), 0.3) !important;
  }
}

.floating-tip-badge {
  position: absolute;
  top: 0;
  right: 8px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  background-color: var(--tip-badge-bg);
  color: var(--tip-badge-text);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--tip-badge-border);
  box-shadow: 0 4px 10px var(--tip-badge-shadow-1);
  cursor: pointer;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  animation: float-pulse 2s infinite;

  &:hover {
    background-color: var(--tip-badge-border);
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 6px 14px var(--tip-badge-shadow-2);
  }

  &:active {
    transform: translateY(0) scale(1);
  }
}

@keyframes float-pulse {
  0% {
    transform: translateY(0);
    box-shadow: 0 4px 10px rgba(198, 40, 40, 0.15);
  }
  50% {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(198, 40, 40, 0.25);
  }
  100% {
    transform: translateY(0);
    box-shadow: 0 4px 10px rgba(198, 40, 40, 0.15);
  }
}
</style>
