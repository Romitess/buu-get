import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { User } from 'src/types/user';
import type { RegisterFormData, DialogState } from 'src/types/register';
import { useCountries } from 'src/composables/use-countries';

export function useRegisterForm(isEditMode: boolean, onSave: (payload: RegisterFormData) => void) {
  const router = useRouter();
  const { t } = useI18n();
  const { titleMap } = useCountries();

  const defaultData: RegisterFormData = {
    profileImage: '',
    nationalId: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: 'TH',
    titleTH: '',
    titleEN: '',
    fullName: '',
    englishName: '',
    birthdate: '',
    phone: '',
    educationLevel: '',
    faculty: '',
    institution: '',
    address: '',
  };

  const formData = ref<RegisterFormData>({ ...defaultData });

  const dialog = ref<DialogState>({
    show: false,
    type: '',
    message: '',
  });

  const isThailand = computed<boolean>(() => formData.value.country === 'TH');

  const initFormData = (userData?: User | null): void => {
    if (isEditMode && userData) {
      formData.value = {
        ...defaultData,
        nationalId: userData.nationalId,
        email: userData.email,
        country: userData.country ?? 'TH',
        titleTH: userData.titleTH,
        titleEN: userData.titleEN,
        fullName: userData.fullNameTH,
        englishName: userData.fullNameEN,
        birthdate: userData.birthdate,
        phone: userData.phone,
        educationLevel: userData.educationLevel,
        faculty: userData.faculty ?? '',
        institution: userData.institution ?? '',
        address: userData.address,
        userImagePath: userData.userImagePath || undefined,
      };
    }
  };

  const handleCountryChange = (): void => {
    formData.value.titleTH = '';
    formData.value.titleEN = '';
    formData.value.fullName = '';
  };

  const handleTitleTHChange = (): void => {
    formData.value.titleEN = titleMap[formData.value.titleTH] || '';
  };

  const submitForm = (): void => {
    try {
      onSave({
        ...formData.value,
        address: formData.value.address?.trim() || null,
      });
      if (isEditMode) {
        dialog.value = {
          show: true,
          type: 'success',
          message: t('profile.dialogUpdateSuccess'),
        };
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onDialogClose = (): void => {
    dialog.value.show = false;
    if (!isEditMode && dialog.value.type === 'success') {
      void router.push('/exam-history');
    }
  };

  return {
    formData,
    dialog,
    isThailand,
    initFormData,
    handleCountryChange,
    handleTitleTHChange,
    submitForm,
    onDialogClose,
  };
}
