<template>
  <div class="q-pa-md page-container-test">
    <!-- Action Bar (Hidden when printing) -->
    <div class="row justify-end q-mb-md no-print">
      <q-btn
        color="primary"
        icon="print"
        label="พิมพ์ใบเข้าห้องสอบ (Print)"
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
            <h1 class="header-title">BUU-GET : Burapha University's Graduate English Test</h1>
            <h2 class="header-subtitle">ADMISSION VOUCHER</h2>
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
                    <label class="info-label">Test Taker ID:</label>
                    <div class="info-value">{{ voucherData.studentId }}</div>
                  </div>
                  <div class="info-group">
                    <label class="info-label">Name Surname:</label>
                    <div class="info-value">{{ voucherData.fullName }}</div>
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

                <!-- Column 2 (Right details) -->
                <div class="col-12 col-sm-6 detail-group">
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
                    <div class="info-value">{{ voucherData.location }}</div>
                  </div>
                  <div class="info-group">
                    <label class="info-label">Seat Number:</label>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { VoucherData } from 'src/types/voucher';
import ImageDisplay from 'src/components/base/image-display.vue';

// ===== Props =====
const props = defineProps<{
  /** ข้อมูลบัตรประจำตัว — ถ้าไม่ส่งจะใช้ Mock Data ตามรูปภาพ */
  data?: VoucherData | undefined;
}>();

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

// ===== Action: Window Print =====
const windowPrint = (): void => {
  window.print();
};
</script>

<style scoped lang="scss">
// Import fonts matching app design system
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@100;200;300;400;500;600;700;800&display=swap');

.page-container-test {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--surface-page);
  min-height: 100%;
  padding: 24px 16px;
}

.print-btn {
  border-radius: var(--radius-sm);
  padding: 8px 16px;
  font-family: 'Sarabun', sans-serif;
  letter-spacing: 0.5px;
}

.voucher-wrapper {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  font-family: 'Outfit', 'Sarabun', 'Inter', sans-serif;
}

.voucher-card {
  width: 100%;
  background-color: var(--surface-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

/* ===== Header Area ===== */
.voucher-header {
  padding: 20px 28px;
  background-color: var(--surface-card);
  border-bottom: 2px solid #cbd5e1 !important;

  .header-logo {
    height: 56px;
    object-fit: contain;
  }

  .header-title {
    font-family: 'Sarabun', sans-serif !important;
    font-weight: 500 !important;
    font-style: normal !important;
    font-size: 20px !important;
    line-height: 100% !important;
    letter-spacing: 0% !important;
    text-align: center !important;
    vertical-align: middle !important;
    color: var(--primary) !important;
    margin: 0 0 6px 0 !important;
  }

  .header-subtitle {
    font-family: 'Sarabun', sans-serif !important;
    font-weight: 500 !important;
    font-style: normal !important;
    font-size: 20px !important;
    line-height: 100% !important;
    letter-spacing: 0% !important;
    text-align: center !important;
    vertical-align: middle !important;
    color: #475569 !important;
    margin: 0 !important;
  }
}

/* ===== Body Area ===== */
.voucher-body {
  padding: 32px;
  background-color: #f8fbff;
  min-height: 280px;

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
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-style: normal;
  font-size: 240px;
  line-height: 100%;
  letter-spacing: 0%;
  vertical-align: middle;
  color: rgba(30, 137, 229, 0.07);
  z-index: 0;
  user-select: none;
  pointer-events: none;
}

/* ===== Profile Photo ===== */
.profile-photo-wrapper {
  width: 156px;
  height: 196px;
  background-color: #e3f2fd;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 3px solid #ffffff;

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
  width: 156px;
  height: 2px;
  background-color: #94a3b8;
  margin-top: 14px;
  border-radius: 1px;
}

/* ===== Detail Grid ===== */
.detail-grid-column {
  padding-left: 20px !important;
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-group {
  display: flex;
  flex-direction: column;

  .info-label {
    font-family: 'Sarabun', sans-serif !important;
    font-size: 14px !important;
    color: #64748b !important;
    font-weight: 500 !important;
    margin-bottom: 2px;
  }

  .info-value {
    font-family: 'Sarabun', sans-serif !important;
    font-size: 18px !important;
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
  padding: 16px 24px 28px 24px;
  background-color: #f8fbff; /* Seamlessly matches card body background */
  border-top: none;

  .barcode-wrapper {
    background-color: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;

    .barcode-svg {
      width: 320px;
      height: 48px;
    }

    .barcode-value {
      font-family: 'Inter', sans-serif !important;
      font-weight: 700 !important;
      font-style: normal !important;
      font-size: 13.46px !important;
      line-height: 100% !important;
      letter-spacing: 0% !important;
      text-align: center !important;
      color: #1a1a1a !important;
      margin-top: 6px !important;
    }
  }
}

/* ===== Responsive Adaptability ===== */
@media (max-width: 768px) {
  .detail-grid-column {
    padding-left: 0 !important;
    margin-top: 20px;
  }
  .voucher-header {
    flex-direction: column;
    padding: 20px;
    gap: 16px;
    text-align: center;
  }
  .voucher-body {
    padding: 20px;
  }
  .watermark-bg {
    font-size: 10rem;
    left: 50%;
  }
}

/* ===== Print Optimization ===== */
@media print {
  body {
    background-color: #ffffff !important;
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
    border: none !important;
    box-shadow: none !important;
  }
}
</style>
