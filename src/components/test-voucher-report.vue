<template>
  <div class="q-pa-md page-container-test">
    <!-- Action Bar (Hidden when printing) -->
    <div class="row justify-end q-mb-md no-print">
      <q-btn
        color="primary"
        icon="print"
        :label="$t('exam.voucher.print')"
        class="print-btn shadow-2 text-weight-bold"
        @click="windowPrint"
      />
    </div>

    <!-- Preview / Printable Area -->
    <div ref="voucherRef" class="voucher-wrapper">
      <div class="voucher-card">
        <!-- ===== Header Section ===== -->
        <div class="voucher-header row items-center no-wrap">
          <!-- Logo container -->
          <div class="col-auto">
            <img src="icons/logo-vocher.png" class="header-logo" alt="BUULI Logo" />
          </div>

          <!-- Titles -->
          <div class="col text-center">
            <h1 class="header-title">{{ $t('exam.voucher.title') }}</h1>
            <h2 class="header-subtitle">{{ $t('exam.voucher.subtitle') }}</h2>
          </div>
        </div>

        <!-- ===== Body Section ===== -->
        <div class="voucher-body relative-position">
          <!-- Subtle Watermark Background -->
          <div class="watermark-bg no-pointer-events">GET</div>

          <div class="row q-col-gutter-lg items-stretch content-container">
            <!-- Left: Profile Photo Column -->
            <div class="col-12 col-sm-4 flex flex-center column">
              <div class="profile-photo-wrapper shadow-1">
                <ImageDisplay
                  :image-path="voucherData.profileImage"
                  class="profile-photo-img"
                  width="100%"
                  height="100%"
                  object-fit="cover"
                  border-radius="0px"
                  alt="Profile Photo"
                />
              </div>
              <div class="photo-divider"></div>
            </div>

            <!-- Right: Details Grid -->
            <div class="col-12 col-sm-8 detail-grid-column">
              <div class="row q-col-gutter-y-lg full-height items-center">
                <!-- Column 1 (Left details) -->
                <div class="col-12 col-sm-6 detail-group">
                  <div class="info-group">
                    <label class="info-label">{{ $t('exam.voucher.fields.testTakerId') }}</label>
                    <div class="info-value">{{ voucherData.studentId }}</div>
                  </div>
                  <div class="info-group">
                    <label class="info-label">{{ $t('exam.voucher.fields.nameSurname') }}</label>
                    <div class="info-value">{{ voucherData.fullName }}</div>
                  </div>
                  <div class="info-group">
                    <label class="info-label">{{ $t('exam.voucher.fields.citizenId') }}</label>
                    <div class="info-value">{{ voucherData.citizenId || '-' }}</div>
                  </div>
                  <div class="info-group">
                    <label class="info-label">{{ $t('exam.voucher.fields.testSession') }}</label>
                    <div class="info-value">{{ voucherData.testSession || '-' }}</div>
                  </div>
                </div>

                <!-- Column 2 (Right details) -->
                <div class="col-12 col-sm-6 detail-group">
                  <div class="info-group">
                    <label class="info-label">{{ $t('exam.voucher.fields.testDate') }}</label>
                    <div class="info-value">{{ voucherData.examDate }}</div>
                  </div>
                  <div class="info-group">
                    <label class="info-label">{{ $t('exam.voucher.fields.time') }}</label>
                    <div class="info-value">{{ voucherData.examTime }}</div>
                  </div>
                  <div class="info-group">
                    <label class="info-label">{{ $t('exam.voucher.fields.venue') }}</label>
                    <div class="info-value">{{ voucherData.location }}</div>
                  </div>
                  <div class="info-group">
                    <label class="info-label">{{ $t('exam.voucher.fields.seatNumber') }}</label>
                    <div class="info-value highlight-value">{{ voucherData.seatNo }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== Barcode Footer Section ===== -->
        <div class="voucher-footer flex flex-center column">
          <div class="barcode-wrapper flex flex-center column bg-white q-pa-sm">
            <!-- SVG Vector Barcode -->
            <svg class="barcode-svg" viewBox="0 0 360 48" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="3" height="48" fill="#000" />
              <rect x="6" y="0" width="1" height="48" fill="#000" />
              <rect x="10" y="0" width="4" height="48" fill="#000" />
              <rect x="18" y="0" width="2" height="48" fill="#000" />
              <rect x="22" y="0" width="1" height="48" fill="#000" />
              <rect x="26" y="0" width="3" height="48" fill="#000" />
              <rect x="34" y="0" width="2" height="48" fill="#000" />
              <rect x="40" y="0" width="1" height="48" fill="#000" />
              <rect x="44" y="0" width="4" height="48" fill="#000" />
              <rect x="52" y="0" width="2" height="48" fill="#000" />
              <rect x="58" y="0" width="3" height="48" fill="#000" />
              <rect x="64" y="0" width="1" height="48" fill="#000" />
              <rect x="68" y="0" width="2" height="48" fill="#000" />
              <rect x="74" y="0" width="4" height="48" fill="#000" />
              <rect x="80" y="0" width="1" height="48" fill="#000" />
              <rect x="84" y="0" width="3" height="48" fill="#000" />
              <rect x="92" y="0" width="2" height="48" fill="#000" />
              <rect x="98" y="0" width="1" height="48" fill="#000" />
              <rect x="102" y="0" width="4" height="48" fill="#000" />
              <rect x="110" y="0" width="2" height="48" fill="#000" />
              <rect x="116" y="0" width="3" height="48" fill="#000" />
              <rect x="122" y="0" width="1" height="48" fill="#000" />
              <rect x="126" y="0" width="2" height="48" fill="#000" />
              <rect x="132" y="0" width="4" height="48" fill="#000" />
              <rect x="138" y="0" width="1" height="48" fill="#000" />
              <rect x="142" y="0" width="3" height="48" fill="#000" />
              <rect x="150" y="0" width="2" height="48" fill="#000" />
              <rect x="156" y="0" width="1" height="48" fill="#000" />
              <rect x="160" y="0" width="4" height="48" fill="#000" />
              <rect x="168" y="0" width="2" height="48" fill="#000" />
              <rect x="174" y="0" width="3" height="48" fill="#000" />
              <rect x="180" y="0" width="1" height="48" fill="#000" />
              <rect x="184" y="0" width="2" height="48" fill="#000" />
              <rect x="190" y="0" width="4" height="48" fill="#000" />
              <rect x="196" y="0" width="1" height="48" fill="#000" />
              <rect x="200" y="0" width="3" height="48" fill="#000" />
              <rect x="208" y="0" width="2" height="48" fill="#000" />
              <rect x="214" y="0" width="1" height="48" fill="#000" />
              <rect x="218" y="0" width="4" height="48" fill="#000" />
              <rect x="226" y="0" width="2" height="48" fill="#000" />
              <rect x="232" y="0" width="3" height="48" fill="#000" />
              <rect x="238" y="0" width="1" height="48" fill="#000" />
              <rect x="242" y="0" width="2" height="48" fill="#000" />
              <rect x="248" y="0" width="4" height="48" fill="#000" />
              <rect x="254" y="0" width="1" height="48" fill="#000" />
              <rect x="258" y="0" width="3" height="48" fill="#000" />
              <rect x="266" y="0" width="2" height="48" fill="#000" />
              <rect x="272" y="0" width="1" height="48" fill="#000" />
              <rect x="276" y="0" width="4" height="48" fill="#000" />
              <rect x="284" y="0" width="2" height="48" fill="#000" />
              <rect x="290" y="0" width="3" height="48" fill="#000" />
              <rect x="296" y="0" width="1" height="48" fill="#000" />
              <rect x="300" y="0" width="2" height="48" fill="#000" />
              <rect x="306" y="0" width="4" height="48" fill="#000" />
              <rect x="312" y="0" width="1" height="48" fill="#000" />
              <rect x="316" y="0" width="3" height="48" fill="#000" />
              <rect x="324" y="0" width="2" height="48" fill="#000" />
              <rect x="330" y="0" width="1" height="48" fill="#000" />
              <rect x="334" y="0" width="4" height="48" fill="#000" />
              <rect x="342" y="0" width="2" height="48" fill="#000" />
              <rect x="348" y="0" width="3" height="48" fill="#000" />
              <rect x="354" y="0" width="1" height="48" fill="#000" />
            </svg>
            <div class="barcode-value text-weight-bold text-uppercase">
              {{ voucherData.barcodeValue || voucherData.voucherNo }}
            </div>
          </div>
        </div>
      </div>

      <!-- Test Regulations (English & Thai combined in a single card) -->
      <div v-if="showRegulations" class="regulations-block q-mt-lg">
        <div class="regulations-box relative-position">
          <!-- Subtle Watermark Background -->
          <div class="watermark-bg no-pointer-events">GET</div>

          <div class="regulations-content-wrapper">
            <h4 class="regulations-heading-inline">
              {{ $t('admin.testVoucherManagement.regulationsEnLabel') }}
            </h4>
            <div class="regulations-text-content q-mb-md">
              {{ displayRegulationsEn }}
            </div>

            <h4 class="regulations-heading-inline q-mt-md">
              {{ $t('admin.testVoucherManagement.regulationsThLabel') }}
            </h4>
            <div class="regulations-text-content">
              {{ displayRegulationsTh }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { VoucherData } from 'src/types/voucher';
import ImageDisplay from 'src/components/base/image-display.vue';

// ===== Props =====
const props = withDefaults(
  defineProps<{
    /** ข้อมูลบัตรประจำตัว — ถ้าไม่ส่งจะใช้ Mock Data ตามรูปภาพ */
    data?: VoucherData | undefined;
    regulationsEn?: string | string[];
    regulationsTh?: string | string[];
    showRegulations?: boolean;
  }>(),
  {
    showRegulations: true,
  },
);

// ===== Mock Data (ตรงตามรูปภาพ) =====
const mockData: VoucherData = {
  id: 1,
  fullName: 'Mr. Somdream Jaidee',
  studentId: '66100001',
  examName: 'BUU-GET : Burapha University\u2019s Graduate English Test',
  examDate: '15 May 2026',
  examTime: '08.00 AM - 10.00 AM',
  examType: 'ทั่วไป',
  location: 'QS1, Burapha University',
  seatNo: 'A1',
  voucherNo: 'ENG2026-001',
  citizenId: '1-1234-12345-12-1',
  testSession: 'X/XXXX',
};

const voucherData = computed<VoucherData>(() => props.data ?? mockData);

// ===== Regulations State & Computed =====
const { t } = useI18n();

const localRegulationsEn = ref<string>('');
const localRegulationsTh = ref<string>('');

const defaultRegulationsEn = t('admin.testVoucherManagement.defaultRegulationsEn');
const defaultRegulationsTh = t('admin.testVoucherManagement.defaultRegulationsTh');

onMounted(() => {
  try {
    const savedEn = localStorage.getItem('buu-get-regulations-en');
    const savedTh = localStorage.getItem('buu-get-regulations-th');
    if (savedEn) {
      if (savedEn.startsWith('[')) {
        localRegulationsEn.value = JSON.parse(savedEn).join('\n');
      } else {
        localRegulationsEn.value = savedEn;
      }
    }
    if (savedTh) {
      if (savedTh.startsWith('[')) {
        localRegulationsTh.value = JSON.parse(savedTh).join('\n');
      } else {
        localRegulationsTh.value = savedTh;
      }
    }
  } catch (e) {
    console.error('Failed to load regulations from localStorage', e);
  }
});

const displayRegulationsEn = computed<string>(() => {
  let val = props.regulationsEn;
  if (!val) {
    val = localRegulationsEn.value || defaultRegulationsEn;
  }
  if (Array.isArray(val)) {
    return val.join('\n');
  }
  return val;
});

const displayRegulationsTh = computed<string>(() => {
  let val = props.regulationsTh;
  if (!val) {
    val = localRegulationsTh.value || defaultRegulationsTh;
  }
  if (Array.isArray(val)) {
    return val.join('\n');
  }
  return val;
});

// ===== Action: Window Print =====
const windowPrint = (): void => {
  window.print();
};
</script>

<style scoped lang="scss">
.page-container-test {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--surface-page);
  min-height: 100%;
  padding: 16px 12px;
}

.print-btn {
  border-radius: var(--radius-sm);
  padding: 6px 14px;
  font-family: var(--font-family-base);
  letter-spacing: 0.5px;
  font-size: 13px;
}

.voucher-wrapper {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  font-family: var(--font-family-base);
}

.voucher-card {
  width: 100%;
  background: var(--voucher-bg-gradient);
  border-radius: var(--radius-md);
  border: 1.5px solid var(--border-black);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

/* ===== Header Area ===== */
.voucher-header {
  padding: 16px 20px;
  background-color: var(--surface-card);
  border-bottom: 1.5px solid var(--neutral-300) !important;

  .header-logo {
    height: 40px;
    object-fit: contain;
  }

  .header-title {
    font-family: var(--font-family-base) !important;
    font-weight: 500 !important;
    font-style: normal !important;
    font-size: 16px !important;
    line-height: 120% !important;
    letter-spacing: 0% !important;
    text-align: center !important;
    vertical-align: middle !important;
    color: var(--primary) !important;
    margin: 0 0 3px 0 !important;
  }

  .header-subtitle {
    font-family: var(--font-family-base) !important;
    font-weight: 500 !important;
    font-style: normal !important;
    font-size: 14px !important;
    line-height: 120% !important;
    letter-spacing: 0% !important;
    text-align: center !important;
    vertical-align: middle !important;
    color: var(--neutral-600) !important;
    margin: 0 !important;
  }
}

/* ===== Body Area ===== */
.voucher-body {
  position: relative;
  padding: 24px 20px;
  background: transparent;
  min-height: auto;

  .content-container {
    position: relative;
    z-index: 1;
  }
}

/* ===== Watermark ===== */
.watermark-bg {
  position: absolute;
  top: 50%;
  left: 65%;
  transform: translate(-50%, -50%);
  font-family: var(--font-family-base);
  font-weight: 800;
  font-style: normal;
  font-size: 140px;
  line-height: 100%;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--watermark-color);
  z-index: 0;
  user-select: none;
  pointer-events: none;
}

/* ===== Profile Photo ===== */
.profile-photo-wrapper {
  width: 100px;
  height: 126px;
  background-color: var(--badge-primary-bg);
  border-radius: 3px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid var(--surface-card);

  .profile-photo-img {
    width: 100%;
    height: 100%;
  }

  .avatar-svg {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.photo-divider {
  width: 100px;
  height: 1.5px;
  background-color: var(--neutral-400);
  margin-top: 8px;
  border-radius: 1px;
}

/* ===== Detail Grid ===== */
.detail-grid-column {
  padding-left: 12px !important;
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-group {
  display: flex;
  flex-direction: column;

  .info-label {
    font-family: var(--font-family-base) !important;
    font-size: 12px !important;
    color: var(--neutral-700, #334155) !important;
    font-weight: 500 !important;
    margin-bottom: 0px;
    line-height: 1.2;
  }

  .info-value {
    font-family: var(--font-family-base) !important;
    font-size: 15px !important;
    font-weight: 500 !important;
    color: var(--primary) !important;
    line-height: 1.3;
    letter-spacing: 0px !important;

    &.highlight-value {
      font-weight: 600 !important;
    }
  }
}

/* ===== Barcode Footer Area ===== */
.voucher-footer {
  padding: 16px 20px 24px 20px;
  background: transparent;
  border-top: none;

  .barcode-wrapper {
    background-color: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;

    .barcode-svg {
      width: 200px;
      height: 32px;
    }

    .barcode-value {
      font-family: var(--font-family-base) !important;
      font-weight: 700 !important;
      font-style: normal !important;
      font-size: 10px !important;
      line-height: 100% !important;
      letter-spacing: 0% !important;
      text-align: center !important;
    }
  }
}

/* ===== Regulations Section ===== */
.regulations-block {
  margin-top: 16px;
  text-align: left;
}

.regulations-heading {
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0 0 8px 0;
}

.regulations-heading-inline {
  font-family: var(--font-family-base);
  font-size: 13px;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0 0 6px 0;
}

.regulations-box {
  position: relative;
  background-color: var(--neutral-50);
  border: 1.5px solid var(--border-black);
  border-radius: 6px;
  padding: 12px 16px;

  .watermark-bg {
    left: 50% !important;
  }
}

.regulations-content-wrapper {
  position: relative;
  z-index: 1;
}

.regulations-text-content {
  font-family: var(--font-family-base);
  font-size: 12px;
  font-weight: 400;
  color: var(--neutral-900);
  line-height: 1.6;
  white-space: pre-line;
  padding-left: 2px;
}

/* ===== Responsive Adaptability ===== */
@media (max-width: 480px) {
  .detail-grid-column {
    padding-left: 0 !important;
    margin-top: 12px;
  }
  .voucher-header {
    flex-direction: column;
    padding: 12px;
    gap: 8px;
    text-align: center;
  }
  .voucher-body {
    padding: 12px;
  }
  .watermark-bg {
    font-size: 6rem;
    left: 50%;
  }
}

/* ===== Print Optimization — Scale up for paper ===== */
@media print {
  body {
    background-color: var(--surface-card) !important;
  }
  .no-print {
    display: none !important;
  }
  .page-container-test {
    padding: 0 !important;
    background-color: transparent !important;
  }
  .voucher-wrapper {
    max-width: 100% !important;
    margin: 0 !important;
    box-shadow: none !important;
  }
  .voucher-card {
    border: 0.1px solid var(--border-black) !important;
    box-shadow: none !important;
  }
  .voucher-header {
    padding: 20px 28px;
    .header-logo {
      height: 56px;
    }
    .header-title {
      font-size: 18px !important;
    }
    .header-subtitle {
      font-size: 16px !important;
    }
  }
  .voucher-body {
    padding: 28px;
  }
  .profile-photo-wrapper {
    width: 140px;
    height: 176px;
  }
  .photo-divider {
    width: 140px;
  }
  .info-group .info-label {
    font-size: 12px !important;
  }
  .info-group .info-value {
    font-size: 16px !important;
  }
  .detail-group {
    gap: 14px;
  }
  .barcode-wrapper .barcode-svg {
    width: 300px;
    height: 44px;
  }
  .barcode-wrapper .barcode-value {
    font-size: 12px !important;
  }
  .watermark-bg {
    font-size: 200px;
  }

  .regulations-block {
    margin-top: 24px;
  }
  .regulations-heading {
    font-size: 16px !important;
    margin-bottom: 12px;
  }
  .regulations-heading-inline {
    font-size: 15px !important;
    margin-bottom: 10px;
  }
  .regulations-box {
    padding: 16px 20px;
    background-color: var(--surface-card) !important;
    border: 1.5px solid var(--border-black) !important;
  }
  .regulations-text-content {
    font-size: 14px !important;
    line-height: 1.6;
  }
}
</style>
