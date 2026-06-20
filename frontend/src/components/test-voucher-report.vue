<template>
  <div class="q-pa-md page-container-test">
    <!-- Action Bar (Hidden when printing) -->
    <div v-if="showActions" class="row justify-end q-mb-md no-print">
      <q-btn
        color="primary"
        icon="print"
        :label="$t('exam.voucher.print')"
        class="print-btn shadow-2 text-weight-bold"
        @click="windowPrint"
      />
    </div>

    <!-- Preview / Printable Area -->
    <div ref="scaleWrapperRef" class="scale-wrapper" :style="{ height: showVoucherCard ? scaledHeight : 'auto' }">
      <div
        ref="voucherRef"
        class="voucher-wrapper"
        :style="`width: 674px !important; min-width: 674px !important; max-width: 674px !important; padding: 0 12px 16px 12px !important; transform: scale(${scale}) !important; transform-origin: top center; flex-shrink: 0;`"
      >
        <div v-if="showVoucherCard" class="voucher-card">
          <!-- ===== Header Section ===== -->
          <div class="report-header row items-center no-wrap">
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

            <div class="content-container">
              <!-- Left: Profile Photo Column -->
              <div class="profile-column">
                <div class="profile-photo-wrapper" :class="{ 'shadow-1': !useImagePlaceholder }">
                  <div v-if="useImagePlaceholder" class="voucher-photo-placeholder">
                    <q-icon name="image" size="48px" color="black" />
                  </div>
                  <ImageDisplay
                    v-else
                    :image-path="voucherData.profileImage"
                    class="profile-photo-img"
                    width="100%"
                    height="100%"
                    object-fit="cover"
                    border-radius="0px"
                    alt="Profile Photo"
                  />
                </div>
                <div class="signature-line"></div>
              </div>

              <!-- Right: Details Grid -->
              <div class="detail-grid-column">
                <div class="row q-col-gutter-y-sm full-height items-center">
                  <!-- Column 1 -->
                  <div class="col-left detail-group">
                    <div class="info-group">
                      <label class="info-label">Test Taker ID:</label>
                      <div class="info-value">{{ voucherData.studentId }}</div>
                    </div>
                    <div class="info-group">
                      <label class="info-label">Name Surname:</label>
                      <div class="info-value name-value">{{ voucherData.fullName }}</div>
                    </div>
                    <div class="info-group">
                      <label class="info-label">Citizen ID:</label>
                      <div class="info-value">{{ voucherData.citizenId || '-' }}</div>
                    </div>
                    <div class="info-group">
                      <label class="info-label">Test Session:</label>
                      <div class="info-value">{{ voucherData.testSession || '-' }}</div>
                    </div>
                  </div>

                  <!-- Column 2 -->
                  <div class="col-right detail-group">
                    <div class="info-group">
                      <label class="info-label">Test Date:</label>
                      <div class="info-value">{{ voucherData.examDate }}</div>
                    </div>
                    <div class="info-group">
                      <label class="info-label">Time:</label>
                      <div class="info-value">{{ voucherData.examTime }}</div>
                    </div>
                    <div class="info-group">
                      <label class="info-label">Venue:</label>
                      <div class="info-value venue-value">
                        <span>{{ voucherData.location }}</span>
                        <span v-if="voucherData.locationRoom"
                          >&nbsp;{{ voucherData.locationRoom }}</span
                        >
                      </div>
                    </div>
                    <div class="info-group">
                      <label class="info-label">Seat Number:</label>
                      <div class="info-value">{{ voucherData.seatNo }}</div>
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
        <div v-if="showRegulations" class="regulations-block">
          <div class="regulations-box relative-position">
            <!-- Subtle Watermark Background -->
            <div class="watermark-bg no-pointer-events">GET</div>

            <div class="regulations-content-wrapper">
              <h4 class="regulations-heading-inline">
                {{ $t('admin.testVoucherManagement.regulationsEnLabel') }}:
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import type { VoucherData } from 'src/types/voucher';
import ImageDisplay from 'src/components/base/image-display.vue';
import { getRegulations } from 'src/services/exam-rule-voucher.service';

// ===== Props =====
const props = withDefaults(
  defineProps<{
    /** ข้อมูลบัตรประจำตัว — ถ้าไม่ส่งจะใช้ Mock Data ตามรูปภาพ */
    data?: VoucherData | undefined;
    regulationsEn?: string | string[] | undefined;
    regulationsTh?: string | string[] | undefined;
    showRegulations?: boolean;
    showVoucherCard?: boolean;
    showActions?: boolean;
    useImagePlaceholder?: boolean;
  }>(),
  {
    showRegulations: true,
    showVoucherCard: true,
    showActions: true,
    useImagePlaceholder: false,
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
  examType: 'General',
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

// ===== Ref & Scaling States =====
const voucherRef = ref<HTMLElement | null>(null);
const scaleWrapperRef = ref<HTMLElement | null>(null);
const scale = ref<number>(1);
const scaledHeight = ref<string>('auto');

let resizeObserver: ResizeObserver | null = null;
let frameId: number | null = null;

const updateScale = (): void => {
  if (frameId !== null) {
    cancelAnimationFrame(frameId);
  }
  
  frameId = requestAnimationFrame(() => {
    if (!scaleWrapperRef.value || !voucherRef.value) return;
    
    const containerWidth = scaleWrapperRef.value.getBoundingClientRect().width;
    const targetWidth = 674; // Adjusted for padding (650px card + 24px padding)
    
    if (containerWidth < targetWidth && containerWidth > 0) {
      const s = containerWidth / targetWidth;
      scale.value = s;
      // Set height of scale wrapper to scaled height of the content to prevent empty vertical space
      scaledHeight.value = `${voucherRef.value.offsetHeight * s}px`;
    } else {
      scale.value = 1;
      scaledHeight.value = 'auto';
    }
    frameId = null;
  });
};

// ดึงจาก API ก่อน, fallback ไป localStorage
onMounted(async () => {
  try {
    const data = await getRegulations();
    if (data.regulationsEn) {
      localRegulationsEn.value = data.regulationsEn;
    }
    if (data.regulationsTh) {
      localRegulationsTh.value = data.regulationsTh;
    }
  } catch {
    // Fallback: อ่านจาก localStorage กรณี API ไม่พร้อม
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
  }

  // Setup ResizeObserver
  void nextTick(() => {
    updateScale();
    if (scaleWrapperRef.value && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateScale();
      });
      resizeObserver.observe(scaleWrapperRef.value);
      if (voucherRef.value) {
        resizeObserver.observe(voucherRef.value);
      }
    }
  });
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (frameId !== null) {
    cancelAnimationFrame(frameId);
  }
});

const displayRegulationsEn = computed<string>(() => {
  let val = props.regulationsEn;
  if (val === undefined || val === null) {
    val = localRegulationsEn.value || defaultRegulationsEn;
  }
  const str = Array.isArray(val) ? val.join('\n') : val;
  return str ? str.trim() : '';
});

const displayRegulationsTh = computed<string>(() => {
  let val = props.regulationsTh;
  if (val === undefined || val === null) {
    val = localRegulationsTh.value || defaultRegulationsTh;
  }
  const str = Array.isArray(val) ? val.join('\n') : val;
  return str ? str.trim() : '';
});



// ===== Action: Window Print =====
const windowPrint = (): void => {
  window.print();
};
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@100;200;300;400;500;600;700;800&display=swap');

.page-container-test {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  min-height: 100%;
  padding: 0;
}

.print-btn {
  border-radius: var(--radius-sm);
  padding: 6px 14px;
  font-family: 'Sarabun', sans-serif;
  letter-spacing: 0.5px;
  font-size: 13px;
}

.scale-wrapper {
  width: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.voucher-wrapper {
  width: 674px !important;
  min-width: 674px !important;
  max-width: 674px !important;
  padding: 0 12px 16px 12px !important;
  margin: 0 auto;
  font-family: 'Outfit', 'Sarabun', 'Inter', sans-serif;
  transform-origin: top center;
  flex-shrink: 0;
}

.voucher-card {
  width: 100%;
  background: linear-gradient(to bottom, #fafafa, #f0f4f8);
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--border-black, #000000);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  padding: 0;
}

/* ===== Header Area ===== */
.report-header {
  padding: 16px 20px;
  background-color: transparent;
  border-bottom: 1.5px solid var(--primary, #0d47a1) !important;

  .header-logo {
    height: 40px;
    object-fit: contain;
  }

  .header-title {
    font-family: var(--font-family-base) !important;
    font-weight: 500 !important;
    font-size: 16px !important;
    line-height: 120% !important;
    color: var(--primary, #0d47a1) !important;
    margin: 0 0 3px 0 !important;
    white-space: nowrap;
  }

  .header-subtitle {
    font-family: var(--font-family-base) !important;
    font-weight: 500 !important;
    font-size: 13px !important;
    line-height: 120% !important;
    color: var(--neutral-600, #334155) !important;
    margin: 0 !important;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

/* ===== Body Area ===== */
.voucher-body {
  position: relative;
  padding: 24px 28px 8px 48px;
  background: transparent;

  .content-container {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    align-items: start;
    column-gap: 32px;
  }
}

/* ===== Watermark ===== */
.watermark-bg {
  position: absolute;
  top: 35%;
  left: 60%;
  transform: translate(-50%, -50%);
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 140px;
  line-height: 100%;
  color: var(--watermark-color, rgba(30, 137, 229, 0.07));
  z-index: 0;
  user-select: none;
  pointer-events: none;
}

/* ===== Profile Photo ===== */
.profile-photo-wrapper {
  width: 120px;
  height: 144px;
  background-color: #00000033 !important;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1.5px solid #00000033 !important;

  .profile-photo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.voucher-photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #c8c8c8;
}

.signature-line {
  width: 120px;
  height: 1.5px;
  background-color: var(--neutral-400);
  margin-top: 24px;
  border-radius: 1px;
}

/* ===== Detail Grid ===== */

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.col-left {
  width: 46%;
  flex: 0 0 46%;
}

.col-right {
  width: 54%;
  flex: 0 0 54%;
}

.info-group {
  display: flex;
  flex-direction: column;

  .info-label {
    font-family: var(--font-family-base) !important;
    font-size: 11px !important;
    color: var(--neutral-700, #334155) !important;
    font-weight: 500 !important;
    margin-bottom: 0px;
    line-height: 1.2;
  }

  .info-value {
    font-family: var(--font-family-base) !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    color: var(--primary, #0d47a1) !important;
    line-height: 1.25;
    letter-spacing: 0px !important;
    white-space: normal !important;
    overflow-wrap: break-word;
    word-break: normal;
  }
}

.info-value.name-value {
  display: block;
  white-space: nowrap !important;
  text-overflow: ellipsis;
  overflow: hidden;
  letter-spacing: -0.3px !important;
}

.info-value.venue-value {
  display: block;
  white-space: nowrap !important;
  overflow: visible !important;
  letter-spacing: -0.3px !important;
}

/* ===== Barcode Footer Section ===== */
.voucher-footer {
  padding: 8px 20px 20px 20px;
  background: transparent;
  border-top: none;

  .barcode-wrapper {
    background-color: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;

    .barcode-svg {
      width: 254px;
      height: 36px;
    }

    .barcode-value {
      font-family: var(--font-family-base) !important;
      font-weight: 700 !important;
      font-size: 10px !important;
      line-height: 100% !important;
      letter-spacing: 0.5px !important;
      text-align: center !important;
      margin-top: 4px;
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
  font-family: var(--font-family-base) !important;
  font-size: 14.5px !important;
  font-weight: 500 !important;
  color: var(--neutral-900) !important;
  margin: 0 !important;
}

.regulations-box {
  position: relative;
  background: linear-gradient(to bottom, #fafafa, #f0f4f8);
  border: 1px solid var(--border-black, #000000);
  border-radius: 6px;
  padding: 20px 24px;
  box-shadow: var(--shadow-md);

  .regulations-content-wrapper {
    position: relative;
    z-index: 1;
    background-color: transparent;
    border-radius: 8px;
    padding: 0;
  }

  .watermark-bg {
    left: 50% !important;
  }
}

.regulations-text-content {
  font-family: 'Sarabun', var(--font-family-base);
  font-size: 14px;
  font-weight: 300;
  font-style: normal;
  color: var(--neutral-900);
  line-height: 1.45;
  letter-spacing: 0;
  vertical-align: middle;
  white-space: pre-line;
  margin-bottom: 16px;
  padding-left: 2px;
  overflow-wrap: break-word;
  word-break: break-word;
}

/* ===== Print Optimization ===== */
@media print {
  .no-print {
    display: none !important;
  }
  .page-container-test {
    padding: 0 !important;
    background-color: transparent !important;
  }
  .scale-wrapper {
    height: auto !important;
    overflow: visible !important;
  }
  .voucher-wrapper {
    width: 674px !important;
    min-width: 674px !important;
    max-width: 674px !important;
    padding: 0 12px 16px 12px !important;
    transform: none !important;
    margin: 0 auto !important;
    box-shadow: none !important;
  }
  .voucher-card {
    border: 0.1px solid var(--border-black) !important;
    box-shadow: none !important;
    background-color: #ffffff !important;
    background-image: none !important;
  }
  .report-header {
    padding: 16px 20px;
    .header-logo {
      width: 160px;
    }
    .header-title {
      font-size: 17px !important;
    }
    .header-subtitle {
      font-size: 15px !important;
    }
  }
  .voucher-body {
    padding: 20px 48px 8px 76px;
  }
  .profile-photo-wrapper {
    width: 120px;
    height: 144px;
  }
  .signature-line {
    width: 120px;
    margin-top: 34px;
  }
  .info-group .info-label {
    font-size: 12px !important;
  }
  .info-group .info-value {
    font-size: 16px !important;
  }
  .barcode-wrapper .barcode-svg {
    width: 254px;
    height: 36px;
  }
  .barcode-wrapper .barcode-value {
    font-size: 12px !important;
  }
  .watermark-bg {
    top: 46%;
    left: 62%;
    font-size: 182px;
  }
  .regulations-box .watermark-bg {
    top: 50%;
    left: 48% !important;
    font-size: 206px;
  }

  .regulations-block {
    margin-top: 10px;
  }
  .regulations-heading {
    font-size: 16px !important;
    margin-bottom: 12px;
  }
  .regulations-heading-inline {
    font-size: 16px !important;
    margin: 0 !important;
  }
  .regulations-box {
    padding: 16px 24px;
    background-color: #ffffff !important;
    background-image: none !important;
    border: 0.1px solid var(--border-black) !important;

    .regulations-content-wrapper {
      padding: 0 !important;
      background-color: transparent !important;
    }
    .regulations-text-content {
      font-family: 'Sarabun', var(--font-family-base) !important;
      font-size: 15px !important;
      font-weight: 300 !important;
      font-style: normal !important;
      line-height: 1.38 !important;
      letter-spacing: 0 !important;
      vertical-align: middle;
      margin-top: -6px !important;
      overflow-wrap: break-word !important;
      word-break: break-word !important;
    }
    .regulations-text-content.q-mb-md {
      margin-bottom: -2px !important;
    }
    .regulations-heading-inline.q-mt-md {
      margin-top: 0 !important;
    }
  }
}
</style>
