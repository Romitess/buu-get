<template>
  <div class="profile-form-container">
    <div class="card">
      <div class="card-header">
        <h2 class="title">{{ pageTitle }}</h2>
        <button type="button" class="btn-cancel" @click="$emit('close')">
          {{ isEditMode ? 'ยกเลิก' : 'กลับสู่หน้าล็อกอิน' }}
        </button>
      </div>

      <div class="card-body">
        <form @submit.prevent="submitForm">
          <div class="form-grid">

            <!-- ─────────────── ข้อมูลบัญชี ─────────────── -->
            <div class="form-group">
              <label>เลขประจำตัวประชาชน <span class="required">*</span></label>
              <input
                type="text"
                v-model="formData.nationalId"
                placeholder="เลขบัตร 13 หลัก"
                required
                :readonly="isEditMode"
              />
            </div>

            <div class="form-group">
              <label>อีเมล <span class="required">*</span></label>
              <input
                type="email"
                v-model="formData.email"
                placeholder="example@email.com"
                required
              />
            </div>

            <template v-if="!isEditMode">
              <div class="form-group">
                <label>รหัสผ่าน <span class="required">*</span></label>
                <input
                  type="password"
                  v-model="formData.password"
                  placeholder="กำหนดรหัสผ่าน"
                  required
                />
              </div>
              <div class="form-group">
                <label>ยืนยันรหัสผ่าน <span class="required">*</span></label>
                <input
                  type="password"
                  v-model="formData.confirmPassword"
                  placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                  required
                />
              </div>
            </template>

            <!-- ─────────────── ประเทศ ─────────────── -->
            <!--
              วางไว้ก่อนฟิลด์ชื่อ เพื่อให้ผู้ใช้เลือกประเทศ
              แล้วค่อยกรอกชื่อตาม logic ที่แสดงด้านล่าง
            -->
            <div class="form-group full-width">
              <label>ประเทศ <span class="required">*</span></label>
              <select v-model="formData.country" @change="handleCountryChange" required>
                <option value="" disabled>— เลือกประเทศ —</option>
                <optgroup label="แนะนำ">
                  <option
                    v-for="c in featuredCountries"
                    :key="c.code"
                    :value="c.code"
                  >
                    {{ c.nameEN }}
                  </option>
                </optgroup>
                <optgroup label="ทั้งหมด (A–Z)">
                  <option
                    v-for="c in otherCountries"
                    :key="c.code"
                    :value="c.code"
                  >
                    {{ c.nameEN }}
                  </option>
                </optgroup>
              </select>
            </div>

            <!-- ─────────────── แจ้งเตือน non-TH ─────────────── -->
            <div v-if="formData.country && !isThailand" class="form-group full-width info-banner">
              <span class="info-icon">ℹ️</span>
              เนื่องจากคุณเลือกประเทศที่ไม่ใช่ประเทศไทย
              <strong>ชื่อ-นามสกุลภาษาไทยและคำนำหน้าภาษาไทย</strong>
              ไม่จำเป็นต้องกรอก — กรอกเฉพาะภาษาอังกฤษก็เพียงพอ
            </div>

            <!-- ─────────────── คำนำหน้า (ไทย) ─────────────── -->
            <div class="form-group">
              <label>
                คำนำหน้า (ภาษาไทย)
                <span v-if="isThailand" class="required">*</span>
                <span v-else class="optional">(ไม่จำเป็น)</span>
              </label>
              <select
                v-model="formData.titleTH"
                @change="handleTitleTHChange"
                :required="isThailand"
              >
                <option value="" :disabled="isThailand">— เลือกคำนำหน้า —</option>
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
                <option value="ด็อกเตอร์">ดร.</option>
                <option value="ศาสตราจารย์">ศ.</option>
                <option value="รองศาสตราจารย์">รศ.</option>
                <option value="ผู้ช่วยศาสตราจารย์">ผศ.</option>
              </select>
            </div>

            <!-- ─────────────── ชื่อ-นามสกุล (ไทย) ─────────────── -->
            <div class="form-group">
              <label>
                ชื่อ - นามสกุล (ภาษาไทย)
                <span v-if="isThailand" class="required">*</span>
                <span v-else class="optional">(ไม่จำเป็น)</span>
              </label>
              <input
                type="text"
                v-model="formData.fullName"
                placeholder="เช่น นายนที บุญญานนท์"
                :required="isThailand"
              />
            </div>

            <!-- ─────────────── คำนำหน้า (อังกฤษ) ─────────────── -->
            <!--
              ถ้าเลือกไทย  → auto-fill จาก titleTH, readonly
              ถ้าเลือกอื่น → dropdown เลือกเอง, required
            -->
            <div class="form-group">
              <label>คำนำหน้า (ภาษาอังกฤษ) <span class="required">*</span></label>

              <!-- โหมดไทย: readonly auto-fill -->
              <input
                v-if="isThailand"
                type="text"
                v-model="formData.titleEN"
                readonly
                class="input-readonly"
              />

              <!-- โหมดต่างชาติ: dropdown -->
              <select
                v-else
                v-model="formData.titleEN"
                required
              >
                <option value="" disabled>— Select Title —</option>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Miss">Miss</option>
                <option value="Ms.">Ms.</option>
                <option value="Dr.">Dr.</option>
                <option value="Prof.">Prof.</option>
                <option value="Assoc. Prof.">Assoc. Prof.</option>
                <option value="Asst. Prof.">Asst. Prof.</option>
              </select>
            </div>

            <!-- ─────────────── ชื่อ-นามสกุล (อังกฤษ) ─────────────── -->
            <div class="form-group">
              <label>ชื่อ - นามสกุล (ภาษาอังกฤษ) <span class="required">*</span></label>
              <input
                type="text"
                v-model="formData.englishName"
                placeholder="e.g. Natee Boonyanon"
                required
              />
            </div>

            <!-- ─────────────── ข้อมูลทั่วไป ─────────────── -->
            <div class="form-group">
              <label>วันเกิด <span class="required">*</span></label>
              <input type="date" v-model="formData.birthdate" required />
            </div>

            <div class="form-group">
              <label>เบอร์โทรศัพท์ <span class="required">*</span></label>
              <input
                type="tel"
                v-model="formData.phone"
                placeholder="เช่น 0984343014"
                required
              />
            </div>

            <div class="form-group">
              <label>ระดับการศึกษาสูงสุด <span class="required">*</span></label>
              <select v-model="formData.educationLevel" required>
                <option value="" disabled>เลือกระดับการศึกษา</option>
                <option value="มัธยมศึกษา">มัธยมศึกษา</option>
                <option value="ปริญญาตรี">ปริญญาตรี</option>
                <option value="ปริญญาโท">ปริญญาโท</option>
                <option value="ปริญญาเอก">ปริญญาเอก</option>
              </select>
            </div>

            <div class="form-group">
              <label>คณะ/สาขาวิชา</label>
              <input
                type="text"
                v-model="formData.faculty"
                placeholder="เช่น วิทยาการสารสนเทศ"
              />
            </div>

            <div class="form-group">
              <label>ชื่อสถานศึกษา</label>
              <input
                type="text"
                v-model="formData.institution"
                placeholder="เช่น มหาวิทยาลัยบูรพา"
              />
            </div>

            <div class="form-group">
              <label>จังหวัด / City</label>
              <input
                type="text"
                v-model="formData.province"
                :placeholder="isThailand ? 'เช่น ชลบุรี' : 'e.g. Bangkok'"
              />
            </div>

            <div class="form-group full-width">
              <label>ที่อยู่สำหรับจัดส่งเอกสาร</label>
              <textarea
                v-model="formData.address"
                rows="2"
                :placeholder="isThailand ? 'กรอกที่อยู่ปัจจุบันของคุณ' : 'Enter your current address'"
              ></textarea>
            </div>

            <div class="form-group">
              <label>รหัสไปรษณีย์ / ZIP Code</label>
              <input
                type="text"
                v-model="formData.zipCode"
                :placeholder="isThailand ? 'เช่น 20130' : 'e.g. 10001'"
              />
            </div>
          </div>

          <hr class="divider" />

          <div class="form-actions">
            <button type="submit" class="btn-submit">{{ submitButtonText }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- ─── Dialog ─── -->
  <div v-if="dialog.show" class="dialog-overlay">
    <div class="dialog-box">
      <h3 :class="dialog.type">
        {{ dialog.type === 'success' ? 'สำเร็จ' : 'เกิดข้อผิดพลาด' }}
      </h3>
      <p>{{ dialog.message }}</p>
      <button @click="onDialogClose">ปิด</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { User } from 'src/components/models';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Country {
  code: string;   // ISO 3166-1 alpha-2
  nameEN: string;
}

interface FormData {
  nationalId: string;
  email: string;
  password: string;
  confirmPassword: string;
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

// ─── Country Data ─────────────────────────────────────────────────────────────

// รายการประเทศแนะนำ (แสดงก่อน)
const featuredCountries: Country[] = [
  { code: 'TH', nameEN: 'Thailand' },
  { code: 'CN', nameEN: 'China' },
  { code: 'JP', nameEN: 'Japan' },
  { code: 'KR', nameEN: 'South Korea' },
  { code: 'SG', nameEN: 'Singapore' },
  { code: 'MY', nameEN: 'Malaysia' },
  { code: 'US', nameEN: 'United States' },
  { code: 'GB', nameEN: 'United Kingdom' },
];

// รายการประเทศทั้งหมด (เรียง A–Z ตาม nameEN ไม่รวม featured)
const allCountries: Country[] = [
  { code: 'AU', nameEN: 'Australia' },
  { code: 'AT', nameEN: 'Austria' },
  { code: 'BE', nameEN: 'Belgium' },
  { code: 'BR', nameEN: 'Brazil' },
  { code: 'KH', nameEN: 'Cambodia' },
  { code: 'CA', nameEN: 'Canada' },
  { code: 'CN', nameEN: 'China' },
  { code: 'DK', nameEN: 'Denmark' },
  { code: 'EG', nameEN: 'Egypt' },
  { code: 'FI', nameEN: 'Finland' },
  { code: 'FR', nameEN: 'France' },
  { code: 'DE', nameEN: 'Germany' },
  { code: 'GH', nameEN: 'Ghana' },
  { code: 'GR', nameEN: 'Greece' },
  { code: 'HK', nameEN: 'Hong Kong' },
  { code: 'HU', nameEN: 'Hungary' },
  { code: 'IN', nameEN: 'India' },
  { code: 'ID', nameEN: 'Indonesia' },
  { code: 'IE', nameEN: 'Ireland' },
  { code: 'IL', nameEN: 'Israel' },
  { code: 'IT', nameEN: 'Italy' },
  { code: 'JP', nameEN: 'Japan' },
  { code: 'KR', nameEN: 'South Korea' },
  { code: 'LA', nameEN: 'Laos' },
  { code: 'MY', nameEN: 'Malaysia' },
  { code: 'MX', nameEN: 'Mexico' },
  { code: 'MM', nameEN: 'Myanmar' },
  { code: 'NL', nameEN: 'Netherlands' },
  { code: 'NZ', nameEN: 'New Zealand' },
  { code: 'NG', nameEN: 'Nigeria' },
  { code: 'NO', nameEN: 'Norway' },
  { code: 'PK', nameEN: 'Pakistan' },
  { code: 'PH', nameEN: 'Philippines' },
  { code: 'PL', nameEN: 'Poland' },
  { code: 'PT', nameEN: 'Portugal' },
  { code: 'RU', nameEN: 'Russia' },
  { code: 'SA', nameEN: 'Saudi Arabia' },
  { code: 'SG', nameEN: 'Singapore' },
  { code: 'ZA', nameEN: 'South Africa' },
  { code: 'ES', nameEN: 'Spain' },
  { code: 'SE', nameEN: 'Sweden' },
  { code: 'CH', nameEN: 'Switzerland' },
  { code: 'TW', nameEN: 'Taiwan' },
  { code: 'TH', nameEN: 'Thailand' },
  { code: 'TR', nameEN: 'Turkey' },
  { code: 'AE', nameEN: 'UAE' },
  { code: 'UA', nameEN: 'Ukraine' },
  { code: 'GB', nameEN: 'United Kingdom' },
  { code: 'US', nameEN: 'United States' },
  { code: 'VN', nameEN: 'Vietnam' },
].sort((a, b) => a.nameEN.localeCompare(b.nameEN));

// ประเทศใน optgroup "ทั้งหมด" = allCountries ที่ไม่ซ้ำกับ featured
const featuredCodes = new Set(featuredCountries.map(c => c.code));
const otherCountries = allCountries.filter(c => !featuredCodes.has(c.code));

// ─── Title Map (TH → EN) ──────────────────────────────────────────────────────

const titleMap: Record<string, string> = {
  นาย: 'Mr.',
  นาง: 'Mrs.',
  นางสาว: 'Miss',
  ด็อกเตอร์: 'Dr.',
  ศาสตราจารย์: 'Prof.',
  รองศาสตราจารย์: 'Assoc. Prof.',
  ผู้ช่วยศาสตราจารย์: 'Asst. Prof.',
};

// ─── Computed ─────────────────────────────────────────────────────────────────

const isEditMode = ref(props.initialEditMode);
const pageTitle = computed(() => (isEditMode.value ? 'แก้ไขข้อมูลส่วนตัว' : 'สมัครสมาชิกใหม่'));
const submitButtonText = computed(() => (isEditMode.value ? 'บันทึกข้อมูลส่วนตัว' : 'สมัครสมาชิก'));

/** true เมื่อผู้ใช้เลือกประเทศไทย */
const isThailand = computed(() => formData.value.country === 'TH');

// ─── Default / Form State ─────────────────────────────────────────────────────

const defaultData: FormData = {
  nationalId: '',
  email: '',
  password: '',
  confirmPassword: '',
  country: 'TH',   // ค่าเริ่มต้น = ไทย
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
      nationalId:     user.nationalId,
      email:          user.email,
      country:        user.country ?? 'TH',
      titleTH:        user.titleTH,
      titleEN:        user.titleEN,
      fullName:       user.fullName,
      englishName:    user.englishName,
      birthdate:      user.birthdate,
      phone:          user.phone,
      educationLevel: user.educationLevel,
      faculty:        user.faculty,
      institution:    user.institution,
      address:        user.address,
      province:       user.province,
      zipCode:        user.zipCode,
    };
  }
});

// ─── Handlers ─────────────────────────────────────────────────────────────────

/** เมื่อเปลี่ยนประเทศ: ล้างฟิลด์ที่ขึ้นอยู่กับประเทศ */
const handleCountryChange = () => {
  formData.value.titleTH = '';
  formData.value.titleEN = '';
  formData.value.fullName = '';
};

/** เมื่อเลือกคำนำหน้าไทย: auto-fill EN เฉพาะโหมดไทย */
const handleTitleTHChange = () => {
  if (isThailand.value) {
    formData.value.titleEN = titleMap[formData.value.titleTH] || '';
  }
};

// ─── Submit ───────────────────────────────────────────────────────────────────

const submitForm = () => {
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

const onDialogClose = () => {
  dialog.value.show = false;
  if (!isEditMode.value && dialog.value.type === 'success') {
    void router.push('/accounts');
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600&display=swap');

.profile-form-container {
  font-family: 'Prompt', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f9fafb;
  width: 100%;
}

.card {
  width: 100%;
  max-width: 900px;
  background: #ffffff;
  border: 1px solid #ffce00;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  background-color: #ffce00;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  color: #212529;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.btn-cancel {
  background: transparent;
  color: #212529;
  border: 1px solid #ffffff;
  padding: 6px 16px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.2);
}

.card-body {
  padding: 30px;
}

/* ─── Grid ─────────────────────────────────────────── */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.full-width {
  grid-column: span 2;
}

/* ─── Labels & Inputs ──────────────────────────────── */
label {
  font-size: 14px;
  color: #374151;
  margin-bottom: 8px;
  font-weight: 500;
}

.required {
  color: #ef4444;
}

.optional {
  color: #9ca3af;
  font-weight: 400;
  font-size: 12px;
}

input,
select,
textarea {
  font-family: inherit;
  font-size: 14px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s;
  background-color: #ffffff;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #ffce00;
  box-shadow: 0 0 0 2px rgba(255, 206, 0, 0.2);
}

textarea {
  resize: vertical;
}

/* input ที่ readonly (auto-fill) */
.input-readonly {
  background-color: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}

/* ─── Info Banner ──────────────────────────────────── */
.info-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  color: #1d4ed8;
  line-height: 1.5;
}
.info-icon {
  font-size: 16px;
  flex-shrink: 0;
}

/* ─── Divider & Actions ────────────────────────────── */
.divider {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 30px 0 20px;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
}

.btn-submit {
  background-color: #ffce00;
  color: #212529;
  border: none;
  padding: 10px 24px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-submit:hover {
  background-color: #e6b800;
}

/* ─── Dialog ───────────────────────────────────────── */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.dialog-box {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 320px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.dialog-box h3 {
  margin-top: 0;
  margin-bottom: 12px;
}
.dialog-box h3.success { color: #10b981; }
.dialog-box h3.error   { color: #ef4444; }

.dialog-box button {
  margin-top: 20px;
  padding: 8px 24px;
  background: #ffce00;
  color: #212529;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* ─── Responsive ───────────────────────────────────── */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .full-width {
    grid-column: span 1;
  }
  .card-body {
    padding: 20px;
  }
}
</style>