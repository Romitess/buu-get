<template>
  <div class="q-gutter-y-md">
    <!-- ─── Thai: เลขบัตรประจำตัวประชาชน / Foreigner: Passport Number ─── -->
    <template v-if="isThai">
      <div>
        <div class="text-body2 text-weight-medium q-mb-xs">{{ t('profile.nationalId') }}</div>
        <q-input
          v-model="nationalId"
          :placeholder="t('profile.nationalIdPlaceholder')"
          outlined
          dense
          :readonly="isEditMode"
          :rules="[(val) => !!val || t('profile.requiredNationalId')]"
          class="custom-input"
        />
      </div>
    </template>
    <template v-else>
      <div>
        <div class="text-body2 text-weight-medium q-mb-xs">{{ t('profile.passportNo') }}</div>
        <q-input
          v-model="nationalId"
          :placeholder="t('profile.passportPlaceholder')"
          outlined
          dense
          :readonly="isEditMode"
          :rules="[(val) => !!val || t('profile.requiredNationalId')]"
          class="custom-input"
        />
      </div>
    </template>

    <!-- ─── Thai: คำนำหน้า (ไทย) / Foreigner: Nationality ─── -->
    <template v-if="isThai">
      <div>
        <div class="text-body2 text-weight-medium q-mb-xs">{{ t('profile.prefix') }}</div>
        <q-select
          v-model="titleTH"
          :options="TITLE_TH_OPTIONS"
          emit-value
          map-options
          outlined
          dense
          @update:model-value="onTitleTHChange"
          :rules="[(val) => !!val || t('profile.requiredPrefix')]"
          class="custom-input"
        />
      </div>
    </template>
    <template v-else>
      <div>
        <div class="text-body2 text-weight-medium q-mb-xs">{{ t('profile.nationality') }}</div>
        <q-input v-model="country" outlined dense placeholder="American" class="custom-input" />
      </div>
    </template>

    <!-- ─── Thai: ชื่อ-นามสกุล (ไทย) — ซ่อนสำหรับต่างชาติ ─── -->
    <div v-if="isThai">
      <div class="text-body2 text-weight-medium q-mb-xs">{{ t('profile.fullName') }}</div>
      <q-input
        v-model="fullName"
        outlined
        dense
        :rules="[(val) => !!val || t('profile.requiredFullName')]"
        class="custom-input"
      />
    </div>

    <!-- ─── Prefixes (EN) ─── -->
    <template v-if="isThai">
      <div>
        <div class="text-body2 text-weight-medium q-mb-xs">{{ t('profile.prefixEn') }}</div>
        <q-input v-model="titleEN" outlined dense readonly class="custom-input bg-grey-2" />
      </div>
    </template>
    <template v-else>
      <div>
        <div class="text-body2 text-weight-medium q-mb-xs">{{ t('profile.prefixEn') }}</div>
        <q-select
          v-model="titleEN"
          :options="TITLE_EN_OPTIONS"
          outlined
          dense
          :rules="[(val) => !!val || t('profile.requiredPrefixEn')]"
          class="custom-input"
        />
      </div>
    </template>

    <!-- ─── Full Name (EN) ─── -->
    <div>
      <div class="text-body2 text-weight-medium q-mb-xs">{{ t('profile.fullNameEn') }}</div>
      <q-input
        v-model="englishName"
        :placeholder="t('profile.fullNameEnPlaceholder')"
        outlined
        dense
        :rules="[(val) => !!val || t('profile.requiredFullNameEn')]"
        class="custom-input"
      />
    </div>

    <!-- ─── วันเกิด / Date of Birth ─── -->
    <div>
      <div class="text-body2 text-weight-medium q-mb-xs">{{ t('profile.birthdate') }}</div>
      <q-input
        v-model="birthdate"
        type="date"
        outlined
        dense
        stack-label
        :rules="[(val) => !!val || t('profile.requiredBirthdate')]"
        class="custom-input"
      />
    </div>

    <!-- ─── ระดับการศึกษา / Highest Education ─── -->
    <div>
      <div class="text-body2 text-weight-medium q-mb-xs">{{ t('profile.education') }}</div>
      <q-select
        v-model="educationLevel"
        :options="educationOptions"
        emit-value
        map-options
        outlined
        dense
        :rules="[(val) => !!val || t('profile.requiredEducation')]"
        class="custom-input"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { TITLE_TH_OPTIONS, TITLE_EN_OPTIONS } from 'src/utils/form-options';

const { t } = useI18n();

defineProps<{
  isThai: boolean;
  isEditMode: boolean;
}>();

const emit = defineEmits(['title-th-change']);

const nationalId = defineModel<string>('nationalId', { required: true });
const country = defineModel<string>('country', { required: true });
const titleTH = defineModel<string>('titleTH', { required: true });
const fullName = defineModel<string>('fullName', { required: true });
const titleEN = defineModel<string>('titleEN', { required: true });
const englishName = defineModel<string>('englishName', { required: true });
const birthdate = defineModel<string>('birthdate', { required: true });
const educationLevel = defineModel<string>('educationLevel', { required: true });

const onTitleTHChange = (): void => {
  emit('title-th-change');
};

const educationOptions = computed(() => [
  { label: t('profile.eduHighSchool'), value: 'มัธยมศึกษา' },
  { label: t('profile.eduBachelor'), value: 'ปริญญาตรี' },
  { label: t('profile.eduMaster'), value: 'ปริญญาโท' },
  { label: t('profile.eduDoctor'), value: 'ปริญญาเอก' },
]);
</script>
