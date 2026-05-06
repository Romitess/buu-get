<template>
  <div class="row justify-center q-pa-md full-width">
    <!-- Match mockup styling: no heavy shadow, soft border, rounded corners -->
    <q-card
      class="q-pa-xl shadow-0"
      style="
        max-width: 1000px;
        width: 100%;
        border: 1px solid var(--q-grey-3);
        border-radius: 12px;
        margin: 0 auto;
      "
    >
      <q-form @submit.prevent="submitForm">
        <!-- ─── 2-Column Layout ─── -->
        <div class="row justify-center q-col-gutter-x-xl q-col-gutter-y-md">
          <!-- คอลัมน์ซ้าย: ข้อมูลตัวตน -->
          <div class="col-12 col-sm-6" style="max-width: 420px">
            <IdentityColumn
              :is-thai="isThailand"
              :is-edit-mode="isEditMode"
              v-model:national-id="formData.nationalId"
              v-model:country="formData.country"
              v-model:title-t-h="formData.titleTH"
              v-model:full-name="formData.fullName"
              v-model:title-e-n="formData.titleEN"
              v-model:english-name="formData.englishName"
              v-model:birthdate="formData.birthdate"
              v-model:education-level="formData.educationLevel"
              @title-th-change="handleTitleTHChange"
            />
          </div>

          <!-- คอลัมน์ขวา: ข้อมูลสถาบัน/ที่อยู่ -->
          <div class="col-12 col-sm-6" style="max-width: 420px">
            <ContactColumn
              v-model:faculty="formData.faculty"
              v-model:institution="formData.institution"
              v-model:address="formData.address"
              v-model:province="formData.province"
              v-model:zip-code="formData.zipCode"
              v-model:phone="formData.phone"
            />
          </div>
        </div>

        <!-- ─── Buttons ─── -->
        <!-- Center-aligned buttons to match mockup -->
        <div class="row justify-center q-gutter-x-md q-mt-xl">
          <q-btn
            unelevated
            class="bg-grey-4 text-black text-weight-bold"
            :label="t('profile.cancel')"
            style="width: 160px; border-radius: 8px; padding: 10px 0"
            @click="emit('close')"
          />
          <q-btn
            type="submit"
            color="primary"
            class="text-weight-bold"
            :label="submitButtonText"
            style="width: 160px; border-radius: 8px; padding: 10px 0"
            unelevated
          />
        </div>
      </q-form>
    </q-card>

    <!-- ─── Dialog ─── -->
    <q-dialog v-model="dialog.show" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar
            :icon="dialog.type === 'success' ? 'check_circle' : 'error'"
            :color="dialog.type === 'success' ? 'positive' : 'negative'"
            text-color="white"
          />
          <span class="q-ml-sm text-h6">{{
            dialog.type === 'success' ? t('profile.dialogSuccess') : t('profile.dialogError')
          }}</span>
        </q-card-section>

        <q-card-section class="q-pt-none">
          {{ dialog.message }}
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="t('profile.dialogClose')" color="primary" @click="onDialogClose" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { User } from 'src/components/models';
import type { RegisterFormData } from 'src/types/register';
import type { RegisterCredentials } from 'src/components/RegisterCard.vue';
import { useRegisterForm } from 'src/composables/use-register-form';

import IdentityColumn from 'src/components/register/identity-column.vue';
import ContactColumn from 'src/components/register/contact-column.vue';

interface Props {
  initialEditMode: boolean;
  isThai?: boolean;
  credentials?: RegisterCredentials;
  userData?: User | null;
}

const props = withDefaults(defineProps<Props>(), {
  isThai: true,
});

const emit = defineEmits<{
  close: [];
  save: [payload: RegisterFormData];
}>();

const { t } = useI18n();

const isEditMode = ref<boolean>(props.initialEditMode);

/** isThai มาจาก prop ที่ parent ส่งมา (ตาม userType ใน step 1) */
const isThailand = computed<boolean>(() => props.isThai);

const submitButtonText = computed<string>(() =>
  isEditMode.value ? t('profile.saveEdit') : t('profile.register'),
);

const { formData, dialog, initFormData, handleTitleTHChange, submitForm, onDialogClose } =
  useRegisterForm(isEditMode.value, (payload) => {
    emit('save', payload);
  });

onMounted(() => {
  initFormData(props.userData);
  // นำ email + password จาก step 1 มาเก็บใน formData
  if (props.credentials) {
    formData.value.email = props.credentials.email;
    formData.value.password = props.credentials.password;
    formData.value.country = props.isThai ? 'TH' : '';
  }
});
</script>
