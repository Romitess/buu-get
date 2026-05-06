<template>
  <div class="row justify-center q-pa-md">
    <q-card class="q-pa-lg shadow-2" style="max-width: 900px; width: 100%">
      <div class="row justify-between items-center q-mb-md">
        <div class="text-h6 text-weight-bold">{{ pageTitle }}</div>
        <q-btn
          flat
          color="grey-8"
          :label="isEditMode ? 'ยกเลิก' : 'กลับสู่หน้าล็อกอิน'"
          @click="$emit('close')"
        />
      </div>

      <q-form @submit.prevent="submitForm" class="q-gutter-md">
        <div class="row q-col-gutter-md">
          <!-- ─────────────── ข้อมูลบัญชี ─────────────── -->
          <div class="col-12 col-md-6">
            <q-input
              v-model="formData.nationalId"
              label="เลขประจำตัวประชาชน *"
              placeholder="เลขบัตร 13 หลัก"
              outlined
              dense
              :readonly="isEditMode"
              :rules="[(val) => !!val || 'กรุณากรอกเลขประจำตัวประชาชน']"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="formData.email"
              type="email"
              label="อีเมล *"
              placeholder="example@email.com"
              outlined
              dense
              :rules="[(val) => !!val || 'กรุณากรอกอีเมล']"
            />
          </div>

          <template v-if="!isEditMode">
            <div class="col-12 col-md-6">
              <q-input
                v-model="formData.password"
                type="password"
                label="รหัสผ่าน *"
                placeholder="กำหนดรหัสผ่าน"
                outlined
                dense
                :rules="[(val) => !!val || 'กรุณากรอกรหัสผ่าน']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="formData.confirmPassword"
                type="password"
                label="ยืนยันรหัสผ่าน *"
                placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                outlined
                dense
                :rules="[
                  (val) => !!val || 'กรุณายืนยันรหัสผ่าน',
                  (val) => val === formData.password || 'รหัสผ่านไม่ตรงกัน',
                ]"
              />
            </div>
          </template>

          <!-- ─────────────── ประเทศ ─────────────── -->
          <div class="col-12">
            <q-select
              v-model="formData.country"
              :options="countryOptions"
              label="ประเทศ *"
              outlined
              dense
              emit-value
              map-options
              @update:model-value="handleCountryChange"
              :rules="[(val) => !!val || 'กรุณาเลือกประเทศ']"
            />
          </div>

          <!-- แจ้งเตือน non-TH -->
          <div v-if="formData.country && !isThailand" class="col-12">
            <q-banner rounded class="bg-blue-1 text-blue-9 border-blue">
              <template v-slot:avatar>
                <q-icon name="info" color="blue-9" />
              </template>
              เนื่องจากคุณเลือกประเทศที่ไม่ใช่ประเทศไทย
              <strong>ชื่อ-นามสกุลภาษาไทยและคำนำหน้าภาษาไทย</strong> ไม่จำเป็นต้องกรอก —
              กรอกเฉพาะภาษาอังกฤษก็เพียงพอ
            </q-banner>
          </div>

          <!-- ─────────────── คำนำหน้า (ไทย) ─────────────── -->
          <div class="col-12 col-md-6">
            <q-select
              v-model="formData.titleTH"
              :options="titleOptions"
              label="คำนำหน้า (ภาษาไทย)"
              outlined
              dense
              :disable="!isThailand"
              @update:model-value="handleTitleTHChange"
              :rules="isThailand ? [(val) => !!val || 'กรุณาเลือกคำนำหน้า'] : []"
            >
              <template v-if="!isThailand" v-slot:append>
                <div class="text-caption text-grey">(ไม่จำเป็น)</div>
              </template>
            </q-select>
          </div>

          <!-- ─────────────── ชื่อ-นามสกุล (ไทย) ─────────────── -->
          <div class="col-12 col-md-6">
            <q-input
              v-model="formData.fullName"
              label="ชื่อ - นามสกุล (ภาษาไทย)"
              placeholder="เช่น นายนที บุญญานนท์"
              outlined
              dense
              :disable="!isThailand"
              :rules="isThailand ? [(val) => !!val || 'กรุณากรอกชื่อ-นามสกุล'] : []"
            >
              <template v-if="!isThailand" v-slot:append>
                <div class="text-caption text-grey">(ไม่จำเป็น)</div>
              </template>
            </q-input>
          </div>

          <!-- ─────────────── คำนำหน้า (อังกฤษ) ─────────────── -->
          <div class="col-12 col-md-6">
            <q-input
              v-if="isThailand"
              v-model="formData.titleEN"
              label="คำนำหน้า (ภาษาอังกฤษ) *"
              outlined
              dense
              readonly
              class="bg-grey-2"
            />
            <q-select
              v-else
              v-model="formData.titleEN"
              :options="enTitleOptions"
              label="คำนำหน้า (ภาษาอังกฤษ) *"
              outlined
              dense
              :rules="[(val) => !!val || 'กรุณาเลือกคำนำหน้าภาษาอังกฤษ']"
            />
          </div>

          <!-- ─────────────── ชื่อ-นามสกุล (อังกฤษ) ─────────────── -->
          <div class="col-12 col-md-6">
            <q-input
              v-model="formData.englishName"
              label="ชื่อ - นามสกุล (ภาษาอังกฤษ) *"
              placeholder="e.g. Natee Boonyanon"
              outlined
              dense
              :rules="[(val) => !!val || 'กรุณากรอกชื่อ-นามสกุลภาษาอังกฤษ']"
            />
          </div>

          <!-- ─────────────── ข้อมูลทั่วไป ─────────────── -->
          <div class="col-12 col-md-6">
            <q-input
              v-model="formData.birthdate"
              type="date"
              label="วันเกิด *"
              outlined
              dense
              stack-label
              :rules="[(val) => !!val || 'กรุณาระบุวันเกิด']"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="formData.phone"
              type="tel"
              label="เบอร์โทรศัพท์ *"
              placeholder="เช่น 0984343014"
              outlined
              dense
              :rules="[(val) => !!val || 'กรุณากรอกเบอร์โทรศัพท์']"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-select
              v-model="formData.educationLevel"
              :options="['มัธยมศึกษา', 'ปริญญาตรี', 'ปริญญาโท', 'ปริญญาเอก']"
              label="ระดับการศึกษาสูงสุด *"
              outlined
              dense
              :rules="[(val) => !!val || 'กรุณาเลือกระดับการศึกษา']"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="formData.faculty"
              label="คณะ/สาขาวิชา"
              placeholder="เช่น วิทยาการสารสนเทศ"
              outlined
              dense
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="formData.institution"
              label="ชื่อสถานศึกษา"
              placeholder="เช่น มหาวิทยาลัยบูรพา"
              outlined
              dense
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="formData.province"
              label="จังหวัด / City"
              :placeholder="isThailand ? 'เช่น ชลบุรี' : 'e.g. Bangkok'"
              outlined
              dense
            />
          </div>

          <div class="col-12">
            <q-input
              v-model="formData.address"
              type="textarea"
              label="ที่อยู่สำหรับจัดส่งเอกสาร"
              :placeholder="isThailand ? 'กรอกที่อยู่ปัจจุบันของคุณ' : 'Enter your current address'"
              outlined
              dense
              rows="3"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="formData.zipCode"
              label="รหัสไปรษณีย์ / ZIP Code"
              :placeholder="isThailand ? 'เช่น 20130' : 'e.g. 10001'"
              outlined
              dense
            />
          </div>
        </div>

        <q-separator class="q-my-md" />

        <div>
          <q-btn
            type="submit"
            color="primary"
            :label="submitButtonText"
            class="q-px-xl"
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
            dialog.type === 'success' ? 'สำเร็จ' : 'เกิดข้อผิดพลาด'
          }}</span>
        </q-card-section>

        <q-card-section class="q-pt-none">
          {{ dialog.message }}
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="ปิด" color="primary" @click="onDialogClose" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { User } from 'src/components/models';
import { useCountries } from 'src/composables/use-countries';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
  nationalId: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  country: string;
  titleTH: string;
  titleEN: string;
  fullName: string;
  englishName: string;
  birthdate: string;
  phone: string;
  educationLevel: string;
  faculty: string;
  institution: string;
  address: string;
  province: string;
  zipCode: string;
}

interface DialogState {
  show: boolean;
  type: 'success' | 'error' | '';
  message: string;
}

interface Props {
  initialEditMode: boolean;
  userData?: User | null;
}

// ─── Props / Emits ────────────────────────────────────────────────────────────

const props = defineProps<Props>();
const emit = defineEmits(['close', 'save']);
const router = useRouter();
const { featuredCountries, otherCountries, titleMap } = useCountries();

// ─── Computed ─────────────────────────────────────────────────────────────────

const isEditMode = ref<boolean>(props.initialEditMode);
const pageTitle = computed<string>(() =>
  isEditMode.value ? 'แก้ไขข้อมูลส่วนตัว' : 'สมัครสมาชิกใหม่',
);
const submitButtonText = computed<string>(() =>
  isEditMode.value ? 'บันทึกข้อมูลส่วนตัว' : 'สมัครสมาชิก',
);

/** true เมื่อผู้ใช้เลือกประเทศไทย */
const isThailand = computed<boolean>(() => formData.value.country === 'TH');

// Select options formatting
const countryOptions = computed(() => {
  return [
    { label: 'แนะนำ', value: '', disable: true },
    ...featuredCountries.map((c) => ({ label: c.nameEN, value: c.code })),
    { label: 'ทั้งหมด (A–Z)', value: '', disable: true },
    ...otherCountries.map((c) => ({ label: c.nameEN, value: c.code })),
  ];
});

const titleOptions = [
  { label: 'นาย', value: 'นาย' },
  { label: 'นาง', value: 'นาง' },
  { label: 'นางสาว', value: 'นางสาว' },
  { label: 'ดร.', value: 'ด็อกเตอร์' },
  { label: 'ศ.', value: 'ศาสตราจารย์' },
  { label: 'รศ.', value: 'รองศาสตราจารย์' },
  { label: 'ผศ.', value: 'ผู้ช่วยศาสตราจารย์' },
];

const enTitleOptions = [
  'Mr.',
  'Mrs.',
  'Miss',
  'Ms.',
  'Dr.',
  'Prof.',
  'Assoc. Prof.',
  'Asst. Prof.',
];

// ─── Default / Form State ─────────────────────────────────────────────────────

const defaultData: FormData = {
  nationalId: '',
  email: '',
  password: '',
  confirmPassword: '',
  country: 'TH', // ค่าเริ่มต้น = ไทย
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
  province: '',
  zipCode: '',
};

const formData = ref<FormData>({ ...defaultData });

const dialog = ref<DialogState>({
  show: false,
  type: '',
  message: '',
});

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  if (isEditMode.value && props.userData) {
    const user = props.userData;
    formData.value = {
      ...defaultData,
      nationalId: user.nationalId,
      email: user.email,
      country: user.country ?? 'TH',
      titleTH: user.titleTH,
      titleEN: user.titleEN,
      fullName: user.fullNameTH,
      englishName: user.fullNameEN,
      birthdate: user.birthdate,
      phone: user.phone,
      educationLevel: user.educationLevel,
      faculty: user.faculty ?? '',
      institution: user.institution ?? '',
      address: user.address,
      province: user.province,
      zipCode: user.zipCode ?? '',
    };
  }
});

// ─── Handlers ─────────────────────────────────────────────────────────────────

/** เมื่อเปลี่ยนประเทศ: ล้างฟิลด์ที่ขึ้นอยู่กับประเทศ */
const handleCountryChange = (): void => {
  formData.value.titleTH = '';
  formData.value.titleEN = '';
  formData.value.fullName = '';
};

/** เมื่อเลือกคำนำหน้าไทย: auto-fill EN เฉพาะโหมดไทย */
const handleTitleTHChange = (): void => {
  if (isThailand.value) {
    formData.value.titleEN = titleMap[formData.value.titleTH] || '';
  }
};

// ─── Submit ───────────────────────────────────────────────────────────────────

const submitForm = (): void => {
  if (isEditMode.value) {
    emit('save', { ...formData.value });
    dialog.value = {
      show: true,
      type: 'success',
      message: 'อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว',
    };
  } else {
    if (formData.value.password !== formData.value.confirmPassword) {
      dialog.value = {
        show: true,
        type: 'error',
        message: 'รหัสผ่านไม่ตรงกัน',
      };
      return;
    }
    emit('save', { ...formData.value });
    dialog.value = {
      show: true,
      type: 'success',
      message: 'สมัครสมาชิกเรียบร้อยแล้ว กำลังพาไปหน้าข้อมูลส่วนตัว...',
    };
  }
};

const onDialogClose = (): void => {
  dialog.value.show = false;
  if (!isEditMode.value && dialog.value.type === 'success') {
    void router.push('/accounts');
  }
};
</script>

<style scoped>
/* No longer need custom CSS grid or dialog styles, relying on Quasar's layout utility classes. */
.border-blue {
  border: 1px solid #bfdbfe;
}
</style>
