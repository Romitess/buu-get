<template>
  <div>
    <!-- Preview / Printable Area -->
    <div ref="certificateRef" class="certificate-wrapper">
      <div class="certificate-card">
        <!-- Decorative Top Border -->
        <div class="certificate-border-top"></div>

        <!-- Header -->
        <div class="certificate-header">
          <div class="column items-center justify-center text-center">
            <img
              src="~assets/img/logobuu.png"
              style="width: 64px; height: auto"
              alt="BUU Logo"
              class="q-mb-sm"
            />
            <div>
              <div
                class="text-overline text-blue-grey-5"
                style="letter-spacing: 3px; font-size: 13px; line-height: 1"
              >
                BURAPHA UNIVERSITY
              </div>
              <div
                class="text-h5 text-weight-bold text-dark q-my-xs"
                style="letter-spacing: -0.5px"
              >
                วุฒิบัตร
              </div>
              <div
                class="text-subtitle2 text-blue-grey-5"
                style="letter-spacing: 2px; font-size: 12px"
              >
                CERTIFICATE OF ACHIEVEMENT
              </div>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="certificate-body">
          <!-- Intro Text -->
          <div class="text-center">
            <div class="text-body1 text-blue-grey-7">ขอมอบวุฒิบัตรฉบับนี้เพื่อรับรองว่า</div>
          </div>

          <!-- Student Name -->
          <div class="text-center">
            <div class="student-name text-h4 text-weight-bold text-dark">
              {{ certData.fullName }}
            </div>
            <div class="text-subtitle1 text-blue-grey-6 q-mt-sm">
              {{ certData.englishName }}
            </div>
            <div class="name-underline"></div>
          </div>

          <!-- Student ID & Institution -->
          <div class="text-center">
            <div class="text-body1 text-blue-grey-7">
              รหัสนิสิต <span class="text-weight-bold text-dark">{{ certData.studentId }}</span>
              &nbsp;·&nbsp;
              {{ certData.faculty }} · {{ certData.institution }}
            </div>
          </div>

          <!-- Exam Details -->
          <div class="text-center">
            <div class="text-body1 text-blue-grey-7">ได้ผ่านการทดสอบ</div>
            <div class="text-h5 text-weight-bold text-amber-9 q-mt-sm">
              {{ certData.examName }}
            </div>
            <div class="text-caption text-blue-grey-5 q-mt-sm">
              วันที่สอบ {{ certData.examDate }} · ประเภท {{ certData.examType }}
            </div>
          </div>

          <q-separator color="blue-grey-2" class="q-my-sm" />

          <!-- Footer: Signatures & Verification -->
          <div class="row items-end justify-between">
            <!-- Signature Left -->
            <div class="text-center" style="min-width: 220px">
              <div class="signature-line"></div>
              <div class="text-body2 text-blue-grey-8 text-weight-medium">
                ผู้อำนวยการสถาบันภาษา
              </div>
              <div class="text-caption text-blue-grey-5">มหาวิทยาลัยบูรพา</div>
            </div>

            <!-- QR Code Center -->
            <div class="column items-center">
              <div class="qr-frame">
                <q-icon name="qr_code_2" size="64px" color="blue-grey-7" />
              </div>
              <div class="text-caption text-blue-grey-5 q-mt-sm text-center">
                สแกนเพื่อตรวจสอบ<br />
                <span class="text-weight-bold text-dark">{{ certData.certificateNo }}</span>
              </div>
            </div>

            <!-- Signature Right -->
            <div class="text-center" style="min-width: 220px">
              <div class="signature-line"></div>
              <div class="text-body2 text-blue-grey-8 text-weight-medium">คณบดีคณะมนุษยศาสตร์</div>
              <div class="text-caption text-blue-grey-5">มหาวิทยาลัยบูรพา</div>
            </div>
          </div>

          <!-- Issued Date -->
          <div class="text-center">
            <div class="text-caption text-blue-grey-5" style="font-size: 11px">
              ออกให้ ณ วันที่ {{ certData.issuedDate }}
            </div>
          </div>
        </div>

        <!-- Decorative Bottom Border -->
        <div class="certificate-border-bottom"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CertificateData } from './models';

// ===== Props =====
const props = defineProps<{
  /** ข้อมูลวุฒิบัตร — ถ้าไม่ส่งจะใช้ Mock Data */
  data?: CertificateData | undefined;
}>();

// ===== Mock Data (ใช้เมื่อไม่มี props.data) =====
const mockData: CertificateData = {
  id: 1,
  fullName: 'นายสมชาย รักดี',
  englishName: 'Mr. Somchai Rakdee',
  studentId: '66160293',
  examName: 'BUU-GET รอบที่ 1/2569',
  examDate: '30 พ.ค. 2569',
  examType: 'ทั่วไป',
  score: 78,
  maxScore: 100,
  grade: 'B2',
  certificateNo: 'CERT-2569-00142',
  issuedDate: '15 มิ.ย. 2569',
  institution: 'มหาวิทยาลัยบูรพา',
  faculty: 'คณะมนุษยศาสตร์และสังคมศาสตร์',
};

const certData = computed<CertificateData>(() => props.data ?? mockData);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@400;600;700&display=swap');

.certificate-wrapper {
  font-family: 'Noto Sans Thai', sans-serif;
  width: 100%;
  max-width: 1123px;
  aspect-ratio: 297 / 210;
  margin: 0 auto;
  color: #263238;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  background: white;
}

/* ===== Decorative Borders ===== */
.certificate-border-top {
  height: 12px;
  background: linear-gradient(
    90deg,
    #263238 0%,
    #455a64 25%,
    #ffce00 50%,
    #455a64 75%,
    #263238 100%
  );
  border-radius: 0;
}

.certificate-border-bottom {
  height: 12px;
  background: linear-gradient(
    90deg,
    #263238 0%,
    #455a64 25%,
    #ffce00 50%,
    #455a64 75%,
    #263238 100%
  );
  border-radius: 0;
}

/* ===== Card ===== */
.certificate-card {
  border: 1px solid #cfd8dc;
  border-radius: 0;
  overflow: hidden;
  background: #ffffff;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ===== Header ===== */
.certificate-header {
  padding: 24px 40px 12px;
  background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
}

/* ===== Body ===== */
.certificate-body {
  padding: 8px 60px 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
}

/* ===== Student Name ===== */
.student-name {
  font-family: 'Noto Serif Thai', serif;
  letter-spacing: 1px;
}

.name-underline {
  width: 320px;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #ffce00 50%, transparent 100%);
  margin: 12px auto 0;
}

/* ===== Signature ===== */
.signature-line {
  width: 180px;
  height: 1px;
  background: #90a4ae;
  margin: 0 auto 8px;
}

/* ===== QR Code ===== */
.qr-frame {
  width: 80px;
  height: 80px;
  border: 1px solid #cfd8dc;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fafafa;
}

/* ===== Responsive ===== */
@media (max-width: 599px) {
  .certificate-body {
    padding: 20px 16px 24px;
  }
  .certificate-header {
    padding: 24px 16px 12px;
  }
  .signature-line {
    width: 120px;
  }
}

/* ===== Print Styles ===== */
@media print {
  @page {
    size: A4 landscape;
    margin: 0;
  }
  .no-print {
    display: none !important;
  }
  .certificate-wrapper {
    box-shadow: none;
    width: 297mm;
    height: 210mm;
    margin: 0;
  }
  .certificate-card {
    border: none;
  }
}
</style>
