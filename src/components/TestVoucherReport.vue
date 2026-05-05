<template>
  <div>
    <!-- Preview / Printable Area -->
    <div ref="voucherRef" class="voucher-wrapper">
      <!-- ===== ส่วนบน: บัตรประจำตัวผู้เข้าสอบ ===== -->
      <div class="voucher-card">
        <!-- Header Band -->
        <div class="voucher-header">
          <div class="row items-center q-gutter-sm">
            <img src="~assets/img/logobuu.png" style="width: 36px; height: auto" alt="BUU Logo" />
            <div>
              <div class="text-h6 text-weight-bold" style="letter-spacing: -0.5px">BUU-GET</div>
              <div class="text-caption text-amber-2">Burapha University General English Test</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-caption text-amber-2">เลขที่บัตร</div>
            <div class="text-h6 text-weight-bold text-amber-3">{{ voucherData.voucherNo }}</div>
          </div>
        </div>

        <!-- Body -->
        <div class="voucher-body">
          <div class="row q-col-gutter-lg">
            <!-- Left: Student Info -->
            <div class="col-12 col-sm-8">
              <div class="text-overline text-amber-9 q-mb-sm">ข้อมูลผู้เข้าสอบ</div>

              <div class="info-grid">
                <div class="info-item">
                  <q-icon name="person" size="18px" color="blue-grey-5" />
                  <div>
                    <div class="info-label">ชื่อ - นามสกุล</div>
                    <div class="info-value">{{ voucherData.fullName }}</div>
                  </div>
                </div>
                <div class="info-item">
                  <q-icon name="badge" size="18px" color="blue-grey-5" />
                  <div>
                    <div class="info-label">รหัสนิสิต</div>
                    <div class="info-value">{{ voucherData.studentId }}</div>
                  </div>
                </div>
                <div class="info-item">
                  <q-icon name="event" size="18px" color="blue-grey-5" />
                  <div>
                    <div class="info-label">วันที่สอบ</div>
                    <div class="info-value">{{ voucherData.examDate }}</div>
                  </div>
                </div>
                <div class="info-item">
                  <q-icon name="schedule" size="18px" color="blue-grey-5" />
                  <div>
                    <div class="info-label">เวลาสอบ</div>
                    <div class="info-value">{{ voucherData.examTime }}</div>
                  </div>
                </div>
                <div class="info-item">
                  <q-icon name="place" size="18px" color="blue-grey-5" />
                  <div>
                    <div class="info-label">สถานที่สอบ</div>
                    <div class="info-value">{{ voucherData.location }}</div>
                  </div>
                </div>
                <div class="info-item">
                  <q-icon name="event_seat" size="18px" color="blue-grey-5" />
                  <div>
                    <div class="info-label">หมายเลขที่นั่ง</div>
                    <div class="info-value text-weight-bold text-amber-9">{{ voucherData.seatNo }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Photo + QR -->
            <div class="col-12 col-sm-4">
              <div class="column items-center q-gutter-md">
                <!-- Photo Placeholder -->
                <div class="photo-frame">
                  <q-icon name="account_circle" size="80px" color="blue-grey-2" />
                  <div class="text-caption text-blue-grey-4 q-mt-xs">รูปถ่ายผู้เข้าสอบ</div>
                </div>
                <!-- QR Code Placeholder -->
                <div class="qr-frame">
                  <q-icon name="qr_code_2" size="72px" color="blue-grey-8" />
                  <div class="text-caption text-blue-grey-5 q-mt-xs">สแกนเพื่อเช็คอิน</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Exam Round Info -->
          <q-separator class="q-my-md" color="blue-grey-2" />
          <div class="row items-center q-gutter-sm">
            <q-icon name="menu_book" color="amber-8" size="24px" />
            <div>
              <div class="text-caption text-blue-grey-5">รอบสอบ</div>
              <div class="text-subtitle1 text-weight-bold text-dark">{{ voucherData.examName }}</div>
            </div>
            <q-space />
            <q-badge color="amber-8" text-color="black" class="q-pa-sm text-weight-bold" style="border-radius: 8px;">
              {{ voucherData.examType }}
            </q-badge>
          </div>
        </div>
      </div>

      <!-- ===== เส้นประสำหรับตัดออก ===== -->
      <div class="tear-line">
        <div class="tear-line-dashes"></div>
        <div class="tear-label">
          <q-icon name="content_cut" size="16px" color="blue-grey-4" class="q-mr-xs" />
          <span class="text-caption text-blue-grey-4">ตัดตามเส้นประ — ส่วนนี้ใช้สำหรับเข้าห้องสอบ</span>
        </div>
        <div class="tear-line-dashes"></div>
      </div>

      <!-- ===== ส่วนล่าง: ส่วนที่ต้องตัดออก (Stub) ===== -->
      <div class="voucher-stub">
        <div class="row items-center q-gutter-md">
          <div class="col">
            <div class="row items-center q-gutter-sm q-mb-sm">
              <img src="~assets/img/logobuu.png" style="width: 24px; height: auto" alt="BUU Logo" />
              <span class="text-subtitle2 text-weight-bold text-dark">BUU-GET</span>
            </div>
            <div class="stub-info-row">
              <span class="stub-label">ชื่อ:</span>
              <span class="stub-value">{{ voucherData.fullName }}</span>
            </div>
            <div class="stub-info-row">
              <span class="stub-label">รหัสนิสิต:</span>
              <span class="stub-value">{{ voucherData.studentId }}</span>
            </div>
            <div class="stub-info-row">
              <span class="stub-label">ที่นั่ง:</span>
              <span class="stub-value text-weight-bold text-amber-9">{{ voucherData.seatNo }}</span>
            </div>
          </div>
          <div class="stub-qr">
            <q-icon name="qr_code_2" size="56px" color="blue-grey-7" />
          </div>
          <div class="text-right">
            <div class="text-caption text-blue-grey-5">เลขที่บัตร</div>
            <div class="text-subtitle1 text-weight-bold text-dark">{{ voucherData.voucherNo }}</div>
            <div class="text-caption text-blue-grey-5 q-mt-xs">{{ voucherData.examDate }}</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { VoucherData } from './models';

// ===== Props & Interface =====
const props = defineProps<{
  /** ข้อมูลบัตรประจำตัว — ถ้าไม่ส่งจะใช้ Mock Data */
  data?: VoucherData | undefined;
}>();

// ===== Mock Data (ใช้เมื่อไม่มี props.data) =====
const mockData: VoucherData = {
  id: 1,
  fullName: 'นายสมชาย รักดี',
  studentId: '66160062',
  examName: 'BUU-GET รอบที่ 1/2569',
  examDate: '30 พ.ค. 2569',
  examTime: '09:00 - 12:00 น.',
  examType: 'ทั่วไป',
  location: 'ตึก QS2 ชั้น 3 ห้อง 301 มหาวิทยาลัยบูรพา',
  seatNo: 'A-042',
  voucherNo: 'VCH-2569-00142',
};

const voucherData = computed<VoucherData>(() => props.data ?? mockData);

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap');

.voucher-wrapper {
  font-family: 'Noto Sans Thai', sans-serif;
  max-width: 800px;
  margin: 0 auto;
  color: #263238;
}

/* ===== Header Band ===== */
.voucher-header {
  background: linear-gradient(135deg, #263238 0%, #37474f 100%);
  color: white;
  padding: 20px 28px;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ===== Body ===== */
.voucher-body {
  background: #ffffff;
  padding: 28px;
  border-left: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
}

/* ===== Info Grid ===== */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.info-label {
  font-size: 0.7rem;
  color: #78909c;
  font-weight: 500;
  margin-bottom: 2px;
}

.info-value {
  font-size: 0.9rem;
  color: #263238;
  font-weight: 500;
}

/* ===== Photo & QR ===== */
.photo-frame {
  width: 120px;
  height: 140px;
  border: 2px dashed #b0bec5;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fafafa;
}

.qr-frame {
  width: 120px;
  height: 110px;
  border: 1px solid #cfd8dc;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fafafa;
}

/* ===== Tear Line ===== */
.tear-line {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  background: #ffffff;
  border-left: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
}

.tear-line-dashes {
  flex: 1;
  border-top: 2px dashed #b0bec5;
}

.tear-label {
  display: flex;
  align-items: center;
  white-space: nowrap;
  padding: 0 8px;
}

/* ===== Stub (ส่วนตัดออก) ===== */
.voucher-stub {
  background: #f5f5f5;
  padding: 20px 28px;
  border: 1px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 12px 12px;
}

.stub-info-row {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 0.85rem;
}

.stub-label {
  color: #78909c;
  font-weight: 500;
  min-width: 70px;
}

.stub-value {
  color: #263238;
}

.stub-qr {
  padding: 8px;
  background: white;
  border-radius: 8px;
  border: 1px solid #eceff1;
}



/* ===== Responsive ===== */
@media (max-width: 599px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  .voucher-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}

/* ===== Print Styles ===== */
@media print {
  .no-print {
    display: none !important;
  }
  .voucher-wrapper {
    box-shadow: none;
    max-width: 100%;
  }
}
</style>
